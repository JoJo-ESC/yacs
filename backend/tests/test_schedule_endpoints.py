"""The saved schedule API is exposed as /api/plan."""
import pytest
from fastapi.testclient import TestClient

import main
from models.user_plan import UserPlan


@pytest.mark.parametrize("method", ["get", "put"])
def test_anonymous_schedule_access(api_client, method):
    kwargs = {"json": {"plan": {}}} if method == "put" else {}
    assert getattr(api_client, method)("/api/plan", **kwargs).status_code == 403


def test_empty_schedule(logged_in_client):
    response = logged_in_client.get("/api/plan")
    assert response.status_code == 200
    assert response.json() == {"plan": {}}


def test_schedule_save_replace_clear(logged_in_client, account, test_session_factory):
    plans = [
        {"202609": {"courses": [1, 2], "name": "Fall schedule"}},
        {"202601": {"courses": [3]}},
        {},
    ]
    for plan in plans:
        response = logged_in_client.put("/api/plan", json={"plan": plan})
        assert response.status_code == 200
        assert response.json() == {"success": True}
        assert logged_in_client.get("/api/plan").json() == {"plan": plan}
        with test_session_factory() as db:
            rows = db.query(UserPlan).filter_by(user_id=account["id"]).all()
            assert len(rows) == 1
            assert rows[0].plan_data == plan


@pytest.mark.parametrize("payload", [{}, {"plan": []}, {"plan": None}, {"plan": "invalid"}])
def test_invalid_schedule_does_not_overwrite(logged_in_client, payload):
    plan = {"202609": [1]}
    assert logged_in_client.put("/api/plan", json={"plan": plan}).status_code == 200
    assert logged_in_client.put("/api/plan", json=payload).status_code == 400
    assert logged_in_client.get("/api/plan").json() == {"plan": plan}


def test_schedules_are_private_between_users(logged_in_client, account):
    first_plan = {"202609": [1, 2]}
    assert logged_in_client.put("/api/plan", json={"plan": first_plan}).status_code == 200
    with TestClient(main.app) as other:
        payload = {**account, "email": "other@example.com"}
        assert other.post("/api/user", json=payload).status_code == 201
        assert other.post("/api/session", json={"email": payload["email"], "password": payload["password"]}).status_code == 200
        assert other.get("/api/plan").json() == {"plan": {}}
        assert other.put("/api/plan", json={"plan": {"202601": [3]}}).status_code == 200
    assert logged_in_client.get("/api/plan").json() == {"plan": first_plan}
    assert logged_in_client.delete("/api/session").status_code == 200
    assert logged_in_client.get("/api/plan").status_code == 403
