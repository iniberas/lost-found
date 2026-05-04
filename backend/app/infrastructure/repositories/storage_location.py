import uuid
from typing import List, Optional

from app.domain.entities.point import Point
from app.domain.entities.storage_location import StorageLocation
from app.domain.interfaces.storage_location import IStorageLocationRepository
from app.infrastructure.database.models.storage_location import StorageLocationModel
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


def _point_from_model(m: StorageLocationModel) -> Point:
    shapely_pt = to_shape(m.location_point)
    return Point(latitude=shapely_pt.y, longitude=shapely_pt.x)


def _point_to_geography(point: Point) -> WKTElement:
    wkt = f"POINT({point.longitude} {point.latitude})"
    return WKTElement(wkt, srid=4326)


class StorageLocationRepository(IStorageLocationRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: StorageLocationModel) -> StorageLocation:
        return StorageLocation(
            id=model.id,
            created_at=model.created_at,
            updated_at=model.updated_at,
            name=model.name,
            is_active=model.is_active,
            description=model.description,
            location_point=_point_from_model(model),
        )

    async def save(self, location: StorageLocation) -> None:
        existing = await self.session.get(StorageLocationModel, location.id)
        location_geom = _point_to_geography(location.location_point)

        if existing:
            existing.updated_at = location.updated_at
            existing.name = location.name
            existing.description = location.description
            existing.location_point = location_geom
            existing.is_active = location.is_active
        else:
            self.session.add(
                StorageLocationModel(
                    id=location.id,
                    created_at=location.created_at,
                    updated_at=location.updated_at,
                    name=location.name,
                    description=location.description,
                    location_point=location_geom,
                    is_active=location.is_active,
                )
            )
        await self.session.flush()

    async def get_by_id(self, location_id: uuid.UUID) -> Optional[StorageLocation]:
        model = await self.session.get(StorageLocationModel, location_id)
        return self._to_entity(model) if model else None

    async def get_by_ids(self, location_ids: List[uuid.UUID]) -> List[StorageLocation]:
        if not location_ids:
            return []
        result = await self.session.execute(
            select(StorageLocationModel).where(
                StorageLocationModel.id.in_(location_ids)
            )
        )
        return [self._to_entity(m) for m in result.scalars().all()]

    async def get_by_name(self, name: str) -> Optional[StorageLocation]:
        result = await self.session.execute(
            select(StorageLocationModel).where(
                func.lower(StorageLocationModel.name) == name.lower().strip()
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def search(
        self,
        query: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[StorageLocation]:
        stmt = select(StorageLocationModel)
        stmt = self._apply_filters(stmt, query, is_active)
        stmt = stmt.order_by(StorageLocationModel.name).limit(limit).offset(offset)

        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def count_search(
        self,
        query: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        stmt = select(func.count()).select_from(StorageLocationModel)
        stmt = self._apply_filters(stmt, query, is_active)

        result = await self.session.execute(stmt)
        return result.scalar_one()

    def _apply_filters(self, stmt, query, is_active):
        if is_active is not None:
            stmt = stmt.where(StorageLocationModel.is_active.is_(is_active))
        if query:
            stmt = stmt.where(StorageLocationModel.name.ilike(f"%{query}%"))
        return stmt

    async def delete(self, location_id: uuid.UUID) -> None:
        model = await self.session.get(StorageLocationModel, location_id)
        if model:
            await self.session.delete(model)
            await self.session.flush()
