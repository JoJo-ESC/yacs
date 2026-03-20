from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from schemas.corequisite_schemas import CourseCorequisiteCreate
from services import corequisite_service
from models import SessionLocal


# --- Database Dependency ---
def get_db():
    """Yields a database session and ensures it's closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(prefix="/api", tags=["Corequisites"])


@router.post('/corequisite')
async def add_corequisite_endpoint(coreq: CourseCorequisiteCreate, db: Session = Depends(get_db)):
    """Add a new corequisite relationship."""
    result = corequisite_service.add_corequisite(
        db, coreq.department, coreq.level, coreq.corequisite
    )
    return {"message": "Corequisite added successfully", "id": f"{result.department}-{result.level}"}


@router.get('/corequisite/{department}/{level}')
async def get_corequisites_endpoint(department: str, level: int, db: Session = Depends(get_db)):
    """Get all corequisites for a course."""
    results = corequisite_service.get_corequisites(db, department, level)
    return [{"corequisite": r.corequisite} for r in results]
