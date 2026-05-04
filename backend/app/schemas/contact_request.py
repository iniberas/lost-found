import uuid
from datetime import datetime
from typing import Optional

from app.domain.entities.contact_request import RequestStatus
from app.schemas.user import UserResponse
from pydantic import BaseModel, ConfigDict


class ContactRequestResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    responded_at: Optional[datetime] = None
    requester: UserResponse
    target_user: UserResponse
    report_id: uuid.UUID
    status: RequestStatus
    message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CreateContactRequestPayload(BaseModel):
    target_user_id: uuid.UUID
    report_id: uuid.UUID
    message: Optional[str] = None
