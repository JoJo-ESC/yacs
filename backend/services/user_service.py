from models import SessionLocal
from models.user import User


def _serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "major": user.major,
        "degree": user.degree,
        "profile_image_url": user.profile_image_url,
    }


def create_user(user_data: dict):
    """Placeholder logic to create a new user."""
    print(f"DATABASE: Creating user '{user_data['name']}'...")
    # In a real app, you would add the user to the database here.
    return {"status": "success", "message": f"User {user_data['name']} created."}

def delete_current_user(user_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}

        db.delete(user)
        db.commit()
        return {"status": "success", "message": "User deleted."}
    finally:
        db.close()


def get_user_profile(user_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"error": "User not found"}

        return _serialize_user(user)
    finally:
        db.close()


def update_user_profile(user_id: int, update_data: dict):
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
