from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from schemas.api_models import SessionPydantic
from services import auth_service

router = APIRouter(prefix="/api", tags=["Authentication"])


@router.post('/session')
async def log_in(request: Request, credentials: SessionPydantic):
    """Log a user in and create a session."""
    result = auth_service.log_user_in(
        credentials.dict(),
        request.session,
        client_ip=request.client.host if request.client else None,
    )

    if result.get("success"):
        return JSONResponse(status_code=status.HTTP_200_OK, content=result)

    if result.get("code") == "rate_limited":
        return JSONResponse(status_code=status.HTTP_429_TOO_MANY_REQUESTS, content=result)

    if result.get("code") == "missing_credentials":
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=result)

    return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content=result)


@router.delete('/session')
def log_out(request: Request):
    """Log the current user out."""
    result = auth_service.log_user_out(request.session)
    if result.get("success"):
        return JSONResponse(status_code=status.HTTP_200_OK, content=result)
    return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content=result)
