import math
import uuid
from datetime import datetime
from typing import List, Optional, Tuple

from app.domain.entities.point import Point
from app.domain.entities.proof import Proof
from app.domain.entities.report import (
    FoundReport,
    FoundStatus,
    LostReport,
    ReportStatus,
)
from app.domain.entities.user import Admin, User
from app.domain.interfaces.category import ICategoryRepository
from app.domain.interfaces.proof import IProofRepository
from app.domain.interfaces.report import IFoundReportRepository, ILostReportRepository
from app.domain.interfaces.storage import IStorageService
from app.domain.interfaces.user import IUserRepository
from app.schemas.pagination import Paginated


class CreateLostReportUseCase:
    def __init__(
        self,
        report_repo: ILostReportRepository,
        category_repo: ICategoryRepository,
        storage_service: IStorageService,
    ):
        self.report_repo = report_repo
        self.category_repo = category_repo
        self.storage_service = storage_service

    async def execute(
        self,
        reporter: User,
        incident_date: datetime,
        title: str,
        description: str,
        location_name: str,
        category_ids: List[uuid.UUID],
        location_point: Optional[Point] = None,
        photo_files: Optional[List[Tuple[bytes, str]]] = None,
    ) -> LostReport:
        categories = await self.category_repo.get_by_ids(category_ids)

        photos = (
            await self.storage_service.save_files(photo_files) if photo_files else []
        )

        report = LostReport.new_lost_report(
            reporter=reporter,
            incident_date=incident_date,
            title=title,
            description=description,
            location_name=location_name,
            categories=categories,
            location_point=location_point,
            photos=photos,
        )
        await self.report_repo.save(report)
        return report


class CreateFoundReportUseCase:
    def __init__(
        self,
        report_repo: IFoundReportRepository,
        category_repo: ICategoryRepository,
        storage_service: IStorageService,
    ):
        self.report_repo = report_repo
        self.category_repo = category_repo
        self.storage_service = storage_service

    async def execute(
        self,
        reporter: User,
        incident_date: datetime,
        title: str,
        description: str,
        location_name: str,
        category_ids: List[uuid.UUID],
        photo_files: List[Tuple[bytes, str]],
        location_point: Optional[Point] = None,
    ) -> FoundReport:
        categories = await self.category_repo.get_by_ids(category_ids)

        photos = await self.storage_service.save_files(photo_files)

        report = FoundReport.new_found_report(
            reporter=reporter,
            incident_date=incident_date,
            title=title,
            description=description,
            location_name=location_name,
            categories=categories,
            photos=photos,
            location_point=location_point,
        )
        await self.report_repo.save(report)
        return report


class CreateHandOverReportUseCase:
    def __init__(
        self,
        report_repo: IFoundReportRepository,
        category_repo: ICategoryRepository,
        storage_service: IStorageService,
    ):
        self.report_repo = report_repo
        self.category_repo = category_repo
        self.storage_service = storage_service

    async def execute(
        self,
        reporter: Admin,
        incident_date: datetime,
        title: str,
        description: str,
        location_name: str,
        category_ids: List[uuid.UUID],
        photo_files: List[Tuple[bytes, str]],
        finder_name: str,
        finder_contact: str,
        location_point: Optional[Point] = None,
    ) -> FoundReport:
        categories = await self.category_repo.get_by_ids(category_ids)

        photos = await self.storage_service.save_files(photo_files)

        report = FoundReport.new_hand_over_report(
            reporter=reporter,
            incident_date=incident_date,
            title=title,
            description=description,
            location_name=location_name,
            categories=categories,
            photos=photos,
            finder_name=finder_name,
            finder_contact=finder_contact,
            location_point=location_point,
        )
        await self.report_repo.save(report)
        return report


class GetLostReportByIdUseCase:
    def __init__(self, repo: ILostReportRepository):
        self.repo = repo

    async def execute(self, report_id: uuid.UUID) -> LostReport:
        report = await self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("Lost report not found")
        return report


class GetFoundReportByIdUseCase:
    def __init__(self, repo: IFoundReportRepository):
        self.repo = repo

    async def execute(self, report_id: uuid.UUID) -> FoundReport:
        report = await self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("Found report not found")
        return report


class SearchLostReportsUseCase:
    def __init__(self, repo: ILostReportRepository):
        self.repo = repo

    async def execute(
        self,
        page: int = 1,
        limit: int = 20,
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
    ) -> Paginated:
        offset = max((page - 1) * limit, 0)
        items = await self.repo.search(
            query,
            user_ids,
            category_ids,
            report_status,
            incident_date_from,
            incident_date_to,
            location_point,
            location_radius,
            sort_by,
            sort_order,
            limit=limit,
            offset=offset,
        )
        total = await self.repo.count_search(
            query,
            user_ids,
            category_ids,
            report_status,
            incident_date_from,
            incident_date_to,
            location_point,
            location_radius,
        )
        return Paginated(
            items=items,
            total_items=total,
            current_page=page,
            total_pages=math.ceil(total / limit) if total > 0 else 1,
            limit=limit,
        )


