"""Audit log service — BR-006 append-only."""
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models import AuditLog
from app.modules.service_utils import clean_pagination


def get_all_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    event_type: Optional[str] = None,
    employee_id: Optional[int] = None,
):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    if event_type:
        q = q.filter(AuditLog.event_type.ilike(f"%{event_type}%"))
    if employee_id:
        q = q.filter(AuditLog.employee_id == employee_id)
    total = q.count()
    return q.offset(skip).limit(limit).all(), total


def get_audit_log_by_id(db: Session, log_id: int):
    return db.query(AuditLog).filter(AuditLog.log_id == log_id).first()


def create_audit_log(
    db: Session,
    event_type: str,
    employee_id: Optional[int] = None,
    content_id: Optional[int] = None,
    channel: str = "web",
    outcome: str = "success",
    reviewer_decision: Optional[str] = None,
    detail: Optional[str] = None,
    is_anonymous: bool = False,
) -> AuditLog:
    """BR-006: append-only. For anonymous surveys, employee_id is intentionally None."""
    al = AuditLog(
        event_type=event_type,
        employee_id=None if is_anonymous else employee_id,
        content_id=content_id,
        channel=channel,
        outcome=outcome,
        reviewer_decision=reviewer_decision,
        detail=detail,
        is_anonymous=is_anonymous,
    )
    db.add(al)
    db.commit()
    db.refresh(al)
    return al
