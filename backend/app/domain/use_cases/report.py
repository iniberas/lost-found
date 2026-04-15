from app.domain.interfaces.report import IReportRepository
import uuid
from datetime import datetime
from typing import List
from app.domain.entities.report import LostReport, FoundReport, HandoverReport, Status, Category
from app.domain.entities.user import User

class ReportUseCase:
    def __init__(self, repo: IReportRepository):
        self.repo = repo

    def execute(self, title: str, description: str, date: datetime, location: str, status: Status,
                categories: List[Category], photos: List[str], user: User):
        category_objects = self.repo.get_categories_by_ids(categories)

        item = LostReport(
            id=str(uuid.uuid4()),
            title=title,
            description=description,
            date=date,
            location=location,
            status=status,
            categories=category_objects,
            photos=photos,
            user=user)
        self.repo.save(item)
        return item


class ListReportUseCase:
    def __init__(self, repo: IReportRepository):
        self.repo = repo

    def execute(self) -> List[LostReport]:
        return self.repo.get_reports_list()
