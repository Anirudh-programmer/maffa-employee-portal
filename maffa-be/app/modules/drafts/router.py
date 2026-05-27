"""Drafts aggregator — returns all unapproved/incomplete content owned by a user."""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models import Survey, EngagementEvent, RecognitionTemplate

router = APIRouter(prefix="/drafts", tags=["drafts"])


@router.get("")
def list_drafts(submitter_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Return drafts (status=draft or pending_approval) grouped across surveys, events, templates."""
    items = []

    # Surveys with status='draft' or 'pending_approval'
    surveys = db.query(Survey).filter(
        Survey.status.in_(["draft", "pending_approval"])
    )
    if submitter_id:
        surveys = surveys.filter(Survey.created_by == submitter_id)
    for s in surveys.all():
        items.append({
            "content_type": "survey",
            "content_id": s.survey_id,
            "title": s.title or f"Untitled Survey #{s.survey_id}",
            "status": s.status,
            "approved_status": s.approved_status.value if hasattr(s.approved_status, "value") else s.approved_status,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "created_by": s.created_by,
        })

    # Engagement events with status='draft' or 'pending_approval'
    events = db.query(EngagementEvent).filter(
        EngagementEvent.status.in_(["draft", "pending_approval"])
    )
    if submitter_id:
        events = events.filter(EngagementEvent.created_by == submitter_id)
    for e in events.all():
        items.append({
            "content_type": "event",
            "content_id": e.event_id,
            "title": e.event_name or f"Untitled Event #{e.event_id}",
            "status": e.status.value if hasattr(e.status, "value") else e.status,
            "approved_status": e.approved_status.value if hasattr(e.approved_status, "value") else e.approved_status,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "created_by": e.created_by,
        })

    # Recognition templates with approved_status='pending' or 'rejected'
    tpl = db.query(RecognitionTemplate).filter(
        RecognitionTemplate.approved_status.in_(["pending", "rejected"])
    )
    if submitter_id:
        tpl = tpl.filter(RecognitionTemplate.created_by == submitter_id)
    for t in tpl.all():
        appr = t.approved_status.value if hasattr(t.approved_status, "value") else t.approved_status
        items.append({
            "content_type": "template",
            "content_id": t.template_id,
            "title": t.template_name or f"Untitled Template #{t.template_id}",
            "status": "draft" if appr == "pending" else "rejected",
            "approved_status": appr,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "created_by": t.created_by,
        })

    items.sort(key=lambda x: x.get("created_at") or "", reverse=True)
    return {"items": items, "total": len(items)}
