import math
import uuid
from datetime import datetime
from typing import Optional

from app.domain.entities.audit_log import ActionType, AuditLog, EntityType
from app.domain.entities.user import Admin, SuperAdmin, User
from app.domain.interfaces.audit_log import IAuditLogRepository
from app.schemas.pagination import Paginated


class GetAuditLogByIdUseCase:
    def __init__(self, repo: IAuditLogRepository):
        self.repo = repo

    async def execute(self, actor: User, log_id: uuid.UUID) -> AuditLog:

        if not (isinstance(actor, Admin) or isinstance(actor, SuperAdmin)):
            raise PermissionError("Only administrators can view audit logs")

        log = await self.repo.get_by_id(log_id)
        if not log:
            raise ValueError("Audit log not found")

        return log


class SearchAuditLogsUseCase:
    def __init__(self, repo: IAuditLogRepository):
        self.repo = repo

    async def execute(
        self,
        actor: User,
        page: int = 1,
        limit: int = 50,
        actor_id: Optional[uuid.UUID] = None,
        entity_type: Optional[EntityType] = None,
        entity_id: Optional[uuid.UUID] = None,
        action: Optional[ActionType] = None,
        created_at_from: Optional[datetime] = None,
        created_at_to: Optional[datetime] = None,
        sort_order: str = "desc",
    ) -> Paginated:

        if not (isinstance(actor, Admin) or isinstance(actor, SuperAdmin)):
            raise PermissionError("Only administrators can view audit logs")

        offset = max((page - 1) * limit, 0)

        items = await self.repo.search(
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            created_at_from=created_at_from,
            created_at_to=created_at_to,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
        )

        total = await self.repo.count_search(
            actor_id=actor_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            created_at_from=created_at_from,
            created_at_to=created_at_to,
        )

        return Paginated(
            items=items,
            total_items=total,
            current_page=page,
            total_pages=math.ceil(total / limit) if total > 0 else 1,
            limit=limit,
        )
