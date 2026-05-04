import re
import uuid
from datetime import datetime, timezone
from typing import Optional, Self

from app.domain.exceptions import StateTransitionError, ValidationError


class User:
    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    PHONE_REGEX = re.compile(r"^\+[1-9]\d{10,14}$")
    NAME_MIN_LEN = 2
    NAME_MAX_LEN = 255

    def __init__(
        self,
        id: uuid.UUID,
        created_at: datetime,
        updated_at: datetime,
        name: str,
        email: str,
        phone_number: str,
        password_hash: str,
        deleted_at: Optional[datetime] = None,
    ):
        name = self._clean_text(name, "Name")
        email = self._clean_text(email, "Email").lower()
        phone_number = self._clean_text(phone_number, "Phone number")

        self._validate_timestamp(created_at, "Created at")
        self._validate_timestamp(updated_at, "Updated at")
        if deleted_at is not None:
            self._validate_timestamp(deleted_at, "Deleted at")
        self._validate_name(name)
        self._validate_email(email)
        self._validate_phone(phone_number)
        self._validate_password_hash(password_hash)

        self._id = id
        self._created_at = created_at
        self._updated_at = updated_at
        self._deleted_at = deleted_at
        self._name = name
        self._email = email
        self._phone_number = phone_number
        self._password_hash = password_hash

    def __eq__(self, other):
        if not isinstance(other, User):
            return False
        return self._id == other.id

    def __hash__(self):
        return hash(self._id)

    @classmethod
    def new_user(
        cls, name: str, email: str, phone_number: str, password_hash: str
    ) -> Self:
        id = uuid.uuid4()
        created_at = datetime.now(timezone.utc)
        updated_at = created_at

        return cls(id, created_at, updated_at, name, email, phone_number, password_hash)

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
    def deleted_at(self) -> Optional[datetime]:
        return self._deleted_at

    @property
    def name(self) -> str:
        return self._name

    @property
    def email(self) -> str:
        return self._email

    @property
    def phone_number(self) -> str:
        return self._phone_number

    @property
    def password_hash(self) -> str:
        return self._password_hash

    @property
    def role(self) -> str:
        return "user"

    def verify_password(self, plain_password: str, hasher) -> bool:
        return hasher.verify(plain_password, self._password_hash)

    def update_name(self, new_name: str):
        self._ensure_active()

        new_name = self._clean_text(new_name, "Name")
        self._validate_name(new_name)
        self._name = new_name
        self._touch()

    def update_email(self, new_email: str):
        self._ensure_active()

        new_email = self._clean_text(new_email, "Email").lower()
        self._validate_email(new_email)
        self._email = new_email
        self._touch()

    def update_phone_number(self, new_phone_number: str):
        self._ensure_active()

        new_phone_number = self._clean_text(new_phone_number, "Phone number")
        self._validate_phone(new_phone_number)
        self._phone_number = new_phone_number
        self._touch()

    def update_password_hash(self, new_password_hash: str):
        self._ensure_active()

        self._validate_password_hash(new_password_hash)
        self._password_hash = new_password_hash
        self._touch()

    def delete(self):
        self._ensure_active()

        self._deleted_at = datetime.now(timezone.utc)
        self._updated_at = self._deleted_at

    def _touch(self):
        self._updated_at = datetime.now(timezone.utc)

    def _ensure_active(self):
        if self._deleted_at is not None:
            raise StateTransitionError(
                "This user has been deleted and cannot be modified"
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

    def _validate_name(self, name: str):
        if len(name) < self.NAME_MIN_LEN:
            raise ValidationError(
                f"Name must be at least {self.NAME_MIN_LEN} characters long"
            )
        if len(name) > self.NAME_MAX_LEN:
            raise ValidationError(f"Name cannot exceed {self.NAME_MAX_LEN} characters")
        if name.isdigit():
            raise ValidationError("Name cannot consist entirely of numbers")

    def _validate_email(self, email: str):
        if not self.EMAIL_REGEX.match(email):
            raise ValidationError("Invalid email format")

    def _validate_phone(self, phone: str):
        if not self.PHONE_REGEX.match(phone):
            raise ValidationError("Invalid phone number format")

    def _validate_password_hash(self, password_hash: str):
        if not password_hash or not password_hash.strip():
            raise ValidationError("Password hash cannot be empty")


class Admin(User):
    @classmethod
    def new_admin(
        cls, name: str, email: str, phone_number: str, password_hash: str
    ) -> Self:
        id = uuid.uuid4()
        created_at = datetime.now(timezone.utc)
        updated_at = created_at

        return cls(id, created_at, updated_at, name, email, phone_number, password_hash)

    @property
    def role(self) -> str:
        return "user"


class SuperAdmin(Admin):
    @classmethod
    def new_superadmin(
        cls, name: str, email: str, phone_number: str, password_hash: str
    ) -> Self:
        id = uuid.uuid4()
        created_at = datetime.now(timezone.utc)
        updated_at = created_at

        return cls(id, created_at, updated_at, name, email, phone_number, password_hash)

    @property
    def role(self) -> str:
        return "superadmin"
