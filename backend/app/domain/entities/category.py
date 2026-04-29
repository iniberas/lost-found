import uuid
from typing import Self

from app.domain.exceptions import ValidationError


class Category:
    NAME_MIN_LEN = 2
    NAME_MAX_LEN = 255

    def __init__(self, id: uuid.UUID, name: str, is_active: bool):
        name = self._clean_text(name, "Name")

        self._validate_name(name)

        self._id = id
        self._name = name
        self._is_active = is_active

    def __eq__(self, other):
        if not isinstance(other, Category):
            return False
        return self._id == other.id

    def __hash__(self):
        return hash(self._id)

    @classmethod
    def new_category(cls, name: str) -> Self:
        id = uuid.uuid4()
        is_active = True
        return cls(id, name, is_active)

    @property
    def id(self) -> uuid.UUID:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def is_active(self) -> bool:
        return self._is_active

    def update_name(self, new_name: str):
        self._ensure_active()
        new_name = self._clean_text(new_name, "Name")

        self._validate_name(new_name)

        self._name = new_name

    def _clean_text(self, text: str, field_name: str) -> str:
        if not text:
            raise ValidationError(f"{field_name} cannot be empty")

        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValidationError(f"{field_name} cannot be empty")

        return cleaned_text

    def _validate_name(self, name: str):
        if len(name) < self.NAME_MIN_LEN:
            raise ValidationError(
                f"Name must be at least {self.NAME_MIN_LEN} characters long"
            )
        if len(name) > self.NAME_MAX_LEN:
            raise ValidationError(f"Name cannot exceed {self.NAME_MAX_LEN} characters")

    def _ensure_active(self):
        if not self._is_active:
            raise ValidationError(
                "This category has been deleted and cannot be modified"
            )

    def delete(self):
        self._is_active = False
