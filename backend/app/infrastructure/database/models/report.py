import enum
import uuid
from datetime import datetime

from app.infrastructure.database.models.base import Base
from geoalchemy2 import Geography
from geoalchemy2.elements import WKBElement
from sqlalchemy import ARRAY, Column, DateTime, Enum, ForeignKey, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid


class ReportType(str, enum.Enum):
    LOST = "lost"
    FOUND = "found"


class ReportStatus(str, enum.Enum):
    OPEN = "open"
    RESOLVED = "resolved"
    CLOSED = "closed"


class FoundStatus(str, enum.Enum):
    HELD_BY_FINDER = "held_by_finder"
    HELD_BY_ADMIN = "held_by_admin"
    RETURNED_TO_OWNER = "returned_to_owner"


report_categories = Table(
    "report_categories",
    Base.metadata,
    Column(
        "report_id",
        Uuid,
        ForeignKey("reports.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "category_id",
        Uuid,
        ForeignKey("categories.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class ReportModel(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    report_type: Mapped[ReportType] = mapped_column(String(20), index=True)

    reporter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    location_name: Mapped[str] = mapped_column(String(255))
    incident_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    photos: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)

    report_status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status_enum", create_constraint=True),
        default=ReportStatus.OPEN,
        index=True,
    )

    location_point: Mapped[WKBElement | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326)
    )

    reporter: Mapped["UserModel"] = relationship(
        foreign_keys="[ReportModel.reporter_id]",
        back_populates="reports",
        lazy="selectin",
    )
    categories: Mapped[list["CategoryModel"]] = relationship(
        secondary=report_categories,
        lazy="selectin",
        back_populates="reports",
    )

    __mapper_args__ = {
        "polymorphic_on": "report_type",
        "polymorphic_identity": "report",
    }


class LostReportModel(ReportModel):
    __tablename__ = "lost_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("reports.id", ondelete="CASCADE"),
        primary_key=True,
    )

    __mapper_args__ = {
        "polymorphic_identity": "lost",
    }


class FoundReportModel(ReportModel):
    __tablename__ = "found_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("reports.id", ondelete="CASCADE"),
        primary_key=True,
    )

    holder_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))

    found_status: Mapped[FoundStatus | None] = mapped_column(
        Enum(FoundStatus, name="found_status_enum", create_constraint=True)
    )

    handed_over_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    proof_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("proofs.id"))
    finder_name: Mapped[str | None] = mapped_column(String(255))
    finder_contact: Mapped[str | None] = mapped_column(String(255))

    holder: Mapped["UserModel | None"] = relationship(
        foreign_keys="[FoundReportModel.holder_id]",
        back_populates="holds",
        lazy="selectin",
    )
    proof: Mapped["ProofModel | None"] = relationship(lazy="selectin")

    __mapper_args__ = {
        "polymorphic_identity": "found",
    }
