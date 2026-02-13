# backend/schemas/course_schemas.py

from pydantic import BaseModel
from typing import List, Optional


class CourseResponse(BaseModel):
    """Single course response."""
    id: int
    term: Optional[str] = None
    term_desc: Optional[str] = None
    crn: Optional[str] = None
    subject: Optional[str] = None
    subject_description: Optional[str] = None
    course_number: Optional[str] = None
    course_title: Optional[str] = None
    credit_hours: Optional[int] = None
    max_enrollment: Optional[int] = None
    enrollment: Optional[int] = None
    seats_available: Optional[int] = None
    section: Optional[str] = None
    schedule_type: Optional[str] = None
    instructional_method: Optional[str] = None

    class Config:
        from_attributes = True  # Allows converting SQLAlchemy models


class PaginationMeta(BaseModel):
    """Pagination metadata."""
    page: int
    per_page: int
    total: int
    total_pages: int


class CourseListResponse(BaseModel):
    """Paginated list of courses."""
    data: List[CourseResponse]
    pagination: PaginationMeta


class DepartmentResponse(BaseModel):
    """Department info."""
    code: str           # e.g., "CSCI"
    name: str           # e.g., "Computer Science"


class SemesterResponse(BaseModel):
    """Semester info."""
    term: str           # e.g., "202501"
    name: str           # e.g., "Spring 2025"


# --- Request schemas (moved from api_models.py) ---

class UserCoursePydantic(BaseModel):
    """User's selected course."""
    name: str
    semester: str
    cid: str


class CourseDeletePydantic(BaseModel):
    """Request to delete a course."""
    name: str
    cid: Optional[str] = None
    semester: str


class SubsemesterPydantic(BaseModel):
    """Subsemester filter."""
    semester: Optional[str] = None


class DefaultSemesterSetPydantic(BaseModel):
    """Set default semester."""
    default: str
