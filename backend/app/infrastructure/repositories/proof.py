import uuid
from typing import Optional

from app.domain.entities.proof import Proof
from app.domain.interfaces.proof import IProofRepository
from app.infrastructure.database.models.proof import ProofModel
from sqlalchemy.ext.asyncio import AsyncSession


class ProofRepository(IProofRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    def _to_entity(self, model: ProofModel) -> Proof:
        return Proof(
            id=model.id,
            created_at=model.created_at,
            photos=list(model.photos or []),
            notes=model.notes,
        )

    async def save(self, proof: Proof) -> None:
        existing = await self.session.get(ProofModel, proof.id)
        if existing:
            existing.photos = proof.photos
            existing.notes = proof.notes
        else:
            self.session.add(
                ProofModel(
                    id=proof.id,
                    created_at=proof.created_at,
                    photos=proof.photos,
                    notes=proof.notes,
                )
            )

    async def get_by_id(self, proof_id: uuid.UUID) -> Optional[Proof]:
        model = await self.session.get(ProofModel, proof_id)
        return self._to_entity(model) if model else None
