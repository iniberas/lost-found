import uuid
from datetime import datetime
from typing import List, Optional

from app.domain.entities.user import Admin, User
from app.domain.interfaces.user import IUserRepository
from app.infrastructure.database.models.user import UserModel, UserRole
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession


class UserRepository(IUserRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: UserModel) -> User:
        if model.role == UserRole.ADMIN:
            cls = Admin
        else:
            cls = User

        return cls(
            id=model.id,
            created_at=model.created_at,
            updated_at=model.updated_at,
            deleted_at=model.deleted_at,
            name=model.name,
            email=model.email,
            phone_number=model.phone_number,
            password_hash=model.password_hash,
        )

    def _to_model(self, user: User) -> UserModel:
        role = UserRole.ADMIN if isinstance(user, Admin) else UserRole.USER

        return UserModel(
            id=user.id,
            created_at=user.created_at,
            updated_at=user.updated_at,
            deleted_at=user.deleted_at,
            name=user.name,
            email=user.email,
            phone_number=user.phone_number,
            password_hash=user.password_hash,
            role=role,
        )

    async def save(self, user: User) -> None:
        existing = await self.session.get(UserModel, user.id)
        if existing:
            existing.updated_at = user.updated_at
            existing.deleted_at = user.deleted_at
            existing.name = user.name
            existing.email = user.email
            existing.phone_number = user.phone_number
            existing.password_hash = user.password_hash
        else:
            self.session.add(self._to_model(user))

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        model = await self.session.get(UserModel, user_id)
        return self._to_entity(model) if model else None

    async def find_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(
            select(UserModel).where(UserModel.email == email.lower())
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def search(
        self,
        query: Optional[str] = None,
        created_at_from: Optional[datetime] = None,
        created_at_to: Optional[datetime] = None,
        is_deleted: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        limit: int = 20,
        offset: int = 0,
    ) -> List[User]:
        stmt = select(UserModel)
        stmt = self._apply_filters(
            stmt, query, created_at_from, created_at_to, is_deleted
        )
        stmt = self._apply_sort(stmt, sort_by, sort_order)
        stmt = stmt.limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def count_search(
        self,
        query: Optional[str] = None,
        created_at_from: Optional[datetime] = None,
        created_at_to: Optional[datetime] = None,
        is_deleted: Optional[bool] = None,
    ) -> int:
        stmt = select(func.count()).select_from(UserModel)
        stmt = self._apply_filters(
            stmt, query, created_at_from, created_at_to, is_deleted
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    def _apply_filters(self, stmt, query, created_at_from, created_at_to, is_deleted):
        if query:
            like = f"%{query}%"
            stmt = stmt.where(
                or_(UserModel.name.ilike(like), UserModel.email.ilike(like))
            )
        if created_at_from:
            stmt = stmt.where(UserModel.created_at >= created_at_from)
        if created_at_to:
            stmt = stmt.where(UserModel.created_at <= created_at_to)
        if is_deleted is True:
            stmt = stmt.where(UserModel.deleted_at.isnot(None))
        elif is_deleted is False:
            stmt = stmt.where(UserModel.deleted_at.is_(None))
        return stmt

    def _apply_sort(self, stmt, sort_by: str, sort_order: str):
        col_map = {
            "created_at": UserModel.created_at,
            "name": UserModel.name,
            "email": UserModel.email,
        }
        col = col_map.get(sort_by, UserModel.created_at)
        return stmt.order_by(col.asc() if sort_order == "asc" else col.desc())
