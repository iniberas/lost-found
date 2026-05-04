import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict
from app.schemas.point import PointSchema 


class StorageLocationResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    name: str
    description: str
    location_point: PointSchema
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class CreateStorageLocationRequest(BaseModel):
    name: str
    description: str
    location_point: PointSchema


class UpdateStorageLocationRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location_point: Optional[PointSchema] = None