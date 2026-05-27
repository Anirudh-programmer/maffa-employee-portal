"""Knowledge Base router — articles + query handler + escalations."""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.config.database import get_db
from . import service

router = APIRouter(tags=["knowledge_base"])


# ── Articles ────────────────────────────────────────────────
@router.get("/knowledge_base/articles")
def list_articles(
    skip: int = 0, limit: int = 100,
    category: Optional[str] = None, status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    items, total = service.list_articles(db, skip, limit, category, status)
    return {"items": [_article_dict(a) for a in items], "total": total,
            "skip": skip, "limit": limit}


@router.get("/knowledge_base/articles/{article_id}")
def get_article(article_id: int, db: Session = Depends(get_db)):
    a = service.get_article(db, article_id)
    if not a:
        raise HTTPException(404, "Article not found")
    return _article_dict(a)


# ── Query handler (three-tier confidence) ───────────────────
@router.post("/knowledge_base/query")
def submit_query(payload: dict = Body(...), db: Session = Depends(get_db)):
    """BR-004: returns high-confidence answer, partial-match list, or escalation."""
    employee_id = int(payload.get("employee_id") or 1)
    query_text = (payload.get("query_text") or payload.get("query") or "").strip()
    if not query_text:
        raise HTTPException(400, "query_text is required")
    return service.submit_query(db, employee_id, query_text)


@router.get("/knowledge_base/queries")
def list_queries(
    skip: int = 0, limit: int = 100,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    items, total = service.list_query_logs(db, skip, limit, employee_id)
    return {"items": [_query_dict(q) for q in items], "total": total,
            "skip": skip, "limit": limit}


# ── Escalations ─────────────────────────────────────────────
@router.get("/escalations")
def list_escalations(
    skip: int = 0, limit: int = 100, status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    items, total = service.list_escalations(db, skip, limit, status)
    return {"items": [_escalation_dict(e) for e in items], "total": total,
            "skip": skip, "limit": limit}


@router.get("/escalations/stats")
def escalation_stats(db: Session = Depends(get_db)):
    return service.get_escalation_stats(db)


@router.put("/escalations/{escalation_id}")
def update_escalation(
    escalation_id: int, payload: dict = Body(...),
    db: Session = Depends(get_db),
):
    """action: send_response | create_kb_article | escalate_further"""
    action = payload.get("action")
    if action not in ("send_response", "create_kb_article", "escalate_further"):
        raise HTTPException(
            400, "action must be send_response|create_kb_article|escalate_further"
        )
    esc = service.resolve_escalation(
        db, escalation_id, action,
        response_text=payload.get("response_text"),
        article_payload=payload.get("article_payload"),
    )
    if not esc:
        raise HTTPException(404, "Escalation not found")
    return _escalation_dict(esc)


# ── Helpers ─────────────────────────────────────────────────
def _article_dict(a):
    return {
        "article_id": a.article_id,
        "title": a.title,
        "content": a.content,
        "category": a.category,
        "role_tag": a.role_tag,
        "author": a.author,
        "version": a.version,
        "status": a.status,
        "last_reviewed_date": a.last_reviewed_date.isoformat() if a.last_reviewed_date else None,
        "review_due_date": a.review_due_date.isoformat() if a.review_due_date else None,
        "keywords": a.keywords,
    }


def _query_dict(q):
    return {
        "query_id": q.query_id,
        "employee_id": q.employee_id,
        "query_text": q.query_text,
        "matched_article_id": q.matched_article_id,
        "related_articles": q.related_articles or [],
        "confidence_score": q.confidence_score,
        "confidence_band": q.confidence_band,
        "response_delivered": q.response_delivered,
        "escalation_flag": bool(q.escalation_flag),
        "created_at": q.created_at.isoformat() if q.created_at else None,
    }


def _escalation_dict(e):
    now = datetime.utcnow()
    sla_remaining_hours = None
    sla_breached = bool(e.sla_breached)
    if e.sla_due_at:
        delta = (e.sla_due_at - now).total_seconds() / 3600
        sla_remaining_hours = round(delta, 1)
        if e.status != "closed" and delta < 0:
            sla_breached = True
    return {
        "id": e.id,
        "escalation_id": e.id,
        "query_id": e.query_id,
        "employee_id": e.employee_id,
        "ticket_ref": e.ticket_ref,
        "assigned_to": e.assigned_to,
        "status": e.status.value if hasattr(e.status, "value") else e.status,
        "resolution_text": e.resolution_text,
        "resolved_at": e.resolved_at.isoformat() if e.resolved_at else None,
        "sla_due_at": e.sla_due_at.isoformat() if e.sla_due_at else None,
        "sla_remaining_hours": sla_remaining_hours,
        "sla_breached": sla_breached,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }
