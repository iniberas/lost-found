from datetime import datetime, timedelta, timezone
import uuid

from app.domain.entities.audit_log import (
    ActionType,
    AuditLog,
    EntityType,
)
from app.domain.entities.contact_request import RequestStatus
from app.domain.interfaces.audit_log import IAuditLogRepository
from app.domain.interfaces.contact_request import (
    IContactRequestRepository,
    IContactRequestService,
)


class ContactRequestService(IContactRequestService):
    def __init__(
        self,
        request_repo: IContactRequestRepository,
        audit_log_repo: IAuditLogRepository,
    ):
        self.request_repo = request_repo
        self.audit_log_repo = audit_log_repo

    async def close_pending_requests_for_report(
        self,
        report_id: uuid.UUID,
        actor_id: uuid.UUID | None,
        reason: str,
    ) -> None:
        requests = await self.request_repo.search(
            report_id=report_id,
            status=RequestStatus.PENDING,
        )

        for request in requests:
            request.close(reason)

            await self.request_repo.save(request)

            log = AuditLog.new_log(
                actor_id=actor_id,
                entity_type=EntityType.CONTACT_REQUEST,
                entity_id=request.id,
                action=ActionType.STATUS_CHANGE,
                changes={
                    "status": RequestStatus.CLOSED.value,
                    "response_message": reason,
                },
            )

            await self.audit_log_repo.save(log)