import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional

from app.domain.entities.point import Point
from app.domain.entities.report import (
    FoundReport,
    FoundStatus,
    LostReport,
    ReportStatus,
)


class ILostReportRepository(ABC):
    @abstractmethod
    def save(self, report: LostReport) -> None:
        pass

    @abstractmethod
    def get_by_id(self, report_id: uuid.UUID) -> Optional[LostReport]:
        pass

    @abstractmethod
    def search(
        self,
        query: Optional[str] = None,
        user_ids: Optional[List[uuid.UUID]] = None,
        category_ids: Optional[List[uuid.UUID]] = None,
        report_status: Optional[List[ReportStatus]] = None,
        incident_date_from: Optional[datetime] = None,
        incident_date_to: Optional[datetime] = None,
        location_point: Optional[Point] = None,
        location_radius: Optional[float] = None,
        sort_by: str = "created_at",  # created_at, distance, title
        sort_order: str = "desc",  # asc, desc
        limit: int = 20,
        offset: int = 0,
    ) -> List[LostReport]:
        pass

    @abstractmethod
    def count_search(
        self,
        query: Optional[str] = None,
        user_ids: Optional[List[uuid.UUID]] = None,
        category_ids: Optional[List[uuid.UUID]] = None,
        report_status: Optional[List[ReportStatus]] = None,
        incident_date_from: Optional[datetime] = None,
        incident_date_to: Optional[datetime] = None,
        location_point: Optional[Point] = None,
        location_radius: Optional[float] = None,
    ) -> int:
        pass

    @abstractmethod
    def find_potential_matches(
        self,
        found_report: FoundReport,
        limit: int = 20,
        offset: int = 0,
    ) -> List[LostReport]:
        pass


class IFoundReportRepository(ABC):
    @abstractmethod
    def save(self, report: FoundReport) -> None:
        pass

    @abstractmethod
    def get_by_id(self, report_id: uuid.UUID) -> Optional[FoundReport]:
        pass

    @abstractmethod
    def search(
        self,
        query: Optional[str] = None,
        user_ids: Optional[List[uuid.UUID]] = None,
        category_ids: Optional[List[uuid.UUID]] = None,
        report_status: Optional[List[ReportStatus]] = None,
        incident_date_from: Optional[datetime] = None,
        incident_date_to: Optional[datetime] = None,
        location_point: Optional[Point] = None,
        location_radius: Optional[float] = None,
        found_status: Optional[FoundStatus] = None,
        sort_by: str = "created_at",  # created_at, distance, title
        sort_order: str = "desc",  # asc, desc
        limit: int = 20,
        offset: int = 0,
    ) -> List[FoundReport]:
        pass

    @abstractmethod
    def count_search(
        self,
        query: Optional[str] = None,
        user_ids: Optional[List[uuid.UUID]] = None,
        category_ids: Optional[List[uuid.UUID]] = None,
        report_status: Optional[List[ReportStatus]] = None,
        incident_date_from: Optional[datetime] = None,
        incident_date_to: Optional[datetime] = None,
        location_point: Optional[Point] = None,
        location_radius: Optional[float] = None,
        found_status: Optional[FoundStatus] = None,
    ) -> int:
        pass

    @abstractmethod
    def find_potential_matches(
        self,
        lost_report: LostReport,
        limit: int = 20,
        offset: int = 0,
    ) -> List[FoundReport]:
        pass
