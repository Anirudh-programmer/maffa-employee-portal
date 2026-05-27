"""Knowledge Base service — BR-004 three-tier confidence (high ≥ 0.90, partial 0.60–0.89, low < 0.60)."""
import re
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models import KnowledgeBaseArticle, QueryLog, QueryEscalation
from app.modules.service_utils import clean_pagination
from app.modules.audit_logs.service import create_audit_log
from app.modules.notifications.service import create_notification

CONF_HIGH = 0.90
CONF_PARTIAL = 0.60
QUERY_SLA_HOURS = 48
DEFAULT_HR_REVIEWER = 3  # Rajesh (HR Ops Manager)


# ── Articles ────────────────────────────────────────────────
def list_articles(
    db: Session, skip: int = 0, limit: int = 100,
    category: Optional[str] = None, status: Optional[str] = None,
):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(KnowledgeBaseArticle).order_by(KnowledgeBaseArticle.created_at.desc())
    if category:
        q = q.filter(KnowledgeBaseArticle.category == category)
    if status:
        q = q.filter(KnowledgeBaseArticle.status == status)
    total = q.count()
    return q.offset(skip).limit(limit).all(), total


def get_article(db: Session, article_id: int):
    return db.query(KnowledgeBaseArticle).filter(
        KnowledgeBaseArticle.article_id == article_id
    ).first()


# ── Confidence scoring (keyword-based, deterministic) ───────
_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> List[str]:
    return _TOKEN_RE.findall((text or "").lower())


_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "do", "for", "from",
    "how", "i", "in", "is", "it", "of", "on", "or", "the", "to", "what",
    "when", "where", "who", "why", "with", "you", "your", "my", "me",
    "can", "could", "should", "would", "will", "shall", "may", "might",
    "have", "has", "had", "this", "that", "these", "those", "we", "us",
    "our", "they", "them", "their", "if", "but", "so", "than", "then",
    "about",
}


def _score_article(query_tokens: set, article: KnowledgeBaseArticle) -> float:
    """Return a confidence score in [0, 1] based on keyword overlap.

    The `keywords` column is curated specifically for query matching, so it gets
    the dominant weight. A query that hits the keywords with strong coverage
    lands in the high band (>= 0.90).
    """
    if not query_tokens:
        return 0.0

    qt = {t for t in query_tokens if t not in _STOPWORDS and len(t) > 2}
    if not qt:
        return 0.0

    title_tokens = set(_tokenize(article.title or "")) - _STOPWORDS
    kw_tokens = set(_tokenize(article.keywords or "")) - _STOPWORDS
    content_tokens = set(_tokenize(article.content or "")) - _STOPWORDS

    title_overlap = qt & title_tokens
    kw_overlap = qt & kw_tokens
    content_overlap = qt & content_tokens

    # Query coverage: of the meaningful query tokens, how many landed somewhere?
    landed = title_overlap | kw_overlap | content_overlap
    query_coverage = len(landed) / max(len(qt), 1)

    # Combine — match count drives the score with diminishing returns
    # 1 keyword match = ~0.55 (low/partial border), 2 = ~0.85 (high band entry), 3+ = high band
    nk = len(kw_overlap)
    nt = len(title_overlap)
    nc = len(content_overlap)
    weighted_matches = nk + (nt * 0.7) + (nc * 0.3)

    if weighted_matches <= 0:
        return 0.0

    # Sigmoid-ish: 1 hit=.55, 2 hits=.80, 3 hits=.92, 4+=.96
    base = 1.0 - (0.45 ** weighted_matches)

    # Penalize if query is mostly noise vs. matches (very long unrelated queries)
    if query_coverage < 0.20 and weighted_matches < 2:
        base *= 0.70

    return round(min(1.0, base), 3)


# ── Query handler with three-tier confidence ────────────────
def submit_query(db: Session, employee_id: int, query_text: str) -> dict:
    """BR-004: matches against KB; returns one of three responses."""
    tokens = set(_tokenize(query_text)) - _STOPWORDS
    articles = db.query(KnowledgeBaseArticle).filter(
        KnowledgeBaseArticle.status == "published"
    ).all()

    scored: List[Tuple[KnowledgeBaseArticle, float]] = sorted(
        ((a, _score_article(tokens, a)) for a in articles),
        key=lambda x: x[1], reverse=True,
    )
    top_article, top_score = (scored[0] if scored else (None, 0.0))

    band: str
    if top_article and top_score >= CONF_HIGH:
        band = "high"
    elif top_article and top_score >= CONF_PARTIAL:
        band = "partial"
    else:
        band = "low"

    # Build response payload
    if band == "high":
        related_ids: List[int] = []
        response_text = top_article.content
    elif band == "partial":
        # Up to 3 related articles in the partial band
        related_ids = [a.article_id for a, s in scored[:3] if s >= CONF_PARTIAL]
        response_text = "Found related articles — please review."
    else:
        related_ids = []
        response_text = "I do not have a confident match. Routing to HR."

    # Persist query log
    ql = QueryLog(
        employee_id=employee_id,
        query_text=query_text,
        matched_article_id=(top_article.article_id if (top_article and band != "low") else None),
        related_articles=related_ids if related_ids else None,
        confidence_score=top_score,
        confidence_band=band,
        response_delivered=response_text,
        escalation_flag=(band == "low"),
    )
    db.add(ql)
    db.commit()
    db.refresh(ql)

    # If low, create escalation with 48h SLA + ticket ref
    escalation = None
    if band == "low":
        ticket_ref = f"EMP-{3000 + ql.query_id:04d}"
        escalation = QueryEscalation(
            query_id=ql.query_id,
            employee_id=employee_id,
            ticket_ref=ticket_ref,
            assigned_to=DEFAULT_HR_REVIEWER,
            status="open",
            sla_due_at=datetime.utcnow() + timedelta(hours=QUERY_SLA_HOURS),
        )
        db.add(escalation)
        db.commit()
        db.refresh(escalation)

        create_notification(
            db, employee_id=employee_id,
            notification_type="query_escalation",
            title="Query Routed to HR",
            message=f"{ticket_ref} escalated — HR will respond within 48 hours.",
            channel="intranet",
            related_id=ql.query_id, related_type="query",
        )

    create_audit_log(
        db, event_type="Query Submitted", employee_id=employee_id,
        content_id=ql.query_id, channel="chat",
        outcome=band, detail=f"score={top_score} band={band}",
    )

    return {
        "query_id": ql.query_id,
        "confidence_score": top_score,
        "confidence_band": band,
        "matched_article": (
            {
                "article_id": top_article.article_id,
                "title": top_article.title,
                "content": top_article.content,
            } if (top_article and band != "low") else None
        ),
        "related_articles": [
            {
                "article_id": a.article_id,
                "title": a.title,
                "score": s,
            }
            for a, s in scored[:3] if s >= CONF_PARTIAL and band == "partial"
        ],
        "response_text": response_text,
        "ticket_ref": (escalation.ticket_ref if escalation else None),
        "sla_due_at": (escalation.sla_due_at.isoformat() if escalation else None),
    }


