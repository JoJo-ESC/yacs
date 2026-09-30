from __future__ import annotations

import logging
from datetime import datetime, timezone
from time import monotonic

from models import SessionLocal
from models.user import User
from services import redis_client
from services.password_service import hash_password, needs_rehash, verify_password

logger = logging.getLogger(__name__)

# Pre-computed dummy hash used when a login email doesn't match any account.
# verify_password is always called (even on unknown emails) so response time
# is consistent and attackers cannot enumerate registered emails via timing.
_DUMMY_HASH = hash_password("dummy_password_that_is_never_used_yacs")

MAX_FAILED_ATTEMPTS = 5
FAILED_WINDOW_SECONDS = 15 * 60
LOCKOUT_SECONDS = 5 * 60

# --- In-memory fallback store -------------------------------------------
# This is the entire throttling mechanism when Redis is unavailable. It is
# intentionally kept even though Redis is the primary path below: without
# it, a Redis outage would mean *no* login throttling at all rather than a
# degraded (per-process) version of it. Do not remove this as "dead code"
# once the Redis path lands — it is the outage fallback, not a leftover.
_FAILED_LOGIN_ATTEMPTS: dict[str, dict[str, float | int]] = {}

# After a Redis call fails, skip retrying it for this long so a sustained
# outage doesn't add a connection-timeout tax to every single login
# request. Short enough that Redis coming back is picked up quickly.
_REDIS_RETRY_BACKOFF_SECONDS = 5.0
_redis_unavailable_until = 0.0


def _redis_should_be_tried() -> bool:
    return monotonic() >= _redis_unavailable_until


def _mark_redis_unavailable() -> None:
    global _redis_unavailable_until
    _redis_unavailable_until = monotonic() + _REDIS_RETRY_BACKOFF_SECONDS


def _normalize_email(raw_email: str) -> str:
    return raw_email.strip().lower()


def _throttle_key(email: str, client_ip: str | None) -> str:
    return f"{email}|{client_ip or 'unknown'}"


# --- In-memory fallback implementation ----------------------------------

def _reset_attempts_memory(key: str) -> None:
    _FAILED_LOGIN_ATTEMPTS.pop(key, None)


def _record_failed_attempt_memory(key: str) -> None:
    now = monotonic()
    state = _FAILED_LOGIN_ATTEMPTS.get(key)
    if state is None or now - float(state["first_failed_at"]) > FAILED_WINDOW_SECONDS:
        _FAILED_LOGIN_ATTEMPTS[key] = {
            "first_failed_at": now,
            "failed_count": 1,
            "locked_until": 0.0,
        }
        return

    state["failed_count"] = int(state["failed_count"]) + 1
    if int(state["failed_count"]) >= MAX_FAILED_ATTEMPTS:
        state["locked_until"] = now + LOCKOUT_SECONDS


def _is_locked_memory(key: str) -> bool:
    state = _FAILED_LOGIN_ATTEMPTS.get(key)
    if state is None:
        return False

    now = monotonic()
    if now - float(state["first_failed_at"]) > FAILED_WINDOW_SECONDS and now >= float(state["locked_until"]):
        _FAILED_LOGIN_ATTEMPTS.pop(key, None)
        return False

    return now < float(state["locked_until"])


# --- Redis-backed throttling, with automatic fallback -------------------
# Redis makes this throttling shared across worker processes/instances
# instead of per-process. Every entry point below tries Redis first (unless
# we recently saw it fail) and falls back to the in-memory store on any
# error, so a Redis outage degrades throttling instead of breaking login.

async def _reset_attempts(key: str) -> None:
    _reset_attempts_memory(key)

    # Deliberately ignores the retry backoff: if a lockout was written to
    # Redis just before a blip, skipping this delete would let it outlive a
    # successful login. Only successful logins pay the possible timeout.
    try:
        client = redis_client.get_client()
        await client.delete(f"yacs:login:attempts:{key}", f"yacs:login:lockout:{key}")
    except Exception:
        logger.warning("Redis unavailable while resetting login attempts; using in-memory state only.")
        _mark_redis_unavailable()


