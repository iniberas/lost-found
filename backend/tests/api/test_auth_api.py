from unittest.mock import AsyncMock

import pytest
from app.core.dependencies import (
    get_login_use_case,
    get_refresh_use_case,
    get_register_use_case,
)
from app.domain.entities.user import User
from app.main import app


@pytest.fixture
def mock_register_uc():
    return AsyncMock()


@pytest.fixture
def mock_login_uc():
    return AsyncMock()


@pytest.fixture
def mock_refresh_uc():
    return AsyncMock()


@pytest.fixture
def dummy_user():
    return User.new_user(
        name="John Doe",
        email="john@example.com",
        phone_number="+628123456789",
        password_hash="hashed_secret",
    )


def test_register_success(client, mock_register_uc, dummy_user):
    mock_register_uc.execute.return_value = dummy_user
    app.dependency_overrides[get_register_use_case] = lambda: mock_register_uc

    form_data = {
        "name": "John Doe",
        "email": "john@example.com",
        "phone_number": "+628123456789",
        "password": "secretpassword",
    }
    response = client.post("/api/v1/auth/register", data=form_data)

    assert response.status_code == 201
    assert response.json()["name"] == "John Doe"
    mock_register_uc.execute.assert_called_once_with(
        name="John Doe",
        email="john@example.com",
        phone_number="+628123456789",
        password="secretpassword",
    )


def test_register_conflict(client, mock_register_uc):
    mock_register_uc.execute.side_effect = ValueError("User with email already exists")
    app.dependency_overrides[get_register_use_case] = lambda: mock_register_uc

    form_data = {
        "name": "John Doe",
        "email": "john@example.com",
        "phone_number": "+628123456789",
        "password": "secretpassword",
    }
    response = client.post("/api/v1/auth/register", data=form_data)

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_login_success(client, mock_login_uc):
    mock_login_uc.execute.return_value = {
        "access_token": "mock_access",
        "refresh_token": "mock_refresh",
        "token_type": "bearer",
    }
    app.dependency_overrides[get_login_use_case] = lambda: mock_login_uc

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "john@example.com", "password": "secretpassword"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "mock_access"
    assert response.json()["refresh_token"] == "mock_refresh"
    assert response.json()["token_type"] == "bearer"
    mock_login_uc.execute.assert_called_once_with(
        email="john@example.com", password="secretpassword"
    )


def test_login_unauthorized(client, mock_login_uc):
    mock_login_uc.execute.side_effect = ValueError("Invalid email or password")
    app.dependency_overrides[get_login_use_case] = lambda: mock_login_uc

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "john@example.com", "password": "wrongpassword"},
    )

    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_refresh_success(client, mock_refresh_uc):
    mock_refresh_uc.execute.return_value = {
        "access_token": "new_mock_access",
        "token_type": "bearer",
    }
    app.dependency_overrides[get_refresh_use_case] = lambda: mock_refresh_uc

    response = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": "valid_refresh_token"}
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "new_mock_access"
    mock_refresh_uc.execute.assert_called_once_with("valid_refresh_token")


def test_refresh_unauthorized(client, mock_refresh_uc):
    mock_refresh_uc.execute.side_effect = ValueError("Could not validate credentials")
    app.dependency_overrides[get_refresh_use_case] = lambda: mock_refresh_uc

    response = client.post(
        "/api/v1/auth/refresh", json={"refresh_token": "invalid_token"}
    )

    assert response.status_code == 401
    assert "validate credentials" in response.json()["detail"]


def test_swagger_login_success(client, mock_login_uc):
    mock_login_uc.execute.return_value = {
        "access_token": "mock_access",
        "refresh_token": "mock_refresh",
        "token_type": "bearer",
    }
    app.dependency_overrides[get_login_use_case] = lambda: mock_login_uc

    response = client.post(
        "/api/v1/auth/swagger-thing",
        data={"username": "john@example.com", "password": "secretpassword"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "mock_access"
    mock_login_uc.execute.assert_called_once_with(
        email="john@example.com", password="secretpassword"
    )


def test_swagger_login_unauthorized(client, mock_login_uc):
    mock_login_uc.execute.side_effect = ValueError("Invalid email or password")
    app.dependency_overrides[get_login_use_case] = lambda: mock_login_uc

    response = client.post(
        "/api/v1/auth/swagger-thing",
        data={"username": "john@example.com", "password": "wrongpassword"},
    )

    assert response.status_code == 401
