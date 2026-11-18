"""Authentication through the real HTTP routes, password hashing and database."""
import pytest

from models.user import User
from services.password_service import verify_password


def test_registration_stores_hash_and_rejects_duplicate(api_client, account, test_session_factory):
    with test_session_factory() as db:
        user = db.get(User, account["id"])
        assert user.password_hash != account["password"]
        assert verify_password(account["password"], user.password_hash)
        assert user.role == "user"
    response = api_client.post("/api/user", json=account)
    assert response.status_code == 400
    assert response.json()["success"] is False


def test_login_session_and_logout(logged_in_client, account):
    response = logged_in_client.get("/api/session/me")
    assert response.status_code == 200
    user = response.json()["user"]
    assert user["email"] == account["email"]
    assert "password" not in user and "password_hash" not in user
    assert logged_in_client.delete("/api/session").status_code == 200
    assert logged_in_client.get("/api/session/me").status_code == 401
    assert logged_in_client.delete("/api/session").status_code == 401


@pytest.mark.parametrize("email,password", [("unknown@example.com", "wrong"), ("student@example.com", "wrong")])
def test_invalid_credentials(api_client, account, email, password):
    response = api_client.post("/api/session", json={"email": email, "password": password})
    assert response.status_code == 401
    assert response.json()["code"] == "invalid_credentials"
    assert api_client.get("/api/session/me").status_code == 401


@pytest.mark.parametrize("payload", [{}, {"email": "student@example.com"}, {"email": "", "password": ""}])
def test_invalid_login_payload(api_client, payload):
    assert api_client.post("/api/session", json=payload).status_code == 400


def test_login_throttle_http_status(api_client, account):
    for _ in range(5):
        assert api_client.post("/api/session", json={"email": account["email"], "password": "wrong"}).status_code == 401
    response = api_client.post("/api/session", json={"email": account["email"], "password": account["password"]})
    assert response.status_code == 429
    assert response.json()["code"] == "rate_limited"


def test_deleted_user_session_is_rejected(logged_in_client, account, test_session_factory):
    with test_session_factory() as db:
        db.delete(db.get(User, account["id"]))
        db.commit()
    assert logged_in_client.get("/api/session/me").status_code == 401
