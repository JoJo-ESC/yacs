from models import SessionLocal
from models.user import User
from services.password_service import verify_password


def log_user_in(credentials: dict, session: dict):
    """Log a user in by verifying database credentials and writing session state."""
    email = credentials.get("email", "").strip().lower()
    password = credentials.get("password", "")

    if not email or not password:
        return {"success": False, "message": "Email and password are required."}

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None or not verify_password(password, user.password_hash):
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
    """Log a user out by clearing session state."""
    if "user" in session:
        session.pop("user", None)
        return {"success": True, "message": "Logout successful."}
    return {"success": False, "message": "No active session."}
