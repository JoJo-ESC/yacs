from models import SessionLocal
from models.user import User
from services.password_service import hash_password


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "major": user.major,
        "degree": user.degree,
        "preferred_semester": user.preferred_semester,
        "role": user.role,
        "entry_year": user.entry_year,
        "profile_image_url": getattr(user, "profile_image_url", None),
        "entry_year": user.entry_year,
    }


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
            preferred_semester=(user_data.get("preferred_semester") or "Fall 2025").strip() or "Fall 2025",
            role="user",
            entry_year=user_data.get("entry_year"),
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


def update_preferred_semester(user_id: int, preferred_semester: str):
    """Update a user's preferred semester."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            return {"success": False, "status": "error", "message": "User not found."}

        user.preferred_semester = preferred_semester.strip() or user.preferred_semester
        db.commit()
        return {
            "success": True,
            "status": "success",
            "message": "Preferred semester updated.",
            "preferred_semester": user.preferred_semester,
        }
    finally:
        db.close()


def get_user_profile(user_id: int):
    """Return a user's profile by ID."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}
        return _serialize_user(user)
    finally:
        db.close()


def update_user_profile(user_id: int, update_data: dict):
    """Update a user's profile fields."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}

        next_email = update_data.get("email")
        if next_email and next_email != user.email:
            existing_user = db.query(User).filter(User.email == next_email).first()
            if existing_user:
                return {"error": "A user with this email already exists"}

        for key, value in update_data.items():
            setattr(user, key, value)

        db.commit()
        db.refresh(user)
        return _serialize_user(user)
    finally:
        db.close()


def list_users():
    """Return a sanitized list of users."""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        return {
            "success": True,
            "status": "success",
            "users": [
                {
                    "user_id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "major": user.major,
                    "degree": user.degree,
                    "preferred_semester": user.preferred_semester,
                    "role": user.role,
                }
                for user in users
            ],
        }
    finally:
        db.close()


def set_user_role(user_id: int, role: str):
    """Update a user's role to either 'user' or 'admin'."""
    normalized = role.strip().lower()
    if normalized not in {"user", "admin"}:
        return {"success": False, "status": "error", "message": "Invalid role."}

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            return {"success": False, "status": "error", "message": "User not found."}

        if user.role == normalized:
            return {
                "success": True,
                "status": "success",
                "message": f"User already has role '{normalized}'.",
                "role": user.role,
            }

        user.role = normalized
        db.commit()
        return {
            "success": True,
            "status": "success",
            "message": f"User role updated to '{normalized}'.",
            "user_id": user.id,
            "role": user.role,
        }
    finally:
        db.close()
