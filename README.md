# Employee Engagement Platform — Phase 1 MVP

A complete, working implementation of the Employee Engagement Platform aligned to the **Virtual Humanoid User Flow** document and **BRD V1**. This README contains everything needed to run the system locally and test every flow.

## What's inside

```
work/
├── maffa-db/               # PostgreSQL schema + seed data
│   ├── ddl.sql             # Schema (12 tables, 13 enums, 3 BR-aligned constraints)
│   └── dml.sql             # 12 employees, 2 surveys, 10 KB articles, 5 query logs, 5 approvals, 14 audit rows
├── maffa-be/               # FastAPI backend (51 routes under /maffa)
│   ├── app/
│   │   ├── main.py         # FastAPI app
│   │   ├── config/         # database.py, settings.py
│   │   ├── models/         # 9 SQLAlchemy models
│   │   └── modules/        # 11 modules: employees, events, surveys, kb, escalations,
│   │                       #             approvals, recognitions, audit_logs, notifications,
│   │                       #             tasks, templates, dashboard
│   ├── .env                # DB connection string
│   ├── requirements.txt
│   └── Dockerfile
├── maffa-fe/               # Vite + React 18 desktop UI
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/     # Dock, LeftStrip (no Calculator/Trash), AuditRail, …
│   │   ├── views/          # 16 views — PortalHome, PortalSurvey, PortalKB, AdminEvents,
│   │   │                   #            AdminSurvey, AdminTemplates, Approval, Escalation,
│   │   │                   #            Audit, DashOverview, DashKB, DashRecog, DashboardApp, …
│   │   └── services/api.js # Single fetch-based client wired to all 51 endpoints
│   ├── .env                # VITE_API_URL=/maffa
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vite.config.js
└── docker-compose.yml      # db + backend + frontend, one command up
```

## Quick start — Docker (one command)

If you have Docker and docker-compose installed:

```bash
cd work/
docker compose up --build
```

That's it. All three services start; PostgreSQL auto-applies `ddl.sql` and `dml.sql` on first boot (via `docker-entrypoint-initdb.d`).

Once the logs stabilize:

- Frontend: <http://localhost:5173/maffa-fe/>
- Backend API: <http://localhost:5001/maffa>
- Swagger docs: <http://localhost:5001/maffa/docs>
- Postgres: `localhost:5432` (user `defaultdb`, password `password`, db `defaultdb`)

To reset the database (clear volume and re-seed):

```bash
docker compose down -v
docker compose up --build
```

## Quick start — Native (no Docker)

### 1. Postgres

Local install or use Aiven/managed Postgres. Default DB name `defaultdb`, user `defaultdb`, password `password`, schema `maffa`.

```bash
# Linux/Mac with system postgres
sudo service postgresql start

# Create user + database
sudo -u postgres psql <<'SQL'
CREATE USER defaultdb WITH PASSWORD 'password';
CREATE DATABASE defaultdb OWNER defaultdb;
GRANT ALL PRIVILEGES ON DATABASE defaultdb TO defaultdb;
SQL

# Apply schema and seed data
PGPASSWORD=password psql -U defaultdb -h 127.0.0.1 -d defaultdb -f maffa-db/ddl.sql
PGWORD=password psql -U defaultdb -h 127.0.0.1 -d defaultdb -f maffa-db/dml.sql
```

### 2. Backend (Python 3.11+)

```bash
cd maffa-be
python -m venv .venv
source .venv/bin/activate          # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# .env already includes the local connection string
python -m uvicorn app.main:app --host 127.0.0.1 --port 5001
```

Verify:

```bash
curl http://127.0.0.1:5001/maffa/health
# {"status":"healthy","app":"Employee Engagement Platform","version":"1.0.0"}
```

### 3. Frontend (Node 18+)

In a separate terminal:

```bash
cd maffa-fe
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/maffa/*` to `127.0.0.1:5001` automatically.

## Aiven Postgres

If you want to use the Aiven instance instead of local Postgres, edit `maffa-be/.env`:

```env
DB_CON_STR=dbname=defaultdb user=avnadmin password='YOUR_PASSWORD' port=23500 host=YOUR_HOST.aivencloud.com db_schema=maffa sslmode=require
```

The connection-string parser handles single-quoted passwords (which is essential for Aiven passwords starting with `AVNS_`).

Then apply DDL/DML directly to Aiven:

```bash
PGPASSWORD='YOUR_PASSWORD' psql \
  "host=YOUR_HOST.aivencloud.com port=23500 user=avnadmin dbname=defaultdb sslmode=require" \
  -f maffa-db/ddl.sql
```

## How the system maps to the humanoid spec

