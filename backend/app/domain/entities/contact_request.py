import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Self

from app.domain.entities.user import User
from app.domain.exceptions import StateTransitionError, ValidationError

from app.domain.entities.report import ReportType

class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELED = "canceled"


class ContactRequest:
    MESSAGE_MAX_LEN = 1000

    def __init__(
        self,
        id: uuid.UUID,
        created_at: datetime,
        updated_at: datetime,
        requester: User,
        target_user: User,
        report_id: uuid.UUID,
        report_type: ReportType,
        status: RequestStatus,
        report_title: Optional[str] = None,
        report_description: Optional[str] = None,
        message: Optional[str] = None,
        responded_at: Optional[datetime] = None,
    ):
        if message is not None:
            message = self._clean_text(message, "Message")
            self._validate_message(message)

        self._validate_timestamp(created_at, "Created at")
        self._validate_timestamp(updated_at, "Updated at")
        if responded_at is not None:
            self._validate_timestamp(responded_at, "Responded at")

        if requester.id == target_user.id:
            raise ValidationError("You cannot request your own contact information")

        self._id = id
        self._created_at = created_at
        self._updated_at = updated_at
        self._requester = requester
        self._target_user = target_user
        self._report_id = report_id
        self._report_type = report_type
        self._report_title = report_title
        self._report_description = report_description
        self._status = status
        self._message = message
        self._responded_at = responded_at

    def __eq__(self, other):
        if not isinstance(other, ContactRequest):
            return False
        return self._id == other.id

    def __hash__(self):
        return hash(self._id)

    @classmethod
    def new_request(
        cls,
        requester: User,
        target_user: User,
        report_id: uuid.UUID,
        report_type: ReportType,
        message: Optional[str] = None,
    ) -> Self:
        id = uuid.uuid4()
        created_at = datetime.now(timezone.utc)
        updated_at = created_at
        status = RequestStatus.PENDING

        return cls(
            id=id,
            created_at=created_at,
            updated_at=updated_at,
            requester=requester,
            target_user=target_user,
            report_id=report_id,
            report_type=report_type,
            status=status,
            message=message,
        )

    @property
    def id(self) -> uuid.UUID:
        return self._id

    @property
    def created_at(self) -> datetime:
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        return self._updated_at

    @property
    def requester(self) -> User:
        return self._requester

    @property
    def target_user(self) -> User:
        return self._target_user

    @property
    def report_id(self) -> uuid.UUID:
        return self._report_id

    @property
    def report_type(self) -> ReportType:
        return self._report_type
    
    @property
    def report_title(self) -> Optional[str]:
        return self._report_title

    @report_title.setter
    def report_title(self, value: Optional[str]):
        self._report_title = value

    @property
    def report_description(self) -> Optional[str]:
        return self._report_description

    @report_description.setter
    def report_description(self, value: Optional[str]):
        self._report_description = value

    @property
    def status(self) -> RequestStatus:
        return self._status

    @property
    def message(self) -> Optional[str]:
        return self._message

    @property
    def responded_at(self) -> Optional[datetime]:
        return self._responded_at

    def approve(self):
        self._ensure_pending()
        self._status = RequestStatus.APPROVED
        self._responded_at = datetime.now(timezone.utc)
        self._touch()

    def reject(self):
        self._ensure_pending()
        self._status = RequestStatus.REJECTED
        self._responded_at = datetime.now(timezone.utc)
        self._touch()

    def cancel(self):
        self._ensure_pending()
        self._status = RequestStatus.CANCELED
        self._touch()

    def update_message(self, new_message: str):
        self._ensure_pending()

        new_message = self._clean_text(new_message, "Message")
        self._validate_message(new_message)
        self._message = new_message
        self._touch()

    def _touch(self):
        self._updated_at = datetime.now(timezone.utc)

    def _ensure_pending(self):
        if self._status != RequestStatus.PENDING:
            raise StateTransitionError(
                f"Cannot modify contact request because it is already {self._status.value}"
            )

    def _clean_text(self, text: str, field_name: str) -> str:
        if not text:
            raise ValidationError(f"{field_name} cannot be empty")

        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValidationError(f"{field_name} cannot be empty")

        return cleaned_text

    def _validate_timestamp(self, dt: datetime, field_name: str):
        if dt.tzinfo is None:
            raise ValidationError(f"{field_name} must include timezone information")

    def _validate_message(self, message: str):
        if len(message) > self.MESSAGE_MAX_LEN:
            raise ValidationError(
                f"Message cannot exceed {self.MESSAGE_MAX_LEN} characters"
            )
