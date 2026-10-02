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


def test_invalidate_prefix_returns_none_without_raising_when_redis_unavailable():
    assert _run(cache_service.invalidate_prefix("yacs:cache:")) is None


class _FakeScanClient:
    """Minimal stand-in for the two Redis calls invalidate_prefix makes."""

    def __init__(self, keys):
        self.keys = set(keys)

    async def scan_iter(self, match, count):
        prefix = match.rstrip("*")
        for key in sorted(self.keys):
            if key.startswith(prefix):
                yield key

    async def delete(self, *keys):
        removed = self.keys & set(keys)
        self.keys -= removed
        return len(removed)


def test_invalidate_prefix_deletes_only_matching_keys(monkeypatch):
    fake = _FakeScanClient([
        "yacs:cache:courses:list:a",
        "yacs:cache:semesters:b",
        "yacs:login:attempts:someone",
    ])
    monkeypatch.setattr(cache_service.redis_client, "get_client", lambda: fake)

    deleted = _run(cache_service.invalidate_prefix("yacs:cache:"))

    assert deleted == 2
    assert fake.keys == {"yacs:login:attempts:someone"}
