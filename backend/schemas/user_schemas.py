# backend/schemas/user_schemas.py

from pydantic import BaseModel


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
