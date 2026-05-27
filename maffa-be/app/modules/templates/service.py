"""Recognition templates service."""
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models import RecognitionTemplate, Approval
from app.modules.service_utils import clean_pagination
from app.modules.audit_logs.service import create_audit_log

APPROVAL_SLA_HOURS = 24
DEFAULT_REVIEWER = 3


def list_templates(
    db: Session, skip: int = 0, limit: int = 100,
    approved_status: Optional[str] = None,
):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(RecognitionTemplate).order_by(RecognitionTemplate.created_at.desc())
    if approved_status:
        q = q.filter(RecognitionTemplate.approved_status == approved_status)
    total = q.count()
    return q.offset(skip).limit(limit).all(), total


def get_template(db: Session, template_id: int):
    return db.query(RecognitionTemplate).filter(
        RecognitionTemplate.template_id == template_id
    ).first()


def create_template(
    db: Session, payload: dict, submit_for_approval: bool = False
) -> RecognitionTemplate:
    t = RecognitionTemplate(
        template_name=payload.get("template_name") or payload.get("name"),
        event_type=payload.get("event_type") or "other",
        content=payload.get("content"),
        version=int(payload.get("version") or 1),
        is_active=bool(payload.get("is_active", True)),
        created_by=payload.get("created_by") or 2,
        approved_status="pending",
    )
    db.add(t)
    db.flush()

    if submit_for_approval:
        db.add(Approval(
            content_type="template",
            content_id=t.template_id,
            title=t.template_name,
            submitter_id=t.created_by,
            status="pending",
            reviewer_id=DEFAULT_REVIEWER,
            sla_due_at=datetime.utcnow() + timedelta(hours=APPROVAL_SLA_HOURS),
        ))

    db.commit()
    db.refresh(t)

    create_audit_log(
        db, event_type="Template Created", employee_id=t.created_by,
        content_id=t.template_id, channel="web", outcome="success",
        detail=f"Template '{t.template_name}' created",
    )
    return t


def resubmit_template(db: Session, template_id: int) -> Optional[RecognitionTemplate]:
    """Resubmit a rejected/pending template for approval."""
    t = get_template(db, template_id)
    if not t:
        return None
    t.approved_status = "pending"
    # Create or refresh approval
    db.add(Approval(
        content_type="template",
        content_id=t.template_id,
        title=t.template_name,
        submitter_id=t.created_by,
        status="pending",
        reviewer_id=DEFAULT_REVIEWER,
        sla_due_at=datetime.utcnow() + timedelta(hours=APPROVAL_SLA_HOURS),
    ))
    db.commit()
    db.refresh(t)
    create_audit_log(
        db, event_type="Template Resubmitted", employee_id=t.created_by,
        content_id=t.template_id, channel="web", outcome="success",
        detail=f"Template #{t.template_id} resubmitted",
    )
    return t
