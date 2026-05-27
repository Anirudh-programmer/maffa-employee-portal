"""Audit logs router — BR-006 append-only viewer + R05 export."""
import io
import csv
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.config.database import get_db
from . import service

router = APIRouter(prefix="/audit-logs", tags=["audit_logs"])


@router.get("")
def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    event_type: Optional[str] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    logs, total = service.get_all_audit_logs(db, skip, limit, event_type, employee_id)
    return {
        "items": [_to_dict(l) for l in logs],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/export")
def export_audit_logs(db: Session = Depends(get_db)):
    """R05 — Engagement Audit Report export as CSV."""
    logs, _ = service.get_all_audit_logs(db, skip=0, limit=10000)

    # Log the export action itself (BR-006)
    service.create_audit_log(
        db=db,
        event_type="Audit Log Exported",
        employee_id=4,  # Compliance Reviewer (Rajib Basu)
        outcome="success",
        detail="R05 Engagement Audit Report exported",
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["log_id", "event_type", "employee_id", "content_id", "channel",
         "outcome", "reviewer_decision", "is_anonymous", "detail", "created_at"]
    )
    for l in logs:
        writer.writerow([
            l.log_id, l.event_type, l.employee_id, l.content_id, l.channel,
            l.outcome, l.reviewer_decision, l.is_anonymous, l.detail or "",
            l.created_at.isoformat() if l.created_at else "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=R05_audit_export.csv"},
    )


@router.get("/{log_id}")
def get_audit_log(log_id: int, db: Session = Depends(get_db)):
    log = service.get_audit_log_by_id(db, log_id)
    if not log:
        raise HTTPException(404, "Audit log not found")
    return _to_dict(log)


def _to_dict(l):
    return {
        "log_id": l.log_id,
        "event_type": l.event_type,
        "employee_id": l.employee_id,
        "content_id": l.content_id,
        "channel": l.channel,
        "outcome": l.outcome,
        "reviewer_decision": l.reviewer_decision,
        "detail": l.detail,
        "is_anonymous": bool(l.is_anonymous),
        "created_at": l.created_at.isoformat() if l.created_at else None,
    }
