import math
import uuid
from datetime import datetime
from typing import Optional

from app.domain.entities.user import User
from app.domain.interfaces.auth import IPasswordHasher
from app.domain.interfaces.user import IUserRepository
from app.schemas.pagination import Paginated


class GetUserByIdUseCase:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    async def execute(self, user_id: uuid.UUID) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        return user


class GetUserByEmailUseCase:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    async def execute(self, email: str) -> User:
        user = await self.repo.find_by_email(email)
        if not user:
            raise ValueError("User not found")
        return user


class UpdateUserUseCase:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    async def execute(
        self,
        user_id: uuid.UUID,
        name: Optional[str] = None,
        email: Optional[str] = None,
        phone_number: Optional[str] = None,
    ) -> User:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if email and email.lower() != user.email:
            if await self.repo.find_by_email(email):
                raise ValueError(f"Email {email} is already taken")
            user.update_email(email)

        if name:
            user.update_name(name)
        if phone_number:
            user.update_phone_number(phone_number)

        await self.repo.save(user)
        return user


class ChangePasswordUseCase:
    def __init__(self, repo: IUserRepository, hasher: IPasswordHasher):
        self.repo = repo
        self.hasher = hasher

    async def execute(
        self, user_id: uuid.UUID, old_password: str, new_password: str
    ) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        if not user.verify_password(old_password, self.hasher):
            raise ValueError("Invalid old password")

        new_hash = self.hasher.hash(new_password)
        user.update_password_hash(new_hash)
        await self.repo.save(user)


class SearchUsersUseCase:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    async def execute(
        self,
        page: int = 1,
        limit: int = 20,
        query: Optional[str] = None,
        created_at_from: Optional[datetime] = None,
        created_at_to: Optional[datetime] = None,
        is_deleted: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Paginated:
        offset = max((page - 1) * limit, 0)
        items = await self.repo.search(
            query=query,
            created_at_from=created_at_from,
            created_at_to=created_at_to,
            is_deleted=is_deleted,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
        )
        total = await self.repo.count_search(
            query=query,
            created_at_from=created_at_from,
            created_at_to=created_at_to,
            is_deleted=is_deleted,
        )
        return Paginated(
            items=items,
            total_items=total,
            current_page=page,
            total_pages=math.ceil(total / limit) if total > 0 else 1,
            limit=limit,
        )


class DeleteUserUseCase:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    async def execute(self, user_id: uuid.UUID) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        user.delete()
        await self.repo.save(user)
