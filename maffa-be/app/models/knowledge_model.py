"""Knowledge base models — BR-004 with three-tier confidence (high/partial/low)."""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, Enum as SQLEnum, Text, Float, ForeignKey, JSON
from app.config.database import Base


class QueryStatusEnum(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


class KnowledgeBaseArticle(Base):
    __tablename__ = "knowledge_base_articles"

    article_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=True)
    content = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    role_tag = Column(String(100), nullable=True)
    author = Column(Integer, nullable=True)
    version = Column(Integer, default=1)
    status = Column(String(50), default="published")
    last_reviewed_date = Column(Date, nullable=True)
    review_due_date = Column(Date, nullable=True)
    keywords = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class QueryLog(Base):
    __tablename__ = "query_logs"

    query_id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True, index=True)
    query_text = Column(Text, nullable=True)
    matched_article_id = Column(Integer, ForeignKey("knowledge_base_articles.article_id"), nullable=True)
    related_articles = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=True)
    confidence_band = Column(String(20), nullable=True)  # 'high' | 'partial' | 'low'
    response_delivered = Column(Text, nullable=True)
    escalation_flag = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class QueryEscalation(Base):
    __tablename__ = "query_escalations"

    id = Column(Integer, primary_key=True, index=True)
    query_id = Column(Integer, ForeignKey("query_logs.query_id", ondelete="CASCADE"), nullable=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    ticket_ref = Column(String(50), nullable=True)
    assigned_to = Column(Integer, nullable=True)
    status = Column(
        SQLEnum(QueryStatusEnum, name="query_status_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        default=QueryStatusEnum.OPEN,
    )
    sla_breached = Column(Boolean, default=False)
    sla_due_at = Column(DateTime, nullable=True)
    resolution_text = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