def list_query_logs(db: Session, skip: int = 0, limit: int = 100,
                    employee_id: Optional[int] = None):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(QueryLog).order_by(QueryLog.created_at.desc())
    if employee_id:
        q = q.filter(QueryLog.employee_id == employee_id)
    total = q.count()
    return q.offset(skip).limit(limit).all(), total


# ── Escalations ─────────────────────────────────────────────
def list_escalations(db: Session, skip: int = 0, limit: int = 100,
                     status: Optional[str] = None):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(QueryEscalation).order_by(QueryEscalation.created_at.desc())
    if status:
        q = q.filter(QueryEscalation.status == status)
    total = q.count()
    return q.offset(skip).limit(limit).all(), total


def resolve_escalation(
    db: Session, escalation_id: int, action: str,
    response_text: Optional[str] = None,
    article_payload: Optional[dict] = None,
) -> Optional[QueryEscalation]:
    """action: send_response | create_kb_article | escalate_further"""
    esc = db.query(QueryEscalation).filter(QueryEscalation.id == escalation_id).first()
    if not esc:
        return None

    now = datetime.utcnow()
    sla_breached = bool(esc.sla_due_at and now > esc.sla_due_at)

    if action == "send_response":
        esc.resolution_text = response_text
        esc.status = "closed"
        esc.resolved_at = now
        esc.sla_breached = sla_breached
        # Update the linked query log
        ql = db.query(QueryLog).filter(QueryLog.query_id == esc.query_id).first()
        if ql and response_text:
            ql.response_delivered = response_text

    elif action == "create_kb_article":
        # Auto-create KB article from resolution
        if article_payload:
            new_article = KnowledgeBaseArticle(
                title=article_payload.get("title") or f"From {esc.ticket_ref}",
                content=article_payload.get("content") or response_text or "",
                category=article_payload.get("category") or "HR FAQ",
                role_tag="All",
                author=DEFAULT_HR_REVIEWER,
                version=1,
                status="published",
                last_reviewed_date=now.date(),
                keywords=article_payload.get("keywords") or "",
            )
            db.add(new_article)
            db.flush()
            esc.resolution_text = (
                f"Resolved + new KB article #{new_article.article_id}: "
                f"{new_article.title}"
            )
        esc.status = "closed"
        esc.resolved_at = now
        esc.sla_breached = sla_breached

    elif action == "escalate_further":
        esc.status = "in_progress"
        esc.resolution_text = (response_text or "Escalated to Head of HR")
        esc.assigned_to = 3  # Head of HR / HR Ops Manager

    else:
        return None

    db.commit()
    db.refresh(esc)

    create_audit_log(
        db, event_type=f"Escalation {action}",
        employee_id=esc.employee_id, content_id=esc.id, channel="web",
        outcome="success" if not sla_breached else "sla_breached",
        detail=f"{esc.ticket_ref}: {action}",
    )

    if esc.employee_id and action == "send_response":
        create_notification(
            db, employee_id=esc.employee_id,
            notification_type="query_response",
            title="Query Resolved",
            message=f"{esc.ticket_ref}: {response_text or 'HR has responded.'}",
            channel="intranet",
            related_id=esc.id, related_type="escalation",
        )

    return esc


def get_escalation_stats(db: Session) -> dict:
    items = db.query(QueryEscalation).all()
    total = len(items)
    open_count = sum(1 for i in items if i.status == "open")
    in_progress = sum(1 for i in items if i.status == "in_progress")
    closed = sum(1 for i in items if i.status == "closed")
    now = datetime.utcnow()
    breached = sum(
        1 for i in items
        if i.status != "closed" and i.sla_due_at and now > i.sla_due_at
    )
    return {
        "total": total, "open": open_count,
        "in_progress": in_progress, "closed": closed,
        "breached": breached,
    }
