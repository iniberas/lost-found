import uuid
from datetime import datetime, timezone
from typing import List, Self

from app.domain.exceptions import ValidationError


class Proof:
    NOTES_MIN_LEN = 10
    NOTES_MAX_LEN = 2047
    MAX_PHOTOS_COUNT = 10

    def __init__(
        self,
        id: uuid.UUID,
        created_at: datetime,
        photos: List[str],
        notes: str,
    ):
        notes = self._clean_text(notes, "Notes")

        self._validate_notes(notes)
        self._validate_photos(photos)
        self._validate_timestamp(created_at, "Created at")

        self._id = id
        self._created_at = created_at
        self._photos = photos.copy()
        self._notes = notes

    def __eq__(self, other):
        if not isinstance(other, Proof):
            return False
        return self._id == other.id

    def __hash__(self):
        return hash(self._id)

    @classmethod
    def new_proof(cls, photos: List[str], notes: str) -> Self:
        id = uuid.uuid4()
        created_at = datetime.now(timezone.utc)
        return cls(id, created_at, photos, notes=notes)

    @property
    def id(self) -> uuid.UUID:
        return self._id

    @property
    def created_at(self) -> datetime:
        return self._created_at

    @property
    def photos(self) -> List[str]:
        return self._photos.copy()

    @property
    def notes(self) -> str:
        return self._notes

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

    def _validate_photos(self, photos: List[str]):
        if len(photos) > self.MAX_PHOTOS_COUNT:
            raise ValidationError(
                f"A proof cannot exceed the maximum limit of {self.MAX_PHOTOS_COUNT} photos"
            )

    def _validate_notes(self, notes: str):
        if len(notes) < self.NOTES_MIN_LEN:
            raise ValidationError(
                f"Notes must be at least {self.NOTES_MIN_LEN} characters long"
            )
        if len(notes) > self.NOTES_MAX_LEN:
            raise ValidationError(
                f"Notes cannot exceed {self.NOTES_MAX_LEN} characters"
            )
