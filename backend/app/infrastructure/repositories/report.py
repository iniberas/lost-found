from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import or_
from typing import Optional, List
from uuid import UUID

from app.infrastructure.database.models.report import (
    LostReportModel,
    FoundReportModel,
    CategoryModel,
    ProofModel
)
from app.domain.entities.user import User
from app.domain.entities.report import (
    LostReport,
    FoundReport,
    Category,
    Proof,
    ReportStatus,
)
from app.domain.interfaces.report import (
    IProofRepository,
    ICategoryRepository,
    ILostReportRepository,
    IFoundReportRepository,
)


class SqlAlchemyCategoryRepository(ICategoryRepository):
    def __init__(self, db: Session):
        self.db = db

    def save(self, category: Category):
        db_category = CategoryModel(
            id=category.id,
            name=category.name
        )
        self.db.merge(db_category)
        self.db.commit()

    def get_categories_by_ids(self, category_ids: List[int]) -> List[Category]:
        db_categories = (
            self.db.query(CategoryModel)
            .filter(CategoryModel.id.in_(category_ids))
            .all()
        )

        return [Category(id=row.id, name=row.name) for row in db_categories]


class SqlAlchemyProofRepository(IProofRepository):
    def __init__(self, db: Session):
        self.db = db

    def save(self, proof: Proof) -> None:
        db_proof = ProofModel(
            id=proof.id,
            created_at=proof.created_at,
            photos=proof.photos,
            notes=proof.notes
        )
        self.db.merge(db_proof)
        self.db.commit()


class SqlAlchemyLostReportRepository(ILostReportRepository):
    def __init__(self, db: Session):
        self.db = db

    def save(self, report: LostReport) -> None:
        db_report = LostReportModel(
            id=report.id,
            title=report.title,
            description=report.description,
            date=report.date,
            location_name=report.location_name,
            latitude=report.latitude,
            longitude=report.longitude,
            report_status=report.report_status,
            photos=report.photos,
            reporter_id=report.reporter.id,
            created_at=report.created_at,
            updated_at=report.updated_at,
            deleted_at=report.deleted_at,
        )

        if report.categories:
            category_ids = [c.id for c in report.categories]
            db_categories = (
                self.db.query(CategoryModel)
                .filter(CategoryModel.id.in_(category_ids))
                .all()
            )
            db_report.categories = db_categories

        self.db.merge(db_report)
        self.db.commit()

    def get_by_id(self, report_id: UUID) -> Optional[LostReport]:
        row = (
            self.db.query(LostReportModel)
            .options(
                joinedload(LostReportModel.reporter),
                selectinload(LostReportModel.categories),
            )
            .filter(LostReportModel.id == report_id)
            .first()
        )

        if not row:
            return None
        return self._to_domain(row)

    def get_by_status(self, status: ReportStatus) -> List[LostReport]:
        db_reports = (
            self.db.query(LostReportModel)
            .options(
                joinedload(LostReportModel.reporter),
                selectinload(LostReportModel.categories),
            )
            .filter(
                LostReportModel.deleted_at.is_(None),
                LostReportModel.report_status == status,
            )
            .all()
        )

        return [self._to_domain(row) for row in db_reports]

    def get_by_user_id(self, user_id: UUID) -> List[LostReport]:
        db_reports = (
            self.db.query(LostReportModel)
            .options(
                joinedload(LostReportModel.reporter),
                selectinload(LostReportModel.categories),
            )
            .filter(
                LostReportModel.deleted_at.is_(None),
                LostReportModel.reporter_id == user_id,
            )
            .all()
        )

        return [self._to_domain(row) for row in db_reports]

    def get_all(self) -> List[LostReport]:
        db_reports = (
            self.db.query(LostReportModel)
            .options(
                joinedload(LostReportModel.reporter),
                selectinload(LostReportModel.categories),
            )
            .filter(LostReportModel.deleted_at.is_(None))
            .all()
        )

        return [self._to_domain(row) for row in db_reports]

    def search(
        self, query: str = "", category_id: Optional[int] = None
    ) -> List[LostReport]:
        db_query = (
            self.db.query(LostReportModel)
            .options(
                joinedload(LostReportModel.reporter),
                selectinload(LostReportModel.categories),
            )
            .filter(LostReportModel.deleted_at.is_(None))
        )

        if query:
            db_query = db_query.filter(
                or_(
                    LostReportModel.title.ilike(f"%{query}%"),
                    LostReportModel.description.ilike(f"%{query}%"),
                )
            )

        if category_id:
            db_query = db_query.filter(
                LostReportModel.categories.any(CategoryModel.id == category_id)
            )

        db_reports = db_query.all()
        return [self._to_domain(row) for row in db_reports]

    def _to_domain(self, row: LostReportModel) -> LostReport:
        user_entity = User(
            id=row.reporter.id,
            created_at=row.reporter.created_at,
            updated_at=row.reporter.updated_at,
            name=row.reporter.name,
            email=row.reporter.email,
            phone_number=row.reporter.phone_number,
            password_hash=row.reporter.password_hash,
        )

        category_entities = [
            Category(id=cat.id, name=cat.name) for cat in row.categories
        ]

        return LostReport(
            id=row.id,
            created_at=row.created_at,
            updated_at=row.updated_at,
            deleted_at=row.deleted_at,
            reporter=user_entity,
            report_status=row.report_status,
            date=row.date,
            title=row.title,
            description=row.description,
            location_name=row.location_name,
            latitude=row.latitude,
            longitude=row.longitude,
            categories=category_entities,
            photos=row.photos,
        )


