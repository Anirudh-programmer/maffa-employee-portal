"""Approval service — BR-005 with 24h SLA + auto-escalation to Head of HR."""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models import (
    Approval, EngagementEvent, Survey, KnowledgeBaseArticle, RecognitionTemplate
)
from app.modules.service_utils import clean_pagination
from app.modules.audit_logs.service import create_audit_log
from app.modules.notifications.service import create_notification

HEAD_OF_HR_ID = 3  # Rajesh (HR Ops Manager doubles as Head of HR for this MVP)


def list_approvals(
    db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None
):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(Approval).order_by(Approval.created_at.desc())
    if status:
        q = q.filter(Approval.status == status)
    total = q.count()
    return q.offset(skip).limit(limit).all(), total


def get_approval(db: Session, approval_id: int):
    return db.query(Approval).filter(Approval.approval_id == approval_id).first()


def get_stats(db: Session) -> dict:
    items = db.query(Approval).all()
    now = datetime.utcnow()
    total = len(items)
    pending = [a for a in items if a.status == "pending"]
    approved = sum(1 for a in items if a.status == "approved")
    rejected = sum(1 for a in items if a.status == "rejected")
    breached = sum(
        1 for a in pending if a.sla_due_at and now > a.sla_due_at
    )
    urgent = sum(
        1 for a in pending
        if a.sla_due_at and 0 < (a.sla_due_at - now).total_seconds() / 3600 <= 4
    )
    # Avg review time for decided items
    decided = [a for a in items if a.decided_at and a.created_at]
    avg_h = 0.0
    if decided:
        total_h = sum(
            (a.decided_at - a.created_at).total_seconds() / 3600 for a in decided
        )
        avg_h = round(total_h / len(decided), 1)
    return {
        "total": total,
        "pending": len(pending),
        "approved": approved,
        "rejected": rejected,
        "urgent": urgent,
        "breached": breached,
        "avg_review_hours": avg_h,
    }


def decide(
    db: Session, approval_id: int, decision: str, comments: Optional[str] = None,
    reviewer_id: Optional[int] = None,
):
    """decision: approved | rejected. Applies decision to underlying content."""
    if decision not in ("approved", "rejected"):
        raise ValueError("decision must be approved|rejected")

    approval = get_approval(db, approval_id)
    if not approval:
        return None
    if approval.status != "pending":
        raise ValueError("Approval already decided")

    now = datetime.utcnow()
    sla_breached = bool(approval.sla_due_at and now > approval.sla_due_at)

    approval.status = decision
    approval.comments = comments
    approval.reviewer_id = reviewer_id or approval.reviewer_id or HEAD_OF_HR_ID
    approval.decided_at = now
    approval.sla_breached = sla_breached

    # Apply to underlying content
    ct = approval.content_type.value if hasattr(approval.content_type, "value") else approval.content_type
    underlying = None
    if ct == "event":
        underlying = db.query(EngagementEvent).filter(
            EngagementEvent.event_id == approval.content_id
        ).first()
        if underlying:
            underlying.approved_status = decision
            if decision == "approved":
                underlying.status = "published"
                underlying.published_date = now.date()
    elif ct == "survey":
        underlying = db.query(Survey).filter(
            Survey.survey_id == approval.content_id
        ).first()
        if underlying:
            underlying.approved_status = decision
            if decision == "approved":
                underlying.status = "active"
    elif ct == "article":
        underlying = db.query(KnowledgeBaseArticle).filter(
            KnowledgeBaseArticle.article_id == approval.content_id
        ).first()
        if underlying:
            underlying.status = "published" if decision == "approved" else "rejected"
            if decision == "approved":
                underlying.last_reviewed_date = now.date()
    elif ct == "template":
        underlying = db.query(RecognitionTemplate).filter(
            RecognitionTemplate.template_id == approval.content_id
        ).first()
        if underlying:
            underlying.approved_status = decision
            underlying.reviewer_note = comments

    db.commit()
    db.refresh(approval)

    create_audit_log(
        db,
        event_type=f"Content {decision.title()}",
        employee_id=approval.reviewer_id,
        content_id=approval.content_id,
        channel="web",
        outcome=("sla_breached" if sla_breached else "success"),
        reviewer_decision=decision,
        detail=f"Approval #{approval.approval_id}: {comments or ''}",
    )

    if approval.submitter_id:
        create_notification(
            db, employee_id=approval.submitter_id,
            notification_type=("event_approved" if decision == "approved" and ct == "event"
                               else "survey_approved" if decision == "approved" and ct == "survey"
                               else "event_rejected" if decision == "rejected" and ct == "event"
                               else "survey_rejected" if decision == "rejected" and ct == "survey"
                               else "system"),
            title=f"{ct.title()} {decision.title()}",
            message=f"Your {ct} '{approval.title}' was {decision}. {comments or ''}",
            channel="intranet",
            related_id=approval.content_id, related_type=ct,
        )
    return approval


def auto_escalate_breached(db: Session) -> int:
    """Mark all breached pending items and notify Head of HR. Returns count."""
    now = datetime.utcnow()
    breached = db.query(Approval).filter(
        Approval.status == "pending",
        Approval.sla_due_at.isnot(None),
        Approval.sla_due_at < now,
        Approval.sla_breached.is_(False),
    ).all()
    for a in breached:
        a.sla_breached = True
        create_audit_log(
            db, event_type="Approval SLA Breached",
            employee_id=a.reviewer_id,
            content_id=a.approval_id, channel="system",
            outcome="sla_breached",
            detail=f"Auto-escalated to Head of HR: '{a.title}'",
        )
        create_notification(
            db, employee_id=HEAD_OF_HR_ID,
            notification_type="system",
            title="SLA Breached — Auto-Escalation",
            message=f"Approval #{a.approval_id} ('{a.title}') passed 24h SLA",
            channel="intranet",
            related_id=a.approval_id, related_type="approval",
        )
    db.commit()
    return len(breached)
