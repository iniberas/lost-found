import uuid
from unittest.mock import AsyncMock

import pytest
from app.domain.entities.point import Point
from app.domain.entities.storage_location import StorageLocation
from app.domain.entities.user import Admin, User
from app.domain.use_cases.storage_location import (
    ActivateStorageLocationUseCase,
    CreateStorageLocationUseCase,
    DeleteStorageLocationUseCase,
    GetStorageLocationByIdUseCase,
    SearchStorageLocationsUseCase,
    UpdateStorageLocationUseCase,
)
from app.schemas.pagination import Paginated


@pytest.fixture
def mock_loc_repo():
    return AsyncMock()


@pytest.fixture
def mock_audit_log_repo():
    return AsyncMock()


@pytest.fixture
def admin_actor():
    return Admin.new_admin(
        name="Admin",
        email="admin@example.com",
        phone_number="+628111111111",
        password_hash="hash",
    )


@pytest.fixture
def user_actor():
    return User.new_user(
        name="User",
        email="user@example.com",
        phone_number="+628222222222",
        password_hash="hash",
    )


@pytest.fixture
def dummy_loc():
    return StorageLocation.new_location(
        name="Pos Utama", description="Gerbang depan", location_point=Point(-6.2, 106.8)
    )


@pytest.mark.asyncio
async def test_create_storage_location_success(
    mock_loc_repo, mock_audit_log_repo, admin_actor
):
    usecase = CreateStorageLocationUseCase(mock_loc_repo, mock_audit_log_repo)
    mock_loc_repo.get_by_name.return_value = None

    loc = await usecase.execute(
        actor=admin_actor,
        name="Pos Utara",
        description="Gerbang Utara",
        location_point=Point(0.0, 0.0),
    )

    assert loc.name == "Pos Utara"
    mock_loc_repo.get_by_name.assert_called_once_with("Pos Utara")
    mock_loc_repo.save.assert_called_once()
    mock_audit_log_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_create_storage_location_fails_not_admin(
    mock_loc_repo, mock_audit_log_repo, user_actor
):
    usecase = CreateStorageLocationUseCase(mock_loc_repo, mock_audit_log_repo)

    with pytest.raises(
        PermissionError, match="Only administrators can create storage locations"
    ):
        await usecase.execute(user_actor, "Nama", "Desc", Point(0.0, 0.0))


@pytest.mark.asyncio
async def test_create_storage_location_fails_exists(
    mock_loc_repo, mock_audit_log_repo, admin_actor, dummy_loc
):
    usecase = CreateStorageLocationUseCase(mock_loc_repo, mock_audit_log_repo)
    mock_loc_repo.get_by_name.return_value = dummy_loc

    with pytest.raises(ValueError, match="already exists"):
        await usecase.execute(admin_actor, "Pos Utama", "Desc", Point(0.0, 0.0))


@pytest.mark.asyncio
async def test_update_storage_location_success(
    mock_loc_repo, mock_audit_log_repo, admin_actor, dummy_loc
):
    usecase = UpdateStorageLocationUseCase(mock_loc_repo, mock_audit_log_repo)
    mock_loc_repo.get_by_id.return_value = dummy_loc
    mock_loc_repo.get_by_name.return_value = None

    updated_loc = await usecase.execute(
        actor=admin_actor,
        location_id=dummy_loc.id,
        name="Pos Baru",
        description="Desc Baru",
    )

    assert updated_loc.name == "Pos Baru"
    assert updated_loc.description == "Desc Baru"
    mock_loc_repo.save.assert_called_once()
    mock_audit_log_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_update_storage_location_fails_not_admin(
    mock_loc_repo, mock_audit_log_repo, user_actor
):
    usecase = UpdateStorageLocationUseCase(mock_loc_repo, mock_audit_log_repo)

    with pytest.raises(
        PermissionError, match="Only administrators can update storage locations"
    ):
        await usecase.execute(actor=user_actor, location_id=uuid.uuid4(), name="Test")


@pytest.mark.asyncio
async def test_delete_storage_location_success(
    mock_loc_repo, mock_audit_log_repo, admin_actor, dummy_loc
):
    usecase = DeleteStorageLocationUseCase(mock_loc_repo, mock_audit_log_repo)
    mock_loc_repo.get_by_id.return_value = dummy_loc

    await usecase.execute(actor=admin_actor, location_id=dummy_loc.id)

    assert dummy_loc.is_active is False
    mock_loc_repo.save.assert_called_once()
    mock_audit_log_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_activate_storage_location_success(
    mock_loc_repo, mock_audit_log_repo, admin_actor, dummy_loc
):
    usecase = ActivateStorageLocationUseCase(mock_loc_repo, mock_audit_log_repo)
    dummy_loc.delete()  # Jadikan inactive dulu
    mock_loc_repo.get_by_id.return_value = dummy_loc

    await usecase.execute(actor=admin_actor, location_id=dummy_loc.id)

    assert dummy_loc.is_active is True
    mock_loc_repo.save.assert_called_once()
    mock_audit_log_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_search_storage_locations_success(mock_loc_repo, dummy_loc):
    usecase = SearchStorageLocationsUseCase(mock_loc_repo)
    mock_loc_repo.search.return_value = [dummy_loc]
    mock_loc_repo.count_search.return_value = 1

    result = await usecase.execute(page=1, limit=10, query="Pos")

    assert isinstance(result, Paginated)
    assert result.total_items == 1
    assert len(result.items) == 1


@pytest.mark.asyncio
async def test_get_storage_location_by_id_success(mock_loc_repo, dummy_loc):
    usecase = GetStorageLocationByIdUseCase(mock_loc_repo)
    mock_loc_repo.get_by_id.return_value = dummy_loc

    result = await usecase.execute(dummy_loc.id)
    assert result.id == dummy_loc.id


@pytest.mark.asyncio
async def test_get_storage_location_by_id_fails_not_found(mock_loc_repo):
    usecase = GetStorageLocationByIdUseCase(mock_loc_repo)
    mock_loc_repo.get_by_id.return_value = None

    with pytest.raises(ValueError, match="Storage location not found"):
        await usecase.execute(uuid.uuid4())
