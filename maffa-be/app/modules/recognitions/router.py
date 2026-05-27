"""Recognition router — cycle runner + log."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.config.database import get_db
from . import service

router = APIRouter(prefix="/recognition", tags=["recognition"])


@router.post("/run-cycle")
def run_cycle(payload: dict = Body(default={}), db: Session = Depends(get_db)):
    """BR-001 — daily HRMS scan; trigger birthdays/anniversaries.
    Body: { target_date?: 'YYYY-MM-DD' (defaults to today) }"""
    td = payload.get("target_date") if payload else None
    target = None
    if td:
        try:
            target = datetime.strptime(td[:10], "%Y-%m-%d").date()
        except Exception:
            target = None
    return service.run_recognition_cycle(db, target_date=target)


@router.get("/log")
def get_log(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items, total = service.get_recognition_log(db, skip, limit)
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/events")
def list_events(
    skip: int = 0, limit: int = 100, delivery_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    items, total = service.list_recognition_events(db, skip, limit, delivery_status)
    out = []
    for e in items:
        out.append({
            "event_id": e.event_id,
            "employee_id": e.employee_id,
            "event_type": e.event_type.value if hasattr(e.event_type, "value") else e.event_type,
            "trigger_date": e.trigger_date.isoformat() if e.trigger_date else None,
            "template_id": e.template_id,
            "delivery_status": e.delivery_status.value if hasattr(e.delivery_status, "value") else e.delivery_status,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        })
    return {"items": out, "total": total, "skip": skip, "limit": limit}
