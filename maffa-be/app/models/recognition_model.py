"""Recognition models — BR-001."""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, Enum as SQLEnum, Text, ForeignKey
from app.config.database import Base


class EventTypeEnum(str, Enum):
    BIRTHDAY = "birthday"
    ANNIVERSARY = "anniversary"
    OTHER = "other"


class _ApprovalStatusLocal(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DeliveryStatusEnum(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class NotificationChannelEnum(str, Enum):
    EMAIL = "email"
    CHAT = "chat"
    INTRANET = "intranet"


class RecognitionTemplate(Base):
    __tablename__ = "recognition_templates"

    template_id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String(100), nullable=True)
    event_type = Column(
        SQLEnum(EventTypeEnum, name="event_type_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
    )
    content = Column(Text, nullable=True)
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, nullable=True)
    approved_status = Column(
        SQLEnum(_ApprovalStatusLocal, name="approval_status_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        default=_ApprovalStatusLocal.PENDING,
    )
    reviewer_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RecognitionEvent(Base):
    __tablename__ = "recognition_events"

    event_id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True, index=True)
    event_type = Column(
        SQLEnum(EventTypeEnum, name="event_type_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
    )
    trigger_date = Column(Date, nullable=True)
    template_id = Column(Integer, ForeignKey("recognition_templates.template_id"), nullable=True)
    delivery_status = Column(
        SQLEnum(DeliveryStatusEnum, name="delivery_status_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        default=DeliveryStatusEnum.PENDING,
    )
    created_at = Column(DateTime, default=datetime.utcnow)


class RecognitionDeliveryLog(Base):
    __tablename__ = "recognition_delivery_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("recognition_events.event_id", ondelete="CASCADE"), nullable=True, index=True)
    channel = Column(
        SQLEnum(NotificationChannelEnum, name="notification_channel_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
    )
    delivery_status = Column(
        SQLEnum(DeliveryStatusEnum, name="delivery_status_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
    )
    retry_count = Column(Integer, default=0)
    delivered_at = Column(DateTime, nullable=True)
    error_detail = Column(Text, nullable=True)
