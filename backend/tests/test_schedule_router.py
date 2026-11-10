"""GET/PUT /api/schedules through the real app's middleware stack, against
an in-memory SQLite database instead of Postgres. Session cookies are signed
the way test_admin_access.py does it, so no login request is needed."""
import json
from base64 import b64encode

import itsdangerous
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import main
from models.user_schedule import UserSchedule
from routers import schedule_router
from utils import get_secret_key, load_secrets

STORE = {"202701": {"activeId": "a", "schedules": [{"id": "a", "name": "Schedule 1", "courses": []}]}}


def _session_cookie(user_id: int) -> dict:
    signer = itsdangerous.TimestampSigner(get_secret_key(load_secrets()))
    data = b64encode(json.dumps({"user": {"user_id": user_id, "role": "user"}}).encode("utf-8"))
    return {"session": signer.sign(data).decode("utf-8")}


@pytest.fixture
def client(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    UserSchedule.__table__.create(bind=engine)
    monkeypatch.setattr(schedule_router, "SessionLocal", sessionmaker(bind=engine))
    # Not used as a context manager, so app startup (database/Redis) never runs
    return TestClient(main.app)


def _login(client, user_id):
    client.cookies.clear()
    client.cookies.update(_session_cookie(user_id))


@pytest.mark.parametrize("method", ["get", "put"])
def test_anonymous_is_rejected(client, method):
    kwargs = {"json": {"schedules": STORE}} if method == "put" else {}
    assert getattr(client, method)("/api/schedules", **kwargs).status_code == 403


def test_new_user_has_no_schedules(client):
    _login(client, 1)
    assert client.get("/api/schedules").json() == {"schedules": {}}


def test_saved_schedules_round_trip_and_update(client):
    _login(client, 1)
    assert client.put("/api/schedules", json={"schedules": STORE}).status_code == 200
    assert client.get("/api/schedules").json() == {"schedules": STORE}

    assert client.put("/api/schedules", json={"schedules": {}}).status_code == 200
    assert client.get("/api/schedules").json() == {"schedules": {}}


def test_users_only_see_their_own_schedules(client):
    _login(client, 1)
    client.put("/api/schedules", json={"schedules": STORE})

    _login(client, 2)
    assert client.get("/api/schedules").json() == {"schedules": {}}


def test_oversized_schedules_are_rejected(client, monkeypatch):
    monkeypatch.setattr(schedule_router, "MAX_SCHEDULE_BYTES", 10)
    _login(client, 1)
    assert client.put("/api/schedules", json={"schedules": STORE}).status_code == 413
    assert client.get("/api/schedules").json() == {"schedules": {}}


def test_malformed_body_is_rejected(client):
    _login(client, 1)
    assert client.put("/api/schedules", json={"schedules": ["not", "a", "dict"]}).status_code in (400, 422)
