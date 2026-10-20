from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Any

from models.database_session import SessionLocal
from models.user_plan import UserPlan

router = APIRouter(prefix="/api", tags=["Planner"])


def _require_user(request: Request):
    """Returns user_id from session or None if not logged in."""
    user = request.session.get("user")
    return user["user_id"] if user else None


class PlanBody(BaseModel):
    plan: dict[str, Any]


@router.get("/plan")
async def get_plan(request: Request):
    user_id = _require_user(request)
    if user_id is None:
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"success": False, "message": "Not authorized."})

    db = SessionLocal()
    try:
        row = db.query(UserPlan).filter(UserPlan.user_id == user_id).first()
        return {"plan": row.plan_data if row else {}}
    finally:
        db.close()


@router.put("/plan")
async def save_plan(request: Request, body: PlanBody):
    user_id = _require_user(request)
    if user_id is None:
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"success": False, "message": "Not authorized."})

    db = SessionLocal()
    try:
        row = db.query(UserPlan).filter(UserPlan.user_id == user_id).first()
        if row:
            row.plan_data = body.plan
        else:
            row = UserPlan(user_id=user_id, plan_data=body.plan)
            db.add(row)
        db.commit()
        return {"success": True}
    finally:
        db.close()
