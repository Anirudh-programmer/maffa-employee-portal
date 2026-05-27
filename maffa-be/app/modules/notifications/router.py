"""Notifications router."""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from . import service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    items, total = service.get_all_notifications(db, skip, limit, employee_id, status)
    return {
        "items": [_to_dict(n) for n in items],
        "total": total, "skip": skip, "limit": limit,
    }


def _to_dict(n):
    return {
        "notification_id": n.notification_id,
        "id": n.notification_id,
        "employee_id": n.employee_id,
        "title": n.title,
        "message": n.message,
        "type": n.notification_type,
        "notification_type": n.notification_type,
        "channel": n.channel,
        "status": n.status,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }
