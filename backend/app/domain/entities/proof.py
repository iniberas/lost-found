import datetime
from uuid import UUID
from typing import List, Optional


class Proof:
    def __init__(
        self, id: UUID, created_at: datetime, photos: List[str], notes: Optional[str]
    ):
        self._id = id
        self._created_at = created_at
        self._photos = photos
        self._notes = notes

    @property
    def id(self) -> UUID:
        return self._id

    @property
    def created_at(self) -> datetime:
        return self._created_at

    @property
    def photos(self) -> List[str]:
        return self._photos

    @property
    def notes(self) -> Optional[str]:
        return self._notes