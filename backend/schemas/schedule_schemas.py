from typing import List

from pydantic import BaseModel, Field


class SaveSchedulePydantic(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    semester: str = Field(..., min_length=1, max_length=20)  # e.g. "202501"
    crns: List[str] = Field(default_factory=list)


class ScheduleSectionResponse(BaseModel):
    crn: str
    term: str


class ScheduleResponse(BaseModel):
    id: int
    name: str
    semester: str
    crns: List[str]
    created_at: str
    updated_at: str
