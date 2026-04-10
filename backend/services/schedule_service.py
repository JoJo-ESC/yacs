from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session, selectinload

from models.saved_schedule import SavedSchedule, SavedScheduleSection


def get_schedules(db: Session, user_id: int) -> List[dict]:
    """Return all saved schedules for a user, each with its section CRNs."""
    schedules = (
        db.query(SavedSchedule)
        .options(selectinload(SavedSchedule.sections))
        .filter(SavedSchedule.user_id == user_id)
        .order_by(SavedSchedule.created_at.desc())
        .all()
    )
    return [_serialize(s) for s in schedules]


def save_schedule(db: Session, user_id: int, name: str, semester: str, crns: List[str]) -> dict:
    """
    Create or replace a named schedule for a user.
    If a schedule with the same name and semester already exists for this user, it is overwritten.
    """
    existing = (
        db.query(SavedSchedule)
        .filter(
            SavedSchedule.user_id == user_id,
            SavedSchedule.name == name,
            SavedSchedule.semester == semester,
        )
        .first()
    )

    if existing:
        # Clear old sections and update timestamp
        existing.sections = []
        existing.updated_at = datetime.now(timezone.utc)
        schedule = existing
    else:
        schedule = SavedSchedule(user_id=user_id, name=name, semester=semester)
        db.add(schedule)
        db.flush()  # get schedule.id before adding sections

    for crn in crns:
        db.add(SavedScheduleSection(schedule_id=schedule.id, crn=crn, term=semester))

    db.commit()
    db.refresh(schedule)
    return {"success": True, "schedule": _serialize(schedule)}


def delete_schedule(db: Session, user_id: int, schedule_id: int) -> dict:
    """Delete a schedule. Returns an error if it doesn't exist or belongs to another user."""
    schedule = db.query(SavedSchedule).filter(SavedSchedule.id == schedule_id).first()

    if not schedule:
        return {"success": False, "message": "Schedule not found."}

    if schedule.user_id != user_id:
        return {"success": False, "message": "Not authorized."}

    db.delete(schedule)
    db.commit()
    return {"success": True, "message": "Schedule deleted."}


def _serialize(schedule: SavedSchedule) -> dict:
    return {
        "id": schedule.id,
        "name": schedule.name,
        "semester": schedule.semester,
        "crns": [s.crn for s in schedule.sections],
        "created_at": schedule.created_at.isoformat(),
        "updated_at": schedule.updated_at.isoformat(),
    }
