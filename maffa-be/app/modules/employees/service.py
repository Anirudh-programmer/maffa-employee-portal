"""Employee service — read-only HRMS mirror."""
from typing import Optional
from sqlalchemy.orm import Session
from app.models import Employee
from app.modules.service_utils import clean_pagination


def get_all_employees(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    department: Optional[str] = None,
    role: Optional[str] = None,
    employment_status: Optional[str] = None,
):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(Employee)
    if department:
        q = q.filter(Employee.department == department)
    if role:
        q = q.filter(Employee.role == role)
    if employment_status:
        q = q.filter(Employee.employment_status == employment_status)
    total = q.count()
    return q.offset(skip).limit(limit).all(), total


def get_employee_by_id(db: Session, employee_id: int):
    return db.query(Employee).filter(Employee.employee_id == employee_id).first()


def update_recognition_preference(db: Session, employee_id: int, preference: str):
    emp = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not emp:
        return None
    emp.recognition_preference = preference
    db.commit()
    db.refresh(emp)
    return emp


def update_notification_preferences(
    db: Session, employee_id: int,
    notify_events: Optional[bool] = None,
    notify_surveys: Optional[bool] = None,
    notify_recognition: Optional[bool] = None,
):
    emp = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not emp:
        return None
    if notify_events is not None:
        emp.notify_events = notify_events
    if notify_surveys is not None:
        emp.notify_surveys = notify_surveys
    if notify_recognition is not None:
        emp.notify_recognition = notify_recognition
    db.commit()
    db.refresh(emp)
    return emp


def daily_validation_report(db: Session):
    """BR-001 — flag employees with missing DOB or joining date."""
    rows = db.query(Employee).filter(
        (Employee.date_of_birth.is_(None)) | (Employee.joining_date.is_(None))
    ).all()
    return [
        {
            "employee_id": e.employee_id,
            "name": e.name,
            "missing": [
                f for f, v in [("date_of_birth", e.date_of_birth), ("joining_date", e.joining_date)]
                if v is None
            ],
        }
        for e in rows
    ]
