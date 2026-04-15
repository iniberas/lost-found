from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from typing import List, Optional
import uuid
from app.infrastructure.database.models.base import Base


# buat relasi Many-to-Many
report_categories = Table(
    "report_categories",
    Base.metadata,
    Column("report_id", UUID(as_uuid=True), ForeignKey("reports.id"), primary_key=True),
    Column("category_id", ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)

class CategoryModel(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    
    # Relasi balik ke Report
    reports: Mapped[List["ReportModel"]] = relationship(
        secondary=report_categories, 
        back_populates="categories"
    )


# class ProofModel(Base):
#     # TODO: tambahin atribut + relasi disini
#     pass


class ReportModel(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    
    # Kolom untuk menyimpan list URL foto dalam format JSON
    photos: Mapped[Optional[list[str]]] = mapped_column(JSON, default=[])

    # Relasi ke User (Many-to-One)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    # user: Mapped["UserModel"] = relationship("UserModel", back_populates="reports")
    user = relationship("UserModel", back_populates="reports")

    # Relasi ke Category (Many-to-Many)
    categories: Mapped[List[CategoryModel]] = relationship(
        secondary=report_categories, 
        back_populates="reports"
    )
    


# class LostReportModel(ReportModel):
#     # TODO: tambahin atribut + relasi disini
#     pass


# class FoundReportModel(ReportModel):
#     # TODO: tambahin atribut + relasi disini
#     pass


# class HandoverReportModel(ReportModel):
#     # TODO: tambahin atribut + relasi disini
#     pass