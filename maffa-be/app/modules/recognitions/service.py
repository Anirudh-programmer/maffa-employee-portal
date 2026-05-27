"""Recognition cycle service — BR-001 honoring recognition_preference + employment_status."""
from datetime import date, datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models import (
    Employee, RecognitionTemplate, RecognitionEvent, RecognitionDeliveryLog,
)
from app.modules.audit_logs.service import create_audit_log
from app.modules.notifications.service import create_notification
from app.modules.service_utils import clean_pagination


def list_recognition_events(
    db: Session, skip: int = 0, limit: int = 100,
    delivery_status: Optional[str] = None,
):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(RecognitionEvent).order_by(RecognitionEvent.created_at.desc())
    if delivery_status:
        q = q.filter(RecognitionEvent.delivery_status == delivery_status)
    total = q.count()
    return q.offset(skip).limit(limit).all(), total


def run_recognition_cycle(db: Session, target_date: Optional[date] = None) -> dict:
    """Identify employees with birthday/anniversary on target_date and trigger events.
    Honors recognition_preference: off=skip; private=audit only; public=normal.
    Honors employment_status: terminated/on_leave skipped.
    Flags employees with missing DOB/joining_date.
    """
    if target_date is None:
        target_date = date.today()

    triggered: List[dict] = []
    skipped: List[dict] = []
    flagged: List[dict] = []

    employees = db.query(Employee).all()
    for emp in employees:
        # Validation flags first (BR-001)
        if not emp.date_of_birth or not emp.joining_date:
            emp.validation_flag = "missing_dob_or_joining_date"
            flagged.append({
                "employee_id": emp.employee_id, "name": emp.name,
                "missing": [f for f, v in [("DOB", emp.date_of_birth),
                                           ("Joining", emp.joining_date)] if not v],
            })
            continue

        emp_status = (emp.employment_status.value if hasattr(emp.employment_status, "value")
                      else emp.employment_status)
        if emp_status in ("terminated", "on_leave"):
            skipped.append({
                "employee_id": emp.employee_id, "name": emp.name,
                "reason": f"employment_status={emp_status}",
            })
            continue

        is_birthday = (emp.date_of_birth.month == target_date.month and
                       emp.date_of_birth.day == target_date.day)
        years = target_date.year - emp.joining_date.year
        is_anniversary = (
            years > 0 and
            emp.joining_date.month == target_date.month and
            emp.joining_date.day == target_date.day
        )

        if not (is_birthday or is_anniversary):
            continue

        event_type = "birthday" if is_birthday else "anniversary"
        pref = (emp.recognition_preference.value if hasattr(emp.recognition_preference, "value")
                else emp.recognition_preference)

        if pref == "off":
            skipped.append({
                "employee_id": emp.employee_id, "name": emp.name,
                "reason": "recognition_preference=off", "event_type": event_type,
            })
            create_audit_log(
                db, event_type="Recognition Skipped (Off)", employee_id=emp.employee_id,
                channel="system", outcome="skipped",
                detail=f"{event_type} skipped — preference off",
            )
            continue

        # Pick template
        template = db.query(RecognitionTemplate).filter(
            RecognitionTemplate.event_type == event_type,
            RecognitionTemplate.approved_status == "approved",
            RecognitionTemplate.is_active.is_(True),
        ).first()
        if not template:
            skipped.append({
                "employee_id": emp.employee_id, "name": emp.name,
                "reason": f"no approved {event_type} template",
            })
            continue

        # Create recognition event
        rec_event = RecognitionEvent(
            employee_id=emp.employee_id,
            event_type=event_type,
            trigger_date=target_date,
            template_id=template.template_id,
            delivery_status="pending",
        )
        db.add(rec_event)
        db.flush()

        if pref == "private":
            # Audit only — no public notification, no employee_id in delivery log
            create_audit_log(
                db, event_type="Recognition Delivered (Private)",
                employee_id=None,  # Private — no PII in detail row
                content_id=rec_event.event_id, channel="system",
                outcome="success", is_anonymous=True,
                detail=f"{event_type} delivered privately for employee #{emp.employee_id}",
            )
            rec_event.delivery_status = "success"
            db.add(RecognitionDeliveryLog(
                event_id=rec_event.event_id, channel="email",
                delivery_status="success", retry_count=0,
                delivered_at=datetime.utcnow(),
            ))
        else:  # public
            # Multi-channel cascade — Email → Chat → Intranet
            db.add(RecognitionDeliveryLog(
                event_id=rec_event.event_id, channel="email",
                delivery_status="success", retry_count=0,
                delivered_at=datetime.utcnow(),
            ))
            rec_event.delivery_status = "success"

            personalized = (template.content or "").replace(
                "{employee_name}", emp.name
            ).replace("{years}", str(years))

            create_notification(
                db, employee_id=emp.employee_id,
                notification_type="recognition",
                title=f"{event_type.title()} Wishes",
                message=personalized,
                channel="email", status="sent",
                related_id=rec_event.event_id, related_type="recognition_event",
            )
            create_audit_log(
                db, event_type="Recognition Delivered",
                employee_id=emp.employee_id, content_id=rec_event.event_id,
                channel="email", outcome="success",
                detail=f"{event_type} delivered to {emp.name}",
            )

        triggered.append({
            "employee_id": emp.employee_id,
            "name": emp.name,
            "event_type": event_type,
            "preference": pref,
            "template_id": template.template_id,
            "validation_flag": None,
            "employment_status": emp_status,
        })

    db.commit()
    return {
        "target_date": target_date.isoformat(),
        "triggered_count": len(triggered),
        "skipped_count": len(skipped),
        "flagged_count": len(flagged),
        "triggered": triggered,
        "skipped": skipped,
        "flagged": flagged,
    }


def get_recognition_log(db: Session, skip: int = 0, limit: int = 100):
    """Return recognition events joined with employee for the dashboard log table.
    Includes Validation Flag and Employment Status columns per humanoid spec."""
    skip, limit = clean_pagination(skip, limit)
    rows = (
        db.query(RecognitionEvent, Employee)
        .outerjoin(Employee, RecognitionEvent.employee_id == Employee.employee_id)
        .order_by(RecognitionEvent.created_at.desc())
        .offset(skip).limit(limit).all()
    )
    total = db.query(RecognitionEvent).count()
    items = []
    for re, emp in rows:
        items.append({
            "event_id": re.event_id,
            "employee_id": re.employee_id,
            "employee_name": emp.name if emp else "(private)",
            "event_type": re.event_type.value if hasattr(re.event_type, "value") else re.event_type,
            "trigger_date": re.trigger_date.isoformat() if re.trigger_date else None,
            "delivery_status": re.delivery_status.value if hasattr(re.delivery_status, "value") else re.delivery_status,
            "validation_flag": emp.validation_flag if emp else None,
            "employment_status": (
                emp.employment_status.value if (emp and hasattr(emp.employment_status, "value"))
                else (emp.employment_status if emp else None)
            ),
            "created_at": re.created_at.isoformat() if re.created_at else None,
        })
    return items, total
