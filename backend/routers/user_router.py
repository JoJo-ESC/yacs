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

'''
@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(request: Request):
    
    #disabled for testing purposes, will be re-enabled when auth is implemented
    #if "user" not in request.session:
    #    return Response("Not authorized", status_code=403)
    
    user_id = 1 
    return user_service.get_user_profile(user_id)
'''

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(request: Request):
    # Completely skip the database for this test
    return {
        "id": 1,
        "name": "John Smith", 
        "email": "smithj@rpi.edu",
        "phone": "111-222-3333",
        "major": "Biology",
        "degree": "B.S.",
        "profile_image_url": None
    }
    


@router.patch("/profile", response_model=UserProfileResponse)
async def update_profile(request: Request, profile_data: UserProfileUpdate):
    if "user" not in request.session:
        return Response("Not authorized", status_code=403)

    user_id = request.session["user"]["user_id"]
    return user_service.update_user_profile(user_id, profile_data.dict(exclude_unset=True))