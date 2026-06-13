# backend/schemas/corequisite_schemas.py

from pydantic import BaseModel


class CourseCorequisiteCreate(BaseModel):
    department: str
    level: int
    corequisite: str
