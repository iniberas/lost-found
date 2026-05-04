import math
import uuid
from datetime import datetime
from typing import Optional

from app.domain.entities.audit_log import ActionType, AuditLog, EntityType
from app.domain.entities.user import Admin, SuperAdmin, User
from app.domain.interfaces.audit_log import IAuditLogRepository
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
    def __init__(self, repo: IUserRepository, audit_log_repo: IAuditLogRepository):
        self.repo = repo
        self.audit_log_repo = audit_log_repo

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

        changes = {}
        if email and email.lower() != user.email:
            if await self.repo.find_by_email(email):
                raise ValueError(f"Email {email} is already taken")
            changes["old_email"] = user.email
            changes["new_email"] = email
            user.update_email(email)

        if name and name != user.name:
            changes["old_name"] = user.name
            changes["new_name"] = name
            user.update_name(name)

        if phone_number and phone_number != user.phone_number:
            changes["old_phone_number"] = user.phone_number
            changes["new_phone_number"] = phone_number
            user.update_phone_number(phone_number)

        await self.repo.save(user)

        if changes:
            entity_type = self._determine_entity_type(user)
            log = AuditLog.new_log(
                actor_id=user.id,
                entity_type=entity_type,
                entity_id=user.id,
                action=ActionType.UPDATE,
                changes=changes,
            )
            await self.audit_log_repo.save(log)

        return user

    def _determine_entity_type(self, user: User) -> EntityType:
        if isinstance(user, SuperAdmin) or isinstance(user, Admin):
            return EntityType.ADMIN
        return EntityType.USER


class ChangePasswordUseCase:
    def __init__(
        self,
        repo: IUserRepository,
        hasher: IPasswordHasher,
        audit_log_repo: IAuditLogRepository,
    ):
        self.repo = repo
        self.hasher = hasher
        self.audit_log_repo = audit_log_repo

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

        entity_type = self._determine_entity_type(user)
        log = AuditLog.new_log(
            actor_id=user.id,
            entity_type=entity_type,
            entity_id=user.id,
            action=ActionType.UPDATE,
            changes={"password_changed": True},
        )
        await self.audit_log_repo.save(log)

    def _determine_entity_type(self, user: User) -> EntityType:
        if isinstance(user, SuperAdmin) or isinstance(user, Admin):
            return EntityType.ADMIN
        return EntityType.USER


class SearchUsersUseCase:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    async def execute(
        self,
        page: int = 1,
        limit: int = 20,
        query: Optional[str] = None,
        role: Optional[str] = None,
        created_at_from: Optional[datetime] = None,
        created_at_to: Optional[datetime] = None,
        is_deleted: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Paginated:
        offset = max((page - 1) * limit, 0)
        items = await self.repo.search(
            query=query,
            role=role,
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
            role=role,
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
    def __init__(self, repo: IUserRepository, audit_log_repo: IAuditLogRepository):
        self.repo = repo
        self.audit_log_repo = audit_log_repo

    async def execute(self, actor: User, user_id: uuid.UUID) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        user.delete()
        await self.repo.save(user)

        entity_type = self._determine_entity_type(user)
        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=entity_type,
            entity_id=user.id,
            action=ActionType.DELETE,
        )
        await self.audit_log_repo.save(log)

    def _determine_entity_type(self, user: User) -> EntityType:
        if isinstance(user, SuperAdmin) or isinstance(user, Admin):
            return EntityType.ADMIN
        return EntityType.USER


class CreateAdminUseCase:
    def __init__(
        self,
        repo: IUserRepository,
        hasher: IPasswordHasher,
        audit_log_repo: IAuditLogRepository,
    ):
        self.repo = repo
        self.hasher = hasher
        self.audit_log_repo = audit_log_repo

    async def execute(
        self, actor: User, name: str, email: str, phone_number: str, password: str
    ) -> Admin:
        if await self.repo.find_by_email(email.lower()):
            raise ValueError(f"Email {email} is already taken")

        password_hash = self.hasher.hash(password)
        admin = Admin.new_admin(name, email, phone_number, password_hash)

        await self.repo.save(admin)

        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=EntityType.ADMIN,
            entity_id=admin.id,
            action=ActionType.CREATE,
            changes={"email": email},
        )
        await self.audit_log_repo.save(log)

        return admin


class CreateSuperAdminUseCase:
    def __init__(
        self,
        repo: IUserRepository,
        hasher: IPasswordHasher,
        audit_log_repo: IAuditLogRepository,
    ):
        self.repo = repo
        self.hasher = hasher
        self.audit_log_repo = audit_log_repo

    async def execute(
        self, actor: User, name: str, email: str, phone_number: str, password: str
    ) -> SuperAdmin:
        if await self.repo.find_by_email(email.lower()):
            raise ValueError(f"Email {email} is already taken")

        password_hash = self.hasher.hash(password)
        superadmin = SuperAdmin.new_superadmin(name, email, phone_number, password_hash)

        await self.repo.save(superadmin)

        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=EntityType.ADMIN,
            entity_id=superadmin.id,
            action=ActionType.CREATE,
            changes={"email": email, "is_superadmin": True},
        )
        await self.audit_log_repo.save(log)

        return superadmin
