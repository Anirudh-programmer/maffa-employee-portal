"""Employees router."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.config.database import get_db
from . import service

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("")
def list_employees(
    skip: int = 0,
    limit: int = 100,
    department: Optional[str] = None,
    role: Optional[str] = None,
    employment_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    items, total = service.get_all_employees(db, skip, limit, department, role, employment_status)
    return {
        "items": [_to_dict(e) for e in items],
        "total": total, "skip": skip, "limit": limit,
    }


@router.get("/validation-report")
def validation_report(db: Session = Depends(get_db)):
    """BR-001 — daily HRMS validation report (missing DOB / joining date)."""
    return {"items": service.daily_validation_report(db)}


@router.get("/{employee_id}")
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = service.get_employee_by_id(db, employee_id)
    if not emp:
        raise HTTPException(404, "Employee not found")
    return _to_dict(emp)


@router.put("/{employee_id}/recognition-preference")
def set_recognition_preference(
    employee_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
):
    """BR-001 — set Public / Private / Off."""
    pref = payload.get("preference")
    if pref not in ("public", "private", "off"):
        raise HTTPException(400, "preference must be public|private|off")
    emp = service.update_recognition_preference(db, employee_id, pref)
    if not emp:
        raise HTTPException(404, "Employee not found")
    return _to_dict(emp)


@router.put("/{employee_id}/notification-preferences")
def set_notification_preferences(
    employee_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
):
    emp = service.update_notification_preferences(
        db, employee_id,
        notify_events=payload.get("notify_events"),
        notify_surveys=payload.get("notify_surveys"),
        notify_recognition=payload.get("notify_recognition"),
    )
    if not emp:
        raise HTTPException(404, "Employee not found")
    return _to_dict(emp)


def _to_dict(e):
    return {
        "employee_id": e.employee_id,
        "name": e.name,
        "email": e.email,
        "department": e.department,
        "role": e.role,
        "location": e.location,
        "language": e.language,
        "time_zone": e.time_zone,
        "date_of_birth": e.date_of_birth.isoformat() if e.date_of_birth else None,
        "joining_date": e.joining_date.isoformat() if e.joining_date else None,
        "employment_status": e.employment_status.value if hasattr(e.employment_status, "value") else e.employment_status,
        "recognition_preference": e.recognition_preference.value if hasattr(e.recognition_preference, "value") else e.recognition_preference,
        "notify_events": bool(e.notify_events),
        "notify_surveys": bool(e.notify_surveys),
        "notify_recognition": bool(e.notify_recognition),
        "validation_flag": e.validation_flag,
    }
