"""Audit log model — BR-006 append-only, with anonymity tag."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from app.config.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=True)
    employee_id = Column(Integer, nullable=True)
    content_id = Column(Integer, nullable=True)
    channel = Column(String(50), nullable=True)
    outcome = Column(String(100), nullable=True)
    reviewer_decision = Column(String(50), nullable=True)
    detail = Column(Text, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
