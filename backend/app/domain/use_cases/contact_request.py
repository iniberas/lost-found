import math
import uuid
from typing import Optional

from app.domain.entities.audit_log import ActionType, AuditLog, EntityType
from app.domain.entities.contact_request import ContactRequest, RequestStatus
from app.domain.entities.user import User
from app.domain.entities.report import ReportType
from app.domain.interfaces.audit_log import IAuditLogRepository
from app.domain.interfaces.contact_request import IContactRequestRepository
from app.domain.interfaces.user import IUserRepository
from app.schemas.pagination import Paginated
from app.domain.interfaces.report import IFoundReportRepository, ILostReportRepository


class CreateContactRequestUseCase:
    def __init__(
        self,
        request_repo: IContactRequestRepository,
        user_repo: IUserRepository,
        audit_log_repo: IAuditLogRepository,
        lost_report_repo: ILostReportRepository,
        found_report_repo: IFoundReportRepository,
    ):
        self.request_repo = request_repo
        self.user_repo = user_repo
        self.audit_log_repo = audit_log_repo
        self.lost_report_repo = lost_report_repo
        self.found_report_repo = found_report_repo

    async def execute(
    self,
    requester: User,
    report_id: uuid.UUID,
    report_type: ReportType,
    message: Optional[str] = None,
) -> ContactRequest:
        if report_type == ReportType.LOST:
            report = await self.lost_report_repo.get_by_id(report_id)

        elif report_type == ReportType.FOUND:
            report = await self.found_report_repo.get_by_id(report_id)

        else:
            raise ValueError("Invalid report type")

        if not report:
            raise ValueError("Report not found")

        if report.reporter.id == requester.id:
            raise ValueError("Cannot contact your own report")

        target_user = report.reporter

        existing_requests = await self.request_repo.search(
            requester_id=requester.id,
            target_user_id=target_user.id,
            report_id=report_id,
            status=RequestStatus.PENDING,
        )

        if existing_requests:
            raise ValueError(
                "You already have a pending contact request for this report"
            )

        request = ContactRequest.new_request(
            requester=requester,
            target_user=target_user,
            report_id=report_id,
            report_type=report_type,
            message=message,
        )

        await self.request_repo.save(request)

        log = AuditLog.new_log(
            actor_id=requester.id,
            entity_type=EntityType.CONTACT_REQUEST,
            entity_id=request.id,
            action=ActionType.CREATE,
            changes={
                "target_user_id": str(target_user.id),
                "report_id": str(report_id),
                "report_type": report_type.value,
            },
        )

        await self.audit_log_repo.save(log)

        return request


class ApproveContactRequestUseCase:
    def __init__(
        self, repo: IContactRequestRepository, audit_log_repo: IAuditLogRepository
    ):
        self.repo = repo
        self.audit_log_repo = audit_log_repo

    async def execute(self, actor: User, request_id: uuid.UUID) -> ContactRequest:
        request = await self.repo.get_by_id(request_id)
        if not request:
            raise ValueError("Contact request not found")

        if request.target_user.id != actor.id:
            raise PermissionError("Only the target user can approve this request")

        request.approve()
        await self.repo.save(request)

        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=EntityType.CONTACT_REQUEST,
            entity_id=request.id,
            action=ActionType.STATUS_CHANGE,
            changes={"status": RequestStatus.APPROVED.value},
        )
        await self.audit_log_repo.save(log)

        return request


class RejectContactRequestUseCase:
    def __init__(
        self, repo: IContactRequestRepository, audit_log_repo: IAuditLogRepository
    ):
        self.repo = repo
        self.audit_log_repo = audit_log_repo

    async def execute(self, actor: User, request_id: uuid.UUID) -> ContactRequest:
        request = await self.repo.get_by_id(request_id)
        if not request:
            raise ValueError("Contact request not found")

        if request.target_user.id != actor.id:
            raise PermissionError("Only the target user can reject this request")

        request.reject()
        await self.repo.save(request)

        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=EntityType.CONTACT_REQUEST,
            entity_id=request.id,
            action=ActionType.STATUS_CHANGE,
            changes={"status": RequestStatus.REJECTED.value},
        )
        await self.audit_log_repo.save(log)

        return request


class CancelContactRequestUseCase:
    def __init__(
        self, repo: IContactRequestRepository, audit_log_repo: IAuditLogRepository
    ):
        self.repo = repo
        self.audit_log_repo = audit_log_repo

    async def execute(self, actor: User, request_id: uuid.UUID) -> ContactRequest:
        request = await self.repo.get_by_id(request_id)
        if not request:
            raise ValueError("Contact request not found")

        if request.requester.id != actor.id:
            raise PermissionError("Only the requester can cancel this request")

        request.cancel()
        await self.repo.save(request)

        log = AuditLog.new_log(
            actor_id=actor.id,
            entity_type=EntityType.CONTACT_REQUEST,
            entity_id=request.id,
            action=ActionType.STATUS_CHANGE,
            changes={"status": RequestStatus.CANCELED.value},
        )
        await self.audit_log_repo.save(log)

        return request


class SearchContactRequestsUseCase:
    def __init__(self, repo: IContactRequestRepository):
        self.repo = repo

    async def execute(
        self,
        page: int = 1,
        limit: int = 20,
        requester_id: Optional[uuid.UUID] = None,
        target_user_id: Optional[uuid.UUID] = None,
        report_id: Optional[uuid.UUID] = None,
        status: Optional[RequestStatus] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> Paginated:
        offset = max((page - 1) * limit, 0)
        items = await self.repo.search(
            requester_id=requester_id,
            target_user_id=target_user_id,
            report_id=report_id,
            status=status,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
        )
        total = await self.repo.count_search(
            requester_id=requester_id,
            target_user_id=target_user_id,
            report_id=report_id,
            status=status,
        )

        return Paginated(
            items=items,
            total_items=total,
            current_page=page,
            total_pages=math.ceil(total / limit) if total > 0 else 1,
            limit=limit,
        )
