import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional, Self

from app.domain.exceptions import ValidationError


class EntityType(str, Enum):
    USER = "user"
    ADMIN = "admin"
    CATEGORY = "category"
    LOST_REPORT = "lost_report"
    FOUND_REPORT = "found_report"
    STORAGE_LOCATION = "storage_location"
    CONTACT_REQUEST = "contact_request"


class ActionType(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    STATUS_CHANGE = "status_change"
    HANDOVER = "handover"


class AuditLog:
    def __init__(
        self,
        id: uuid.UUID,
        created_at: datetime,
        actor_id: uuid.UUID,
        entity_type: EntityType,
        entity_id: uuid.UUID,
        action: ActionType,
        changes: Optional[Dict[str, Any]] = None,
    ):
        self._validate_timestamp(created_at, "Created at")

        self._id = id
        self._created_at = created_at
        self._actor_id = actor_id
        self._entity_type = entity_type
        self._entity_id = entity_id
        self._action = action
        self._changes = changes.copy() if changes is not None else {}

    def __eq__(self, other):
        if not isinstance(other, AuditLog):
            return False
        return self._id == other.id

    def __hash__(self):
        return hash(self._id)

    @classmethod
    def new_log(
        cls,
        actor_id: uuid.UUID,
        entity_type: EntityType,
        entity_id: uuid.UUID,
        action: ActionType,
        changes: Optional[Dict[str, Any]] = None,
    ) -> Self:
        """
        Membuat record log baru.
        - actor_id: ID dari User/Admin yang melakukan aksi.
        - entity_type: Jenis entitas yang diubah/dibuat (contoh: FOUND_REPORT).
        - entity_id: ID dari entitas tersebut.
        - action: Jenis aksi (contoh: HANDOVER).
        - changes: Dictionary opsional untuk menyimpan data detail (misal state before-after).
        """
        id = uuid.uuid4()
        created_at = datetime.now(timezone.utc)

        return cls(id, created_at, actor_id, entity_type, entity_id, action, changes)

    @property
    def id(self) -> uuid.UUID:
        return self._id

    @property
    def created_at(self) -> datetime:
        return self._created_at

    @property
    def actor_id(self) -> uuid.UUID:
        return self._actor_id

    @property
    def entity_type(self) -> EntityType:
        return self._entity_type

    @property
    def entity_id(self) -> uuid.UUID:
        return self._entity_id

    @property
    def action(self) -> ActionType:
        return self._action

    @property
    def changes(self) -> Dict[str, Any]:
        """Return copy of changes to prevent mutation from outside"""
        return self._changes.copy()

    def _validate_timestamp(self, dt: datetime, field_name: str):
        if dt.tzinfo is None:
            raise ValidationError(f"{field_name} must include timezone information")