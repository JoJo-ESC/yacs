# backend/schemas/auth_schemas.py

from pydantic import BaseModel


class SessionPydantic(BaseModel):
    email: str
    password: str


class SessionDeletePydantic(BaseModel):
    sessionID: str
