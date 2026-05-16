import uuid
from datetime import datetime, timezone
from typing import Self

from app.domain.entities.point import Point
from app.domain.exceptions import StateTransitionError, ValidationError


class StorageLocation:
    NAME_MIN_LEN = 2
    NAME_MAX_LEN = 255
    DESCRIPTION_MAX_LEN = 2047

    def __init__(
        self,
        id: uuid.UUID,
        created_at: datetime,
        updated_at: datetime,
        name: str,
        is_active: bool,
        description: str,
        location_point: Point,
    ):
        name = self._clean_text(name, "Name")
        description = description.strip()

        self._validate_timestamp(created_at, "Created at")
        self._validate_timestamp(updated_at, "Updated at")
        self._validate_name(name)
        self._validate_description(description)

        if location_point is None:
            raise ValidationError("Location point is required")

        self._id = id
        self._created_at = created_at
        self._updated_at = updated_at
        self._name = name
        self._description = description
        self._location_point = location_point
        self._is_active = is_active

    def __eq__(self, other):
        if not isinstance(other, StorageLocation):
            return False
        return self._id == other.id

    def __hash__(self):
        return hash(self._id)

    @classmethod
    def new_location(cls, name: str, description: str, location_point: Point) -> Self:
        id = uuid.uuid4()
        created_at = datetime.now(timezone.utc)
        updated_at = created_at
        is_active = True

        return cls(
            id, created_at, updated_at, name, is_active, description, location_point
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
    def name(self) -> str:
        return self._name

    @property
    def description(self) -> str:
        return self._description

    @property
    def location_point(self) -> Point:
        return self._location_point

    @property
    def is_active(self) -> bool:
        return self._is_active

    def update_name(self, new_name: str):
        self._ensure_active()

        new_name = self._clean_text(new_name, "Name")
        self._validate_name(new_name)
        self._name = new_name
        self._touch()

    def update_description(self, new_description: str):
        self._ensure_active()

        new_description = self._clean_text(new_description, "Description")
        self._validate_description(new_description)

        self._description = new_description
        self._touch()

    def update_location_point(self, new_location_point: Point):
        self._ensure_active()

        if new_location_point is None:
            raise ValidationError("Location point is required")

        self._location_point = new_location_point
        self._touch()

    def delete(self):
        self._ensure_active()
        self._is_active = False
        self._touch()

    def activate(self):
        if self._is_active:
            raise StateTransitionError("This storage location is already active")
        self._is_active = True
        self._touch()

    def _touch(self):
        self._updated_at = datetime.now(timezone.utc)

    def _ensure_active(self):
        if not self._is_active:
            raise StateTransitionError(
                "This storage location is inactive and cannot be modified"
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

    def _validate_description(self, description: str):
        if len(description) > self.DESCRIPTION_MAX_LEN:
            raise ValidationError(
                f"Description cannot exceed {self.DESCRIPTION_MAX_LEN} characters"
            )
