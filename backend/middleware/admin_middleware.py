from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

NOT_LOGGED_IN = "Login required."
NOT_ADMIN = "Admin access required."


def _admin_error(session) -> tuple[int, str] | None:
    """Returns (status, message) if the session isn't an admin's, else None."""
    user = session.get("user")
    if not user:
        return status.HTTP_401_UNAUTHORIZED, NOT_LOGGED_IN
    if user.get("role") != "admin":
        return status.HTTP_403_FORBIDDEN, NOT_ADMIN
    return None


class AdminMiddleware(BaseHTTPMiddleware):
    """Restricts every route under `admin_prefix` to admins.

    Reads request.session, so SessionMiddleware must run before this one:
    in main.py it has to be added *after* this middleware (Starlette runs the
    most recently added middleware first).
    """

    def __init__(self, app, admin_prefix: str = "/api/admin"):
        super().__init__(app)
        self.admin_prefix = admin_prefix

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith(self.admin_prefix):
            error = _admin_error(request.session)
            if error:
                # Return the response directly: an HTTPException raised from
                # middleware bypasses FastAPI's handlers and becomes a 500.
                status_code, message = error
                return JSONResponse(status_code=status_code, content={"detail": message})
        return await call_next(request)


def require_admin(request: Request) -> None:
    """FastAPI dependency for admin-only routes outside the admin prefix."""
    error = _admin_error(request.session)
    if error:
        status_code, message = error
        raise HTTPException(status_code=status_code, detail=message)
