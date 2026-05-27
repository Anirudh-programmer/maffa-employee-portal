"""Engagement event models — BR-002 with time-conflict columns."""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, Enum as SQLEnum, Text, Float, ForeignKey, UniqueConstraint
from app.config.database import Base


class EventStatusEnum(str, Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    PUBLISHED = "published"
    COMPLETED = "completed"


class ParticipationStatusEnum(str, Enum):
    REGISTERED = "registered"
    PARTICIPATED = "participated"
    ABSENT = "absent"


class _ApprovalStatusLocal(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class EngagementEvent(Base):
    __tablename__ = "engagement_events"

    event_id = Column(Integer, primary_key=True, index=True)
    event_name = Column(String(150), nullable=True)
    event_type = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    target_audience = Column(String(100), nullable=True)
    registration_start = Column(Date, nullable=True)
    registration_end = Column(Date, nullable=True)
    event_start_time = Column(DateTime, nullable=True)
    event_end_time = Column(DateTime, nullable=True)
    event_date = Column(Date, nullable=True)
    published_date = Column(Date, nullable=True)
    status = Column(
        SQLEnum(EventStatusEnum, name="engagement_status_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        default=EventStatusEnum.DRAFT,
    )
    created_by = Column(Integer, nullable=True)
    approved_status = Column(
        SQLEnum(_ApprovalStatusLocal, name="approval_status_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        default=_ApprovalStatusLocal.PENDING,
    )
    created_at = Column(DateTime, default=datetime.utcnow)


class EventParticipant(Base):
    __tablename__ = "event_participants"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("engagement_events.event_id", ondelete="CASCADE"), nullable=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True, index=True)
    registration_status = Column(Boolean, default=False)
    participation_status = Column(
        SQLEnum(ParticipationStatusEnum, name="participation_status_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
    )
    feedback_rating = Column(Float, nullable=True)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint('event_id', 'employee_id', name='uq_event_employee'),)
