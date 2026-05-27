"""Notification model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from app.config.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True, index=True)
    title = Column(String(200), nullable=True)
    message = Column(Text, nullable=True)
    notification_type = Column(String(50), nullable=True)
    related_id = Column(Integer, nullable=True)
    related_type = Column(String(50), nullable=True)
    channel = Column(String(50), nullable=True)
    status = Column(String(20), default="pending")
    retry_count = Column(Integer, default=0)
    sent_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
