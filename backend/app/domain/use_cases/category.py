import uuid
from typing import List, Optional

from app.domain.entities.category import Category
from app.domain.interfaces.category import ICategoryRepository


class CreateCategoryUseCase:
    def __init__(self, category_repo: ICategoryRepository):
        self.category_repo = category_repo

    async def execute(self, name: str) -> Category:
        if await self.category_repo.get_by_name(name):
            raise ValueError(f"A category named '{name}' already exists")
        category = Category.new_category(name)
        await self.category_repo.save(category)
        return category


class UpdateCategoryUseCase:
    def __init__(self, category_repo: ICategoryRepository):
        self.category_repo = category_repo

    async def execute(self, category_id: uuid.UUID, new_name: str) -> Category:
        category = await self.category_repo.get_by_id(category_id)
        if not category:
            raise ValueError("Category not found")
        category.update_name(new_name)
        await self.category_repo.save(category)
        return category


class SearchCategoriesUseCase:
    def __init__(self, category_repo: ICategoryRepository):
        self.category_repo = category_repo

    async def execute(self, query: Optional[str] = None, is_active: Optional[bool] = None) -> List[Category]:
        return await self.category_repo.search(query=query, is_active=is_active)


class DeleteCategoryUseCase:
    def __init__(self, category_repo: ICategoryRepository):
        self.category_repo = category_repo

    async def execute(self, category_id: uuid.UUID) -> None:
        category = await self.category_repo.get_by_id(category_id)
        if not category:
            raise ValueError("Category not found")
        category.delete()
        await self.category_repo.save(category)
