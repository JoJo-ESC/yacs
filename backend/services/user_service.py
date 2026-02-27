from models import SessionLocal
from models.user import User
from services.password_service import hash_password


def create_user(user_data: dict):
    """Create a user account in the database."""
    db = SessionLocal()
    try:
        email = user_data["email"].strip().lower()
        if not email or "@" not in email:
            return {"success": False, "status": "error", "message": "Invalid email address."}

        password = user_data.get("password", "")
        if len(password) < 8:
            return {"success": False, "status": "error", "message": "Password must be at least 8 characters."}

        existing = db.query(User).filter(User.email == email).first()
        if existing is not None:
            return {"success": False, "status": "error", "message": "Email already in use."}

        try:
            password_hash = hash_password(password)
        except ValueError:
            return {"success": False, "status": "error", "message": "Password is too long."}

        new_user = User(
            name=user_data["name"].strip(),
            email=email,
            phone=user_data.get("phone", "").strip(),
            password_hash=password_hash,
            major=user_data.get("major", "Undeclared").strip() or "Undeclared",
            degree=user_data.get("degree", "BS").strip() or "BS",
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {"success": True, "status": "success", "message": "User created.", "user_id": new_user.id}
    finally:
        db.close()


def delete_current_user(user_id: int):
    """Delete a user by ID."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            return {"success": False, "status": "error", "message": "User not found."}

        db.delete(user)
        db.commit()
        return {"success": True, "status": "success", "message": "User deleted."}
    finally:
        db.close()
