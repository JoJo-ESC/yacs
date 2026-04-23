from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base


class SavedSchedule(Base):
    __tablename__ = "saved_schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)  # TODO: Add ForeignKey('users.id') when User model lands
    name = Column(String(100), nullable=False)
    semester = Column(String(20), nullable=False)  # matches Course.term, e.g. "202501"
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    sections = relationship("SavedScheduleSection", back_populates="schedule", cascade="all, delete-orphan")


class SavedScheduleSection(Base):
    __tablename__ = "saved_schedule_sections"

    schedule_id = Column(Integer, ForeignKey("saved_schedules.id", ondelete="CASCADE"), primary_key=True)
    crn = Column(String(10), primary_key=True)
    term = Column(String(10), primary_key=True)  # matches Course.term

    schedule = relationship("SavedSchedule", back_populates="sections")
