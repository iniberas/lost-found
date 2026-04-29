import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class UserResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    name: str
    email: str
    phone_number: str

    model_config = ConfigDict(from_attributes=True)


class RegisterUserRequest(BaseModel):
    name: str
    email: EmailStr
    phone_number: str
    password: str


class LoginUserRequest(BaseModel):
    email: str
    password: str


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