| Humanoid doc claim | Where it's implemented |
| --- | --- |
| 5 dock icons + View Desktop button (no Recently-Opened popup) | `maffa-fe/src/components/Dock.jsx` |
| No Calculator, no Recycle Bin | Files removed; `LeftStrip.jsx` only shows Clock / Calendar / NewNote |
| Q2 Engagement Survey with 5 questions | `dml.sql` seeds Q2 with 5 questions; `PortalSurvey.jsx` loads them via `/surveys/active` |
| Anonymous-by-default surveys (BR-003) | `is_anonymous` boolean on `surveys`, `survey_responses`, `audit_logs`. When anonymous, `employee_id` is stored as `NULL` |
| Recognition Preference: Public / Private / Off (BR-001) | `recognition_pref_enum` on `employees`; UI dropdown on `PortalHome.jsx` and `AdminTemplates.jsx`; cycle runner skips `off`, anonymizes `private` |
| Three-tier KB confidence: ≥0.90 high / 0.60–0.89 partial / <0.60 escalation (BR-004) | `knowledge_base/service.py:_score_article()` returns sigmoid-like score; router branches into the three responses; low band creates `EMP-NNNN` ticket with 48h SLA |
| 24h approval SLA + auto-escalation to Head of HR (BR-005) | `approvals.sla_due_at`, `sla_breached`, `decided_at`; `POST /approvals/escalate-breached` cron-style endpoint |
| 48h query SLA chip on Escalation queue (BR-004) | `query_escalations.sla_due_at`; backend returns `sla_remaining_hours`; FE renders Urgent/Breached chips |
| Validation Flag + Employment Status columns on Recognition Log | `employees.validation_flag`, `employment_status`; `DashRecog.jsx` renders 6 columns |
| Append-only audit log with R05 export (BR-006) | `audit_logs` table; `GET /audit-logs/export` returns CSV; **the export action is itself audit-logged** |
| Anonymity tag on Survey Submitted audit rows | `audit_logs.is_anonymous`; AuditRail and Audit view both render the 🔒 tag |

## Test recipes (curl)

After the backend is running, you can exercise every flow:

```bash
B=http://127.0.0.1:5001/maffa

# 1. Health
curl $B/health

# 2. Employee directory
curl $B/employees | python3 -m json.tool | head -20

# 3. Active survey for Aisha (employee 1) — should return Q2 with 5 questions
curl "$B/surveys/active?employee_id=1" | python3 -m json.tool | head -40

# 4. Submit anonymous response
curl -X POST "$B/surveys/1/submit" -H "Content-Type: application/json" -d '{
  "employee_id": 5,
  "answers": [
    {"question_id": 1, "answer_text": "4"},
    {"question_id": 2, "answer_text": "Mostly clear"},
    {"question_id": 3, "answer_text": "5"},
    {"question_id": 4, "answer_text": "Often"},
    {"question_id": 5, "answer_text": "More frequent town halls."}
  ]
}'

# 5. KB query — high band (returns matched article)
curl -X POST "$B/knowledge_base/query" -H "Content-Type: application/json" \
  -d '{"employee_id": 1, "query_text": "When does the next appraisal cycle begin?"}' \
  | python3 -m json.tool

# 6. KB query — partial band (returns 1-3 related articles)
curl -X POST "$B/knowledge_base/query" -H "Content-Type: application/json" \
  -d '{"employee_id": 1, "query_text": "travel reimbursement amount"}' \
  | python3 -m json.tool

# 7. KB query — low band (creates EMP-NNNN escalation)
curl -X POST "$B/knowledge_base/query" -H "Content-Type: application/json" \
  -d '{"employee_id": 1, "query_text": "What is the cafeteria menu today?"}' \
  | python3 -m json.tool

# 8. Approval queue with SLA chips
curl "$B/approvals" | python3 -m json.tool | head -40
curl $B/approvals/stats

# 9. Approve an item
curl -X PUT "$B/approvals/1" -H "Content-Type: application/json" \
  -d '{"decision":"approved","comments":"Looks good","reviewer_id":3}'

# 10. Auto-escalate breached approvals
curl -X POST "$B/approvals/escalate-breached" -H "Content-Type: application/json" -d '{}'

# 11. Set recognition preference (Public / Private / Off)
curl -X PUT "$B/employees/12/recognition-preference" \
  -H "Content-Type: application/json" -d '{"preference":"private"}'

# 12. Run recognition cycle (honors preferences)
curl -X POST "$B/recognition/run-cycle" -H "Content-Type: application/json" -d '{}'

# 13. R05 audit export (CSV)
curl -O -J "$B/audit-logs/export"   # writes R05_audit_export.csv

# 14. Dashboard KPIs (live)
curl $B/dashboard/overview | python3 -m json.tool

# 15. KB analytics — three-band breakdown
curl $B/dashboard/kb-analytics | python3 -m json.tool

# 16. Register for an event (with time-conflict + duplicate guards)
curl -X POST "$B/events/1/register" -H "Content-Type: application/json" \
  -d '{"employee_id": 12}'

# Trying again returns 400 "Already registered"
curl -X POST "$B/events/1/register" -H "Content-Type: application/json" \
  -d '{"employee_id": 12}'
```

