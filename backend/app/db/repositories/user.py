from typing import Optional
from sqlalchemy.orm import Session
from app.domain.entities.user import User
from app.domain.interfaces.user import IUserRepository
from app.db.session import UserModel

class SqlAlchemyUserRepository(IUserRepository):
    def __init__(self, db: Session):
        self.db = db

    def save(self, user: User) -> None:
        db_user = UserModel(
            id=user.id,
            email=user.email,
            username=user.username,
            password_hash=user.password_hash
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)

    def find_by_email(self, email: str) -> Optional[User]:
        db_user = self.db.query(UserModel).filter(UserModel.email == email).first()
        if not db_user:
            return None
        return User(
            id=db_user.id,
            email=db_user.email,
            username=db_user.username,
            password_hash=db_user.password_hash
        )