# backend/services/course_service.py

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_
from typing import List, Optional, Tuple

from models.course import Course


def _order_course_query(query):
    """Apply a deterministic ordering for paginated course queries."""
    return query.order_by(
        Course.term.desc(),
        Course.subject.asc(),
        Course.course_number.asc(),
        Course.section.asc(),
        Course.id.asc(),
    )


def get_all_courses(
    db: Session,
    page: int = 1,
    per_page: int = 50,
    semester: Optional[str] = None
) -> Tuple[List[Course], int]:
    """
    Get all courses with pagination and optional semester filter.
    Returns (courses, total_count).
    """
    query = db.query(Course).options(selectinload(Course.meeting_times))

    if semester:
        query = query.filter(Course.term == semester)

    query = _order_course_query(query)

    total = query.order_by(None).count()
    courses = query.offset((page - 1) * per_page).limit(per_page).all()

    return courses, total


def get_course_by_id(db: Session, course_id: int) -> Optional[Course]:
    """Get a single course by ID."""
    return db.query(Course).options(selectinload(Course.meeting_times)).filter(Course.id == course_id).first()


def search_courses(
    db: Session,
    query_str: str,
    page: int = 1,
    per_page: int = 50,
    semester: Optional[str] = None
) -> Tuple[List[Course], int]:
    """
    Search courses by name or course code.
    Returns (courses, total_count).
    """
    search_pattern = f"%{query_str}%"

    query = db.query(Course).options(selectinload(Course.meeting_times)).filter(
        or_(
            Course.course_title.ilike(search_pattern),
            Course.course_number.ilike(search_pattern),
            Course.subject.ilike(search_pattern),
        )
    )

    if semester:
        query = query.filter(Course.term == semester)

    query = _order_course_query(query)

    total = query.order_by(None).count()
    courses = query.offset((page - 1) * per_page).limit(per_page).all()

    return courses, total


def get_departments(db: Session) -> List[dict]:
    """Get all unique departments."""
    results = db.query(
        Course.subject,
        Course.subject_description
    ).distinct().order_by(Course.subject).all()

    return [{"code": r.subject, "name": r.subject_description} for r in results]


def get_courses_by_department(
    db: Session,
    department: str,
    page: int = 1,
    per_page: int = 50,
    semester: Optional[str] = None
) -> Tuple[List[Course], int]:
    """
    Get courses filtered by department.
    Returns (courses, total_count).
    """
    query = db.query(Course).options(selectinload(Course.meeting_times)).filter(Course.subject == department)

    if semester:
        query = query.filter(Course.term == semester)

    query = _order_course_query(query)

    total = query.order_by(None).count()
    courses = query.offset((page - 1) * per_page).limit(per_page).all()

    return courses, total


def get_semesters(db: Session) -> List[dict]:
    """Get all unique semesters."""
    results = db.query(
        Course.term,
        Course.term_desc
    ).distinct().order_by(Course.term.desc()).all()

    return [{"term": r.term, "name": r.term_desc} for r in results]