## Personas (matching the humanoid doc)

| ID | Name | Role | Login persona used in FE |
| -- | ---- | ---- | ----------------------- |
| 1  | Aisha Mehta   | Employee            | `PortalHome`, `PortalSurvey`, `PortalKB` (current user `CURRENT_EMP_ID = 1`) |
| 2  | Yogesh Y      | HR Coordinator      | `AdminEvents`, `AdminSurvey`, `AdminTemplates` (`CURRENT_USER_ID = 2`) |
| 3  | Rajesh Kumar  | HR Ops Manager      | `Approval`, `Escalation`, dashboards (`REVIEWER_ID = 3`) |
| 4  | Rajib Basu    | Compliance Reviewer | `Audit` |

## Troubleshooting

**"connection refused" on Postgres** → make sure the postgres service is running; on Linux: `sudo service postgresql start` (or `brew services start postgresql` on Mac).

**"DATABASE_URL or DB_CON_STR must be set"** → check `maffa-be/.env` exists and the password is single-quoted.

**Frontend shows "Failed to fetch"** → backend isn't running on port 5001. Start it with `python -m uvicorn app.main:app --host 127.0.0.1 --port 5001` from `maffa-be/`.

**KB query returns wrong band** → keyword overlap is the only signal; rewrite the query using terms from the article keywords (visible in `dml.sql` → `knowledge_base_articles.keywords` column).

**Want fresh seed data after testing** → `PGPASSWORD=password psql -U defaultdb -h 127.0.0.1 -d defaultdb -f maffa-db/dml.sql` re-runs the DML (it `TRUNCATE`s all tables first).

## API surface (51 routes, all under `/maffa`)

```
GET    /health
GET    /                              # API info

# Employees (BR-001)
GET    /employees
GET    /employees/{id}
GET    /employees/validation-report   # missing DOB / joining-date flagging
PUT    /employees/{id}/recognition-preference         # public | private | off
PUT    /employees/{id}/notification-preferences       # notify_events|surveys|recognition

# Engagement events (BR-002)
GET    /events
GET    /events/{id}
POST   /events                        # ?submit_for_approval=true creates approval
POST   /events/{id}/register          # time-conflict + duplicate guards

# Surveys (BR-003)
GET    /surveys
GET    /surveys/active?employee_id=N
GET    /surveys/{id}
POST   /surveys                       # submit_for_approval
POST   /surveys/{id}/submit           # honors is_anonymous
POST   /surveys/{id}/respond          # alias of /submit

# Knowledge Base (BR-004) — three-tier confidence
GET    /knowledge_base/articles
GET    /knowledge_base/articles/{id}
POST   /knowledge_base/query          # high (>=0.90) / partial (0.60-0.89) / low (<0.60)
GET    /knowledge_base/queries
GET    /escalations                   # 48h SLA tracking
GET    /escalations/stats
PUT    /escalations/{id}              # send_response | create_kb_article | escalate_further

# Approvals (BR-005) — 24h SLA
GET    /approvals
GET    /approvals/stats
GET    /approvals/{id}
PUT    /approvals/{id}                # approved | rejected
POST   /approvals/escalate-breached   # auto-escalate to Head of HR

# Recognition (BR-001)
GET    /templates
POST   /templates
POST   /templates/{id}/resubmit
POST   /recognition/run-cycle         # honors preferences + employment_status
GET    /recognition/log               # 6-col log w/ Validation Flag + Employment Status
GET    /recognition/events

# Audit (BR-006)
GET    /audit-logs
GET    /audit-logs/export             # R05 CSV (self-logging)
GET    /audit-logs/{id}

# Dashboard
GET    /dashboard/overview            # all KPIs in one shot, live
GET    /dashboard/kb-analytics        # three-band breakdown
GET    /dashboard/recognition-analytics

# Notifications
GET    /notifications

# Tasks (sticky-note widget)
GET    /tasks
POST   /tasks
PUT    /tasks/{id}
DELETE /tasks/{id}
```

Every write endpoint emits an `audit_logs` row with `is_anonymous` preserved when relevant. SLA timestamps are computed at write-time and re-evaluated at read-time so countdowns are always live.
