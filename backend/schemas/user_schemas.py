# backend/schemas/user_schemas.py

from pydantic import BaseModel
from typing import Optional

class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    major: Optional[str] = None
    degree: Optional[str] = None
    entry_year: Optional[int] = None
    profile_image_url: Optional[str] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    major: Optional[str] = None
    degree: Optional[str] = None
    entry_year: Optional[int] = None

class UserPydantic(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    major: str
    degree: str


class UserDeletePydantic(BaseModel):
    sessionID: str
    password: str


class UpdateUserPydantic(BaseModel):
    name: str
    sessionID: str
    email: str
    phone: str
    newPassword: str
    major: str
    degree: str
