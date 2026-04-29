from abc import ABC, abstractmethod
from typing import List, Tuple


class IStorageService(ABC):
    @abstractmethod
    def save_file(self, file_data: Tuple[bytes, str]) -> str:
        pass

    @abstractmethod
    def save_files(self, files_data: List[Tuple[bytes, str]]) -> List[str]:
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> None:
        pass
