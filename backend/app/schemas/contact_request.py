import uuid
from datetime import datetime
from typing import Optional

from app.domain.entities.contact_request import RequestStatus
from app.domain.entities.report import ReportType
from app.schemas.user import UserResponse
from pydantic import BaseModel, ConfigDict

class ContactRequestUserPreview(BaseModel):
    name: str #harusnya diplay name aja kalo ada gasi? bukan full name
    model_config = ConfigDict(from_attributes=True)

class ContactRequestResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    responded_at: Optional[datetime] = None
    requester: ContactRequestUserPreview
    target_user: ContactRequestUserPreview
    report_id: uuid.UUID
    report_type: ReportType
    report_title: Optional[str] = None
    report_description: Optional[str] = None
    status: RequestStatus
    message: Optional[str] = None
    response_message: Optional[str] = None
    is_response_seen: bool

    model_config = ConfigDict(from_attributes=True)


class CreateContactRequestPayload(BaseModel):
    report_id: uuid.UUID
    report_type: ReportType
    message: Optional[str] = None


class ContactAccessUserResponse(BaseModel):
    name: str
    email: str
    phone_number: str

    model_config = ConfigDict(from_attributes=True)


class ContactAccessResponse(BaseModel):
    request_id: uuid.UUID
    granted_at: datetime

    other_user: ContactAccessUserResponse

class ApproveContactRequestPayload(BaseModel):
    message: Optional[str] = None

class RejectContactRequestPayload(BaseModel):
    message: str

class ContactRequestNotificationCountResponse(BaseModel):
    incoming_pending: int
    outgoing_approved: int
    outgoing_rejected: int
    outgoing_closed: int