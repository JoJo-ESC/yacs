from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import JSONB

from .database import Base


class UserSchedule(Base):
    """A user's saved schedules, in the frontend's format:
    { term: { activeId, schedules: [{ id, name, courses }] } }."""

    __tablename__ = "user_schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    # JSONB on Postgres; plain JSON elsewhere (the tests use SQLite)
    schedule_data = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
