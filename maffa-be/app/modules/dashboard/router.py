"""Dashboard router — KPIs for HR Ops Dashboard."""
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.config.database import get_db
from app.models import (
    EngagementEvent, EventParticipant, Survey, SurveyResponse,
    QueryLog, QueryEscalation, RecognitionEvent, RecognitionDeliveryLog,
    Approval, Employee, AuditLog,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    """All KPIs for the Engagement Overview screen.
    Includes Recognition Delivery Rate, Event Participation, Survey Response,
    Query Resolution, Confidence breakdown."""

    # Recognition delivery
    rec_total = db.query(RecognitionEvent).count()
    rec_delivered = db.query(RecognitionEvent).filter(
        RecognitionEvent.delivery_status == "success"
    ).count()
    rec_failed = db.query(RecognitionEvent).filter(
        RecognitionEvent.delivery_status == "failed"
    ).count()
    rec_pending = db.query(RecognitionEvent).filter(
        RecognitionEvent.delivery_status == "pending"
    ).count()
    rec_pct = round(rec_delivered / rec_total * 100, 1) if rec_total else 0.0

    # Event participation
    evt_total = db.query(EngagementEvent).count()
    evt_published = db.query(EngagementEvent).filter(
        EngagementEvent.status == "published"
    ).count()
    participations = db.query(EventParticipant).filter(
        EventParticipant.registration_status.is_(True)
    ).count()
    total_emps = db.query(Employee).filter(
        Employee.employment_status.in_(["active", "new_joiner"])
    ).count() or 1
    participation_pct = round(participations / total_emps * 100, 1)

    # Survey response
    survey_total = db.query(Survey).count()
    survey_responses = db.query(SurveyResponse).count()
    survey_pct = round(survey_responses / total_emps * 100, 1)

    # Query resolution
    qry_total = db.query(QueryLog).count()
    qry_high = db.query(QueryLog).filter(QueryLog.confidence_band == "high").count()
    qry_partial = db.query(QueryLog).filter(QueryLog.confidence_band == "partial").count()
    qry_low = db.query(QueryLog).filter(QueryLog.confidence_band == "low").count()
    qry_resolution_pct = round((qry_high + qry_partial) / qry_total * 100, 1) if qry_total else 0.0

    # Confidence band distribution
    confidence_bands = [
        {"band": "high (>= 0.90)", "count": qry_high},
        {"band": "partial (0.60 - 0.89)", "count": qry_partial},
        {"band": "low (< 0.60)", "count": qry_low},
    ]

    # Approval stats
    now = datetime.utcnow()
    appr_pending = db.query(Approval).filter(Approval.status == "pending").count()
    appr_breached = db.query(Approval).filter(
        Approval.status == "pending",
        Approval.sla_due_at.isnot(None),
        Approval.sla_due_at < now,
    ).count()

    # Escalation stats
    esc_open = db.query(QueryEscalation).filter(
        QueryEscalation.status.in_(["open", "in_progress"])
    ).count()
    esc_breached = db.query(QueryEscalation).filter(
        QueryEscalation.status.in_(["open", "in_progress"]),
        QueryEscalation.sla_due_at.isnot(None),
        QueryEscalation.sla_due_at < now,
    ).count()

    # Employee headcount + status breakdown
    emp_total = db.query(Employee).count()
    emp_active = db.query(Employee).filter(
        Employee.employment_status.in_(["active", "new_joiner"])
    ).count()
    emp_on_leave = db.query(Employee).filter(
        Employee.employment_status == "on_leave"
    ).count()
    emp_terminated = db.query(Employee).filter(
        Employee.employment_status == "terminated"
    ).count()
    on_leave_pct = round(emp_on_leave / emp_total * 100, 1) if emp_total else 0.0

    # Department distribution (top 10)
    dept_rows = (
        db.query(Employee.department, func.count(Employee.employee_id).label("cnt"))
        .filter(Employee.department.isnot(None))
        .group_by(Employee.department)
        .order_by(func.count(Employee.employee_id).desc())
        .limit(10)
        .all()
    )
    departments = [{"name": r[0] or "Unassigned", "count": r[1]} for r in dept_rows]

    # Avg approval decision time (hours, decided approvals only)
    decided = db.query(Approval).filter(Approval.decided_at.isnot(None)).all()
    if decided:
        total_hrs = sum(
            (a.decided_at - a.created_at).total_seconds() / 3600.0
            for a in decided if a.created_at
        )
        avg_decision_hrs = round(total_hrs / len(decided), 1)
    else:
        avg_decision_hrs = 0.0

    # Unique employees who participated in any event (registered)
    participating_emps = db.query(EventParticipant.employee_id).filter(
        EventParticipant.registration_status.is_(True)
    ).distinct().count()

    return {
        "recognition": {
            "delivery_rate_pct": rec_pct,
            "total": rec_total,
            "delivered": rec_delivered,
            "failed": rec_failed,
            "pending": rec_pending,
        },
        "events": {
            "total": evt_total,
            "published": evt_published,
            "participation_pct": participation_pct,
            "registrations": participations,
            "unique_participants": participating_emps,
        },
        "surveys": {
            "total": survey_total,
            "response_pct": survey_pct,
            "responses": survey_responses,
        },
        "queries": {
            "total": qry_total,
            "resolution_pct": qry_resolution_pct,
            "high_confidence_count": qry_high,
            "partial_count": qry_partial,
            "low_count": qry_low,
            "high_confidence_pct": round(qry_high / qry_total * 100, 1) if qry_total else 0.0,
            "confidence_bands": confidence_bands,
        },
        "approvals": {
            "pending": appr_pending,
            "breached": appr_breached,
            "avg_decision_hours": avg_decision_hrs,
        },
        "escalations": {
            "open": esc_open,
            "breached": esc_breached,
        },
        "employees": {
            "total": emp_total,
            "active": emp_active,
            "on_leave": emp_on_leave,
            "terminated": emp_terminated,
            "on_leave_pct": on_leave_pct,
            "active_pct": round(emp_active / emp_total * 100, 1) if emp_total else 0.0,
        },
        "departments": departments,
    }


@router.get("/kb-analytics")
def kb_analytics(db: Session = Depends(get_db)):
    """Detailed three-band confidence breakdown for the KB & Queries dashboard."""
    qry_total = db.query(QueryLog).count() or 1
    qry_high = db.query(QueryLog).filter(QueryLog.confidence_band == "high").count()
    qry_partial = db.query(QueryLog).filter(QueryLog.confidence_band == "partial").count()
    qry_low = db.query(QueryLog).filter(QueryLog.confidence_band == "low").count()

    return {
        "total_queries": qry_total,
        "bands": [
            {"label": "High (>= 0.90)",      "count": qry_high,    "pct": round(qry_high / qry_total * 100, 1)},
            {"label": "Partial (0.60-0.89)", "count": qry_partial, "pct": round(qry_partial / qry_total * 100, 1)},
            {"label": "Low (< 0.60)",        "count": qry_low,     "pct": round(qry_low / qry_total * 100, 1)},
        ],
    }


@router.get("/monthly-trend")
def monthly_trend(db: Session = Depends(get_db)):
    """Audit-log entries grouped by year-month, last 6 months."""
    rows = (
        db.query(
            func.to_char(AuditLog.created_at, 'YYYY-MM').label('ym'),
            func.count(AuditLog.log_id).label('count'),
        )
        .group_by('ym')
        .order_by('ym')
        .all()
    )
    return {"items": [{"ym": r.ym, "count": r.count} for r in rows[-6:]]}


@router.get("/recognition-analytics")
def recognition_analytics(db: Session = Depends(get_db)):
    """Channel-level recognition delivery breakdown."""
    by_channel = (
        db.query(
            RecognitionDeliveryLog.channel,
            RecognitionDeliveryLog.delivery_status,
            func.count(RecognitionDeliveryLog.id),
        )
        .group_by(RecognitionDeliveryLog.channel, RecognitionDeliveryLog.delivery_status)
        .all()
    )
    out: dict = {}
    for ch, ds, c in by_channel:
        ch_str = ch.value if hasattr(ch, "value") else ch
        ds_str = ds.value if hasattr(ds, "value") else ds
        out.setdefault(ch_str, {})[ds_str] = c
    return {"by_channel": out}
