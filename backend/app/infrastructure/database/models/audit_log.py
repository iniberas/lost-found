import enum
import uuid
from datetime import datetime

from app.infrastructure.database.models.base import Base
from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class EntityType(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    CATEGORY = "category"
    LOST_REPORT = "lost_report"
    FOUND_REPORT = "found_report"
    STORAGE_LOCATION = "storage_location"
    CONTACT_REQUEST = "contact_request"


class ActionType(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    STATUS_CHANGE = "status_change"
    HANDOVER = "handover"


class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    entity_type: Mapped[EntityType] = mapped_column(
        Enum(EntityType, name="entity_type_enum", create_constraint=True),
        nullable=False,
        index=True,
    )

    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )

    action: Mapped[ActionType] = mapped_column(
        Enum(ActionType, name="action_type_enum", create_constraint=True),
        nullable=False,
        index=True,
    )

    changes: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    actor: Mapped["UserModel | None"] = relationship(foreign_keys=[actor_id])
