"""Employee model — BR-001 includes recognition_preference and employment_status."""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, Enum as SQLEnum
from app.config.database import Base


class EmploymentStatusEnum(str, Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"
    NEW_JOINER = "new_joiner"


class RecognitionPrefEnum(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    OFF = "off"


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    date_of_birth = Column(Date, nullable=True)
    joining_date = Column(Date, nullable=True)
    department = Column(String(100), nullable=True)
    role = Column(String(100), nullable=True)
    location = Column(String(100), nullable=True)
    language = Column(String(50), default="English")
    time_zone = Column(String(50), default="Asia/Kolkata")
    employment_status = Column(
        SQLEnum(EmploymentStatusEnum, name="employment_status_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        default=EmploymentStatusEnum.ACTIVE,
    )
    recognition_preference = Column(
        SQLEnum(RecognitionPrefEnum, name="recognition_pref_enum",
                values_callable=lambda obj: [e.value for e in obj]),
        default=RecognitionPrefEnum.PUBLIC,
    )
    notify_events = Column(Boolean, default=True)
    notify_surveys = Column(Boolean, default=True)
    notify_recognition = Column(Boolean, default=True)
    validation_flag = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
