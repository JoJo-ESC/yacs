from fastapi import APIRouter, Request, Response

from schemas.user_schemas import UserPydantic
from services import user_service

router = APIRouter(prefix="/api", tags=["Users"])


@router.post('/user')
async def add_user(user: UserPydantic):
    """Create a new user account."""
    return user_service.create_user(user.dict())


@router.delete('/user')
async def delete_user(request: Request):
    """Delete the currently logged-in user."""
    if 'user' not in request.session:
        return Response("Not authorized", status_code=403)
    user_id = request.session['user']['user_id']
    return user_service.delete_current_user(user_id)
