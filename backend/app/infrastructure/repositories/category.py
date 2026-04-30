import uuid
from typing import List, Optional

from app.domain.entities.category import Category
from app.domain.interfaces.category import ICategoryRepository
from app.infrastructure.database.models.category import CategoryModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


class CategoryRepository(ICategoryRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: CategoryModel) -> Category:
        return Category(id=model.id, name=model.name, is_active=model.is_active)

    async def save(self, category: Category) -> None:
        existing = await self.session.get(CategoryModel, category.id)
        if existing:
            existing.name = category.name
            existing.is_active = category.is_active
        else:
            self.session.add(
                CategoryModel(
                    id=category.id,
                    name=category.name,
                    is_active=category.is_active,
                )
            )

    async def get_by_id(self, category_id: uuid.UUID) -> Optional[Category]:
        model = await self.session.get(CategoryModel, category_id)
        return self._to_entity(model) if model else None

    async def get_by_ids(self, category_ids: List[uuid.UUID]) -> List[Category]:
        if not category_ids:
            return []
        result = await self.session.execute(
            select(CategoryModel).where(CategoryModel.id.in_(category_ids))
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_by_name(self, name: str) -> Optional[Category]:
        result = await self.session.execute(
            select(CategoryModel).where(
                func.lower(CategoryModel.name) == name.lower().strip()
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def search(
        self, query: Optional[str] = None, is_active: Optional[bool] = None
    ) -> List[Category]:
        stmt = select(CategoryModel)
        if is_active is not None:
            stmt = stmt.where(CategoryModel.is_active.is_(is_active))
        if query:
            stmt = stmt.where(CategoryModel.name.ilike(f"%{query}%"))
        stmt = stmt.order_by(CategoryModel.name)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def delete(self, category_id: uuid.UUID) -> None:
        model = await self.session.get(CategoryModel, category_id)
        if model:
            await self.session.delete(model)
