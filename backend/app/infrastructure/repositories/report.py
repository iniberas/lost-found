from sqlalchemy.orm import Session, joinedload, selectinload
from typing import Optional, List
from app.infrastructure.database.models.report import ReportModel, CategoryModel
from app.domain.entities.user import User
from app.domain.entities.report import Report, Category, LostReport
from app.domain.interfaces.report import IReportRepository


class SqlAlchemyReportRepository(IReportRepository):
    def __init__(self, db: Session):
        self.db = db

    def save(self, report: Report) -> None:
        db_report = ReportModel(
            id=report.id,
            title=report.title,
            description=report.description,
            date=report.date,
            location=report.location,
            status=report.status,
            photos=report.photos,
            user_id=report.user["id"] # cuz the GetUserUseCase return a dict
        )

        # handle Many-to-Many Categories
        if report.categories:
            category_ids = [c.id for c in report.categories]
            db_categories = self.db.query(CategoryModel).filter(
                CategoryModel.id.in_(category_ids)
            ).all()
            db_report.categories = db_categories

        self.db.add(db_report)
        self.db.commit()
        self.db.refresh(db_report)
    
    def get_categories_by_ids(self, list: List[str]) -> List[Category]:
        db_categories = self.db.query(CategoryModel).filter(
            CategoryModel.id.in_(list)
        ).all()

        domain_categories = [ Category(id=row.id, name=row.name) for row in db_categories ]
        return domain_categories
    
    def get_reports_list(self) -> List[Report]:
        db_reports = self.db.query(ReportModel).options(
            joinedload(ReportModel.user),
            selectinload(ReportModel.categories)
        ).all()

        domain_reports = []
        for row in db_reports:
            user_entity = User(
                id = row.user_id,
                name = row.user.name,
                email = row.user.email,
                phone_number = row.user.phone_number,
                password_hash = row.user.password_hash,
            )

            category_entities = [
                Category(id = cat.id, name = cat.name) for cat in row.categories
            ]

            report = LostReport(
                id = row.id,
                title = row.title,
                description = row.description,
                date = row.date,
                location = row.location,
                status = row.status,
                photos = row.photos,
                categories = category_entities,
                user = user_entity,
            )

            domain_reports.append(report)
        
        return domain_reports