class SqlAlchemyFoundReportRepository(IFoundReportRepository):
    def __init__(self, db: Session):
        self.db = db

    def save(self, report: FoundReport) -> None:
        db_report = FoundReportModel(
            id=report.id,
            title=report.title,
            description=report.description,
            date=report.date,
            location_name=report.location_name,
            latitude=report.latitude,
            longitude=report.longitude,
            report_status=report.report_status,
            found_status=report.found_status,
            photos=report.photos,
            reporter_id=report.reporter.id,
            holder_id=report.holder.id,
            finder_name=report.finder_name,
            finder_contact=report.finder_contact,
            created_at=report.created_at,
            updated_at=report.updated_at,
            deleted_at=report.deleted_at,
        )

        if report.categories:
            category_ids = [c.id for c in report.categories]
            db_categories = (
                self.db.query(CategoryModel)
                .filter(CategoryModel.id.in_(category_ids))
                .all()
            )
            db_report.categories = db_categories

        self.db.merge(db_report)
        self.db.commit()

    def get_by_id(self, report_id: UUID) -> Optional[FoundReport]:
        row = (
            self.db.query(FoundReportModel)
            .options(
                joinedload(FoundReportModel.reporter),
                joinedload(FoundReportModel.holder),
                selectinload(FoundReportModel.categories),
            )
            .filter(FoundReportModel.id == report_id)
            .first()
        )

        if not row:
            return None
        return self._to_domain(row)

    def get_by_status(self, status: ReportStatus) -> List[FoundReport]:
        db_reports = (
            self.db.query(FoundReportModel)
            .options(
                joinedload(FoundReportModel.reporter),
                joinedload(FoundReportModel.holder),
                selectinload(FoundReportModel.categories),
            )
            .filter(
                FoundReportModel.deleted_at.is_(None),
                FoundReportModel.report_status == status,
            )
            .all()
        )

        return [self._to_domain(row) for row in db_reports]

    def get_by_user_id(self, user_id: UUID) -> List[FoundReport]:
        db_reports = (
            self.db.query(FoundReportModel)
            .options(
                joinedload(FoundReportModel.reporter),
                joinedload(FoundReportModel.holder),
                selectinload(FoundReportModel.categories),
            )
            .filter(
                FoundReportModel.deleted_at.is_(None),
                or_(
                    FoundReportModel.reporter_id == user_id,
                    FoundReportModel.holder_id == user_id,
                ),
            )
            .all()
        )

        return [self._to_domain(row) for row in db_reports]

    def get_all(self) -> List[FoundReport]:
        db_reports = (
            self.db.query(FoundReportModel)
            .options(
                joinedload(FoundReportModel.reporter),
                joinedload(FoundReportModel.holder),
                selectinload(FoundReportModel.categories),
            )
            .filter(FoundReportModel.deleted_at.is_(None))
            .all()
        )

        return [self._to_domain(row) for row in db_reports]

    def search(
        self, query: str = "", category_id: Optional[int] = None
    ) -> List[FoundReport]:
        # NOTE: klo sempet tambahin search berdasarkan tanggal + lokasi

        db_query = (
            self.db.query(FoundReportModel)
            .options(
                joinedload(FoundReportModel.reporter),
                joinedload(FoundReportModel.holder),
                selectinload(FoundReportModel.categories),
            )
            .filter(FoundReportModel.deleted_at.is_(None))
        )

        if query:
            db_query = db_query.filter(
                or_(
                    FoundReportModel.title.ilike(f"%{query}%"),
                    FoundReportModel.description.ilike(f"%{query}%"),
                )
            )

        if category_id:
            db_query = db_query.filter(
                FoundReportModel.categories.any(CategoryModel.id == category_id)
            )

        db_reports = db_query.all()
        return [self._to_domain(row) for row in db_reports]

    def find_matches(self, lost_report: LostReport) -> List[FoundReport]:
        # 1. masih open
        # 2. ditemuin setelah atau saat hari ilang
        # 3. ada kategori yang sama
        # NOTE: mungkin bagusan disort sih trus tambahin lokasi somehow

        db_query = (
            self.db.query(FoundReportModel)
            .options(
                joinedload(FoundReportModel.reporter),
                joinedload(FoundReportModel.holder),
                selectinload(FoundReportModel.categories),
            )
            .filter(
                FoundReportModel.deleted_at.is_(None),
                FoundReportModel.report_status == ReportStatus.OPEN,
                FoundReportModel.date >= lost_report.date,
            )
        )

        if lost_report.categories:
            category_ids = [c.id for c in lost_report.categories]
            db_query = db_query.filter(
                FoundReportModel.categories.any(CategoryModel.id.in_(category_ids))
            )

        db_reports = db_query.all()
        return [self._to_domain(row) for row in db_reports]

    def _to_domain(self, row: FoundReportModel) -> FoundReport:
        reporter_entity = User(
            id=row.reporter.id,
            created_at=row.reporter.created_at,
            updated_at=row.reporter.updated_at,
            name=row.reporter.name,
            email=row.reporter.email,
            phone_number=row.reporter.phone_number,
            password_hash=row.reporter.password_hash,
        )

        holder_entity = User(
            id=row.holder.id,
            created_at=row.holder.created_at,
            updated_at=row.holder.updated_at,
            name=row.holder.name,
            email=row.holder.email,
            phone_number=row.holder.phone_number,
            password_hash=row.holder.password_hash,
        )

        category_entities = [
            Category(id=cat.id, name=cat.name) for cat in row.categories
        ]

        return FoundReport(
            id=row.id,
            created_at=row.created_at,
            updated_at=row.updated_at,
            deleted_at=row.deleted_at,
            reporter=reporter_entity,
            holder=holder_entity,
            report_status=row.report_status,
            found_status=row.found_status,
            date=row.date,
            title=row.title,
            description=row.description,
            location_name=row.location_name,
            latitude=row.latitude,
            longitude=row.longitude,
            categories=category_entities,
            photos=row.photos,
            finder_name=row.finder_name,
            finder_contact=row.finder_contact,
            proof=None,
        )
