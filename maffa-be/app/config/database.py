"""
Database configuration and SQLAlchemy setup
Initializes SQLAlchemy engine, session factory, and base model class
"""
from sqlalchemy import create_engine, MetaData, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config.settings import DATABASE_URL, DB_SCHEMA

# Create SQLAlchemy engine
# pool_pre_ping=True helps detect stale connections
# echo=False for production (set to True for debugging SQL queries)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
    connect_args={"options": f"-csearch_path=\"{DB_SCHEMA}\",public"}
)


@event.listens_for(engine, "connect")
def _set_search_path(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute(f'SET search_path TO {DB_SCHEMA}, public')
    cursor.close()

# Create session factory
# This factory will be used to create new database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declarative base for all ORM models
# All model classes will inherit from this
metadata = MetaData(schema=DB_SCHEMA)
Base = declarative_base(metadata=metadata)


def get_db():
    """
    Dependency injection function for FastAPI endpoints
    Provides a database session for each request
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
