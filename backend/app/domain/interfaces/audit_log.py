import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional

from app.domain.entities.audit_log import ActionType, AuditLog, EntityType


class IAuditLogRepository(ABC):
    @abstractmethod
    def save(self, log: AuditLog) -> None:
        pass

    @abstractmethod
    def get_by_id(self, log_id: uuid.UUID) -> Optional[AuditLog]:
        pass

    @abstractmethod
    def search(
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
        pass

    @abstractmethod
    def count_search(
        self,
        actor_id: Optional[uuid.UUID] = None,
        entity_type: Optional[EntityType] = None,
        entity_id: Optional[uuid.UUID] = None,
        action: Optional[ActionType] = None,
        created_at_from: Optional[datetime] = None,
        created_at_to: Optional[datetime] = None,
    ) -> int:
        pass