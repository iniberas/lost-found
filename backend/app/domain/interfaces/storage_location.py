import uuid
from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.entities.storage_location import StorageLocation


class IStorageLocationRepository(ABC):
    @abstractmethod
    def save(self, location: StorageLocation) -> None:
        pass

    @abstractmethod
    def get_by_id(self, location_id: uuid.UUID) -> Optional[StorageLocation]:
        pass

    @abstractmethod
    def get_by_ids(self, location_ids: List[uuid.UUID]) -> List[StorageLocation]:
        pass

    @abstractmethod
    def get_by_name(self, name: str) -> Optional[StorageLocation]:
        pass

    @abstractmethod
    def search(
        self, 
        query: Optional[str] = None, 
        is_active: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[StorageLocation]:
        pass

    @abstractmethod
    def count_search(
        self, 
        query: Optional[str] = None, 
        is_active: Optional[bool] = None
    ) -> int:
        pass

    @abstractmethod
    def delete(self, location_id: uuid.UUID) -> None:
        pass