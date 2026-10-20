"""Exercises the Redis-backed paths of login throttling and caching.

test_auth_login_throttle.py and test_cache_service.py cover the fallback
paths (Redis never configured). These tests swap in an in-process
`fakeredis` client so the real Redis commands (pipelines, TTLs, SCAN) run,
plus a client that raises mid-request to cover the "Redis dies while the
app is up" fallback.

Each test runs its whole scenario inside one `asyncio.run` because the fake
client's connections are bound to the event loop that first uses them.

Run with: /path/to/venv/bin/python -m pytest backend/tests/test_redis_integration.py
"""
import asyncio
from types import SimpleNamespace

import fakeredis
import pytest
from redis.exceptions import ConnectionError as RedisConnectionError

from routers import course_router
from schemas.course_schemas import CourseListResponse, CourseResponse
from services import auth_service, cache_service, redis_client

THROTTLE_KEY = "student@rpi.edu|127.0.0.1"
ATTEMPTS_KEY = f"yacs:login:attempts:{THROTTLE_KEY}"
LOCKOUT_KEY = f"yacs:login:lockout:{THROTTLE_KEY}"


@pytest.fixture(autouse=True)
def _clean_state(monkeypatch):
    """Clear the retry backoff (other test files trip it on purpose) and
    the in-memory fallback store so each test starts from scratch."""
    monkeypatch.setattr(auth_service, "_redis_unavailable_until", 0.0)
    monkeypatch.setattr(auth_service, "_FAILED_LOGIN_ATTEMPTS", {})
    monkeypatch.setattr(cache_service, "_unavailable_until", 0.0)


def _run_with_fake_redis(monkeypatch, scenario):
    async def runner():
        fake = fakeredis.FakeAsyncRedis(decode_responses=True)
        monkeypatch.setattr(redis_client, "_redis", fake)
        try:
            return await scenario(fake)
        finally:
            await fake.aclose()

    return asyncio.run(runner())


class _BrokenRedis:
    """A client whose every command fails like an unreachable Redis."""

    def __getattr__(self, name):
        def fail(*args, **kwargs):
            raise RedisConnectionError("Redis is down")

        return fail


def _fake_course(course_id: int):
    return SimpleNamespace(
        id=course_id,
        term="202609",
        term_desc="Fall 2026",
        crn=str(40000 + course_id),
        subject="CSCI",
        subject_description="Computer Science",
        course_number="1200",
        course_title="Data Structures",
        credit_hours=4,
        max_enrollment=100,
        enrollment=42,
        seats_available=58,
        section="01",
        schedule_type="Lecture",
        instructional_method="In-Person",
        meeting_times=[SimpleNamespace(
            id=1, monday=True, thursday=True, begin_time="1000", end_time="1150",
            building="DCC", building_description="Darrin Communications Center",
            room="308", start_date=None, end_date=None,
            meeting_schedule_type="LEC", instructor_name="Prof. Example",
            tuesday=False, wednesday=False, friday=False, saturday=False, sunday=False,
        )],
    )


# --- Login throttling ------------------------------------------------------

def test_failed_attempt_counter_uses_redis_with_window_ttl(monkeypatch):
    async def scenario(fake):
        await auth_service._record_failed_attempt(THROTTLE_KEY)
        await auth_service._record_failed_attempt(THROTTLE_KEY)
        return await fake.get(ATTEMPTS_KEY), await fake.ttl(ATTEMPTS_KEY)

    count, ttl = _run_with_fake_redis(monkeypatch, scenario)

    assert count == "2"
    # The counter must always carry the window TTL, or it would never reset.
    assert 0 < ttl <= auth_service.FAILED_WINDOW_SECONDS
    assert auth_service._FAILED_LOGIN_ATTEMPTS == {}


def test_lockout_after_threshold_is_stored_in_redis(monkeypatch):
    async def scenario(fake):
        for _ in range(auth_service.MAX_FAILED_ATTEMPTS - 1):
            await auth_service._record_failed_attempt(THROTTLE_KEY)
        locked_before = await auth_service._is_locked(THROTTLE_KEY)
        await auth_service._record_failed_attempt(THROTTLE_KEY)
        locked_after = await auth_service._is_locked(THROTTLE_KEY)
        return locked_before, locked_after, await fake.ttl(LOCKOUT_KEY)

    locked_before, locked_after, lockout_ttl = _run_with_fake_redis(monkeypatch, scenario)

    assert locked_before is False
    assert locked_after is True
    assert 0 < lockout_ttl <= auth_service.LOCKOUT_SECONDS


