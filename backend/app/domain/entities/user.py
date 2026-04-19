import re
from datetime import datetime
from uuid import UUID
from typing import Optional


class User:
    def __init__(
        self,
        id: UUID,
        created_at: datetime,
        updated_at: datetime,
        name: str,
        email: str,
        phone_number: str,
        password_hash: str,
    ):
        clean_name = name.strip() if name else name
        clean_email = email.strip().lower() if email else email
        clean_phone = phone_number.strip() if phone_number else phone_number

        self._validate_name(clean_name)
        self._validate_email(clean_email)
        self._validate_phone(clean_phone)
        self._validate_password_hash(password_hash)

        self._id = id
        self._created_at = created_at
        self._updated_at = updated_at
        self._name = clean_name
        self._email = clean_email
        self._phone_number = clean_phone
        self._password_hash = password_hash

    @property
    def id(self) -> UUID:
        return self._id

    @property
    def created_at(self) -> datetime:
        return self._created_at

    @property
    def updated_at(self) -> datetime:
        return self._updated_at

    @property
    def name(self) -> str:
        return self._name

    @property
    def email(self) -> str:
        return self._email

    @property
    def phone_number(self) -> str:
        return self._phone_number

    @property
    def password_hash(self) -> str:
        return self._password_hash

    def verify_password(self, plain_password: str, hasher) -> bool:
        return hasher.verify(plain_password, self._password_hash)

    def update_name(self, new_name: str):
        self._validate_name(new_name)
        self._name = new_name
        self._updated_at = datetime.now()

    def update_email(self, new_email: str):
        self._validate_email(new_email)
        self._email = new_email
        self._updated_at = datetime.now()

    def update_phone_number(self, new_phone_number: str):
        self._validate_phone(new_phone_number)
        self._phone_number = new_phone_number
        self._updated_at = datetime.now()

    def update_password_hash(self, new_password_hash: str):
        self._validate_password_hash(new_password_hash)
        self._password_hash = new_password_hash
        self._updated_at = datetime.now()

    def _validate_name(self, name: str):
        if not name or not name.strip():
            raise ValueError("Name cannot be empty")

    def _validate_email(self, email: str):
        if not email or not email.strip():
            raise ValueError("Email cannot be empty")

        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
            raise ValueError("Invalid email format")

    def _validate_phone(self, phone: str):
        if not phone or not phone.strip():
            raise ValueError("Phone number cannot be empty")

        if not re.match(r"^\+[1-9]\d{10,14}$", phone):
            raise ValueError("Invalid phone number format")

    def _validate_password_hash(self, password_hash: str):
        if not password_hash or not password_hash.strip():
            raise ValueError("Password hash cannot be empty")


class Admin(User):
    pass


class UserSummary:
    def __init__(self, id: UUID, name: str, email: str, phone_number: str):
        self._id = id
        self._name = name
        self._email = email
        self._phone_number = phone_number

    @property
    def id(self) -> UUID:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def email(self) -> str:
        return self._email

    @property
    def phone_number(self) -> str:
        return self._phone_number
