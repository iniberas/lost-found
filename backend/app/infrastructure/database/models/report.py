import enum
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, JSON, func, Enum as SQLEnum, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.infrastructure.database.models.base import Base
from app.domain.entities.report import ReportType, ReportStatus, FoundStatus

# buat relasi Many-to-Many
report_categories = Table(
    "report_categories",
    Base.metadata,
    Column("report_id", UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class CategoryModel(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    
    reports: Mapped[List["ReportModel"]] = relationship(
        secondary=report_categories, 
        back_populates="categories"
    )


class ProofModel(Base):
    __tablename__ = "proofs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True)

    report_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("found_reports.id", ondelete="CASCADE"), 
        unique=True
    )
    report: Mapped["FoundReportModel"] = relationship(back_populates="proof")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    
    photos: Mapped[Optional[list[str]]] = mapped_column(JSON, default=list)


class ReportModel(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    location_name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    report_status: Mapped[ReportStatus] = mapped_column(SQLEnum(ReportStatus), default=ReportStatus.OPEN)  
    report_type: Mapped[ReportType] = mapped_column(SQLEnum(ReportType))

    # Kolom untuk menyimpan list URL foto dalam format JSON
    photos: Mapped[Optional[list[str]]] = mapped_column(JSON, default=list)

    # Relasi ke User (Many-to-One)
    reporter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    reporter: Mapped["UserModel"] = relationship(
        "UserModel",
        foreign_keys=[reporter_id], 
        back_populates="reported_items"
    )

    categories: Mapped[List[CategoryModel]] = relationship(
        secondary=report_categories, 
        back_populates="reports"
    )

    __mapper_args__ = {
        "polymorphic_on": report_type,
    }


class LostReportModel(ReportModel):
    __tablename__ = "lost_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("reports.id", ondelete="CASCADE"),
        primary_key=True
    )
    
    __mapper_args__ = {
        "polymorphic_identity": ReportType.LOST, 
    }


class FoundReportModel(ReportModel):
    __tablename__ = "found_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("reports.id", ondelete="CASCADE"), 
        primary_key=True
    )

    found_status: Mapped[FoundStatus] = mapped_column(SQLEnum(FoundStatus), nullable=False)

    holder_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    holder: Mapped["UserModel"] = relationship(
        "UserModel",
        foreign_keys=[holder_id]
    )

    finder_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    finder_contact: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    proof: Mapped[Optional["ProofModel"]] = relationship(
        back_populates="report",
        uselist=False, 
        cascade="all, delete-orphan"
    )

    __mapper_args__ = {
        "polymorphic_identity": ReportType.FOUND,
    }