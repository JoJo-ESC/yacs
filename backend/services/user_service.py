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
    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            return {"error": "A user with this email already exists"}

        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        return _serialize_user(user)
    finally:
        db.close()