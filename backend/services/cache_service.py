"""Generic, fail-open read-through caching on top of Redis.

Mirrors the pattern in `auth_service`'s login throttling: every call tries
Redis, catches errors, and degrades instead of breaking. The difference is
what "degrade" means here — for throttling, a Redis outage falls back to a
weaker but real in-memory limiter; for caching, there is nothing to fall
back to but the database, which is exactly what would happen without a
cache at all. So on any Redis failure this just treats it as a cache miss
(reads) or a no-op (writes) and lets the caller hit Postgres directly —
slower under an outage, never broken.
"""
from __future__ import annotations

import hashlib
import json
import logging
from time import monotonic
from typing import Any

from services import redis_client

logger = logging.getLogger(__name__)

# Same short backoff idea as auth_service: after a Redis failure, skip
# retrying it for a bit so a sustained outage doesn't add a connection
# timeout to every single request while it's down.
_RETRY_BACKOFF_SECONDS = 5.0
_unavailable_until = 0.0


def _should_try() -> bool:
    return monotonic() >= _unavailable_until


def _mark_unavailable() -> None:
    global _unavailable_until
    _unavailable_until = monotonic() + _RETRY_BACKOFF_SECONDS


def build_key(namespace: str, **params: Any) -> str:
    """Builds a deterministic cache key from a namespace and its parameters.

    Params are hashed rather than interpolated directly so arbitrary values
    (free-text search queries, None, etc.) can't break or collide with the
    key structure.
    """
    payload = json.dumps(params, sort_keys=True, default=str)
    digest = hashlib.sha256(payload.encode()).hexdigest()[:16]
    return f"yacs:cache:{namespace}:{digest}"


async def get_json(key: str) -> Any | None:
    """Returns the cached value for `key`, or None on a miss or if Redis is unavailable."""
    if not _should_try():
        return None

    try:
        client = redis_client.get_client()
        raw = await client.get(key)
    except Exception:
        logger.warning("Redis unavailable while reading cache key %s; treating as a miss.", key)
        _mark_unavailable()
        return None

    if raw is None:
        return None

    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        # Shouldn't happen since we control what gets written, but a
        # corrupt/unexpected value should never break the request.
        logger.warning("Cache key %s held a non-JSON value; treating as a miss.", key)
        return None


async def set_json(key: str, value: Any, ttl_seconds: int) -> None:
    """Best-effort cache write. Silently does nothing if Redis is unavailable."""
    if not _should_try():
        return

    try:
        client = redis_client.get_client()
        await client.set(key, json.dumps(value), ex=ttl_seconds)
    except Exception:
        logger.warning("Redis unavailable while writing cache key %s; skipping cache write.", key)
        _mark_unavailable()
