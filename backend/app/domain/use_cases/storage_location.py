import math
import uuid
from typing import Optional

from app.domain.entities.audit_log import ActionType, AuditLog, EntityType
from app.domain.entities.point import Point
from app.domain.entities.storage_location import StorageLocation
from app.domain.entities.user import Admin, SuperAdmin, User
from app.domain.interfaces.audit_log import IAuditLogRepository
from app.domain.interfaces.storage_location import IStorageLocationRepository
from app.schemas.pagination import Paginated


class CreateStorageLocationUseCase:
    def __init__(
        self, repo: IStorageLocationRepository, audit_log_repo: IAuditLogRepository
    ):
        self.repo = repo
        self.audit_log_repo = audit_log_repo

    async def execute(
        self, actor: User, name: str, description: str, location_point: Point
    ) -> StorageLocation:
        if not (isinstance(actor, Admin) or isinstance(actor, SuperAdmin)):
            raise PermissionError("Only administrators can create storage locations")

        if await self.repo.get_by_name(name):
            raise ValueError(f"A storage location named '{name}' already exists")

        location = StorageLocation.new_location(name, description, location_point)
        await self.repo.save(location)

        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=EntityType.STORAGE_LOCATION,
            entity_id=location.id,
            action=ActionType.CREATE,
            changes={"name": name},
        )
        await self.audit_log_repo.save(log)

        return location


class UpdateStorageLocationUseCase:
    def __init__(
        self, repo: IStorageLocationRepository, audit_log_repo: IAuditLogRepository
    ):
        self.repo = repo
        self.audit_log_repo = audit_log_repo

    async def execute(
        self,
        actor: User,
        location_id: uuid.UUID,
        name: Optional[str] = None,
        description: Optional[str] = None,
        location_point: Optional[Point] = None,
    ) -> StorageLocation:
        if not (isinstance(actor, Admin) or isinstance(actor, SuperAdmin)):
            raise PermissionError("Only administrators can update storage locations")

        location = await self.repo.get_by_id(location_id)
        if not location:
            raise ValueError("Storage location not found")

        changes = {}
        if name and name != location.name:
            if await self.repo.get_by_name(name):
                raise ValueError(f"A storage location named '{name}' already exists")
            changes["old_name"] = location.name
            changes["new_name"] = name
            location.update_name(name)

        if description and description != location.description:
            changes["description_updated"] = True
            location.update_description(description)

        if location_point:
            changes["location_point_updated"] = True
            location.update_location_point(location_point)

        await self.repo.save(location)

        if changes:
            log = AuditLog.new_log(
                actor_id=actor.id,
                entity_type=EntityType.STORAGE_LOCATION,
                entity_id=location.id,
                action=ActionType.UPDATE,
                changes=changes,
            )
            await self.audit_log_repo.save(log)

        return location


class DeleteStorageLocationUseCase:
    def __init__(
        self, repo: IStorageLocationRepository, audit_log_repo: IAuditLogRepository
    ):
        self.repo = repo
        self.audit_log_repo = audit_log_repo

    async def execute(self, actor: User, location_id: uuid.UUID) -> None:
        if not (isinstance(actor, Admin) or isinstance(actor, SuperAdmin)):
            raise PermissionError("Only administrators can delete storage locations")

        location = await self.repo.get_by_id(location_id)
        if not location:
            raise ValueError("Storage location not found")

        location.delete()
        await self.repo.save(location)

        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=EntityType.STORAGE_LOCATION,
            entity_id=location.id,
            action=ActionType.DELETE,
        )
        await self.audit_log_repo.save(log)


class ActivateStorageLocationUseCase:
    def __init__(
        self, repo: IStorageLocationRepository, audit_log_repo: IAuditLogRepository
    ):
        self.repo = repo
        self.audit_log_repo = audit_log_repo

    async def execute(self, actor: User, location_id: uuid.UUID) -> StorageLocation:
        if not (isinstance(actor, Admin) or isinstance(actor, SuperAdmin)):
            raise PermissionError("Only administrators can modify storage locations")

        location = await self.repo.get_by_id(location_id)
        if not location:
            raise ValueError("Storage location not found")

        location.activate()
        await self.repo.save(location)

        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=EntityType.STORAGE_LOCATION,
            entity_id=location.id,
            action=ActionType.STATUS_CHANGE,
            changes={"is_active": True},
        )
        await self.audit_log_repo.save(log)

        return location


class SearchStorageLocationsUseCase:
    def __init__(self, repo: IStorageLocationRepository):
        self.repo = repo

    async def execute(
        self,
        page: int = 1,
        limit: int = 20,
        query: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Paginated:
        offset = max((page - 1) * limit, 0)
        items = await self.repo.search(query, is_active, limit=limit, offset=offset)
        total = await self.repo.count_search(query, is_active)

        return Paginated(
            items=items,
            total_items=total,
            current_page=page,
            total_pages=math.ceil(total / limit) if total > 0 else 1,
            limit=limit,
        )


class GetStorageLocationByIdUseCase:
    def __init__(self, repo: IStorageLocationRepository):
        self.repo = repo

    async def execute(self, location_id: uuid.UUID) -> StorageLocation:
        location = await self.repo.get_by_id(location_id)
        if not location:
            raise ValueError("Storage location not found")
        return location
