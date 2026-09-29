"""Verifies the read-through cache degrades to "no cache" when Redis is
unavailable, instead of breaking the request.

Like test_auth_login_throttle.py, these never configure a real Redis
connection, so `cache_service` is exercised purely on its fallback path.

Run with: /path/to/venv/bin/python -m pytest backend/tests/test_cache_service.py
"""
import asyncio

from services import cache_service


def _run(coro):
    return asyncio.run(coro)


def test_build_key_is_deterministic_and_namespaced():
    key_a = cache_service.build_key("courses:search", q="calc", page=1)
    key_b = cache_service.build_key("courses:search", q="calc", page=1)
    key_c = cache_service.build_key("courses:search", q="calc", page=2)

    assert key_a == key_b
    assert key_a != key_c
    assert key_a.startswith("yacs:cache:courses:search:")


def test_get_json_misses_without_raising_when_redis_unavailable():
    # No `redis_client.connect()` has been called in this process, so this
    # exercises exactly what a live request sees during a Redis outage.
    result = _run(cache_service.get_json(cache_service.build_key("unused", k="v")))
    assert result is None


def test_set_json_is_a_silent_noop_when_redis_unavailable():
    # Must not raise — a cache write failing should never fail the request
    # that triggered it.
    _run(cache_service.set_json(cache_service.build_key("unused", k="v"), {"a": 1}, ttl_seconds=30))
