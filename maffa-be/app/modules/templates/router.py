"""Recognition templates router."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.config.database import get_db
from . import service

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("")
def list_templates(
    skip: int = 0, limit: int = 100,
    approved_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    items, total = service.list_templates(db, skip, limit, approved_status)
    return {"items": [_to_dict(t) for t in items], "total": total,
            "skip": skip, "limit": limit}


@router.get("/{template_id}")
def get_template(template_id: int, db: Session = Depends(get_db)):
    t = service.get_template(db, template_id)
    if not t:
        raise HTTPException(404, "Template not found")
    return _to_dict(t)


@router.post("")
def create_template(payload: dict = Body(...), db: Session = Depends(get_db)):
    submit = bool(payload.get("submit_for_approval"))
    t = service.create_template(db, payload, submit_for_approval=submit)
    return _to_dict(t)


@router.post("/{template_id}/resubmit")
def resubmit(template_id: int, db: Session = Depends(get_db)):
    t = service.resubmit_template(db, template_id)
    if not t:
        raise HTTPException(404, "Template not found")
    return _to_dict(t)


def _to_dict(t):
    return {
        "template_id": t.template_id,
        "template_name": t.template_name,
        "event_type": t.event_type.value if hasattr(t.event_type, "value") else t.event_type,
        "content": t.content,
        "version": t.version,
        "is_active": bool(t.is_active),
        "created_by": t.created_by,
        "approved_status": t.approved_status.value if hasattr(t.approved_status, "value") else t.approved_status,
        "reviewer_note": t.reviewer_note,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }
