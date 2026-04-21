from models import SessionLocal
from models.user import User


def log_user_in(credentials: dict, session: dict):
    """Log a user in by matching email/password and storing their session."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == credentials["email"]).first()
        if not user or user.password != credentials["password"]:
            return {"success": False, "message": "Invalid credentials."}

        session["user"] = {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
        }

        return {"success": True, "message": "Login successful."}
    finally:
        db.close()


def log_user_out(session: dict):
    """Logs a user out by clearing their session data."""
    if 'user' in session:
        session.pop('user', None)
        return {"success": True, "message": "Logout successful."}
    return {"success": False, "message": "No active session."}