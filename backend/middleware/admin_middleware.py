from fastapi import HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware


class AdminMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, admin_prefix: str = "/api/admin"):
        super().__init__(app)
        self.admin_prefix = admin_prefix

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith(self.admin_prefix):
            session_user = request.session.get("user")
            if not session_user or session_user.get("role") != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Admin access required.",
                )
        return await call_next(request)
