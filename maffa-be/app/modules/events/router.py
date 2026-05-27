"""Engagement events router."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.config.database import get_db
from . import service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
def list_events(
    skip: int = 0, limit: int = 100,
    status: Optional[str] = None, approved_status: Optional[str] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    items, total = service.list_events(db, skip, limit, status, approved_status)
    out = []
    for e in items:
        d = _event_dict(e)
        d["participant_count"] = service.participant_count(db, e.event_id)
        out.append(d)

    if employee_id is not None:
        from app.models import EventParticipant
        registered_event_ids = {
            row.event_id for row in db.query(EventParticipant.event_id)
            .filter(
                EventParticipant.employee_id == employee_id,
                EventParticipant.registration_status.is_(True),
            ).all()
        }
        for d in out:
            d["registered"] = d.get("event_id") in registered_event_ids
    else:
        for d in out:
            d["registered"] = False

    return {"items": out, "total": total, "skip": skip, "limit": limit}


@router.get("/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    e = service.get_event(db, event_id)
    if not e:
        raise HTTPException(404, "Event not found")
    d = _event_dict(e)
    d["participant_count"] = service.participant_count(db, e.event_id)
    return d


@router.post("")
def create_event(payload: dict = Body(...), db: Session = Depends(get_db)):
    submit = bool(payload.get("submit_for_approval"))
    e = service.create_event(db, payload, submit_for_approval=submit)
    return _event_dict(e)


@router.post("/{event_id}/register")
def register(event_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    """BR-002 — registration with duplicate + time-conflict guards."""
    employee_id = payload.get("employee_id")
    if not employee_id:
        raise HTTPException(400, "employee_id is required")
    try:
        return service.register_for_event(db, event_id, int(employee_id))
    except ValueError as ve:
        raise HTTPException(400, str(ve))


def _event_dict(e):
    return {
        "event_id": e.event_id,
        "event_name": e.event_name,
        "event_type": e.event_type,
        "description": e.description,
        "target_audience": e.target_audience,
        "registration_start": e.registration_start.isoformat() if e.registration_start else None,
        "registration_end": e.registration_end.isoformat() if e.registration_end else None,
        "event_start_time": e.event_start_time.isoformat() if e.event_start_time else None,
        "event_end_time": e.event_end_time.isoformat() if e.event_end_time else None,
        "event_date": e.event_date.isoformat() if e.event_date else None,
        "published_date": e.published_date.isoformat() if e.published_date else None,
        "status": e.status.value if hasattr(e.status, "value") else e.status,
        "approved_status": e.approved_status.value if hasattr(e.approved_status, "value") else e.approved_status,
        "created_by": e.created_by,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }
