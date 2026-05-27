"""Approvals router."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.config.database import get_db
from . import service

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("")
def list_approvals(
    skip: int = 0, limit: int = 100, status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    items, total = service.list_approvals(db, skip, limit, status)
    return {"items": [_to_dict(a) for a in items], "total": total,
            "skip": skip, "limit": limit}


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    return service.get_stats(db)


@router.post("/escalate-breached")
def escalate_breached(db: Session = Depends(get_db)):
    """Cron-style endpoint that auto-escalates SLA-breached items."""
    count = service.auto_escalate_breached(db)
    return {"escalated": count}


@router.get("/{approval_id}")
def get_approval(approval_id: int, db: Session = Depends(get_db)):
    a = service.get_approval(db, approval_id)
    if not a:
        raise HTTPException(404, "Approval not found")
    return _to_dict(a)


@router.put("/{approval_id}")
def update_approval(
    approval_id: int, payload: dict = Body(...), db: Session = Depends(get_db)
):
    """BR-005: decide (approved/rejected) — applies to underlying content."""
    decision = (payload.get("decision") or payload.get("status") or "").lower()
    comments = payload.get("comments")
    if decision == "approve": decision = "approved"
    if decision == "reject": decision = "rejected"
    try:
        a = service.decide(
            db, approval_id, decision, comments,
            reviewer_id=payload.get("reviewer_id"),
        )
    except ValueError as ve:
        raise HTTPException(400, str(ve))
    if not a:
        raise HTTPException(404, "Approval not found")
    return _to_dict(a)


def _to_dict(a):
    now = datetime.utcnow()
    sla_remaining_hours = None
    sla_breached = bool(a.sla_breached)
    if a.sla_due_at:
        delta = (a.sla_due_at - now).total_seconds() / 3600
        sla_remaining_hours = round(delta, 1)
        if a.status == "pending" and delta < 0:
            sla_breached = True
    return {
        "approval_id": a.approval_id,
        "id": a.approval_id,
        "content_type": a.content_type.value if hasattr(a.content_type, "value") else a.content_type,
        "content_id": a.content_id,
        "title": a.title,
        "submitter_id": a.submitter_id,
        "status": a.status.value if hasattr(a.status, "value") else a.status,
        "reviewer_id": a.reviewer_id,
        "comments": a.comments,
        "sla_due_at": a.sla_due_at.isoformat() if a.sla_due_at else None,
        "sla_remaining_hours": sla_remaining_hours,
        "sla_breached": sla_breached,
        "decided_at": a.decided_at.isoformat() if a.decided_at else None,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }
