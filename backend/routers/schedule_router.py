from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List

from models import SessionLocal
from services import schedule_service
from schemas.schedule_schemas import SaveSchedulePydantic, ScheduleResponse


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(prefix="/api", tags=["Schedules"])


@router.get("/schedules", response_model=List[ScheduleResponse])
def get_schedules(request: Request, db: Session = Depends(get_db)):
    """Return all saved schedules for the current user."""
    if "user" not in request.session:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"message": "Not authenticated."})

    user_id = request.session["user"]["user_id"]
    schedules = schedule_service.get_schedules(db, user_id)
    return JSONResponse(status_code=status.HTTP_200_OK, content=schedules)


@router.post("/schedules", response_model=ScheduleResponse)
def save_schedule(request: Request, payload: SaveSchedulePydantic, db: Session = Depends(get_db)):
    """Create or overwrite a named schedule for the current user."""
    if "user" not in request.session:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"message": "Not authenticated."})

    user_id = request.session["user"]["user_id"]
    result = schedule_service.save_schedule(db, user_id, payload.name, payload.semester, payload.crns)
    return JSONResponse(status_code=status.HTTP_200_OK, content=result)


@router.delete("/schedules/{schedule_id}")
def delete_schedule(schedule_id: int, request: Request, db: Session = Depends(get_db)):
    """Delete a saved schedule by ID."""
    if "user" not in request.session:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"message": "Not authenticated."})

    user_id = request.session["user"]["user_id"]
    result = schedule_service.delete_schedule(db, user_id, schedule_id)

    if not result.get("success"):
        code = status.HTTP_404_NOT_FOUND if "not found" in result.get("message", "").lower() else status.HTTP_403_FORBIDDEN
        return JSONResponse(status_code=code, content=result)

    return JSONResponse(status_code=status.HTTP_200_OK, content=result)
