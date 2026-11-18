import pathlib
import sys


BACKEND_DIR = pathlib.Path(__file__).resolve().parents[1]

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import os

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@compiles(JSONB, "sqlite")
def _sqlite_jsonb(type_, compiler, **kw):
    # SQLite exercises JSON round trips; CI also runs against PostgreSQL JSONB.
    return "JSON"


@pytest.fixture
def test_session_factory(monkeypatch):
    """Fresh database per test; never connect to the application's database."""
    import main
    import models
    from models import database_session
    from routers import course_router, planner_router
    from services import auth_service, user_service

    url = os.environ.get("TEST_DATABASE_URL", "sqlite://")
    if url != "sqlite://":
        from sqlalchemy.engine import make_url
        parsed = make_url(url)
        if parsed.get_backend_name() != "postgresql" or parsed.database != "yacs_test":
            raise ValueError("TEST_DATABASE_URL must use a dedicated PostgreSQL database named yacs_test")
    options = {"connect_args": {"check_same_thread": False}, "poolclass": StaticPool} if url == "sqlite://" else {}
    engine = create_engine(url, **options)
    if url == "sqlite://":
        @event.listens_for(engine, "connect")
        def foreign_keys(connection, record):
            connection.execute("PRAGMA foreign_keys=ON")

    models.Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    for module in (models, database_session, course_router, planner_router, auth_service, user_service):
        monkeypatch.setattr(module, "SessionLocal", factory)
    # Run the real lifespan against the isolated schema without production migrations.
    monkeypatch.setattr(main, "init_db", lambda: None)
    try:
        yield factory
    finally:
        models.Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture
def api_client(test_session_factory, monkeypatch):
    import main
    from fastapi.testclient import TestClient
    from services import auth_service, redis_client

    async def no_connect(*args, **kwargs):
        pass

    monkeypatch.setattr(redis_client, "connect", no_connect)
    monkeypatch.setattr(redis_client, "_redis", None)
    monkeypatch.setattr(auth_service, "_FAILED_LOGIN_ATTEMPTS", {})
    monkeypatch.setattr(auth_service, "_redis_unavailable_until", 0.0)
    with TestClient(main.app) as client:
        yield client


@pytest.fixture
def account(api_client):
    payload = {"name": "Test Student", "email": "student@example.com", "phone": "",
               "password": "test-password-123", "major": "CSCI", "degree": "BS"}
    response = api_client.post("/api/user", json=payload)
    assert response.status_code == 201
    return {**payload, "id": response.json()["user_id"]}


@pytest.fixture
def logged_in_client(api_client, account):
    response = api_client.post("/api/session", json={"email": account["email"], "password": account["password"]})
    assert response.status_code == 200
    return api_client