async def _record_failed_attempt(key: str) -> None:
    if _redis_should_be_tried():
        try:
            client = redis_client.get_client()
            attempts_key = f"yacs:login:attempts:{key}"
            # Create the counter with its window TTL and increment it in one
            # transaction. A separate INCR then EXPIRE could leave a counter
            # with no TTL if the EXPIRE failed, locking the key out forever.
            # SET NX only creates it when absent; INCR keeps the existing TTL.
            async with client.pipeline(transaction=True) as pipe:
                pipe.set(attempts_key, 0, ex=FAILED_WINDOW_SECONDS, nx=True)
                pipe.incr(attempts_key)
                _, failed_count = await pipe.execute()
            if failed_count >= MAX_FAILED_ATTEMPTS:
                await client.set(f"yacs:login:lockout:{key}", "1", ex=LOCKOUT_SECONDS)
            return
        except Exception:
            logger.warning("Redis unavailable while recording a failed login; falling back to in-memory throttling.")
            _mark_redis_unavailable()

    _record_failed_attempt_memory(key)


async def _is_locked(key: str) -> bool:
    if _redis_should_be_tried():
        try:
            client = redis_client.get_client()
            return bool(await client.exists(f"yacs:login:lockout:{key}"))
        except Exception:
            logger.warning("Redis unavailable while checking login lockout; falling back to in-memory throttling.")
            _mark_redis_unavailable()

    return _is_locked_memory(key)


async def log_user_in(credentials: dict, session: dict, client_ip: str | None = None):
    """Log a user in by verifying database credentials and writing session state."""
    email = _normalize_email(credentials.get("email", ""))
    password = credentials.get("password", "")

    if not email or not password:
        return {"success": False, "status": "error", "code": "missing_credentials", "message": "Email and password are required."}

    throttle_key = _throttle_key(email, client_ip)
    if await _is_locked(throttle_key):
        return {
            "success": False,
            "status": "error",
            "code": "rate_limited",
            "message": "Too many failed attempts. Try again in a few minutes.",
        }

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()

        # Always run verify_password regardless of whether the user exists.
        # Using _DUMMY_HASH for unknown emails keeps response time consistent
        # so attackers cannot tell which emails are registered.
        hash_to_check = user.password_hash if user is not None else _DUMMY_HASH
        password_valid = verify_password(password, hash_to_check)

        if user is None or not password_valid:
            await _record_failed_attempt(throttle_key)
            return {"success": False, "status": "error", "code": "invalid_credentials", "message": "Invalid credentials."}

        session.clear()
        session["user"] = {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "authenticated_at": datetime.now(timezone.utc).isoformat(),
        }

        if needs_rehash(user.password_hash):
            user.password_hash = hash_password(password)
            db.commit()

        await _reset_attempts(throttle_key)
        return {
            "success": True,
            "status": "success",
            "message": "Login successful.",
            "user": {
                "user_id": user.id,
                "email": user.email,
                "name": user.name,
                "preferred_semester": user.preferred_semester,
                "role": user.role,
                "entry_year": user.entry_year,
            },
        }
    finally:
        db.close()


def log_user_out(session: dict):
    """Log a user out by clearing session state."""
    if "user" in session:
        session.clear()
        return {"success": True, "status": "success", "message": "Logout successful."}
    return {"success": False, "status": "error", "code": "no_active_session", "message": "No active session."}


def get_current_user_session(session: dict):
    """Return the current authenticated user from server-side session data."""
    session_user = session.get("user")
    if not session_user:
        return {"success": False, "status": "error", "code": "not_authenticated", "message": "No active session."}

    user_id = session_user.get("user_id")
    if not user_id:
        session.clear()
        return {"success": False, "status": "error", "code": "not_authenticated", "message": "No active session."}

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            session.clear()
            return {"success": False, "status": "error", "code": "not_authenticated", "message": "No active session."}

        return {
            "success": True,
            "status": "success",
            "message": "Session active.",
            "user": {
                "user_id": user.id,
                "email": user.email,
                "name": user.name,
                "preferred_semester": user.preferred_semester,
                "role": user.role,
                "entry_year": user.entry_year,
            },
        }
    finally:
        db.close()
