from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from app.domain.entities.report import Status, Category
from uuid import UUID

class ReportRequest(BaseModel):
    title: str
    description: str
    date: datetime
    location: str
    status: Status
    categories: List[int]


# Pydantic-friendly schema
class CategorySchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True # Allows Pydantic to read from objects/entities

class UserSummary(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True


class ReportResponse(BaseModel):
    id: UUID
    title: str
    description: str
    date: datetime
    location: str
    status: Status
    categories: List[CategorySchema]
    user: UserSummary
    
