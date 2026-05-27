"""Survey models — BR-003 with anonymity flag."""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, Enum as SQLEnum, Text, JSON, ForeignKey, CheckConstraint
from app.config.database import Base


class _ApprovalStatusLocal(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class QuestionTypeEnum(str, Enum):
    MCQ = "mcq"
    RATING = "rating"
    TEXT = "text"


class Survey(Base):
    __tablename__ = "surveys"

    survey_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    target_audience = Column(String(100), nullable=True)
    audience = Column(String(100), nullable=True)
    open_date = Column(Date, nullable=True)
    close_date = Column(Date, nullable=True)
    is_anonymous = Column(Boolean, default=True)
    status = Column(String(20), default="draft")
    created_by = Column(Integer, nullable=True)
    approved_status = Column(
        SQLEnum(_ApprovalStatusLocal, name="approval_status_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        default=_ApprovalStatusLocal.PENDING,
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (CheckConstraint('open_date <= close_date'),)


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    question_id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.survey_id", ondelete="CASCADE"), nullable=True, index=True)
    question_order = Column(Integer, default=1)
    question_text = Column(Text, nullable=True)
    question_type = Column(
        SQLEnum(QuestionTypeEnum, name="question_type_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
    )
    options = Column(JSON, nullable=True)


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    response_id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.survey_id", ondelete="CASCADE"), nullable=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True, index=True)
    is_anonymous = Column(Boolean, default=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)


class SurveyAnswer(Base):
    __tablename__ = "survey_answers"

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("survey_responses.response_id", ondelete="CASCADE"), nullable=True, index=True)
    question_id = Column(Integer, ForeignKey("survey_questions.question_id"), nullable=True)
    answer_text = Column(Text, nullable=True)
