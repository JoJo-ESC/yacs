from pydantic import BaseModel
from typing import Literal, Optional


class SessionPydantic(BaseModel):
    email: str
    password: str

class SessionDeletePydantic(BaseModel):
    sessionID: str

class CourseDeletePydantic(BaseModel):
    name: str
    cid: Optional[str] = None
    semester: str

class updateUser(BaseModel):
    name:str
    sessionID:str
    email:str
    phone:str
    newPassword:str
    major:str
    degree:str

class UserPydantic(BaseModel):
     name: str
     email: str
     phone: str
     password: str
     major: str
     degree: str
     preferred_semester: Optional[str] = None

class PreferredSemesterPydantic(BaseModel):
    preferred_semester: str

class RoleUpdatePydantic(BaseModel):
    role: Literal["user", "admin"]

class UserDeletePydantic(BaseModel):
    sessionID: str
    password: str

class UserCoursePydantic(BaseModel):
    name: str
    semester: str
    cid: str

class SubsemesterPydantic(BaseModel):
    semester: Optional[str] = None

class DefaultSemesterSetPydantic(BaseModel):
    default: str
    
class CourseCorequisiteCreate(BaseModel):
    department: str
    level: int
    corequisite: str

    
