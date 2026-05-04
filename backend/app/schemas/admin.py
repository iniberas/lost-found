import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.domain.entities.audit_log import ActionType, EntityType
from app.infrastructure.database.models.user import UserRole
from app.schemas.category import (
    CategoryResponse,
    CreateCategoryRequest,
    UpdateCategoryRequest,
)
from app.schemas.contact_request import (
    ContactRequestResponse,
    CreateContactRequestPayload,
)
from app.schemas.point import PointSchema
from app.schemas.report import (
    CreateFoundReportRequest,
    CreateLostReportRequest,
    FoundReportResponse,
    LostReportResponse,
    ResolveFoundReportRequest,
    UpdateFoundReportRequest,
    UpdateLostReportRequest,
)
from app.schemas.storage_location import (
    CreateStorageLocationRequest,
    StorageLocationResponse,
    UpdateStorageLocationRequest,
)
from pydantic import BaseModel, ConfigDict, EmailStr


# ==========================================
# 1. ADMIN USERS
# ==========================================
class AdminUserResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    name: str
    email: str
    phone_number: str
    role: UserRole

    model_config = ConfigDict(from_attributes=True)


class AdminCreateAdminRequest(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    password: str


# ==========================================
# 2. ADMIN AUDIT LOGS
# ==========================================
class AdminAuditLogResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    actor_id: Optional[uuid.UUID] = None
    entity_type: EntityType
    entity_id: uuid.UUID
    action: ActionType
    changes: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 3. ADMIN CATEGORIES
# ==========================================
class AdminCategoryResponse(CategoryResponse):
    pass


class AdminCreateCategoryRequest(CreateCategoryRequest):
    pass


class AdminUpdateCategoryRequest(UpdateCategoryRequest):
    pass


# ==========================================
# 4. ADMIN STORAGE LOCATIONS
# ==========================================
class AdminStorageLocationResponse(StorageLocationResponse):
    pass


class AdminCreateStorageLocationRequest(CreateStorageLocationRequest):
    pass


class AdminUpdateStorageLocationRequest(UpdateStorageLocationRequest):
    pass


# ==========================================
# 5. ADMIN CONTACT REQUESTS
# ==========================================
class AdminContactRequestResponse(ContactRequestResponse):
    requester: AdminUserResponse
    target_user: AdminUserResponse


class AdminCreateContactRequestPayload(CreateContactRequestPayload):
    pass


# ==========================================
# 6. ADMIN REPORTS
# ==========================================
class AdminLostReportResponse(LostReportResponse):
    reporter: AdminUserResponse


class AdminFoundReportResponse(FoundReportResponse):
    reporter: AdminUserResponse
    holder: AdminUserResponse


class AdminCreateLostReportRequest(CreateLostReportRequest):
    pass


class AdminCreateFoundReportRequest(CreateFoundReportRequest):
    pass


class AdminCreateHandOverReportRequest(BaseModel):
    title: str
    description: str
    location_name: str
    incident_date: datetime
    category_ids: List[uuid.UUID]
    finder_name: str
    finder_contact: str
    storage_location_id: uuid.UUID
    location_point: Optional[PointSchema] = None


class AdminHandOverRequest(BaseModel):
    report_id: uuid.UUID
    storage_location_id: uuid.UUID


class AdminUpdateLostReportRequest(UpdateLostReportRequest):
    pass


class AdminUpdateFoundReportRequest(UpdateFoundReportRequest):
    storage_location_id: Optional[uuid.UUID] = None


class AdminResolveFoundReportRequest(ResolveFoundReportRequest):
    pass
