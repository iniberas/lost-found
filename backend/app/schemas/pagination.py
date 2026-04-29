from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Paginated(BaseModel, Generic[T]):
    items: List[T]
    total_items: int
    current_page: int
    total_pages: int
    limit: int
