import re
from datetime import datetime, timezone
from uuid import UUID


class User:
    EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    PHONE_REGEX = re.compile(r"^\+[1-9]\d{10,14}$")
    NAME_REGEX = re.compile(r"^[A-Za-z\s\-\.]+$")
    NAME_MIN_LEN = 2
    NAME_MAX_LEN = 255

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
        clean_name = self._clean_text(name, "Name")
        clean_email = self._clean_text(email, "Email").lower()
        clean_phone = self._clean_text(phone_number, "Phone number")

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
        new_name = self._clean_text(new_name, "Name")
        self._validate_name(new_name)
        self._name = new_name
        self._touch()

    def update_email(self, new_email: str):
        new_email = self._clean_text(new_email, "Email")
        self._validate_email(new_email)
        self._email = new_email
        self._touch()

    def update_phone_number(self, new_phone_number: str):
        new_phone_number = self._clean_text(new_phone_number, "Phone number")
        self._validate_phone(new_phone_number)
        self._phone_number = new_phone_number
        self._touch()

    def update_password_hash(self, new_password_hash: str):
        self._validate_password_hash(new_password_hash)
        self._password_hash = new_password_hash
        self._touch()

    def _touch(self):
        self._updated_at = datetime.now(timezone.utc)
    
    def _clean_text(self, text: str, field_name: str) -> str:
        if not text:
            raise ValueError(f"{field_name} cannot be empty")
            
        cleaned_text = text.strip()
        if not cleaned_text:
            raise ValueError(f"{field_name} cannot be empty")
            
        return cleaned_text
    
    def _validate_name(self, name: str):
        if not self.NAME_REGEX.match(name):
            raise ValueError("Invalid name format")
        if len(name) < self.NAME_MIN_LEN:
            raise ValueError("Name is too short")
        if len(name) > self.NAME_MAX_LEN:
            raise ValueError("Name is too long")

    def _validate_email(self, email: str):
        if not self.EMAIL_REGEX.match(email):
            raise ValueError("Invalid email format")

    def _validate_phone(self, phone: str):
        if not self.PHONE_REGEX.match(phone):
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
