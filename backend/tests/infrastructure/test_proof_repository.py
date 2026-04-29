import pytest
from uuid import uuid4
from datetime import datetime, timezone

from app.domain.entities.proof import Proof
from app.infrastructure.repositories.proof import ProofRepository


@pytest.mark.asyncio
async def test_save_and_get_by_id(db_session):
    repo = ProofRepository(db_session)
    
    proof = Proof.new_proof(
        photos=["proof1.jpg", "proof2.jpg"],
        notes="Handed over to the verified owner."
    )
    
    await repo.save(proof)
    await db_session.commit()
    
    saved_proof = await repo.get_by_id(proof.id)
    
    assert saved_proof is not None
    assert saved_proof.id == proof.id
    assert len(saved_proof.photos) == 2
    assert "proof1.jpg" in saved_proof.photos
    assert saved_proof.notes == "Handed over to the verified owner."


@pytest.mark.asyncio
async def test_get_by_id_returns_none_if_not_found(db_session):
    repo = ProofRepository(db_session)
    result = await repo.get_by_id(uuid4())
    assert result is None


@pytest.mark.asyncio
async def test_update_existing_proof(db_session):
    repo = ProofRepository(db_session)
    
    proof_id = uuid4()
    created_at = datetime.now(timezone.utc)
    
    original_proof = Proof(
        id=proof_id,
        created_at=created_at,
        photos=["old_photo.jpg"],
        notes="Old notes here."
    )
    
    await repo.save(original_proof)
    await db_session.commit()
    
    updated_proof = Proof(
        id=proof_id,
        created_at=created_at,
        photos=["new_photo.jpg"],
        notes="Updated notes here."
    )
    
    await repo.save(updated_proof)
    await db_session.commit()
    
    db_proof = await repo.get_by_id(proof_id)
    
    assert db_proof is not None
    assert db_proof.photos == ["new_photo.jpg"]
    assert db_proof.notes == "Updated notes here."