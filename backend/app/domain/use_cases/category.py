import uuid
from typing import List, Optional

from app.domain.entities.category import Category
from app.domain.entities.user import User
from app.domain.entities.audit_log import AuditLog, ActionType, EntityType
from app.domain.interfaces.category import ICategoryRepository
from app.domain.interfaces.audit_log import IAuditLogRepository


class CreateCategoryUseCase:
    def __init__(
        self, 
        category_repo: ICategoryRepository,
        audit_log_repo: IAuditLogRepository
    ):
        self.category_repo = category_repo
        self.audit_log_repo = audit_log_repo

    async def execute(self, actor: User, name: str) -> Category:
        if await self.category_repo.get_by_name(name):
            raise ValueError(f"A category named '{name}' already exists")
            
        category = Category.new_category(name)
        await self.category_repo.save(category)
        
        # Mencatat Log
        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=EntityType.CATEGORY,
            entity_id=category.id,
            action=ActionType.CREATE,
            changes={"name": name}
        )
        await self.audit_log_repo.save(log)
        
        return category


class UpdateCategoryUseCase:
    def __init__(
        self, 
        category_repo: ICategoryRepository,
        audit_log_repo: IAuditLogRepository
    ):
        self.category_repo = category_repo
        self.audit_log_repo = audit_log_repo

    async def execute(self, actor: User, category_id: uuid.UUID, new_name: str) -> Category:
        category = await self.category_repo.get_by_id(category_id)
        if not category:
            raise ValueError("Category not found")
            
        # Simpan nama lama untuk dicatat di log
        old_name = category.name
        
        category.update_name(new_name)
        await self.category_repo.save(category)
        
        # Mencatat Log
        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=EntityType.CATEGORY,
            entity_id=category.id,
            action=ActionType.UPDATE,
            changes={
                "old_name": old_name,
                "new_name": new_name
            }
        )
        await self.audit_log_repo.save(log)
        
        return category


class GetCategoryByIdUseCase:
    def __init__(self, repo: ICategoryRepository):
        self.repo = repo
    
    async def execute(self, category_id: uuid.UUID):
        category = await self.repo.get_by_id(category_id)
        if not category:
            raise ValueError("Category not found")
        return category


class SearchCategoriesUseCase:
    def __init__(self, category_repo: ICategoryRepository):
        self.category_repo = category_repo

    async def execute(self, query: Optional[str] = None, is_active: Optional[bool] = None) -> List[Category]:
        return await self.category_repo.search(query=query, is_active=is_active)


class DeleteCategoryUseCase:
    def __init__(
        self, 
        category_repo: ICategoryRepository,
        audit_log_repo: IAuditLogRepository
    ):
        self.category_repo = category_repo
        self.audit_log_repo = audit_log_repo

    async def execute(self, actor: User, category_id: uuid.UUID) -> None:
        category = await self.category_repo.get_by_id(category_id)
        if not category:
            raise ValueError("Category not found")
            
        category.delete()
        await self.category_repo.save(category)
        
        # Mencatat Log
        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=EntityType.CATEGORY,
            entity_id=category.id,
            action=ActionType.DELETE
        )
        await self.audit_log_repo.save(log)