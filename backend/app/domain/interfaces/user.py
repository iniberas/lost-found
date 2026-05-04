import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional

from app.domain.entities.user import User


class IUserRepository(ABC):
    @abstractmethod
    def save(self, user: User) -> None:
        pass

    @abstractmethod
    def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        pass

    @abstractmethod
    def find_by_email(self, email: str) -> Optional[User]:
        pass

    @abstractmethod
    def search(
        self,
        query: Optional[str] = None,
        role: Optional[str] = None, 
        created_at_from: Optional[datetime] = None,
        created_at_to: Optional[datetime] = None,
        is_deleted: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        limit: int = 20,
        offset: int = 0,
    ) -> List[User]:
        pass

    @abstractmethod
    def count_search(
        self,
        query: Optional[str] = None,
        role: Optional[str] = None, 
        created_at_from: Optional[datetime] = None,
        created_at_to: Optional[datetime] = None,
        is_deleted: Optional[bool] = None,
    ) -> int:
        pass