# backend/routers/course_router.py

from typing import Callable, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from models import SessionLocal
from services import cache_service, course_service
from schemas.course_schemas import (
    CourseResponse,
    CourseListResponse,
    PaginationMeta,
    DepartmentResponse,
    SemesterResponse,
)

# Course listings and single-course details (enrollment/seats change as the
# scraper re-syncs and as students register) get a short TTL: enough to absorb a traffic spike
# without serving badly stale seat counts.
COURSE_LIST_TTL_SECONDS = 30

# Departments/semesters only change when the catalog itself changes, so a
# longer TTL is safe and keeps these near-static lookups off the database
# almost entirely.
LOOKUP_TABLE_TTL_SECONDS = 600


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


async def _cached_course_list(
    namespace: str,
    cache_params: dict,
    compute: Callable[[], tuple],
    *,
    page: int,
    per_page: int,
) -> CourseListResponse:
    """Read-through cache wrapper shared by the paginated course-list endpoints.

    On a cache miss (or if Redis is unavailable — `cache_service` fails open
    to that on any error) this runs `compute()` against the database exactly
    as before and caches the result; a hit skips the database entirely.
    """
    cache_key = cache_service.build_key(namespace, **cache_params)

    cached = await cache_service.get_json(cache_key)
    if cached is not None:
        return CourseListResponse(**cached)

    courses, total = compute()
    response = build_course_list_response(courses, page=page, per_page=per_page, total=total)

    await cache_service.set_json(cache_key, response.model_dump(mode="json"), COURSE_LIST_TTL_SECONDS)
    return response


async def _cached_lookup_list(namespace: str, compute: Callable[[], list]) -> list:
    """Read-through cache wrapper for the small, near-static lookup endpoints."""
    cache_key = cache_service.build_key(namespace)

    cached = await cache_service.get_json(cache_key)
    if cached is not None:
        return cached

    result = compute()
    await cache_service.set_json(cache_key, result, LOOKUP_TABLE_TTL_SECONDS)
    return result


@router.get('/courses', response_model=CourseListResponse)
async def get_courses(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    semester: Optional[str] = Query(None, description="Filter by semester (e.g., 202501)"),
    db: Session = Depends(get_db)
):
    """Get all courses with pagination."""
    return await _cached_course_list(
        "courses:list",
        {"page": page, "per_page": per_page, "semester": semester},
        lambda: course_service.get_all_courses(db, page, per_page, semester),
        page=page,
        per_page=per_page,
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
    return await _cached_course_list(
        "courses:search",
        {"q": q, "page": page, "per_page": per_page, "semester": semester},
        lambda: course_service.search_courses(db, q, page, per_page, semester),
        page=page,
        per_page=per_page,
    )


@router.get('/departments', response_model=List[DepartmentResponse])
async def get_departments(db: Session = Depends(get_db)):
    """Get all departments."""
    departments = await _cached_lookup_list("departments", lambda: course_service.get_departments(db))
    return [DepartmentResponse(**d) for d in departments]


@router.get('/semesters', response_model=List[SemesterResponse])
async def get_semesters(db: Session = Depends(get_db)):
    """Get all available semesters."""
    semesters = await _cached_lookup_list("semesters", lambda: course_service.get_semesters(db))
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
    return await _cached_course_list(
        "courses:department",
        {"dept": dept, "page": page, "per_page": per_page, "semester": semester},
        lambda: course_service.get_courses_by_department(db, dept, page, per_page, semester),
        page=page,
        per_page=per_page,
    )


@router.get('/courses/{course_id}', response_model=CourseResponse)
async def get_course(course_id: int, db: Session = Depends(get_db)):
    """Get a single course by ID."""
    cache_key = cache_service.build_key("courses:detail", course_id=course_id)

    cached = await cache_service.get_json(cache_key)
    if cached is not None:
        return CourseResponse(**cached)

    course = course_service.get_course_by_id(db, course_id)

    # 404s aren't cached, so a course added by the next import shows up
    # right away rather than after a negative-cache TTL.
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    response = CourseResponse.model_validate(course)
    await cache_service.set_json(cache_key, response.model_dump(mode="json"), COURSE_LIST_TTL_SECONDS)
    return response
