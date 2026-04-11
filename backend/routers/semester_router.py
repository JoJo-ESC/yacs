from fastapi import APIRouter

from services import semester_service

router = APIRouter(prefix="/api", tags=["Semesters"])


@router.get("/semesters")
async def list_semesters():
    """List available semesters from configured backend data sources."""
    return {"semesters": semester_service.list_semesters()}