def test_reset_deletes_counter_and_lockout(monkeypatch):
    async def scenario(fake):
        for _ in range(auth_service.MAX_FAILED_ATTEMPTS):
            await auth_service._record_failed_attempt(THROTTLE_KEY)
        await auth_service._reset_attempts(THROTTLE_KEY)
        return await fake.exists(ATTEMPTS_KEY, LOCKOUT_KEY), await auth_service._is_locked(THROTTLE_KEY)

    remaining, locked = _run_with_fake_redis(monkeypatch, scenario)

    assert remaining == 0
    assert locked is False


def test_reset_clears_redis_lockout_even_during_retry_backoff(monkeypatch):
    async def scenario(fake):
        await fake.set(LOCKOUT_KEY, "1", ex=auth_service.LOCKOUT_SECONDS)
        auth_service._mark_redis_unavailable()
        await auth_service._reset_attempts(THROTTLE_KEY)
        return await fake.exists(LOCKOUT_KEY)

    assert _run_with_fake_redis(monkeypatch, scenario) == 0


def test_redis_failure_mid_request_falls_back_to_memory(monkeypatch):
    monkeypatch.setattr(redis_client, "_redis", _BrokenRedis())

    async def scenario():
        for _ in range(auth_service.MAX_FAILED_ATTEMPTS):
            await auth_service._record_failed_attempt(THROTTLE_KEY)
        return await auth_service._is_locked(THROTTLE_KEY)

    assert asyncio.run(scenario()) is True
    assert THROTTLE_KEY in auth_service._FAILED_LOGIN_ATTEMPTS
    assert not auth_service._redis_should_be_tried()


# --- Caching ---------------------------------------------------------------

def test_cache_round_trip_sets_ttl(monkeypatch):
    async def scenario(fake):
        key = cache_service.build_key("unit", k="v")
        await cache_service.set_json(key, {"a": [1, 2]}, ttl_seconds=30)
        return await cache_service.get_json(key), await fake.ttl(key)

    value, ttl = _run_with_fake_redis(monkeypatch, scenario)

    assert value == {"a": [1, 2]}
    assert 0 < ttl <= 30


def test_course_list_cache_hit_skips_database_and_round_trips(monkeypatch):
    calls = []

    def compute():
        calls.append(1)
        return [_fake_course(1), _fake_course(2)], 2

    async def scenario(fake):
        params = {"page": 1, "per_page": 50, "semester": "202609"}
        first = await course_router._cached_course_list("courses:list", params, compute, page=1, per_page=50)
        second = await course_router._cached_course_list("courses:list", params, compute, page=1, per_page=50)
        return first, second

    first, second = _run_with_fake_redis(monkeypatch, scenario)

    assert len(calls) == 1
    assert isinstance(second, CourseListResponse)
    assert second == first
    assert second.data[0].meeting_times[0].building == "DCC"


def test_course_detail_is_cached_but_404s_are_not(monkeypatch):
    lookups = []

    def get_course_by_id(db, course_id):
        lookups.append(course_id)
        return _fake_course(course_id) if course_id == 7 else None

    monkeypatch.setattr(course_router.course_service, "get_course_by_id", get_course_by_id)

    async def scenario(fake):
        first = await course_router.get_course(7, db=None)
        second = await course_router.get_course(7, db=None)
        for _ in range(2):
            with pytest.raises(course_router.HTTPException):
                await course_router.get_course(99, db=None)
        return first, second

    first, second = _run_with_fake_redis(monkeypatch, scenario)

    assert isinstance(second, CourseResponse)
    assert second == first
    assert lookups == [7, 99, 99]


def test_invalidate_prefix_clears_cache_but_not_throttle_keys(monkeypatch):
    async def scenario(fake):
        for i in range(1200):  # more than one SCAN/DELETE batch
            await fake.set(f"yacs:cache:courses:list:{i}", "{}")
        await fake.set(ATTEMPTS_KEY, "3")
        deleted = await cache_service.invalidate_prefix("yacs:cache:")
        return deleted, await fake.keys("*")

    deleted, remaining = _run_with_fake_redis(monkeypatch, scenario)

    assert deleted == 1200
    assert remaining == [ATTEMPTS_KEY]
