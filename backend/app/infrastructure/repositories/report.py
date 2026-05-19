import uuid
from datetime import datetime
from typing import List, Optional

from app.domain.entities.category import Category
from app.domain.entities.point import Point
from app.domain.entities.proof import Proof
from app.domain.entities.report import (
    FoundReport,
    FoundStatus,
    LostReport,
    ReportStatus,
)
from app.domain.entities.storage_location import StorageLocation
from app.domain.entities.user import Admin, SuperAdmin, User
from app.domain.interfaces.report import IFoundReportRepository, ILostReportRepository
from app.infrastructure.database.models.category import CategoryModel
from app.infrastructure.database.models.report import (
    FoundReportModel,
    LostReportModel,
)
from app.infrastructure.database.models.storage_location import (
    StorageLocationModel,
)
from app.infrastructure.database.models.user import UserRole
from geoalchemy2.elements import WKTElement
from geoalchemy2.functions import ST_Distance
from geoalchemy2.shape import to_shape
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

MATCH_RADIUS_METERS = 10000


def _user_from_model(m) -> User:
    if m.role == UserRole.SUPERADMIN:
        cls = SuperAdmin
    elif m.role == UserRole.ADMIN:
        cls = Admin
    else:
        cls = User

    return cls(
        id=m.id,
        created_at=m.created_at,
        updated_at=m.updated_at,
        deleted_at=m.deleted_at,
        name=m.name,
        email=m.email,
        phone_number=m.phone_number,
        password_hash=m.password_hash,
    )


def _categories_from_models(models) -> List[Category]:
    return [Category(id=c.id, name=c.name, is_active=c.is_active) for c in models]


def _point_from_model(m) -> Optional[Point]:
    if m.location_point is not None:
        shapely_pt = to_shape(m.location_point)
        return Point(latitude=shapely_pt.y, longitude=shapely_pt.x)
    return None


def _point_to_geography(point: Optional[Point]) -> Optional[WKTElement]:
    if point:
        wkt = f"POINT({point.longitude} {point.latitude})"
        return WKTElement(wkt, srid=4326)
    return None


def _storage_location_from_model(
    m: Optional[StorageLocationModel],
) -> Optional[StorageLocation]:
    if not m:
        return None

    return StorageLocation(
        id=m.id,
        created_at=m.created_at,
        updated_at=m.updated_at,
        name=m.name,
        description=m.description,
        location_point=_point_from_model(m),
        is_active=m.is_active,
    )


