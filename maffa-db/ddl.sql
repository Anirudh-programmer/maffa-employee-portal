-- ============================================================
-- DDL Script — Employee Engagement Platform (Phase 1 MVP)
-- Aligned to Virtual Humanoid User Flow document, BRD V1
-- Compatible with: PostgreSQL 14+
-- ============================================================

CREATE SCHEMA IF NOT EXISTS "maffa";
SET search_path TO "maffa";

-- ── Drop tables in correct order (child first) ──────────────
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS query_escalations CASCADE;
DROP TABLE IF EXISTS query_logs CASCADE;
DROP TABLE IF EXISTS knowledge_base_articles CASCADE;
DROP TABLE IF EXISTS survey_answers CASCADE;
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS survey_questions CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS engagement_events CASCADE;
DROP TABLE IF EXISTS recognition_delivery_logs CASCADE;
DROP TABLE IF EXISTS recognition_events CASCADE;
DROP TABLE IF EXISTS recognition_templates CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- ── Drop ENUM types ────────────────────────────────────────
DROP TYPE IF EXISTS event_type_enum CASCADE;
DROP TYPE IF EXISTS approval_status_enum CASCADE;
DROP TYPE IF EXISTS delivery_status_enum CASCADE;
DROP TYPE IF EXISTS notification_channel_enum CASCADE;
DROP TYPE IF EXISTS engagement_status_enum CASCADE;
DROP TYPE IF EXISTS participation_status_enum CASCADE;
DROP TYPE IF EXISTS question_type_enum CASCADE;
DROP TYPE IF EXISTS query_status_enum CASCADE;
DROP TYPE IF EXISTS content_type_enum CASCADE;
DROP TYPE IF EXISTS notification_type_enum CASCADE;
DROP TYPE IF EXISTS notification_status_enum CASCADE;
DROP TYPE IF EXISTS recognition_pref_enum CASCADE;
DROP TYPE IF EXISTS employment_status_enum CASCADE;

-- ── ENUM Types ───────────────────────────────────────────────
CREATE TYPE event_type_enum            AS ENUM ('birthday', 'anniversary', 'other');
CREATE TYPE approval_status_enum       AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE delivery_status_enum       AS ENUM ('pending', 'success', 'failed');
CREATE TYPE notification_channel_enum  AS ENUM ('email', 'chat', 'intranet');
CREATE TYPE engagement_status_enum     AS ENUM ('draft', 'pending_approval', 'published', 'completed');
CREATE TYPE participation_status_enum  AS ENUM ('registered', 'participated', 'absent');
CREATE TYPE question_type_enum         AS ENUM ('mcq', 'rating', 'text');
CREATE TYPE query_status_enum          AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE content_type_enum          AS ENUM ('event', 'survey', 'article', 'template');
CREATE TYPE notification_status_enum   AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE recognition_pref_enum      AS ENUM ('public', 'private', 'off');
CREATE TYPE employment_status_enum     AS ENUM ('active', 'on_leave', 'terminated', 'new_joiner');

