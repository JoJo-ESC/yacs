from __future__ import annotations

import logging
import os

import redis.asyncio as aioredis
from fastapi import Request

from utils import load_secrets

logger = logging.getLogger(__name__)

# Short timeouts so a hung/unreachable Redis fails fast instead of stalling
# whichever request (or the app startup) is waiting on it.
_CONNECT_TIMEOUT_SECONDS = 0.5
_SOCKET_TIMEOUT_SECONDS = 0.5

_redis: aioredis.Redis | None = None

_DEFAULT_REDIS_URL = "redis://localhost:6379/0"


def resolve_url() -> str:
    """Returns the Redis URL: the REDIS_URL env var, then secrets.yaml, then
    localhost.

    The env var wins so docker-compose can point the backend at the `redis`
    service regardless of what a developer's (gitignored) secrets.yaml says —
    `localhost` inside the backend container is the container itself.
    """
    return os.environ.get("REDIS_URL") or load_secrets().get("REDIS_URL") or _DEFAULT_REDIS_URL


async def connect(url: str) -> None:
    """Configure the shared Redis client.

    This never raises: Redis is an optional dependency (login-attempt
    throttling and caching degrade gracefully without it), so an unreachable
    Redis at startup must not prevent the rest of the API from serving
    requests. `aioredis.from_url` only builds a connection pool — it doesn't
    open a socket — so the client object is safe to keep even when the
    startup ping below fails; later calls will retry the connection on
    their own.
    """
    global _redis
    _redis = aioredis.from_url(
        url,
        decode_responses=True,
        socket_connect_timeout=_CONNECT_TIMEOUT_SECONDS,
        socket_timeout=_SOCKET_TIMEOUT_SECONDS,
    )
    try:
        await _redis.ping()
    except Exception:
        logger.warning(
            "Redis is unreachable at startup (%s); continuing without it. "
            "Features that use Redis will fall back to degraded behavior "
            "until it recovers.",
            url,
        )


async def disconnect() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


def get_client() -> aioredis.Redis:
    """Returns the configured Redis client.

    Raises only if `connect()` was never called (a startup-ordering bug) —
    not if Redis itself is unreachable. Callers that need to tolerate Redis
    being down should catch `redis.exceptions.RedisError` (or a broad
    `Exception`) around the operation itself and fall back accordingly.
    """
    if _redis is None:
        raise RuntimeError("Redis client is not initialised")
    return _redis


async def get_redis(request: Request) -> aioredis.Redis:
    """FastAPI dependency — injects the shared Redis client."""
    return get_client()
