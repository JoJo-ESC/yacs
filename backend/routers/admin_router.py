from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from schemas.api_models import RoleUpdatePydantic
from services import user_service

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users")
def list_users():
    """List all registered users for admin review."""
    result = user_service.list_users()
    return JSONResponse(status_code=status.HTTP_200_OK, content=result)


@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, payload: RoleUpdatePydantic):
    """Promote or demote a user to a specific role."""
    result = user_service.set_user_role(user_id, payload.role)
    if result.get("success"):
        return JSONResponse(status_code=status.HTTP_200_OK, content=result)
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=result)
