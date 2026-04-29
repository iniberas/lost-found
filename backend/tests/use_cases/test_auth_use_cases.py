from unittest.mock import AsyncMock, MagicMock

import pytest
from app.domain.entities.user import User
from app.domain.use_cases.auth import (
    LoginUserUseCase,
    RefreshTokenUseCase,
    RegisterUserUseCase,
)


@pytest.fixture
def mock_user_repo():
    return AsyncMock()


@pytest.fixture
def mock_hasher():
    hasher = MagicMock()
    hasher.verify.return_value = True
    hasher.hash.return_value = "hashed_secret_password"
    return hasher


@pytest.fixture
def mock_token_service():
    token_service = MagicMock()
    token_service.create_access_token.return_value = "mock_access_token"
    token_service.create_refresh_token.return_value = "mock_refresh_token"
    token_service.decode_token.return_value = {"sub": "budi@example.com"}
    return token_service


@pytest.fixture
def dummy_user():
    return User.new_user(
        name="Budi",
        email="budi@example.com",
        phone_number="+6281234567890",
        password_hash="hashed_secret_password",
    )


@pytest.mark.asyncio
async def test_register_user_success(mock_user_repo, mock_hasher):
    usecase = RegisterUserUseCase(mock_user_repo, mock_hasher)

    mock_user_repo.find_by_email.return_value = None

    user = await usecase.execute(
        name="Budi Baru",
        email="budibaru@example.com",
        phone_number="+628999999999",
        password="MySecretPassword123",
    )

    assert user.name == "Budi Baru"
    assert user.email == "budibaru@example.com"
    assert user.password_hash == "hashed_secret_password"

    mock_user_repo.find_by_email.assert_called_once_with("budibaru@example.com")
    mock_hasher.hash.assert_called_once_with("MySecretPassword123")
    mock_user_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_register_user_fails_if_email_exists(
    mock_user_repo, mock_hasher, dummy_user
):
    usecase = RegisterUserUseCase(mock_user_repo, mock_hasher)

    mock_user_repo.find_by_email.return_value = dummy_user

    with pytest.raises(ValueError, match="already exists"):
        await usecase.execute(
            name="Budi Clone",
            email="budi@example.com",
            phone_number="+6281234567890",
            password="password",
        )

    mock_hasher.hash.assert_not_called()
    mock_user_repo.save.assert_not_called()


@pytest.mark.asyncio
async def test_login_user_success(
    mock_user_repo, mock_hasher, mock_token_service, dummy_user
):
    usecase = LoginUserUseCase(mock_user_repo, mock_hasher, mock_token_service)

    mock_user_repo.find_by_email.return_value = dummy_user

    result = await usecase.execute("budi@example.com", "CorrectPassword")

    assert result["access_token"] == "mock_access_token"
    assert result["refresh_token"] == "mock_refresh_token"
    assert result["token_type"] == "bearer"

    mock_user_repo.find_by_email.assert_called_once_with("budi@example.com")
    mock_hasher.verify.assert_called_once_with(
        "CorrectPassword", "hashed_secret_password"
    )
    mock_token_service.create_access_token.assert_called_once_with(
        {"sub": dummy_user.email}
    )
    mock_token_service.create_refresh_token.assert_called_once_with(
        {"sub": dummy_user.email}
    )


@pytest.mark.asyncio
async def test_login_user_fails_if_not_found(
    mock_user_repo, mock_hasher, mock_token_service
):
    usecase = LoginUserUseCase(mock_user_repo, mock_hasher, mock_token_service)

    mock_user_repo.find_by_email.return_value = None

    with pytest.raises(ValueError, match="Invalid email or password"):
        await usecase.execute("unknown@example.com", "password")


@pytest.mark.asyncio
async def test_login_user_fails_if_wrong_password(
    mock_user_repo, mock_hasher, mock_token_service, dummy_user
):
    usecase = LoginUserUseCase(mock_user_repo, mock_hasher, mock_token_service)

    mock_user_repo.find_by_email.return_value = dummy_user
    mock_hasher.verify.return_value = False

    with pytest.raises(ValueError, match="Invalid email or password"):
        await usecase.execute("budi@example.com", "WrongPassword")


@pytest.mark.asyncio
async def test_refresh_token_success(mock_user_repo, mock_token_service, dummy_user):
    usecase = RefreshTokenUseCase(mock_user_repo, mock_token_service)

    mock_user_repo.find_by_email.return_value = dummy_user
    mock_token_service.decode_token.return_value = {"sub": dummy_user.email}

    result = await usecase.execute("valid_refresh_token")

    assert result["access_token"] == "mock_access_token"
    assert result["token_type"] == "bearer"
    mock_token_service.decode_token.assert_called_once_with("valid_refresh_token")
    mock_user_repo.find_by_email.assert_called_once_with(dummy_user.email)


@pytest.mark.asyncio
async def test_refresh_token_fails_if_decode_error(mock_user_repo, mock_token_service):
    usecase = RefreshTokenUseCase(mock_user_repo, mock_token_service)

    mock_token_service.decode_token.side_effect = Exception("Expired token")

    with pytest.raises(ValueError, match="Could not validate credentials"):
        await usecase.execute("invalid_refresh_token")


@pytest.mark.asyncio
async def test_refresh_token_fails_if_no_sub(mock_user_repo, mock_token_service):
    usecase = RefreshTokenUseCase(mock_user_repo, mock_token_service)

    mock_token_service.decode_token.return_value = {"other_key": "value"}

    with pytest.raises(ValueError, match="Could not validate credentials"):
        await usecase.execute("weird_refresh_token")


@pytest.mark.asyncio
async def test_refresh_token_fails_if_user_not_found(
    mock_user_repo, mock_token_service
):
    usecase = RefreshTokenUseCase(mock_user_repo, mock_token_service)

    mock_token_service.decode_token.return_value = {"sub": "ghost@example.com"}
    mock_user_repo.find_by_email.return_value = None

    with pytest.raises(ValueError, match="User not found"):
        await usecase.execute("valid_refresh_token_but_deleted_user")
