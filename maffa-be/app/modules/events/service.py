"""Engagement event service — BR-002 with time-conflict detection."""
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models import EngagementEvent, EventParticipant, Approval
from app.modules.service_utils import clean_pagination
from app.modules.audit_logs.service import create_audit_log
from app.modules.notifications.service import create_notification

APPROVAL_SLA_HOURS = 24
DEFAULT_REVIEWER = 3


def list_events(
    db: Session, skip: int = 0, limit: int = 100,
    status: Optional[str] = None, approved_status: Optional[str] = None,
):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(EngagementEvent).order_by(EngagementEvent.event_date.desc().nullslast())
    if status:
        q = q.filter(EngagementEvent.status == status)
    if approved_status:
        q = q.filter(EngagementEvent.approved_status == approved_status)
    total = q.count()
    return q.offset(skip).limit(limit).all(), total


def get_event(db: Session, event_id: int):
    return db.query(EngagementEvent).filter(
        EngagementEvent.event_id == event_id
    ).first()


def participant_count(db: Session, event_id: int) -> int:
    return db.query(EventParticipant).filter(
        EventParticipant.event_id == event_id,
        EventParticipant.registration_status.is_(True),
    ).count()


def create_event(
    db: Session, payload: dict, submit_for_approval: bool = False
) -> EngagementEvent:
    e = EngagementEvent(
        event_name=payload.get("event_name") or payload.get("name"),
        event_type=payload.get("event_type") or "Team",
        description=payload.get("description"),
        target_audience=payload.get("target_audience") or payload.get("audience"),
        registration_start=_parse_date(payload.get("registration_start")),
        registration_end=_parse_date(payload.get("registration_end")),
        event_start_time=_parse_dt(payload.get("event_start_time")),
        event_end_time=_parse_dt(payload.get("event_end_time")),
        event_date=_parse_date(payload.get("event_date")),
        status="pending_approval" if submit_for_approval else "draft",
        approved_status="pending",
        created_by=payload.get("created_by") or 2,
    )
    db.add(e)
    db.flush()

    if submit_for_approval:
        db.add(Approval(
            content_type="event",
            content_id=e.event_id,
            title=e.event_name,
            submitter_id=e.created_by,
            status="pending",
            reviewer_id=DEFAULT_REVIEWER,
            sla_due_at=datetime.utcnow() + timedelta(hours=APPROVAL_SLA_HOURS),
        ))

    db.commit()
    db.refresh(e)

    create_audit_log(
        db, event_type="Event Created", employee_id=e.created_by,
        content_id=e.event_id, channel="web", outcome="success",
        detail=f"Event '{e.event_name}' created (submit_for_approval={submit_for_approval})",
    )
    return e


def register_for_event(db: Session, event_id: int, employee_id: int) -> dict:
    """BR-002 with time-conflict + duplicate guard."""
    event = get_event(db, event_id)
    if not event:
        raise ValueError("Event not found")
    if event.approved_status != "approved" or event.status != "published":
        raise ValueError("Event is not published")

    # Duplicate guard
    existing = db.query(EventParticipant).filter(
        EventParticipant.event_id == event_id,
        EventParticipant.employee_id == employee_id,
    ).first()
    if existing and existing.registration_status:
        raise ValueError("Already registered")

    # Time-conflict — overlap with another registered, published event
    if event.event_start_time and event.event_end_time:
        conflicts = (
            db.query(EngagementEvent)
            .join(
                EventParticipant,
                EventParticipant.event_id == EngagementEvent.event_id,
            )
            .filter(
                EventParticipant.employee_id == employee_id,
                EventParticipant.registration_status.is_(True),
                EngagementEvent.event_id != event_id,
                EngagementEvent.event_start_time.isnot(None),
                EngagementEvent.event_end_time.isnot(None),
                # overlap = start < other.end AND end > other.start
                EngagementEvent.event_start_time < event.event_end_time,
                EngagementEvent.event_end_time > event.event_start_time,
            )
            .all()
        )
        if conflicts:
            names = ", ".join(c.event_name for c in conflicts)
            raise ValueError(f"Time conflict with: {names}")

    if existing:
        existing.registration_status = True
        existing.participation_status = "registered"
    else:
        db.add(EventParticipant(
            event_id=event_id, employee_id=employee_id,
            registration_status=True, participation_status="registered",
        ))

    db.commit()

    create_audit_log(
        db, event_type="Event Registration", employee_id=employee_id,
        content_id=event_id, channel="web", outcome="success",
        detail=f"Registered for '{event.event_name}'",
    )

    create_notification(
        db, employee_id=employee_id,
        notification_type="event",
        title="Registration Confirmed",
        message=f"You are registered for '{event.event_name}'.",
        channel="intranet",
        related_id=event_id, related_type="event",
    )

    return {
        "event_id": event_id,
        "employee_id": employee_id,
        "registered": True,
        "participant_count": participant_count(db, event_id),
    }


def _parse_date(v):
    if not v: return None
    if isinstance(v, str):
        try:
            return datetime.strptime(v[:10], "%Y-%m-%d").date()
        except Exception:
            return None
    return v


def _parse_dt(v):
    if not v: return None
    if isinstance(v, str):
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M"):
            try:
                return datetime.strptime(v, fmt)
            except Exception:
                continue
    return v
