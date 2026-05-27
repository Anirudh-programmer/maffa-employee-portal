"""Approval model — BR-005 with 24h SLA tracking."""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, Text, Boolean
from app.config.database import Base


class ContentTypeEnum(str, Enum):
    EVENT = "event"
    SURVEY = "survey"
    ARTICLE = "article"
    TEMPLATE = "template"


class ApprovalStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Approval(Base):
    __tablename__ = "approvals"

    approval_id = Column(Integer, primary_key=True, index=True)
    content_type = Column(
        SQLEnum(ContentTypeEnum, name="content_type_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
    )
    content_id = Column(Integer, nullable=True)
    title = Column(String(200), nullable=True)
    submitter_id = Column(Integer, nullable=True)
    status = Column(
        SQLEnum(ApprovalStatusEnum, name="approval_status_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        default=ApprovalStatusEnum.PENDING,
    )
    reviewer_id = Column(Integer, nullable=True)
    comments = Column(Text, nullable=True)
    sla_due_at = Column(DateTime, nullable=True)
    sla_breached = Column(Boolean, default=False)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
