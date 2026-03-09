from sqlalchemy import Column, String
from app.infrastructure.database.models.base import Base


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    name = Column(String)
    phone_number = Column(String)

    # TODO: tambahin type buat inheritance (ngarang ga tau bener kagak) + relasi disini


class AdminModel(UserModel):
    # TODO: tambahin type buat inheritance (ngarang ga tau bener kagak) + relasi disini
    pass