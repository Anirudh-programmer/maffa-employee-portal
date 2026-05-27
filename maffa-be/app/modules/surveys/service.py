"""Survey service — BR-003 with anonymity flag handling."""
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models import Survey, SurveyQuestion, SurveyResponse, SurveyAnswer, Approval, Employee
from app.modules.service_utils import clean_pagination
from app.modules.audit_logs.service import create_audit_log

APPROVAL_SLA_HOURS = 24
DEFAULT_REVIEWER = 3  # HR Ops Manager


def list_surveys(
    db: Session, skip: int = 0, limit: int = 100,
    status: Optional[str] = None, approved_status: Optional[str] = None,
):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(Survey).order_by(Survey.created_at.desc())
    if status:
        q = q.filter(Survey.status == status)
    if approved_status:
        q = q.filter(Survey.approved_status == approved_status)
    total = q.count()
    return q.offset(skip).limit(limit).all(), total


def get_survey(db: Session, survey_id: int):
    return db.query(Survey).filter(Survey.survey_id == survey_id).first()


def get_questions(db: Session, survey_id: int):
    return db.query(SurveyQuestion).filter(
        SurveyQuestion.survey_id == survey_id
    ).order_by(SurveyQuestion.question_order).all()


def get_active_surveys(db: Session, employee_id: Optional[int] = None):
    """Active = approved + open_date <= today <= close_date + status='active'."""
    today = datetime.utcnow().date()
    surveys = db.query(Survey).filter(
        Survey.approved_status == "approved",
        Survey.status == "active",
        or_(Survey.open_date.is_(None), Survey.open_date <= today),
        or_(Survey.close_date.is_(None), Survey.close_date >= today),
    ).all()
    out = []
    for s in surveys:
        already_responded = False
        if employee_id and not s.is_anonymous:
            already_responded = db.query(SurveyResponse).filter(
                SurveyResponse.survey_id == s.survey_id,
                SurveyResponse.employee_id == employee_id,
            ).count() > 0
        questions = get_questions(db, s.survey_id)
        out.append({
            "survey_id": s.survey_id,
            "title": s.title,
            "description": s.description,
            "is_anonymous": bool(s.is_anonymous),
            "open_date": s.open_date.isoformat() if s.open_date else None,
            "close_date": s.close_date.isoformat() if s.close_date else None,
            "audience": s.audience or s.target_audience,
            "already_responded": already_responded,
            "questions": [_question_dict(q) for q in questions],
        })
    return out


def get_response_pct(db: Session, survey_id: int) -> float:
    """% of total active employees who have responded."""
    total_emps = db.query(Employee).filter(
        Employee.employment_status.in_(["active", "new_joiner"])
    ).count()
    if total_emps == 0:
        return 0.0
    responses = db.query(SurveyResponse).filter(
        SurveyResponse.survey_id == survey_id
    ).count()
    return round(responses / total_emps * 100, 1)


def submit_response(
    db: Session, survey_id: int, employee_id: Optional[int],
    answers: List[dict],
) -> dict:
    """BR-003: anonymous surveys store employee_id=NULL.
    Non-anonymous: blocks duplicate submission for the same employee."""
    survey = get_survey(db, survey_id)
    if not survey:
        raise ValueError("Survey not found")

    # Validate active
    today = datetime.utcnow().date()
    if survey.approved_status != "approved" or survey.status != "active":
        raise ValueError("Survey is not active")
    if survey.close_date and today > survey.close_date:
        raise ValueError("Survey is closed")

    # Duplicate-submission guard for non-anonymous
    if not survey.is_anonymous and employee_id:
        existing = db.query(SurveyResponse).filter(
            SurveyResponse.survey_id == survey_id,
            SurveyResponse.employee_id == employee_id,
        ).first()
        if existing:
            raise ValueError("Already submitted")

    response = SurveyResponse(
        survey_id=survey_id,
        employee_id=None if survey.is_anonymous else employee_id,
        is_anonymous=bool(survey.is_anonymous),
    )
    db.add(response)
    db.flush()

    for ans in (answers or []):
        db.add(SurveyAnswer(
            response_id=response.response_id,
            question_id=ans.get("question_id"),
            answer_text=str(ans.get("answer_text") or ans.get("answer") or ""),
        ))

    db.commit()
    db.refresh(response)

    # Audit log — anonymity tag preserved
    create_audit_log(
        db,
        event_type="Survey Submitted",
        employee_id=None if survey.is_anonymous else employee_id,
        content_id=survey_id, channel="web", outcome="success",
        detail=f"Response submitted to survey #{survey_id}",
        is_anonymous=bool(survey.is_anonymous),
    )

    return {
        "response_id": response.response_id,
        "survey_id": survey_id,
        "is_anonymous": bool(survey.is_anonymous),
        "submitted_at": response.submitted_at.isoformat() if response.submitted_at else None,
    }


def create_survey(
    db: Session, payload: dict, submit_for_approval: bool = False
) -> Survey:
    s = Survey(
        title=payload.get("title"),
        description=payload.get("description"),
        target_audience=payload.get("target_audience") or payload.get("audience"),
        audience=payload.get("audience") or payload.get("target_audience"),
        open_date=_parse_date(payload.get("open_date")),
        close_date=_parse_date(payload.get("close_date")),
        is_anonymous=bool(payload.get("is_anonymous", True)),
        status="pending_approval" if submit_for_approval else "draft",
        created_by=payload.get("created_by") or 2,
        approved_status="pending",
    )
    db.add(s)
    db.flush()

    # Add questions
    for idx, q in enumerate(payload.get("questions") or [], start=1):
        db.add(SurveyQuestion(
            survey_id=s.survey_id,
            question_order=idx,
            question_text=q.get("question_text") or q.get("text"),
            question_type=q.get("question_type") or q.get("type") or "text",
            options=q.get("options"),
        ))

    if submit_for_approval:
        db.add(Approval(
            content_type="survey",
            content_id=s.survey_id,
            title=s.title,
            submitter_id=s.created_by,
            status="pending",
            reviewer_id=DEFAULT_REVIEWER,
            sla_due_at=datetime.utcnow() + timedelta(hours=APPROVAL_SLA_HOURS),
        ))

    db.commit()
    db.refresh(s)

    create_audit_log(
        db, event_type="Survey Created", employee_id=s.created_by,
        content_id=s.survey_id, channel="web", outcome="success",
        detail=f"Survey '{s.title}' created (anonymous={s.is_anonymous})",
    )
    return s


def _parse_date(v):
    if not v:
        return None
    if isinstance(v, str):
        try:
            return datetime.strptime(v[:10], "%Y-%m-%d").date()
        except Exception:
            return None
    return v


def _question_dict(q):
    return {
        "question_id": q.question_id,
        "question_order": q.question_order,
        "question_text": q.question_text,
        "question_type": q.question_type.value if hasattr(q.question_type, "value") else q.question_type,
        "options": q.options,
    }
