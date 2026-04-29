import uuid
from typing import List, Optional, Tuple

from app.domain.entities.proof import Proof
from app.domain.interfaces.proof import IProofRepository
from app.domain.interfaces.storage import IStorageService


class CreateProofUseCase:
    def __init__(self, repo: IProofRepository, storage: IStorageService):
        self.repo = repo
        self.storage = storage

    async def execute(self, photo_files: List[Tuple[bytes, str]], notes: str) -> Proof:
        photos = await self.storage.save_files(photo_files) if photo_files else []
        proof = Proof.new_proof(photos=photos, notes=notes)
        await self.repo.save(proof)
        return proof


class GetProofByIdUseCase:
    def __init__(self, repo: IProofRepository):
        self.repo = repo

    async def execute(self, proof_id: uuid.UUID) -> Optional[Proof]:
        return await self.repo.get_by_id(proof_id)
