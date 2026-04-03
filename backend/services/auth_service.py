from __future__ import annotations

from datetime import datetime, timezone
from time import monotonic

from models import SessionLocal
from models.user import User
from services.password_service import hash_password, needs_rehash, verify_password


MAX_FAILED_ATTEMPTS = 5
FAILED_WINDOW_SECONDS = 15 * 60
LOCKOUT_SECONDS = 5 * 60

# In-memory throttling store:
# key -> {"first_failed_at": float, "failed_count": int, "locked_until": float}
_FAILED_LOGIN_ATTEMPTS: dict[str, dict[str, float | int]] = {}


def _normalize_email(raw_email: str) -> str:
    return raw_email.strip().lower()


def _throttle_key(email: str, client_ip: str | None) -> str:
    return f"{email}|{client_ip or 'unknown'}"


def _reset_attempts(key: str) -> None:
    _FAILED_LOGIN_ATTEMPTS.pop(key, None)


def _record_failed_attempt(key: str) -> None:
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


def _is_locked(key: str) -> bool:
    state = _FAILED_LOGIN_ATTEMPTS.get(key)
    if state is None:
        return False

    now = monotonic()
    if now - float(state["first_failed_at"]) > FAILED_WINDOW_SECONDS and now >= float(state["locked_until"]):
        _FAILED_LOGIN_ATTEMPTS.pop(key, None)
        return False

    return now < float(state["locked_until"])


def log_user_in(credentials: dict, session: dict, client_ip: str | None = None):
    """Log a user in by verifying database credentials and writing session state."""
    email = _normalize_email(credentials.get("email", ""))
    password = credentials.get("password", "")

    if not email or not password:
        return {"success": False, "status": "error", "code": "missing_credentials", "message": "Email and password are required."}

    throttle_key = _throttle_key(email, client_ip)
    if _is_locked(throttle_key):
        return {
            "success": False,
            "status": "error",
            "code": "rate_limited",
            "message": "Too many failed attempts. Try again in a few minutes.",
        }

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None or not verify_password(password, user.password_hash):
            _record_failed_attempt(throttle_key)
            return {"success": False, "status": "error", "code": "invalid_credentials", "message": "Invalid credentials."}

        # Clear stale session keys before creating authenticated session state.
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

        _reset_attempts(throttle_key)
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
            },
        }
    finally:
        db.close()
