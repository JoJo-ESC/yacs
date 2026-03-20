#!/usr/bin/python3
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from routers import user_router, auth_router, corequisite_router, course_router
from models import init_db
from utils import load_secrets


# --- Lifespan (startup/shutdown events) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create database tables
    init_db()
    yield
    # Shutdown: cleanup if needed


# --- Initialize FastAPI App ---
app = FastAPI(lifespan=lifespan)

# --- Add Middleware ---
secrets = load_secrets()
app.add_middleware(SessionMiddleware, secret_key=secrets.get("SECRET_KEY", "dev_secret_key"))

# --- Include Routers ---
app.include_router(user_router.router)
app.include_router(auth_router.router)
app.include_router(corequisite_router.router)
app.include_router(course_router.router)


# --- Root Endpoint ---
@app.get('/')
async def root():
    """Confirms the API is running."""
    return {"message": "YACS API is Up!"}
