import uuid
from datetime import datetime
from typing import List, Optional

from app.domain.entities.audit_log import ActionType, AuditLog, EntityType
from app.domain.interfaces.audit_log import IAuditLogRepository
from app.infrastructure.database.models.audit_log import AuditLogModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


class AuditLogRepository(IAuditLogRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: AuditLogModel) -> AuditLog:
        return AuditLog(
            id=model.id,
            created_at=model.created_at,
            actor_id=model.actor_id,
            entity_type=EntityType(model.entity_type),
            entity_id=model.entity_id,
            action=ActionType(model.action),
            changes=model.changes,
        )

    async def save(self, log: AuditLog) -> None:

        self.session.add(
            AuditLogModel(
                id=log.id,
                created_at=log.created_at,
                actor_id=log.actor_id,
                entity_type=log.entity_type.value,
                entity_id=log.entity_id,
                action=log.action.value,
                changes=log.changes,
            )
        )
        await self.session.flush()

    async def get_by_id(self, log_id: uuid.UUID) -> Optional[AuditLog]:
        model = await self.session.get(AuditLogModel, log_id)
        return self._to_entity(model) if model else None

    async def search(
        self,
        actor_id: Optional[uuid.UUID] = None,
        entity_type: Optional[EntityType] = None,
        entity_id: Optional[uuid.UUID] = None,
        action: Optional[ActionType] = None,
        created_at_from: Optional[datetime] = None,
        created_at_to: Optional[datetime] = None,
        sort_order: str = "desc",
        limit: int = 50,
        offset: int = 0,
    ) -> List[AuditLog]:
        stmt = select(AuditLogModel)
        stmt = self._apply_filters(
            stmt,
            actor_id,
            entity_type,
            entity_id,
            action,
            created_at_from,
            created_at_to,
        )

        if sort_order == "asc":
            stmt = stmt.order_by(AuditLogModel.created_at.asc())
        else:
            stmt = stmt.order_by(AuditLogModel.created_at.desc())

        stmt = stmt.limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return [self._to_entity(m) for m in result.scalars().all()]

    async def count_search(
        self,
        actor_id: Optional[uuid.UUID] = None,
        entity_type: Optional[EntityType] = None,
        entity_id: Optional[uuid.UUID] = None,
        action: Optional[ActionType] = None,
        created_at_from: Optional[datetime] = None,
        created_at_to: Optional[datetime] = None,
    ) -> int:
        stmt = select(func.count()).select_from(AuditLogModel)
        stmt = self._apply_filters(
            stmt,
            actor_id,
            entity_type,
            entity_id,
            action,
            created_at_from,
            created_at_to,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    def _apply_filters(
        self,
        stmt,
        actor_id,
        entity_type,
        entity_id,
        action,
        created_at_from,
        created_at_to,
    ):
        if actor_id:
            stmt = stmt.where(AuditLogModel.actor_id == actor_id)
        if entity_type:
            stmt = stmt.where(AuditLogModel.entity_type == entity_type.value)
        if entity_id:
            stmt = stmt.where(AuditLogModel.entity_id == entity_id)
        if action:
            stmt = stmt.where(AuditLogModel.action == action.value)
        if created_at_from:
            stmt = stmt.where(AuditLogModel.created_at >= created_at_from)
        if created_at_to:
            stmt = stmt.where(AuditLogModel.created_at <= created_at_to)
        return stmt
