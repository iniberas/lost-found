import enum
import uuid
from datetime import datetime
from typing import List

from sqlalchemy import String, ForeignKey, DateTime, func, Enum as SQLEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.infrastructure.database.models.base import Base


class UserType(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)

    user_type: Mapped[UserType] = mapped_column(SQLEnum(UserType), default=UserType.USER)

    __mapper_args__ = {
        "polymorphic_identity": UserType.USER,
        "polymorphic_on": "user_type",
    }

    reported_items: Mapped[List["ReportModel"]] = relationship(
        "ReportModel", 
        foreign_keys="[ReportModel.reporter_id]",
        back_populates="reporter",
        cascade="all, delete-orphan"
    )

    held_items: Mapped[List["FoundReportModel"]] = relationship(
        "FoundReportModel",
        foreign_keys="[FoundReportModel.holder_id]",
        back_populates="holder",
        cascade="all, delete-orphan"
    )


class AdminModel(UserModel):
    __tablename__ = "admins"

    id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        primary_key=True
    )
    
    __mapper_args__ = {
        "polymorphic_identity": UserType.ADMIN,
    }