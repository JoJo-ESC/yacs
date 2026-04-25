#!/usr/bin/python3
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from routers import user_router, auth_router, corequisite_router, course_router
from models import init_db
from utils import load_secrets

FRONTEND_BUILD = Path(__file__).parent.parent / "frontend" / "build"


# --- Lifespan (startup/shutdown events) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


# --- Initialize FastAPI App ---
app = FastAPI(lifespan=lifespan)

# --- Add Middleware ---
secrets = load_secrets()
app.add_middleware(SessionMiddleware, secret_key=secrets.get("SECRET_KEY", "dev_secret_key"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
app.include_router(user_router.router)
app.include_router(auth_router.router)
app.include_router(corequisite_router.router)
app.include_router(course_router.router)

# --- Serve React frontend ---
if FRONTEND_BUILD.exists():
    app.mount("/static", StaticFiles(directory=FRONTEND_BUILD / "static"), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file = FRONTEND_BUILD / full_path
        if file.is_file():
            return FileResponse(file)
        return FileResponse(FRONTEND_BUILD / "index.html")
