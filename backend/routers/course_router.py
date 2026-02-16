# backend/routers/course_router.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from models import SessionLocal
from services import course_service
from schemas.course_schemas import (
    CourseResponse,
    CourseListResponse,
    PaginationMeta,
    DepartmentResponse,
    SemesterResponse,
)


# --- Database Dependency ---
def get_db():
    """Yields a database session and ensures it's closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(prefix="/api", tags=["Courses"])


def build_course_list_response(
    courses,
    *,
    page: int,
    per_page: int,
    total: int,
) -> CourseListResponse:
    """Create a CourseListResponse with consistent pagination metadata."""
    return CourseListResponse(
        data=[CourseResponse.model_validate(c) for c in courses],
        pagination=PaginationMeta(
            page=page,
            per_page=per_page,
            total=total,
            total_pages=(total + per_page - 1) // per_page,
        ),
    )


@router.get('/courses', response_model=CourseListResponse)
async def get_courses(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    semester: Optional[str] = Query(None, description="Filter by semester (e.g., 202501)"),
    db: Session = Depends(get_db)
):
    """Get all courses with pagination."""
    courses, total = course_service.get_all_courses(db, page, per_page, semester)

    return build_course_list_response(
        courses,
        page=page,
        per_page=per_page,
        total=total,
    )


@router.get('/courses/search', response_model=CourseListResponse)
async def search_courses(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    semester: Optional[str] = Query(None, description="Filter by semester"),
    db: Session = Depends(get_db)
):
    """Search courses by name or course code."""
    courses, total = course_service.search_courses(db, q, page, per_page, semester)

    return build_course_list_response(
        courses,
        page=page,
        per_page=per_page,
        total=total,
    )


@router.get('/departments', response_model=List[DepartmentResponse])
async def get_departments(db: Session = Depends(get_db)):
    """Get all departments."""
    departments = course_service.get_departments(db)
    return [DepartmentResponse(**d) for d in departments]


@router.get('/semesters', response_model=List[SemesterResponse])
async def get_semesters(db: Session = Depends(get_db)):
    """Get all available semesters."""
    semesters = course_service.get_semesters(db)
    return [SemesterResponse(**s) for s in semesters]


@router.get('/courses/department/{dept}', response_model=CourseListResponse)
async def get_courses_by_department(
    dept: str,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    semester: Optional[str] = Query(None, description="Filter by semester"),
    db: Session = Depends(get_db)
):
    """Get courses by department."""
    courses, total = course_service.get_courses_by_department(db, dept, page, per_page, semester)

    return build_course_list_response(
        courses,
        page=page,
        per_page=per_page,
        total=total,
    )


@router.get('/courses/{course_id}', response_model=CourseResponse)
async def get_course(course_id: int, db: Session = Depends(get_db)):
    """Get a single course by ID."""
    course = course_service.get_course_by_id(db, course_id)

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return CourseResponse.model_validate(course)
