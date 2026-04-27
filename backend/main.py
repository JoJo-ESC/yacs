#!/usr/bin/python3
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from middleware.admin_middleware import AdminMiddleware
from routers import user_router, auth_router, corequisite_router, admin_router
from models import init_db
from utils import load_secrets


def _as_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


# --- Lifespan (startup/shutdown events) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create database tables
    init_db()
    yield
    # Shutdown: cleanup if needed


# --- Initialize FastAPI App ---
app = FastAPI(lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"success": False, "status": "error", "message": "Invalid request data."},
    )

# --- Add Middleware ---
secrets = load_secrets()
app.add_middleware(
    SessionMiddleware,
    secret_key=secrets.get("SECRET_KEY", "dev_secret_key"),
    same_site=secrets.get("SESSION_SAME_SITE", "lax"),
    https_only=_as_bool(secrets.get("SESSION_HTTPS_ONLY"), default=False),
    max_age=int(secrets.get("SESSION_MAX_AGE_SECONDS", 12 * 60 * 60)),
)
app.add_middleware(AdminMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
app.include_router(user_router.router)
app.include_router(auth_router.router)
app.include_router(corequisite_router.router)
app.include_router(admin_router.router)


# --- Root Endpoint ---
@app.get('/')
async def root():
    """Confirms the API is running."""
    return {"message": "YACS API is Up!"}
