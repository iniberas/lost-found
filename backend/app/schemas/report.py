from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Literal
from datetime import datetime
from uuid import UUID

from app.domain.entities.report import ReportStatus, FoundStatus, ReportType


class CategorySchema(BaseModel):
    id: int
    name: str
    
    model_config = ConfigDict(from_attributes=True)


class UserSummary(BaseModel):
    id: UUID
    name: str

    model_config = ConfigDict(from_attributes=True)


class ProofResponse(BaseModel):
    id: UUID 
    created_at: datetime
    notes: str
    photos: List[str]

    model_config = ConfigDict(from_attributes=True)


class ReportRequestBase(BaseModel):
    title: str
    description: str
    date: datetime
    location_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category_ids: List[int] = Field(..., min_length=1)


class LostReportRequest(ReportRequestBase):
    pass


class FoundReportRequest(ReportRequestBase):
    pass


class HandoverReportRequest(ReportRequestBase):
    finder_name: str 
    finder_contact: str


class UpdateReportRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class ReportResponse(BaseModel):
    id: UUID
    created_at: datetime 
    updated_at: datetime
    title: str
    description: str
    date: datetime
    location_name: str 
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    report_status: ReportStatus 
    
    photos: List[str]
    categories: List[CategorySchema]
    reporter: UserSummary 
    
    model_config = ConfigDict(from_attributes=True) 


class LostReportResponse(ReportResponse):
    report_type: Literal[ReportType.LOST] = ReportType.LOST


class FoundReportResponse(ReportResponse):
    report_type: Literal[ReportType.FOUND] = ReportType.FOUND
    found_status: FoundStatus
    holder: UserSummary 
    finder_name: Optional[str] = None
    finder_contact: Optional[str] = None
    proof: Optional[ProofResponse] = None


class MyReportsResponse(BaseModel):
    lost: List[LostReportResponse]
    found: List[FoundReportResponse]