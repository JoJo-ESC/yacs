from fastapi import APIRouter, Request

from schemas.auth_schemas import SessionPydantic
from services import auth_service

router = APIRouter(prefix="/api", tags=["Authentication"])


@router.post('/session')
async def log_in(request: Request, credentials: SessionPydantic):
    """Log a user in and create a session."""
    return auth_service.log_user_in(credentials.dict(), request.session)


@router.delete('/session')
def log_out(request: Request):
    """Log the current user out."""
    return auth_service.log_user_out(request.session)