class LostReportRepository(ILostReportRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, m: LostReportModel) -> LostReport:
        return LostReport(
            id=m.id,
            created_at=m.created_at,
            updated_at=m.updated_at,
            reporter=_user_from_model(m.reporter),
            report_status=ReportStatus(m.report_status),
            incident_date=m.incident_date,
            title=m.title,
            description=m.description,
            location_name=m.location_name,
            categories=_categories_from_models(m.categories),
            deleted_at=m.deleted_at,
            location_point=_point_from_model(m),
            photos=list(m.photos or []),
        )

    async def _sync_categories(self, model, categories: List[Category]):
        ids = [c.id for c in categories]
        if ids:
            result = await self.session.execute(
                select(CategoryModel).where(CategoryModel.id.in_(ids))
            )
            model.categories = list(result.scalars().all())
        else:
            model.categories = []

    async def save(self, report: LostReport) -> None:
        existing = await self.session.get(
            LostReportModel,
            report.id,
            options=[selectinload(LostReportModel.categories)],
        )
        location_geom = _point_to_geography(report.location_point)

        if existing:
            existing.updated_at = report.updated_at
            existing.deleted_at = report.deleted_at
            existing.title = report.title
            existing.description = report.description
            existing.location_name = report.location_name
            existing.incident_date = report.incident_date
            existing.photos = report.photos
            existing.report_status = report.report_status.value
            existing.location_point = location_geom
            await self._sync_categories(existing, report.categories)
        else:
            model = LostReportModel(
                id=report.id,
                created_at=report.created_at,
                updated_at=report.updated_at,
                deleted_at=report.deleted_at,
                reporter_id=report.reporter.id,
                title=report.title,
                description=report.description,
                location_name=report.location_name,
                incident_date=report.incident_date,
                photos=report.photos,
                report_status=report.report_status.value,
                location_point=location_geom,
            )
            await self._sync_categories(model, report.categories)
            self.session.add(model)
            await self.session.flush()

    async def get_by_id(self, report_id: uuid.UUID) -> Optional[LostReport]:
        stmt = (
            select(LostReportModel)
            .options(
                selectinload(LostReportModel.reporter),
                selectinload(LostReportModel.categories),
            )
            .where(LostReportModel.id == report_id)
        )
        result = await self.session.execute(stmt)
        m = result.scalar_one_or_none()
        return self._to_entity(m) if m else None

    async def search(
        self,
        query: Optional[str] = None,
        user_ids: Optional[List[uuid.UUID]] = None,
        category_ids: Optional[List[uuid.UUID]] = None,
        report_status: Optional[List[ReportStatus]] = None,
        incident_date_from: Optional[datetime] = None,
        incident_date_to: Optional[datetime] = None,
        location_point: Optional[Point] = None,
        location_radius: Optional[float] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        limit: int = 20,
        offset: int = 0,
    ) -> List[LostReport]:
        stmt = select(LostReportModel).options(
            selectinload(LostReportModel.reporter),
            selectinload(LostReportModel.categories),
        )
        stmt = self._apply_filters(
            stmt,
            query,
            user_ids,
            category_ids,
            report_status,
            incident_date_from,
            incident_date_to,
            location_point,
            location_radius,
        )
        stmt = stmt.distinct()
        stmt = self._apply_sort(stmt, sort_by, sort_order, location_point)
        stmt = stmt.limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def count_search(
        self,
        query: Optional[str] = None,
        user_ids: Optional[List[uuid.UUID]] = None,
        category_ids: Optional[List[uuid.UUID]] = None,
        report_status: Optional[List[ReportStatus]] = None,
        incident_date_from: Optional[datetime] = None,
        incident_date_to: Optional[datetime] = None,
        location_point: Optional[Point] = None,
        location_radius: Optional[float] = None,
    ) -> int:
        stmt = select(func.count()).select_from(LostReportModel)
        stmt = self._apply_filters(
            stmt,
            query,
            user_ids,
            category_ids,
            report_status,
            incident_date_from,
            incident_date_to,
            location_point,
            location_radius,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def find_potential_matches(
        self, found_report: FoundReport, limit: int = 20, offset: int = 0
    ) -> List[LostReport]:
        stmt = (
            select(LostReportModel)
            .distinct()
            .options(
                selectinload(LostReportModel.reporter),
                selectinload(LostReportModel.categories),
            )
            .where(
                LostReportModel.report_status == ReportStatus.OPEN.value,
                LostReportModel.deleted_at.is_(None),
            )
        )
        category_ids = [c.id for c in found_report.categories]
        if category_ids:
            from app.infrastructure.database.models.report import report_categories

            stmt = stmt.join(
                report_categories,
                report_categories.c.report_id == LostReportModel.id,
            ).where(report_categories.c.category_id.in_(category_ids))

        if found_report.location_point:
            target_geom = _point_to_geography(found_report.location_point)
            stmt = stmt.where(
                ST_Distance(LostReportModel.location_point, target_geom)
                <= MATCH_RADIUS_METERS
            )
        stmt = (
            stmt.order_by(LostReportModel.created_at.desc()).limit(limit).offset(offset)
        )
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    def _apply_filters(
        self,
        stmt,
        query,
        user_ids,
        category_ids,
        report_status,
        incident_date_from,
        incident_date_to,
        location_point,
        location_radius,
    ):
        if query:
            like = f"%{query}%"
            stmt = stmt.where(
                or_(
                    LostReportModel.title.ilike(like),
                    LostReportModel.description.ilike(like),
                )
            )
        if user_ids:
            stmt = stmt.where(LostReportModel.reporter_id.in_(user_ids))
        if category_ids:
            from app.infrastructure.database.models.report import report_categories

            stmt = stmt.join(
                report_categories,
                report_categories.c.report_id == LostReportModel.id,
            ).where(report_categories.c.category_id.in_(category_ids))
        if report_status:
            stmt = stmt.where(
                LostReportModel.report_status.in_([s.value for s in report_status])
            )
        if incident_date_from:
            stmt = stmt.where(LostReportModel.incident_date >= incident_date_from)
        if incident_date_to:
            stmt = stmt.where(LostReportModel.incident_date <= incident_date_to)
        if location_point and location_radius:
            target_geom = _point_to_geography(location_point)
            stmt = stmt.where(
                ST_Distance(LostReportModel.location_point, target_geom)
                <= (location_radius * 1000) # kata om chatgpt defaultnya meter, jadi dikali 1000 (soalnya inputnya km)
            )
        return stmt

    def _apply_sort(self, stmt, sort_by, sort_order, location_point=None):
        if sort_by == "distance" and location_point:
            target_geom = _point_to_geography(location_point)
            dist_expr = ST_Distance(LostReportModel.location_point, target_geom)
            return stmt.order_by(
                dist_expr.asc() if sort_order == "asc" else dist_expr.desc()
            )
        col = {
            "created_at": LostReportModel.created_at,
            "title": LostReportModel.title,
        }.get(sort_by, LostReportModel.created_at)
        return stmt.order_by(col.asc() if sort_order == "asc" else col.desc())


class FoundReportRepository(IFoundReportRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, m: FoundReportModel) -> FoundReport:
        proof = None
        if m.proof:
            proof = Proof(
                id=m.proof.id,
                created_at=m.proof.created_at,
                photos=list(m.proof.photos or []),
                notes=m.proof.notes,
            )

        storage_location = _storage_location_from_model(m.storage_location)

        return FoundReport(
            id=m.id,
            created_at=m.created_at,
            updated_at=m.updated_at,
            reporter=_user_from_model(m.reporter),
            report_status=ReportStatus(m.report_status),
            found_status=FoundStatus(m.found_status),
            incident_date=m.incident_date,
            title=m.title,
            description=m.description,
            location_name=m.location_name,
            categories=_categories_from_models(m.categories),
            photos=list(m.photos or []),
            holder=_user_from_model(m.holder),
            deleted_at=m.deleted_at,
            handed_over_at=m.handed_over_at,
            location_point=_point_from_model(m),
            proof=proof,
            finder_name=m.finder_name,
            finder_contact=m.finder_contact,
            storage_location=storage_location,
        )

    async def _sync_categories(self, model, categories: List[Category]):
        ids = [c.id for c in categories]
        if ids:
            result = await self.session.execute(
                select(CategoryModel).where(CategoryModel.id.in_(ids))
            )
            model.categories = list(result.scalars().all())
        else:
            model.categories = []

    async def save(self, report: FoundReport) -> None:
        existing = await self.session.get(
            FoundReportModel,
            report.id,
            options=[selectinload(FoundReportModel.categories)],
        )
        location_geom = _point_to_geography(report.location_point)
        storage_loc_id = report.storage_location.id if report.storage_location else None

        if existing:
            existing.updated_at = report.updated_at
            existing.deleted_at = report.deleted_at
            existing.holder_id = report.holder.id
            existing.storage_location_id = storage_loc_id
            existing.title = report.title
            existing.description = report.description
            existing.location_name = report.location_name
            existing.incident_date = report.incident_date
            existing.photos = report.photos
            existing.report_status = report.report_status.value
            existing.found_status = report.found_status.value
            existing.handed_over_at = report.handed_over_at
            existing.location_point = location_geom
            existing.proof_id = report.proof.id if report.proof else None
            existing.finder_name = report.finder_name
            existing.finder_contact = report.finder_contact
            await self._sync_categories(existing, report.categories)
        else:
            model = FoundReportModel(
                id=report.id,
                created_at=report.created_at,
                updated_at=report.updated_at,
                deleted_at=report.deleted_at,
                reporter_id=report.reporter.id,
                holder_id=report.holder.id,
                storage_location_id=storage_loc_id,
                title=report.title,
                description=report.description,
                location_name=report.location_name,
                incident_date=report.incident_date,
                photos=report.photos,
                report_status=report.report_status.value,
                found_status=report.found_status.value,
                handed_over_at=report.handed_over_at,
                location_point=location_geom,
                proof_id=report.proof.id if report.proof else None,
                finder_name=report.finder_name,
                finder_contact=report.finder_contact,
            )
            await self._sync_categories(model, report.categories)
            self.session.add(model)
            await self.session.flush()

    async def get_by_id(self, report_id: uuid.UUID) -> Optional[FoundReport]:
        stmt = (
            select(FoundReportModel)
            .options(
                selectinload(FoundReportModel.reporter),
                selectinload(FoundReportModel.holder),
                selectinload(FoundReportModel.categories),
                selectinload(FoundReportModel.proof),
                selectinload(FoundReportModel.storage_location),
            )
            .where(FoundReportModel.id == report_id)
        )
        result = await self.session.execute(stmt)
        m = result.scalar_one_or_none()
        return self._to_entity(m) if m else None

    async def search(
        self,
        query: Optional[str] = None,
        user_ids: Optional[List[uuid.UUID]] = None,
        category_ids: Optional[List[uuid.UUID]] = None,
        report_status: Optional[List[ReportStatus]] = None,
        incident_date_from: Optional[datetime] = None,
        incident_date_to: Optional[datetime] = None,
        location_point: Optional[Point] = None,
        location_radius: Optional[float] = None,
        found_status: Optional[FoundStatus] = None,
        storage_location_id: Optional[uuid.UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        limit: int = 20,
        offset: int = 0,
    ) -> List[FoundReport]:
        stmt = select(FoundReportModel).options(
            selectinload(FoundReportModel.reporter),
            selectinload(FoundReportModel.holder),
            selectinload(FoundReportModel.categories),
            selectinload(FoundReportModel.proof),
            selectinload(FoundReportModel.storage_location),
        )
        stmt = self._apply_filters(
            stmt,
            query,
            user_ids,
            category_ids,
            report_status,
            incident_date_from,
            incident_date_to,
            location_point,
            location_radius,
            found_status,
            storage_location_id,
        )
        stmt = stmt.distinct()
        stmt = self._apply_sort(stmt, sort_by, sort_order, location_point)
        stmt = stmt.limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def count_search(
        self,
        query: Optional[str] = None,
        user_ids: Optional[List[uuid.UUID]] = None,
        category_ids: Optional[List[uuid.UUID]] = None,
        report_status: Optional[List[ReportStatus]] = None,
        incident_date_from: Optional[datetime] = None,
        incident_date_to: Optional[datetime] = None,
        location_point: Optional[Point] = None,
        location_radius: Optional[float] = None,
        found_status: Optional[FoundStatus] = None,
        storage_location_id: Optional[uuid.UUID] = None,
    ) -> int:
        stmt = select(func.count()).select_from(FoundReportModel)
        stmt = self._apply_filters(
            stmt,
            query,
            user_ids,
            category_ids,
            report_status,
            incident_date_from,
            incident_date_to,
            location_point,
            location_radius,
            found_status,
            storage_location_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def find_potential_matches(
        self, lost_report: LostReport, limit: int = 20, offset: int = 0
    ) -> List[FoundReport]:
        stmt = (
            select(FoundReportModel)
            .distinct()
            .options(
                selectinload(FoundReportModel.reporter),
                selectinload(FoundReportModel.holder),
                selectinload(FoundReportModel.categories),
                selectinload(FoundReportModel.proof),
                selectinload(FoundReportModel.storage_location),
            )
            .where(
                FoundReportModel.report_status == ReportStatus.OPEN.value,
                FoundReportModel.found_status.in_(
                    [FoundStatus.HELD_BY_FINDER.value, FoundStatus.HELD_BY_ADMIN.value]
                ),
                FoundReportModel.deleted_at.is_(None),
            )
        )
        category_ids = [c.id for c in lost_report.categories]
        if category_ids:
            from app.infrastructure.database.models.report import report_categories

            stmt = stmt.join(
                report_categories,
                report_categories.c.report_id == FoundReportModel.id,
            ).where(report_categories.c.category_id.in_(category_ids))

        if lost_report.location_point:
            target_geom = _point_to_geography(lost_report.location_point)
            stmt = stmt.where(
                ST_Distance(FoundReportModel.location_point, target_geom)
                <= MATCH_RADIUS_METERS
            )
        stmt = (
            stmt.order_by(FoundReportModel.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    def _apply_filters(
        self,
        stmt,
        query,
        user_ids,
        category_ids,
        report_status,
        incident_date_from,
        incident_date_to,
        location_point,
        location_radius,
        found_status,
        storage_location_id,
    ):
        if query:
            like = f"%{query}%"
            stmt = stmt.where(
                or_(
                    FoundReportModel.title.ilike(like),
                    FoundReportModel.description.ilike(like),
                )
            )
        if user_ids:
            stmt = stmt.where(FoundReportModel.reporter_id.in_(user_ids))
        if category_ids:
            from app.infrastructure.database.models.report import report_categories

            stmt = stmt.join(
                report_categories,
                report_categories.c.report_id == FoundReportModel.id,
            ).where(report_categories.c.category_id.in_(category_ids))
        if report_status:
            stmt = stmt.where(
                FoundReportModel.report_status.in_([s.value for s in report_status])
            )
        if found_status:
            stmt = stmt.where(FoundReportModel.found_status == found_status.value)
        if storage_location_id:
            stmt = stmt.where(
                FoundReportModel.storage_location_id == storage_location_id
            )

        if incident_date_from:
            stmt = stmt.where(FoundReportModel.incident_date >= incident_date_from)
        if incident_date_to:
            stmt = stmt.where(FoundReportModel.incident_date <= incident_date_to)
        if location_point and location_radius:
            target_geom = _point_to_geography(location_point)
            stmt = stmt.where(
                ST_Distance(FoundReportModel.location_point, target_geom)
                <= location_radius
            )
        return stmt

    def _apply_sort(self, stmt, sort_by, sort_order, location_point=None):
        if sort_by == "distance" and location_point:
            target_geom = _point_to_geography(location_point)
            dist_expr = ST_Distance(FoundReportModel.location_point, target_geom)
            return stmt.order_by(
                dist_expr.asc() if sort_order == "asc" else dist_expr.desc()
            )
        col = {
            "created_at": FoundReportModel.created_at,
            "title": FoundReportModel.title,
        }.get(sort_by, FoundReportModel.created_at)
        return stmt.order_by(col.asc() if sort_order == "asc" else col.desc())
