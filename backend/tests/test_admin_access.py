"""Verifies admin-only routes reject anonymous and non-admin users with
401/403 (not a 500), using the real app's middleware stack.

Session cookies are signed exactly as Starlette's SessionMiddleware signs
them, so no database or login request is needed. The TestClient is not used
as a context manager, so the app's startup (database/Redis) never runs.

Run with: /path/to/venv/bin/python -m pytest backend/tests/test_admin_access.py
"""
import json
from base64 import b64encode

import itsdangerous
import pytest
from fastapi.testclient import TestClient

import main
from utils import get_secret_key, load_secrets

# Fails validation, so a request that gets past the admin check returns 400
# without ever reaching the database.
INVALID_COREQ = {"department": "CSCI"}


def _session_cookie(user: dict | None) -> dict:
    if user is None:
        return {}
    signer = itsdangerous.TimestampSigner(get_secret_key(load_secrets()))
    data = b64encode(json.dumps({"user": user}).encode("utf-8"))
    return {"session": signer.sign(data).decode("utf-8")}


STUDENT = {"user_id": 1, "email": "student@rpi.edu", "name": "Student", "role": "user"}
ADMIN = {"user_id": 2, "email": "admin@rpi.edu", "name": "Admin", "role": "admin"}


@pytest.fixture
def client():
    return TestClient(main.app)


@pytest.mark.parametrize(
    "user, expected",
    [(None, 401), (STUDENT, 403)],
    ids=["anonymous", "student"],
)
def test_admin_routes_reject_non_admins(client, user, expected):
    client.cookies.update(_session_cookie(user))

    response = client.get("/api/admin/users")

    assert response.status_code == expected
    assert "detail" in response.json()


@pytest.mark.parametrize(
    "user, expected",
    [(None, 401), (STUDENT, 403), (ADMIN, 400)],
    ids=["anonymous", "student", "admin-passes-auth"],
)
def test_corequisite_creation_is_admin_only(client, user, expected):
    client.cookies.update(_session_cookie(user))

    response = client.post("/api/corequisite", json=INVALID_COREQ)

    assert response.status_code == expected


def test_corequisite_reads_stay_public(client, monkeypatch):
    monkeypatch.setattr(main.corequisite_router.corequisite_service, "get_corequisites", lambda db, d, l: [])

    response = client.get("/api/corequisite/CSCI/1200")

    assert response.status_code == 200
    assert response.json() == []
