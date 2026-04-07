from pydantic import BaseModel
from typing import Optional


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

class UserDeletePydantic(BaseModel):
    sessionID: str
    password: str

class UserCoursePydantic(BaseModel):
    name: str
    semester: str
    cid: str

class UserCreate(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    major: str
    degree: str


class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    major: str
    degree: str
    profile_image_url: str | None = None


class UserProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    major: str | None = None
    degree: str | None = None
    profile_image_url: str | None = None



class SubsemesterPydantic(BaseModel):
    semester: Optional[str] = None

class DefaultSemesterSetPydantic(BaseModel):
    default: str
    
class CourseCorequisiteCreate(BaseModel):
    department: str
    level: int
    corequisite: str

    
