"""FastAPI entry point — Employee Engagement Platform."""
import logging
import traceback

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError, ProgrammingError, OperationalError
from sqlalchemy.orm import Session

from app.config.settings import APP_NAME, APP_VERSION, API_V1_STR, DB_SCHEMA
from app.config.database import get_db

# Module routers
from app.modules.employees.router import router as employees_router
from app.modules.events.router import router as events_router
from app.modules.surveys.router import router as surveys_router
from app.modules.knowledge_base.router import router as knowledge_base_router
from app.modules.notifications.router import router as notifications_router
from app.modules.audit_logs.router import router as audit_logs_router
from app.modules.templates.router import router as templates_router
from app.modules.tasks.router import router as tasks_router
from app.modules.approvals.router import router as approvals_router
from app.modules.recognitions.router import router as recognitions_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.drafts.router import router as drafts_router


app = FastAPI(
    title=APP_NAME,
    description="Employee Engagement Platform — Phase 1 MVP (BR-001 through BR-006)",
    version=APP_VERSION,
    docs_url=f"{API_V1_STR}/docs",
    redoc_url=f"{API_V1_STR}/redoc",
    openapi_url=f"{API_V1_STR}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cors_headers(request):
    return {"Access-Control-Allow-Origin": request.headers.get("origin", "*")}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logging.error(f"Validation error: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()}, headers=_cors_headers(request))


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request, exc):
    path = request.url.path
    method = request.method
    logging.error(
        f"Database error on {method} {path}: {exc.__class__.__name__}: {exc}\n"
        f"{traceback.format_exc()}"
    )
    if isinstance(exc, ProgrammingError):
        detail = "Database schema error — a required table or column is missing."
    elif isinstance(exc, OperationalError):
        detail = "Database connection error — backend cannot reach the database."
    else:
        detail = "Unexpected database error."
    return JSONResponse(
        status_code=500,
        content={"error": "database_error", "detail": detail, "path": path},
        headers=_cors_headers(request),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logging.error(f"Unhandled error: {exc}\n{traceback.format_exc()}")
    return JSONResponse(status_code=500, content={"detail": str(exc)}, headers=_cors_headers(request))


@app.get(API_V1_STR + "/health", tags=["system"])
def health():
    return {"status": "healthy", "app": APP_NAME, "version": APP_VERSION}


@app.get(API_V1_STR + "/health/db", tags=["system"])
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    tables_visible = db.execute(
        text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = :s"),
        {"s": DB_SCHEMA},
    ).scalar()
    return {"status": "ok", "schema": DB_SCHEMA, "tables_visible": int(tables_visible or 0)}


@app.get(API_V1_STR + "/", tags=["system"])
def root():
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "docs": f"{API_V1_STR}/docs",
        "health": f"{API_V1_STR}/health",
    }


for r in (
    employees_router, events_router, surveys_router,
    knowledge_base_router, notifications_router, audit_logs_router,
    templates_router, tasks_router, approvals_router,
    recognitions_router, dashboard_router,
    drafts_router,
):
    app.include_router(r, prefix=API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    from app.config.app_config import PORT
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="info")
