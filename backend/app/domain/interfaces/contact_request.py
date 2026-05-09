import uuid
from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.entities.contact_request import ContactRequest, RequestStatus
from app.domain.entities.report import ReportType


class IContactRequestRepository(ABC):
    @abstractmethod
    def save(self, request: ContactRequest) -> None:
        pass

    @abstractmethod
    def get_by_id(self, request_id: uuid.UUID) -> Optional[ContactRequest]:
        pass

    @abstractmethod
    def search(
        self,
        requester_id: Optional[uuid.UUID] = None,
        target_user_id: Optional[uuid.UUID] = None,
        report_id: Optional[uuid.UUID] = None,
        report_type: Optional[uuid.UUID] = ReportType,
        status: Optional[RequestStatus] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        limit: int = 20,
        offset: int = 0,
    ) -> List[ContactRequest]:
        pass

    @abstractmethod
    def count_search(
        self,
        requester_id: Optional[uuid.UUID] = None,
        target_user_id: Optional[uuid.UUID] = None,
        report_id: Optional[uuid.UUID] = None,
        status: Optional[RequestStatus] = None,
    ) -> int:
        pass

    @abstractmethod
    def delete(self, request_id: uuid.UUID) -> None:
        pass