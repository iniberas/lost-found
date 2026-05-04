import uuid
from datetime import datetime
from typing import List, Optional

from app.domain.entities.report import (
    FoundStatus,
    ReportStatus,
    ReportType,
)
from app.schemas.category import CategoryResponse
from app.schemas.point import PointSchema
from app.schemas.proof import ProofResponse
from app.schemas.storage_location import StorageLocationResponse
from app.schemas.user import UserResponse
from pydantic import BaseModel, ConfigDict


class LostReportResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    reporter: UserResponse
    report_status: ReportStatus
    report_type: ReportType
    incident_date: datetime
    title: str
    description: str
    location_name: str
    categories: List[CategoryResponse]
    photos: List[str]
    location_point: Optional[PointSchema] = None

    model_config = ConfigDict(from_attributes=True)


class FoundReportResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    reporter: UserResponse
    holder: UserResponse
    report_status: ReportStatus
    report_type: ReportType
    found_status: FoundStatus
    incident_date: datetime
    title: str
    description: str
    location_name: str
    categories: List[CategoryResponse]
    photos: List[str]
    location_point: Optional[PointSchema] = None
    handed_over_at: Optional[datetime] = None
    proof: Optional[ProofResponse] = None
    finder_name: Optional[str] = None
    finder_contact: Optional[str] = None
    storage_location: Optional[StorageLocationResponse] = None

    model_config = ConfigDict(from_attributes=True)


class CreateLostReportRequest(BaseModel):
    title: str
    description: str
    location_name: str
    incident_date: datetime
    category_ids: List[uuid.UUID]
    location_point: Optional[PointSchema] = None


class CreateFoundReportRequest(BaseModel):
    title: str
    description: str
    location_name: str
    incident_date: datetime
    category_ids: List[uuid.UUID]
    location_point: Optional[PointSchema] = None


class UpdateLostReportRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    incident_date: Optional[datetime] = None
    location_name: Optional[str] = None
    location_point: Optional[PointSchema] = None
    category_ids: Optional[List[uuid.UUID]] = None
    photos_to_remove: Optional[List[str]] = None


class UpdateFoundReportRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    incident_date: Optional[datetime] = None
    location_name: Optional[str] = None
    location_point: Optional[PointSchema] = None
    category_ids: Optional[List[uuid.UUID]] = None
    photos_to_remove: Optional[List[str]] = None
    finder_name: Optional[str] = None
    finder_contact: Optional[str] = None


class ResolveFoundReportRequest(BaseModel):
    notes: str
