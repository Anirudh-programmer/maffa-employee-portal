"""Surveys router."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.config.database import get_db
from . import service

router = APIRouter(prefix="/surveys", tags=["surveys"])


@router.get("")
def list_surveys(
    skip: int = 0, limit: int = 100,
    status: Optional[str] = None, approved_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    items, total = service.list_surveys(db, skip, limit, status, approved_status)
    out = []
    for s in items:
        d = _survey_dict(s)
        d["response_pct"] = service.get_response_pct(db, s.survey_id)
        out.append(d)
    return {"items": out, "total": total, "skip": skip, "limit": limit}


@router.get("/active")
def get_active_surveys(
    employee_id: Optional[int] = None, db: Session = Depends(get_db)
):
    return {"items": service.get_active_surveys(db, employee_id)}


@router.get("/{survey_id}")
def get_survey(survey_id: int, db: Session = Depends(get_db)):
    s = service.get_survey(db, survey_id)
    if not s:
        raise HTTPException(404, "Survey not found")
    d = _survey_dict(s)
    d["questions"] = [
        service._question_dict(q) for q in service.get_questions(db, survey_id)
    ]
    d["response_pct"] = service.get_response_pct(db, survey_id)
    return d


@router.post("")
def create_survey(payload: dict = Body(...), db: Session = Depends(get_db)):
    submit = bool(payload.get("submit_for_approval"))
    s = service.create_survey(db, payload, submit_for_approval=submit)
    return _survey_dict(s)


@router.post("/{survey_id}/submit")
@router.post("/{survey_id}/respond")
def submit_response(
    survey_id: int, payload: dict = Body(...), db: Session = Depends(get_db)
):
    """BR-003 — submit answers; honours anonymity flag and blocks duplicate non-anonymous submits."""
    employee_id = payload.get("employee_id")
    answers = payload.get("answers") or []
    try:
        return service.submit_response(db, survey_id, employee_id, answers)
    except ValueError as ve:
        raise HTTPException(400, str(ve))


def _survey_dict(s):
    return {
        "survey_id": s.survey_id,
        "title": s.title,
        "description": s.description,
        "target_audience": s.target_audience,
        "audience": s.audience,
        "open_date": s.open_date.isoformat() if s.open_date else None,
        "close_date": s.close_date.isoformat() if s.close_date else None,
        "is_anonymous": bool(s.is_anonymous),
        "status": s.status,
        "created_by": s.created_by,
        "approved_status": s.approved_status.value if hasattr(s.approved_status, "value") else s.approved_status,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }
