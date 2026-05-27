"""Notification service."""
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Notification
from app.modules.service_utils import clean_pagination


def get_all_notifications(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(Notification).order_by(Notification.created_at.desc())
    if employee_id:
        q = q.filter(Notification.employee_id == employee_id)
    if status:
        q = q.filter(Notification.status == status)
    total = q.count()
    return q.offset(skip).limit(limit).all(), total


def create_notification(
    db: Session,
    employee_id: int,
    notification_type: str,
    message: str,
    channel: str = "intranet",
    title: Optional[str] = None,
    related_id: Optional[int] = None,
    related_type: Optional[str] = None,
    status: str = "sent",
) -> Notification:
    n = Notification(
        employee_id=employee_id,
        title=title or notification_type.replace("_", " ").title(),
        message=message,
        notification_type=notification_type,
        related_id=related_id,
        related_type=related_type,
        channel=channel,
        status=status,
        sent_at=datetime.utcnow() if status == "sent" else None,
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return n
