from typing import Optional
from sqlalchemy.orm import Session
from app.domain.entities.user import User
from app.domain.interfaces.user import IUserRepository
from app.infrastructure.database.models.user import UserModel


class SqlAlchemyUserRepository(IUserRepository):
    def __init__(self, db: Session):
        self.db = db

    def save(self, user: User) -> None:
        db_user = UserModel(
            id=user.id,
            created_at=user.created_at, 
            updated_at=user.updated_at, 
            name=user.name,
            email=user.email,
            phone_number=user.phone_number,
            password_hash=user.password_hash
        )
        
        self.db.merge(db_user)
        self.db.commit()

    def find_by_email(self, email: str) -> Optional[User]:
        db_user = self.db.query(UserModel).filter(UserModel.email == email).first()
        
        if not db_user:
            return None
            
        return User(
            id=db_user.id,
            created_at=db_user.created_at,
            updated_at=db_user.updated_at,
            name=db_user.name,
            email=db_user.email,
            phone_number=db_user.phone_number,
            password_hash=db_user.password_hash
        )