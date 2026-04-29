import uuid
from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.entities.category import Category


class ICategoryRepository(ABC):
    @abstractmethod
    def save(self, category: Category) -> None:
        pass

    @abstractmethod
    def get_by_id(self, category_id: uuid.UUID) -> Optional[Category]:
        pass

    @abstractmethod
    def get_by_ids(self, category_ids: List[uuid.UUID]) -> List[Category]:
        pass
    
    @abstractmethod
    def get_by_name(self, name) -> Optional[Category]:
        pass

    @abstractmethod
    def search(self, query: Optional[str]) -> List[Category]:
        pass

    @abstractmethod
    def delete(self, category_id: uuid.UUID) -> None:
        pass