class SearchFoundReportsUseCase:
    def __init__(self, repo: IFoundReportRepository):
        self.repo = repo

    async def execute(
        self,
        page: int = 1,
        limit: int = 20,
        query: Optional[str] = None,
        user_ids: Optional[List[uuid.UUID]] = None,
        category_ids: Optional[List[uuid.UUID]] = None,
        report_status: Optional[List[ReportStatus]] = None,
        incident_date_from: Optional[datetime] = None,
        incident_date_to: Optional[datetime] = None,
        location_point: Optional[Point] = None,
        location_radius: Optional[float] = None,
        found_status: Optional[FoundStatus] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Paginated:
        offset = max((page - 1) * limit, 0)
        items = await self.repo.search(
            query,
            user_ids,
            category_ids,
            report_status,
            incident_date_from,
            incident_date_to,
            location_point,
            location_radius,
            found_status,
            sort_by,
            sort_order,
            limit=limit,
            offset=offset,
        )
        total = await self.repo.count_search(
            query,
            user_ids,
            category_ids,
            report_status,
            incident_date_from,
            incident_date_to,
            location_point,
            location_radius,
            found_status,
        )
        return Paginated(
            items=items,
            total_items=total,
            current_page=page,
            total_pages=math.ceil(total / limit) if total > 0 else 1,
            limit=limit,
        )


class UpdateLostReportUseCase:
    def __init__(
        self,
        report_repo: ILostReportRepository,
        category_repo: ICategoryRepository,
        storage_service: IStorageService,
    ):
        self.report_repo = report_repo
        self.category_repo = category_repo
        self.storage_service = storage_service

    async def execute(
        self,
        user: User,
        report_id: uuid.UUID,
        title: Optional[str] = None,
        description: Optional[str] = None,
        incident_date: Optional[datetime] = None,
        location_name: Optional[str] = None,
        location_point: Optional[Point] = None,
        category_ids: Optional[List[uuid.UUID]] = None,
        photos_to_add: Optional[List[Tuple[bytes, str]]] = None,
        photos_to_remove: Optional[List[str]] = None,
    ) -> LostReport:
        report = await self.report_repo.get_by_id(report_id)
        if not report:
            raise ValueError("Lost report not found")
        if report.reporter.id != user.id:
            raise PermissionError("You can only edit your own reports")

        if title is not None:
            report.update_title(title)
        if description is not None:
            report.update_description(description)
        if incident_date is not None:
            report.update_incident_date(incident_date)
        if location_name is not None:
            report.update_location_name(location_name)
        if location_point is not None:
            report.update_location_point(location_point)
        if category_ids is not None:
            categories = await self.category_repo.get_by_ids(category_ids)
            report.update_categories(categories)

        final_photos = report.photos
        saved_new_photos: List[str] = []
        try:
            if photos_to_add:
                saved_new_photos = await self.storage_service.save_files(photos_to_add)
                final_photos.extend(saved_new_photos)
            if photos_to_remove:
                final_photos = [p for p in final_photos if p not in photos_to_remove]
            report.update_photos(final_photos)
            await self.report_repo.save(report)
        except Exception as e:
            for photo in saved_new_photos:
                try:
                    await self.storage_service.delete_file(photo)
                except Exception:
                    pass
            raise e

        if photos_to_remove:
            for path in photos_to_remove:
                try:
                    await self.storage_service.delete_file(path)
                except Exception:
                    pass

        return report


class UpdateFoundReportUseCase:
    def __init__(
        self,
        report_repo: IFoundReportRepository,
        category_repo: ICategoryRepository,
        storage_service: IStorageService,
    ):
        self.report_repo = report_repo
        self.category_repo = category_repo
        self.storage_service = storage_service

    async def execute(
        self,
        user: User,
        report_id: uuid.UUID,
        title: Optional[str] = None,
        description: Optional[str] = None,
        incident_date: Optional[datetime] = None,
        location_name: Optional[str] = None,
        location_point: Optional[Point] = None,
        category_ids: Optional[List[uuid.UUID]] = None,
        photos_to_add: Optional[List[Tuple[bytes, str]]] = None,
        photos_to_remove: Optional[List[str]] = None,
        finder_name: Optional[str] = None,
        finder_contact: Optional[str] = None,
    ) -> FoundReport:
        report = await self.report_repo.get_by_id(report_id)
        if not report:
            raise ValueError("Found report not found")
        if report.reporter.id != user.id:
            raise PermissionError("You can only edit your own reports")

        if title is not None:
            report.update_title(title)
        if description is not None:
            report.update_description(description)
        if incident_date is not None:
            report.update_incident_date(incident_date)
        if location_name is not None:
            report.update_location_name(location_name)
        if location_point is not None:
            report.update_location_point(location_point)
        if category_ids is not None:
            categories = await self.category_repo.get_by_ids(category_ids)
            report.update_categories(categories)
        if finder_name is not None:
            report.update_finder_name(finder_name)
        if finder_contact is not None:
            report.update_finder_contact(finder_contact)

        final_photos = report.photos
        saved_new_photos: List[str] = []
        try:
            if photos_to_add:
                saved_new_photos = await self.storage_service.save_files(photos_to_add)
                final_photos.extend(saved_new_photos)
            if photos_to_remove:
                final_photos = [p for p in final_photos if p not in photos_to_remove]
            report.update_photos(final_photos)
            await self.report_repo.save(report)
        except Exception as e:
            for photo in saved_new_photos:
                try:
                    await self.storage_service.delete_file(photo)
                except Exception:
                    pass
            raise e

        if photos_to_remove:
            for path in photos_to_remove:
                try:
                    await self.storage_service.delete_file(path)
                except Exception:
                    pass

        return report


class ResolveLostReportUseCase:
    def __init__(self, report_repo: ILostReportRepository):
        self.report_repo = report_repo

    async def execute(self, report_id: uuid.UUID, user: User) -> LostReport:
        report = await self.report_repo.get_by_id(report_id)
        if not report:
            raise ValueError("Lost report not found")
        if report.reporter.id != user.id:
            raise PermissionError("You can only resolve your own reports")
        report.confirm_found()
        await self.report_repo.save(report)
        return report


class ResolveFoundReportUseCase:
    def __init__(
        self,
        report_repo: IFoundReportRepository,
        proof_repo: IProofRepository,
        storage_service: IStorageService,
    ):
        self.report_repo = report_repo
        self.proof_repo = proof_repo
        self.storage_service = storage_service

    async def execute(
        self,
        report_id: uuid.UUID,
        user: User,
        photo_files: List[Tuple[bytes, str]],
        notes: str,
    ) -> FoundReport:
        report = await self.report_repo.get_by_id(report_id)
        if not report:
            raise ValueError("Found report not found")
        if report.reporter.id != user.id:
            raise PermissionError("You can only resolve your own reports")

        photos: List[str] = []
        try:
            photos = await self.storage_service.save_files(photo_files)
            proof = Proof.new_proof(photos=photos, notes=notes)
            report.confirm_return(proof)
            await self.proof_repo.save(proof)
            await self.report_repo.save(report)
        except Exception as e:
            for photo in photos:
                try:
                    await self.storage_service.delete_file(photo)
                except Exception:
                    pass
            raise e

        return report


class HandOverToAdminUseCase:
    def __init__(self, report_repo: IFoundReportRepository, user_repo: IUserRepository):
        self.report_repo = report_repo
        self.user_repo = user_repo

    async def execute(
        self, report_id: uuid.UUID, user: User, admin_id: uuid.UUID
    ) -> FoundReport:
        report = await self.report_repo.get_by_id(report_id)
        if not report:
            raise ValueError("Found report not found")
        if report.reporter.id != user.id:
            raise PermissionError("You can only hand over your own reports")

        admin = await self.user_repo.get_by_id(admin_id)
        if not admin or not isinstance(admin, Admin):
            raise ValueError("Target user is not an Admin or not found")

        report.hand_over_to_admin(admin)
        await self.report_repo.save(report)
        return report


class DeleteLostReportUseCase:
    def __init__(self, repo: ILostReportRepository):
        self.repo = repo

    async def execute(self, report_id: uuid.UUID, user: User) -> None:
        report = await self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("Lost report not found")
        if report.reporter.id != user.id:
            raise PermissionError("You can only delete your own reports")
        report.delete()
        await self.repo.save(report)


class DeleteFoundReportUseCase:
    def __init__(self, repo: IFoundReportRepository):
        self.repo = repo

    async def execute(self, report_id: uuid.UUID, user: User) -> None:
        report = await self.repo.get_by_id(report_id)
        if not report:
            raise ValueError("Found report not found")
        if report.reporter.id != user.id:
            raise PermissionError("You can only delete your own reports")
        report.delete()
        await self.repo.save(report)


class FindPotentialFoundReportsUseCase:
    def __init__(
        self, lost_repo: ILostReportRepository, found_repo: IFoundReportRepository
    ):
        self.lost_repo = lost_repo
        self.found_repo = found_repo

    async def execute(self, lost_report_id: uuid.UUID) -> List[FoundReport]:
        report = await self.lost_repo.get_by_id(lost_report_id)
        if not report:
            raise ValueError("Lost report not found")
        return await self.found_repo.find_potential_matches(report)


class FindPotentialLostReportsUseCase:
    def __init__(
        self, lost_repo: ILostReportRepository, found_repo: IFoundReportRepository
    ):
        self.lost_repo = lost_repo
        self.found_repo = found_repo

    async def execute(self, found_report_id: uuid.UUID) -> List[LostReport]:
        report = await self.found_repo.get_by_id(found_report_id)
        if not report:
            raise ValueError("Found report not found")
        return await self.lost_repo.find_potential_matches(report)
