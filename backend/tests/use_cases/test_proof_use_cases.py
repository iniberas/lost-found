import uuid
from unittest.mock import AsyncMock

import pytest
from app.domain.entities.proof import Proof
from app.domain.use_cases.proof import CreateProofUseCase, GetProofByIdUseCase


@pytest.fixture
def mock_proof_repo():
    return AsyncMock()


@pytest.fixture
def mock_storage():
    storage = AsyncMock()
    storage.save_files.return_value = ["saved_proof.jpg"]
    return storage


@pytest.fixture
def dummy_proof():
    return Proof.new_proof(
        photos=["saved_proof.jpg"],
        notes="Barang dikembalikan langsung ke tangan pemilik aslinya.",
    )


@pytest.mark.asyncio
async def test_create_proof_success_with_photos(mock_proof_repo, mock_storage):
    usecase = CreateProofUseCase(mock_proof_repo, mock_storage)

    photo_files = [(b"image_bytes", "proof.jpg")]
    notes = "Barang dikembalikan langsung ke tangan pemilik aslinya."

    proof = await usecase.execute(photo_files=photo_files, notes=notes)

    assert proof.notes == notes
    assert "saved_proof.jpg" in proof.photos
    mock_storage.save_files.assert_called_once_with(photo_files)
    mock_proof_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_create_proof_success_without_photos(mock_proof_repo, mock_storage):
    usecase = CreateProofUseCase(mock_proof_repo, mock_storage)

    notes = "Barang dikembalikan langsung ke tangan pemilik aslinya."

    proof = await usecase.execute(photo_files=[], notes=notes)

    assert proof.notes == notes
    assert len(proof.photos) == 0
    mock_storage.save_files.assert_not_called()
    mock_proof_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_get_proof_by_id_success(mock_proof_repo, dummy_proof):
    usecase = GetProofByIdUseCase(mock_proof_repo)
    mock_proof_repo.get_by_id.return_value = dummy_proof

    result = await usecase.execute(dummy_proof.id)

    assert result is not None
    assert result.id == dummy_proof.id


@pytest.mark.asyncio
async def test_get_proof_by_id_not_found(mock_proof_repo):
    usecase = GetProofByIdUseCase(mock_proof_repo)
    mock_proof_repo.get_by_id.return_value = None

    result = await usecase.execute(uuid.uuid4())

    assert result is None
