from sqlalchemy import Boolean, Column, ForeignKeyConstraint, Integer, String
from sqlalchemy.orm import relationship
from .database import Base


class MeetingTime(Base):
    __tablename__ = 'meeting_time'
    __table_args__ = (
        ForeignKeyConstraint(
            ['term', 'crn'],
            ['course.term', 'course.crn'],
            ondelete='CASCADE',
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Foreign key back to the course section
    term = Column(String(10), nullable=False, index=True)
    crn = Column(String(10), nullable=False, index=True)

    # Days of week
    monday = Column(Boolean, default=False)
    tuesday = Column(Boolean, default=False)
    wednesday = Column(Boolean, default=False)
    thursday = Column(Boolean, default=False)
    friday = Column(Boolean, default=False)
    saturday = Column(Boolean, default=False)
    sunday = Column(Boolean, default=False)

    # Time range — stored as "HHMM" strings (e.g. "0900", "1050")
    begin_time = Column(String(4))
    end_time = Column(String(4))

    # Location
    building = Column(String(20))
    building_description = Column(String(100))
    room = Column(String(20))

    # Date range for the meeting pattern
    start_date = Column(String(10))  # "MM/DD/YYYY"
    end_date = Column(String(10))    # "MM/DD/YYYY"

    # Category/type (e.g. "L" = lecture, "M" = other)
    meeting_schedule_type = Column(String(10))

    # Instructor name — denormalized from faculty[] for simplicity
    instructor_name = Column(String(100))

    # Relationship back to Course
    course = relationship('Course', back_populates='meeting_times')
