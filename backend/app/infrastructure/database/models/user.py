from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.infrastructure.database.models.base import Base

class UserModel(Base):
    __tablename__ = "users"

    # Use UUID type for Postgres. as_uuid=True lets you use python uuid objects.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    phone_number: Mapped[str] = mapped_column(String(20), nullable=True)

    # Polimorphism 'type' column (Required for Inheritance)
    type: Mapped[str] = mapped_column(String(50))

    __mapper_args__ = {
        "polymorphic_identity": "user",
        "polymorphic_on": "type",
    }

    reports = relationship("ReportModel", back_populates="user")


class AdminModel(UserModel):
    __tablename__ = "admins"

    # CRITICAL: This 'id' must reference the parent 'users.id'
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("users.id"),  # <--- THIS IS THE MISSING LINK
        primary_key=True
    )

    # Any extra fields for admins go here
    # permissions: Mapped[str] = mapped_column(String(255))

    __mapper_args__ = {
        "polymorphic_identity": "admin",
    }