-- ── Table 1.1: Employee Master ───────────────────────────────
-- BR-001: includes recognition_preference (Public/Private/Off)
-- BR-001: employment_status filter (active/on_leave/terminated/new_joiner)
-- BR-001: validation_flag for missing DOB / joining date
CREATE TABLE employees (
    employee_id            SERIAL        PRIMARY KEY,
    name                   VARCHAR(100)  NOT NULL,
    email                  VARCHAR(150)  UNIQUE NOT NULL,
    date_of_birth          DATE,
    joining_date           DATE,
    department             VARCHAR(100),
    role                   VARCHAR(100),
    location               VARCHAR(100),
    language               VARCHAR(50)   DEFAULT 'English',
    time_zone              VARCHAR(50)   DEFAULT 'Asia/Kolkata',
    employment_status      employment_status_enum DEFAULT 'active',
    recognition_preference recognition_pref_enum  DEFAULT 'public',
    notify_events          BOOLEAN       DEFAULT TRUE,
    notify_surveys         BOOLEAN       DEFAULT TRUE,
    notify_recognition     BOOLEAN       DEFAULT TRUE,
    validation_flag        VARCHAR(50),
    created_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 1.2: Recognition Templates ────────────────────────
CREATE TABLE recognition_templates (
    template_id     SERIAL        PRIMARY KEY,
    template_name   VARCHAR(100),
    event_type      event_type_enum,
    content         TEXT,
    version         INTEGER       DEFAULT 1,
    is_active       BOOLEAN       DEFAULT TRUE,
    created_by      INTEGER       REFERENCES employees(employee_id),
    approved_status approval_status_enum DEFAULT 'pending',
    reviewer_note   TEXT,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 1.3: Recognition Events ───────────────────────────
CREATE TABLE recognition_events (
    event_id        SERIAL        PRIMARY KEY,
    employee_id     INTEGER       REFERENCES employees(employee_id),
    event_type      event_type_enum,
    trigger_date    DATE,
    template_id     INTEGER       REFERENCES recognition_templates(template_id),
    delivery_status delivery_status_enum DEFAULT 'pending',
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 1.4: Recognition Delivery Log ─────────────────────
-- BR-001: Email ×2 → Chat → Intranet → Dead-letter
CREATE TABLE recognition_delivery_logs (
    id              SERIAL        PRIMARY KEY,
    event_id        INTEGER       REFERENCES recognition_events(event_id) ON DELETE CASCADE,
    channel         notification_channel_enum,
    delivery_status delivery_status_enum,
    retry_count     INTEGER       DEFAULT 0,
    delivered_at    TIMESTAMP,
    error_detail    TEXT
);

-- ── Table 2.1: Engagement Events ────────────────────────────
-- BR-002: time-conflict via event_start_time / event_end_time
CREATE TABLE engagement_events (
    event_id           SERIAL        PRIMARY KEY,
    event_name         VARCHAR(150),
    event_type         VARCHAR(50),
    description        TEXT,
    target_audience    VARCHAR(100),
    registration_start DATE,
    registration_end   DATE,
    event_start_time   TIMESTAMP,
    event_end_time     TIMESTAMP,
    event_date         DATE,
    published_date     DATE,
    status             engagement_status_enum DEFAULT 'draft',
    created_by         INTEGER,
    approved_status    approval_status_enum   DEFAULT 'pending',
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 2.2: Event Participation ──────────────────────────
CREATE TABLE event_participants (
    id                   SERIAL        PRIMARY KEY,
    event_id             INTEGER       REFERENCES engagement_events(event_id) ON DELETE CASCADE,
    employee_id          INTEGER       REFERENCES employees(employee_id),
    registration_status  BOOLEAN       DEFAULT FALSE,
    participation_status participation_status_enum,
    feedback_rating      FLOAT,
    feedback_text        TEXT,
    created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_employee UNIQUE (event_id, employee_id)
);

-- ── Table 3.1: Surveys ───────────────────────────────────────
-- BR-003: is_anonymous toggle
CREATE TABLE surveys (
    survey_id       SERIAL        PRIMARY KEY,
    title           VARCHAR(200),
    description     TEXT,
    target_audience VARCHAR(100),
    audience        VARCHAR(100),
    open_date       DATE,
    close_date      DATE,
    is_anonymous    BOOLEAN       DEFAULT TRUE,
    status          VARCHAR(20)   DEFAULT 'draft',
    created_by      INTEGER,
    approved_status approval_status_enum DEFAULT 'pending',
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CHECK (open_date <= close_date)
);

-- ── Table 3.2: Survey Questions ──────────────────────────────
CREATE TABLE survey_questions (
    question_id    SERIAL        PRIMARY KEY,
    survey_id      INTEGER       REFERENCES surveys(survey_id) ON DELETE CASCADE,
    question_order INTEGER       DEFAULT 1,
    question_text  TEXT,
    question_type  question_type_enum,
    options        JSONB
);

-- ── Table 3.3: Survey Responses ──────────────────────────────
-- For anonymous surveys, employee_id is intentionally NULL (BR-003 / BR-006)
CREATE TABLE survey_responses (
    response_id  SERIAL    PRIMARY KEY,
    survey_id    INTEGER   REFERENCES surveys(survey_id) ON DELETE CASCADE,
    employee_id  INTEGER   REFERENCES employees(employee_id),
    is_anonymous BOOLEAN   DEFAULT TRUE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 3.4: Survey Answers ────────────────────────────────
CREATE TABLE survey_answers (
    id          SERIAL    PRIMARY KEY,
    response_id INTEGER   REFERENCES survey_responses(response_id) ON DELETE CASCADE,
    question_id INTEGER   REFERENCES survey_questions(question_id),
    answer_text TEXT
);

-- ── Table 4.1: Knowledge Base Articles ──────────────────────
CREATE TABLE knowledge_base_articles (
    article_id         SERIAL        PRIMARY KEY,
    title              VARCHAR(200),
    content            TEXT,
    category           VARCHAR(100),
    role_tag           VARCHAR(100),
    author             INTEGER,
    version            INTEGER       DEFAULT 1,
    status             VARCHAR(50)   DEFAULT 'published',
    last_reviewed_date DATE,
    review_due_date    DATE,
    keywords           TEXT,
    created_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 4.2: Query Logs ───────────────────────────────────
-- BR-004: 3-tier confidence (high ≥ 0.90, partial 0.60–0.89, low < 0.60)
CREATE TABLE query_logs (
    query_id          SERIAL    PRIMARY KEY,
    employee_id       INTEGER   REFERENCES employees(employee_id),
    query_text        TEXT,
    matched_article_id INTEGER  REFERENCES knowledge_base_articles(article_id),
    related_articles  JSONB,
    confidence_score  FLOAT,
    confidence_band   VARCHAR(20),
    response_delivered TEXT,
    escalation_flag   BOOLEAN   DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 4.3: Query Escalations ────────────────────────────
-- BR-004: 48h SLA, ticket_ref like EMP-3011
CREATE TABLE query_escalations (
    id              SERIAL    PRIMARY KEY,
    query_id        INTEGER   REFERENCES query_logs(query_id) ON DELETE CASCADE,
    employee_id     INTEGER   REFERENCES employees(employee_id),
    ticket_ref      VARCHAR(50),
    assigned_to     INTEGER,
    status          query_status_enum DEFAULT 'open',
    sla_breached    BOOLEAN   DEFAULT FALSE,
    sla_due_at      TIMESTAMP,
    resolution_text TEXT,
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 5: Approvals (HIL Content Approval Queue) ─────────
-- BR-005: 24h SLA from creation
CREATE TABLE approvals (
    approval_id  SERIAL    PRIMARY KEY,
    content_type content_type_enum,
    content_id   INTEGER,
    title        VARCHAR(200),
    submitter_id INTEGER,
    status       approval_status_enum DEFAULT 'pending',
    reviewer_id  INTEGER,
    comments     TEXT,
    sla_due_at   TIMESTAMP,
    sla_breached BOOLEAN   DEFAULT FALSE,
    decided_at   TIMESTAMP,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 6: Audit Logs (Append-Only) ───────────────────────
-- BR-006
CREATE TABLE audit_logs (
    log_id            SERIAL        PRIMARY KEY,
    event_type        VARCHAR(100),
    employee_id       INTEGER,
    content_id        INTEGER,
    channel           VARCHAR(50),
    outcome           VARCHAR(100),
    reviewer_decision VARCHAR(50),
    detail            TEXT,
    is_anonymous      BOOLEAN       DEFAULT FALSE,
    created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 7: Notifications ────────────────────────────────────
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    employee_id     INTEGER REFERENCES employees(employee_id),
    title           VARCHAR(200),
    message         TEXT,
    notification_type VARCHAR(50),
    related_id      INTEGER,
    related_type    VARCHAR(50),
    channel         VARCHAR(50),
    status          VARCHAR(20) DEFAULT 'pending',
    retry_count     INTEGER DEFAULT 0,
    sent_at         TIMESTAMP,
    read_at         TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Table 8: Tasks ────────────────────────────────────────────
CREATE TABLE tasks (
    id        SERIAL PRIMARY KEY,
    txt       TEXT,
    done      BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
