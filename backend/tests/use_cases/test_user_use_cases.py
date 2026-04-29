from unittest.mock import AsyncMock, MagicMock

import pytest
from app.domain.entities.user import User
from app.domain.use_cases.user import (
    ChangePasswordUseCase,
    DeleteUserUseCase,
    GetUserByEmailUseCase,
    GetUserByIdUseCase,
    SearchUsersUseCase,
    UpdateUserUseCase,
)
from app.schemas.pagination import Paginated


@pytest.fixture
def mock_user_repo():
    return AsyncMock()


@pytest.fixture
def mock_hasher():
    hasher = MagicMock()
    hasher.hash.return_value = "new_hashed_password"
    hasher.verify.return_value = True
    return hasher


@pytest.fixture
def dummy_user():
    return User.new_user(
        name="Budi",
        email="budi@apps.ipb.ac.id",
        phone_number="+6281234567890",
        password_hash="old_hashed_password",
    )


@pytest.mark.asyncio
async def test_get_user_by_id_success(mock_user_repo, dummy_user):
    usecase = GetUserByIdUseCase(mock_user_repo)
    mock_user_repo.get_by_id.return_value = dummy_user

    result = await usecase.execute(dummy_user.id)
    assert result.id == dummy_user.id
    mock_user_repo.get_by_id.assert_called_once_with(dummy_user.id)


@pytest.mark.asyncio
async def test_get_user_by_email_success(mock_user_repo, dummy_user):
    usecase = GetUserByEmailUseCase(mock_user_repo)
    mock_user_repo.find_by_email.return_value = dummy_user

    result = await usecase.execute("budi@apps.ipb.ac.id")
    assert result.email == "budi@apps.ipb.ac.id"


@pytest.mark.asyncio
async def test_update_user_success(mock_user_repo, dummy_user):
    usecase = UpdateUserUseCase(mock_user_repo)
    mock_user_repo.get_by_id.return_value = dummy_user
    mock_user_repo.find_by_email.return_value = None

    updated = await usecase.execute(
        user_id=dummy_user.id, name="Budi Updated", email="newbudi@apps.ipb.ac.id"
    )

    assert updated.name == "Budi Updated"
    assert updated.email == "newbudi@apps.ipb.ac.id"
    mock_user_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_update_user_fails_if_email_taken(mock_user_repo, dummy_user):
    usecase = UpdateUserUseCase(mock_user_repo)
    mock_user_repo.get_by_id.return_value = dummy_user
    mock_user_repo.find_by_email.return_value = User.new_user(
        "Other", "taken@x.com", "+6201234567890", "h"
    )

    with pytest.raises(ValueError, match="already taken"):
        await usecase.execute(user_id=dummy_user.id, email="taken@x.com")


@pytest.mark.asyncio
async def test_change_password_success(mock_user_repo, mock_hasher, dummy_user):
    usecase = ChangePasswordUseCase(mock_user_repo, mock_hasher)
    mock_user_repo.get_by_id.return_value = dummy_user

    await usecase.execute(dummy_user.id, "OldPass123", "NewPass123")

    assert dummy_user.password_hash == "new_hashed_password"
    mock_hasher.verify.assert_called_once()
    mock_user_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_change_password_fails_if_wrong_old_password(
    mock_user_repo, mock_hasher, dummy_user
):
    usecase = ChangePasswordUseCase(mock_user_repo, mock_hasher)
    mock_user_repo.get_by_id.return_value = dummy_user
    mock_hasher.verify.return_value = False

    with pytest.raises(ValueError, match="Invalid old password"):
        await usecase.execute(dummy_user.id, "WrongOldPass", "NewPass")


@pytest.mark.asyncio
async def test_delete_user_success(mock_user_repo, dummy_user):
    usecase = DeleteUserUseCase(mock_user_repo)
    mock_user_repo.get_by_id.return_value = dummy_user

    await usecase.execute(dummy_user.id)

    assert dummy_user.deleted_at is not None
    mock_user_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_search_users_paginated(mock_user_repo, dummy_user):
    usecase = SearchUsersUseCase(mock_user_repo)
    mock_user_repo.search.return_value = [dummy_user]
    mock_user_repo.count_search.return_value = 1

    result = await usecase.execute(page=1, limit=5, query="Budi")

    assert isinstance(result, Paginated)
    assert result.total_items == 1
    assert result.items[0].name == "Budi"
    mock_user_repo.search.assert_called_once()
