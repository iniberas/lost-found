import enum
import uuid
from datetime import datetime

from app.infrastructure.database.models.base import Base
from sqlalchemy import DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELED = "canceled"
    CLOSED = "closed"


class ReportType(str, enum.Enum):
    LOST = "lost"
    FOUND = "found"


class ContactRequestModel(Base):
    __tablename__ = "contact_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    responded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    requester_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    target_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    report_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("reports.id", ondelete="CASCADE"), index=True, nullable=False
    )
    report_type: Mapped[ReportType] = mapped_column(
        Enum(ReportType, name="report_type_enum", create_constraint=True),
        nullable=False,
        server_default=ReportType.LOST
    )

    status: Mapped[RequestStatus] = mapped_column(
        Enum(RequestStatus, name="request_status_enum", create_constraint=True),
        nullable=False,
        default=RequestStatus.PENDING,
    )

    is_response_seen: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    requester: Mapped["UserModel"] = relationship(foreign_keys=[requester_id])
    target_user: Mapped["UserModel"] = relationship(foreign_keys=[target_user_id])
    report: Mapped["ReportModel"] = relationship(foreign_keys=[report_id])
