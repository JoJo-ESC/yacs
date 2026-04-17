from fastapi import APIRouter, HTTPException, Request, Response

from schemas.api_models import UserCreate, UserProfileResponse, UserProfileUpdate
from services import user_service

router = APIRouter(prefix="/api", tags=["Users"])


def _unwrap_service_result(result: dict):
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post('/user')
async def add_user(user: UserCreate):
    """Create a new user account."""
    return _unwrap_service_result(user_service.create_user(user.dict()))


@router.delete('/user')
async def delete_user(request: Request):
    """Delete the currently logged-in user."""
    if 'user' not in request.session:
        return Response("Not authorized", status_code=403)
    user_id = request.session['user']['user_id']
    return user_service.delete_current_user(user_id)


@router.get('/profile', response_model=UserProfileResponse)
async def get_profile(request: Request):
    """Return the currently logged-in user's profile."""
    if 'user' not in request.session:
        return Response("Not authorized", status_code=403)
    user_id = request.session['user']['user_id']
    return _unwrap_service_result(user_service.get_user_profile(user_id))


@router.patch('/profile', response_model=UserProfileResponse)
async def update_profile(request: Request, profile_data: UserProfileUpdate):
    """Update the currently logged-in user's profile."""
    if 'user' not in request.session:
        return Response("Not authorized", status_code=403)
    user_id = request.session['user']['user_id']
    return _unwrap_service_result(
        user_service.update_user_profile(user_id, profile_data.dict(exclude_unset=True))
    )
