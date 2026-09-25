"""Verifies login-attempt throttling still works when Redis is unavailable.

This is the exact regression the Redis integration has to avoid: a Redis
outage must degrade throttling to the in-memory fallback, not remove it
entirely. These tests never configure a real Redis connection (`connect()`
is never called), so `services.auth_service` is exercised purely on its
fallback path — the same path a live app takes mid-request if Redis errors.

Run with: /path/to/venv/bin/python -m pytest backend/tests/test_auth_login_throttle.py
"""
import asyncio
import uuid

import pytest

from services import auth_service


def _run(coro):
    return asyncio.run(coro)


@pytest.fixture(autouse=True)
def _isolated_throttle_key(monkeypatch):
    """Give every test its own key so in-memory state doesn't leak between tests."""
    key = f"test-{uuid.uuid4()}"
    monkeypatch.setattr(auth_service, "_FAILED_LOGIN_ATTEMPTS", {})
    return key


def test_no_lockout_before_threshold(_isolated_throttle_key):
    key = _isolated_throttle_key

    for _ in range(auth_service.MAX_FAILED_ATTEMPTS - 1):
        _run(auth_service._record_failed_attempt(key))

    assert _run(auth_service._is_locked(key)) is False


def test_locks_out_after_threshold(_isolated_throttle_key):
    key = _isolated_throttle_key

    for _ in range(auth_service.MAX_FAILED_ATTEMPTS):
        _run(auth_service._record_failed_attempt(key))

    assert _run(auth_service._is_locked(key)) is True


def test_reset_clears_lockout(_isolated_throttle_key):
    key = _isolated_throttle_key

    for _ in range(auth_service.MAX_FAILED_ATTEMPTS):
        _run(auth_service._record_failed_attempt(key))
    assert _run(auth_service._is_locked(key)) is True

    _run(auth_service._reset_attempts(key))

    assert _run(auth_service._is_locked(key)) is False


def test_lockout_is_scoped_to_its_own_key(_isolated_throttle_key):
    locked_key = _isolated_throttle_key
    other_key = f"{locked_key}-other"

    for _ in range(auth_service.MAX_FAILED_ATTEMPTS):
        _run(auth_service._record_failed_attempt(locked_key))

    assert _run(auth_service._is_locked(locked_key)) is True
    assert _run(auth_service._is_locked(other_key)) is False
