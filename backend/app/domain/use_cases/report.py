from app.domain.interfaces.report import (
    IProofRepository,
    ICategoryRepository,
    ILostReportRepository,
    IFoundReportRepository,
)
import uuid
from datetime import datetime
from typing import List, Optional
from app.domain.entities.report import (
    LostReport,
    FoundReport,
    Proof,
    Category,
    ReportStatus,
    FoundStatus,
)
from app.domain.entities.user import User, Admin


class CreateLostReportUseCase:
    def __init__(
        self, report_repo: ILostReportRepository, category_repo: ICategoryRepository
    ):
        self.report_repo = report_repo
        self.category_repo = category_repo

    def execute(
        self,
        reporter: User,
        date: datetime,
        title: str,
        description: str,
        location_name: str,
        category_ids: List[int],
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        photos: Optional[List[str]] = None,
    ):
        categories = self.category_repo.get_categories_by_ids(category_ids)

        item = LostReport(
            id=uuid.uuid4(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            reporter=reporter,
            report_status=ReportStatus.OPEN,
            date=date,
            title=title,
            description=description,
            location_name=location_name,
            categories=categories,
            latitude=latitude,
            longitude=longitude,
            photos=photos,
        )
        self.report_repo.save(item)
        return item


class CreateFoundReportUseCase:
    def __init__(
        self, report_repo: IFoundReportRepository, category_repo: ICategoryRepository
    ):
        self.report_repo = report_repo
        self.category_repo = category_repo

    def execute(
        self,
        reporter: User,
        date: datetime,
        title: str,
        description: str,
        location_name: str,
        category_ids: List[int],
        photos: List[str],
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ):
        categories = self.category_repo.get_categories_by_ids(category_ids)

        item = FoundReport(
            id=uuid.uuid4(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            reporter=reporter,
            report_status=ReportStatus.OPEN,
            found_status=FoundStatus.HELD_BY_FINDER,
            date=date,
            title=title,
            description=description,
            location_name=location_name,
            categories=categories,
            photos=photos,
            holder=reporter,
            latitude=latitude,
            longitude=longitude,
        )
        self.report_repo.save(item)
        return item


class CreateHandoverReportUseCase:
    def __init__(
        self, report_repo: IFoundReportRepository, category_repo: ICategoryRepository
    ):
        self.report_repo = report_repo
        self.category_repo = category_repo

    def execute(
        self,
        reporter: Admin,
        date: datetime,
        title: str,
        description: str,
        location_name: str,
        category_ids: List[int],
        photos: List[str],
        finder_name: str,
        finder_contact: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ):
        categories = self.category_repo.get_categories_by_ids(category_ids)

        item = FoundReport(
            id=uuid.uuid4(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            reporter=reporter,
            report_status=ReportStatus.OPEN,
            found_status=FoundStatus.HELD_BY_ADMIN,
            date=date,
            title=title,
            description=description,
            location_name=location_name,
            categories=categories,
            photos=photos,
            holder=reporter,
            latitude=latitude,
            longitude=longitude,
            finder_name=finder_name,
            finder_contact=finder_contact,
        )
        self.report_repo.save(item)
        return item


class ListAllLostReportUseCase:
    def __init__(self, repo: ILostReportRepository):
        self.repo = repo

    def execute(self) -> List[LostReport]:
        return self.repo.get_all()


class ListAllFoundReportUseCase:
    def __init__(self, repo: IFoundReportRepository):
        self.repo = repo

    def execute(self) -> List[FoundReport]:
        return self.repo.get_all()


class ListOpenLostReportUseCase:
    def __init__(self, repo: ILostReportRepository):
        self.repo = repo

    def execute(self) -> List[LostReport]:
        return self.repo.get_by_status()


class ListOpenFoundReportUseCase:
    def __init__(self, repo: IFoundReportRepository):
        self.repo = repo

    def execute(self) -> List[FoundReport]:
        return self.repo.get_by_status()


class GetLostReportByIdUseCase:
    def __init__(self, repo: ILostReportRepository):
        self.repo = repo

    def execute(self, report_id: uuid.UUID) -> Optional[LostReport]:
        report = self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("Lost report not found")
        return report


class GetFoundReportByIdUseCase:
    def __init__(self, repo: IFoundReportRepository):
        self.repo = repo

    def execute(self, report_id: uuid.UUID) -> Optional[LostReport]:
        report = self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("Found report not found")
        return report


class SearchLostReportsUseCase:
    def __init__(self, repo: ILostReportRepository):
        self.repo = repo

    def execute(
        self, query: str = "", category_id: Optional[int] = None
    ) -> List[LostReport]:
        return self.repo.search(query=query, category_id=category_id)


class SearchFoundReportsUseCase:
    def __init__(self, repo: IFoundReportRepository):
        self.repo = repo

    def execute(
        self, query: str = "", category_id: Optional[int] = None
    ) -> List[FoundReport]:
        return self.repo.search(query=query, category_id=category_id)


class GetReportsByUserUseCase:
    def __init__(
        self, lost_repo: ILostReportRepository, found_repo: IFoundReportRepository
    ):
        self.lost_repo = lost_repo
        self.found_repo = found_repo

    def execute(self, user_id: uuid.UUID) -> dict:
        lost_reports = self.lost_repo.get_by_user_id(user_id)
        found_reports = self.found_repo.get_by_user_id(user_id)
        return {"lost": lost_reports, "found": found_reports}


# ini updatenya masih kuranggggggggggggg
class UpdateLostReportUseCase:
    def __init__(self, repo: ILostReportRepository):
        self.repo = repo

    def execute(
        self,
        report_id: uuid.UUID,
        title: Optional[str] = None,
        description: Optional[str] = None,
    ) -> LostReport:
        report = self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("Lost report not found")

        if title:
            report.update_title(title)
        if description:
            report.update_description(description)
        
        self.repo.save(report)
        return report


# ini updatenya masih kuranggggggggggggg
class UpdateFoundReportUseCase:
    def __init__(self, repo: IFoundReportRepository):
        self.repo = repo

    def execute(
        self,
        report_id: uuid.UUID,
        title: Optional[str] = None,
        description: Optional[str] = None,
    ) -> FoundReport:
        report = self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("Found report not found")

        if title:
            report.update_title(title)
        if description:
            report.update_description(description)

        self.repo.save(report)
        return report


class ResolveLostReportUseCase:
    def __init__(
        self, report_repo: ILostReportRepository, proof_repo: IProofRepository
    ):
        self.report_repo = report_repo
        self.proof_repo = proof_repo

    def execute(self, report_id: uuid.UUID) -> LostReport:
        report = self.report_repo.get_by_id(report_id)

        if not report:
            raise ValueError("Lost report not found")

        report.confirm_found()

        self.report_repo.save(report)
        return report


class ResolveFoundReportUseCase:
    def __init__(
        self, report_repo: IFoundReportRepository, proof_repo: IProofRepository
    ):
        self.report_repo = report_repo
        self.proof_repo = proof_repo

    def execute(
        self, report_id: uuid.UUID, photos: List[str], notes: str
    ) -> FoundReport:
        report = self.report_repo.get_by_id(report_id)

        if not report:
            raise ValueError("Found report not found")

        proof = Proof(
            id=uuid.uuid4(), created_at=datetime.now(), photos=photos, notes=notes
        )

        report.confirm_return(proof)

        self.proof_repo.save(proof)
        self.report_repo.save(report)
        return report


class TransferFoundItemToAdminUseCase:
    def __init__(self, report_repo: IFoundReportRepository):
        self.report_repo = report_repo

    def execute(self, report_id: uuid.UUID, admin: Admin) -> FoundReport:
        report = self.report_repo.get_by_id(report_id)

        if not report:
            raise ValueError("Found report not found")

        report.transfer_to_admin(admin)

        self.report_repo.save(report)
        return report


class DeleteLostReportUseCase:
    def __init__(self, repo: ILostReportRepository):
        self.repo = repo

    def execute(self, report_id: uuid.UUID) -> None:
        report = self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("Lost report not found")

        report.delete()

        self.repo.save(report)


class DeleteFoundReportUseCase:
    def __init__(self, repo: IFoundReportRepository):
        self.repo = repo

    def execute(self, report_id: uuid.UUID) -> None:
        report = self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("Found report not found")
        
        report.delete()

        self.repo.save(report)


class FindPotentialMatchesUseCase:
    def __init__(
        self, lost_repo: ILostReportRepository, found_repo: IFoundReportRepository
    ):
        self.lost_repo = lost_repo
        self.found_repo = found_repo

    def execute(self, lost_report_id: uuid.UUID) -> List[FoundReport]:
        lost_report = self.lost_repo.get_by_id(lost_report_id)
        if not lost_report:
            raise ValueError("Lost report not found")

        return self.found_repo.find_matches(lost_report)
