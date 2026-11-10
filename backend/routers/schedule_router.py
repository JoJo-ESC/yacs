import json
from typing import Any

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from models.database_session import SessionLocal
from models.user_schedule import UserSchedule

router = APIRouter(prefix="/api", tags=["Schedules"])

# Generous for real use (each course carries its meeting times), but stops
# one account from storing arbitrarily large blobs.
MAX_SCHEDULE_BYTES = 2 * 1024 * 1024


def _require_user(request: Request):
    """Returns user_id from session or None if not logged in."""
    user = request.session.get("user")
    return user["user_id"] if user else None


def _forbidden():
    return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"success": False, "message": "Not authorized."})


class SchedulesBody(BaseModel):
    schedules: dict[str, Any]


@router.get("/schedules")
async def get_schedules(request: Request):
    user_id = _require_user(request)
    if user_id is None:
        return _forbidden()

    db = SessionLocal()
    try:
        row = db.query(UserSchedule).filter(UserSchedule.user_id == user_id).first()
        return {"schedules": row.schedule_data if row else {}}
    finally:
        db.close()


@router.put("/schedules")
async def save_schedules(request: Request, body: SchedulesBody):
    user_id = _require_user(request)
    if user_id is None:
        return _forbidden()

    if len(json.dumps(body.schedules)) > MAX_SCHEDULE_BYTES:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"success": False, "message": "Schedules are too large to save."},
        )

    db = SessionLocal()
    try:
        row = db.query(UserSchedule).filter(UserSchedule.user_id == user_id).first()
        if row:
            row.schedule_data = body.schedules
        else:
            db.add(UserSchedule(user_id=user_id, schedule_data=body.schedules))
        db.commit()
        return {"success": True}
    finally:
        db.close()
