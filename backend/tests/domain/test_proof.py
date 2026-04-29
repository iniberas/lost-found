import uuid
from datetime import datetime, timezone

import pytest
from app.domain.entities.proof import Proof
from app.domain.exceptions import ValidationError


@pytest.fixture
def valid_proof_kwargs():
    return {
        "id": uuid.uuid4(),
        "created_at": datetime.now(timezone.utc),
        "photos": ["photo1.jpg", "photo2.jpg"],
        "notes": "A" * 10,  # exactly NOTES_MIN_LEN
    }


@pytest.mark.parametrize(
    "photos, notes",
    [
        ([], "A" * 10),  # no photos is allowed
        (["photo.jpg"], "A" * 10),  # exactly NOTES_MIN_LEN
        (["p.jpg"] * 10, "A" * 2047),  # max photos + max notes
        (["photo1.jpg", "photo2.jpg"], "Found near the main gate of the building."),
    ],
)
def test_create_proof_success(photos, notes):
    proof = Proof(
        id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        photos=photos,
        notes=notes,
    )
    assert proof.notes == notes.strip()
    assert proof.photos == photos


@pytest.mark.parametrize(
    "notes, expected_error",
    [
        ("", "Notes cannot be empty"),
        ("   ", "Notes cannot be empty"),
        ("A" * 9, "Notes must be at least 10 characters long"),  # NOTES_MIN_LEN - 1
        ("A" * 2048, "Notes cannot exceed 2047 characters"),  # NOTES_MAX_LEN + 1
    ],
)
def test_create_proof_fails_with_invalid_notes(
    valid_proof_kwargs, notes, expected_error
):
    valid_proof_kwargs["notes"] = notes
    with pytest.raises(ValidationError, match=expected_error):
        Proof(**valid_proof_kwargs)


def test_create_proof_fails_with_none_notes(valid_proof_kwargs):
    valid_proof_kwargs["notes"] = None
    with pytest.raises(ValidationError, match="Notes cannot be empty"):
        Proof(**valid_proof_kwargs)


@pytest.mark.parametrize(
    "photos, expected_error",
    [
        (
            ["p.jpg"] * 11,
            "A proof cannot exceed the maximum limit of 10 photos",
        ),  # MAX_PHOTOS_COUNT + 1
    ],
)
def test_create_proof_fails_with_invalid_photos(
    valid_proof_kwargs, photos, expected_error
):
    valid_proof_kwargs["photos"] = photos
    with pytest.raises(ValidationError, match=expected_error):
        Proof(**valid_proof_kwargs)


@pytest.mark.parametrize(
    "created_at, expected_error",
    [
        (
            datetime(2024, 1, 1),
            "Created at must include timezone information",
        ),  # naive datetime
    ],
)
def test_create_proof_fails_with_naive_timestamp(
    valid_proof_kwargs, created_at, expected_error
):
    valid_proof_kwargs["created_at"] = created_at
    with pytest.raises(ValidationError, match=expected_error):
        Proof(**valid_proof_kwargs)


def test_new_proof_assigns_uuid_and_timestamps():
    proof = Proof.new_proof(
        photos=["photo.jpg"], notes="Found near the gate of campus."
    )
    assert isinstance(proof.id, uuid.UUID)
    assert proof.created_at.tzinfo is not None


def test_new_proof_generates_unique_ids():
    p1 = Proof.new_proof(photos=[], notes="Notes long enough here ok.")
    p2 = Proof.new_proof(photos=[], notes="Notes long enough here ok.")
    assert p1.id != p2.id


def test_proof_photos_is_defensive_copy():
    original = ["photo1.jpg"]
    proof = Proof(
        id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        photos=original,
        notes="A" * 10,
    )
    original.append("injected.jpg")
    assert "injected.jpg" not in proof.photos


def test_proof_photos_getter_is_defensive_copy():
    proof = Proof(
        id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        photos=["photo1.jpg"],
        notes="A" * 10,
    )
    proof.photos.append("injected.jpg")
    assert "injected.jpg" not in proof.photos


def test_proof_equality_same_id():
    shared_id = uuid.uuid4()
    p1 = Proof(
        id=shared_id, created_at=datetime.now(timezone.utc), photos=[], notes="A" * 10
    )
    p2 = Proof(
        id=shared_id, created_at=datetime.now(timezone.utc), photos=[], notes="B" * 10
    )
    assert p1 == p2


def test_proof_inequality_different_id():
    p1 = Proof(
        id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        photos=[],
        notes="A" * 10,
    )
    p2 = Proof(
        id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        photos=[],
        notes="A" * 10,
    )
    assert p1 != p2


def test_proof_not_equal_to_non_proof():
    proof = Proof(
        id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        photos=[],
        notes="A" * 10,
    )
    assert proof != "not a proof"
    assert proof is not None


def test_proof_hashable_and_usable_in_set():
    p1 = Proof.new_proof(photos=[], notes="Notes long enough here ok.")
    p2 = Proof.new_proof(photos=[], notes="Notes long enough here ok.")
    s = {p1, p2}
    assert len(s) == 2
