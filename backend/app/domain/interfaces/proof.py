import uuid
from abc import ABC, abstractmethod
from typing import Optional

from app.domain.entities.proof import Proof


class IProofRepository(ABC):
    @abstractmethod
    def save(self, proof: Proof) -> None:
        pass

    @abstractmethod
    def get_by_id(self, proof_id: uuid.UUID) -> Optional[Proof]:
        pass
