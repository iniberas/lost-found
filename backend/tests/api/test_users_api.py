import uuid
from unittest.mock import AsyncMock

import pytest
from app.core.dependencies import (
    get_change_password_use_case,
    get_current_admin,
    get_current_user,
    get_delete_user_use_case,
    get_update_user_use_case,
    get_user_by_id_use_case,
)
from app.domain.entities.user import Admin, User
from app.main import app


@pytest.fixture
def mock_update_user_uc():
    return AsyncMock()


@pytest.fixture
def mock_change_pw_uc():
    return AsyncMock()


@pytest.fixture
def mock_delete_user_uc():
    return AsyncMock()


@pytest.fixture
def mock_get_user_by_id_uc():
    return AsyncMock()


@pytest.fixture
def dummy_user():
    return User.new_user(
        name="John Doe",
        email="john@example.com",
        phone_number="+628123456789",
        password_hash="hashed_secret",
    )


@pytest.fixture
def dummy_admin():
    return Admin.new_admin(
        name="Admin Boss",
        email="admin@example.com",
        phone_number="+628111111111",
        password_hash="hashed_secret",
    )


def test_get_me_success(client, dummy_user):

    app.dependency_overrides[get_current_user] = lambda: dummy_user

    response = client.get("/api/v1/users/me")

    assert response.status_code == 200
    assert response.json()["id"] == str(dummy_user.id)
    assert response.json()["email"] == dummy_user.email


def test_update_profile_success(client, dummy_user, mock_update_user_uc):
    app.dependency_overrides[get_current_user] = lambda: dummy_user
    mock_update_user_uc.execute.return_value = dummy_user
    app.dependency_overrides[get_update_user_use_case] = lambda: mock_update_user_uc

    form_data = {
        "name": "John Updated",
        "email": "john.updated@example.com",
        "phone_number": "+628123456789",
    }

    response = client.put("/api/v1/users/me", data=form_data)

    assert response.status_code == 200
    mock_update_user_uc.execute.assert_called_once_with(
        user_id=dummy_user.id,
        name="John Updated",
        email="john.updated@example.com",
        phone_number="+628123456789",
    )


def test_update_profile_bad_request(client, dummy_user, mock_update_user_uc):
    app.dependency_overrides[get_current_user] = lambda: dummy_user
    mock_update_user_uc.execute.side_effect = ValueError("Email already taken")
    app.dependency_overrides[get_update_user_use_case] = lambda: mock_update_user_uc

    form_data = {"email": "taken@example.com"}

    response = client.put("/api/v1/users/me", data=form_data)

    assert response.status_code == 400
    assert "already taken" in response.json()["detail"]


def test_change_password_success(client, dummy_user, mock_change_pw_uc):
    app.dependency_overrides[get_current_user] = lambda: dummy_user
    mock_change_pw_uc.execute.return_value = None
    app.dependency_overrides[get_change_password_use_case] = lambda: mock_change_pw_uc

    form_data = {
        "old_password": "old_secret_password",
        "new_password": "new_secret_password",
    }

    response = client.patch("/api/v1/users/me/password", data=form_data)

    assert response.status_code == 204
    mock_change_pw_uc.execute.assert_called_once_with(
        user_id=dummy_user.id,
        old_password="old_secret_password",
        new_password="new_secret_password",
    )


def test_change_password_bad_request(client, dummy_user, mock_change_pw_uc):
    app.dependency_overrides[get_current_user] = lambda: dummy_user
    mock_change_pw_uc.execute.side_effect = ValueError("Invalid old password")
    app.dependency_overrides[get_change_password_use_case] = lambda: mock_change_pw_uc

    form_data = {
        "old_password": "wrong_password",
        "new_password": "new_secret_password",
    }

    response = client.patch("/api/v1/users/me/password", data=form_data)

    assert response.status_code == 400
    assert "Invalid old password" in response.json()["detail"]


def test_delete_user_self_success(client, dummy_user, mock_delete_user_uc):
    app.dependency_overrides[get_current_user] = lambda: dummy_user
    mock_delete_user_uc.execute.return_value = None
    app.dependency_overrides[get_delete_user_use_case] = lambda: mock_delete_user_uc

    user_id = str(dummy_user.id)
    response = client.delete(f"/api/v1/users/{user_id}")

    assert response.status_code == 204
    mock_delete_user_uc.execute.assert_called_once_with(dummy_user.id)


def test_delete_user_as_admin_success(admin_client, dummy_admin, mock_delete_user_uc):
    app.dependency_overrides[get_current_user] = lambda: dummy_admin
    mock_delete_user_uc.execute.return_value = None
    app.dependency_overrides[get_delete_user_use_case] = lambda: mock_delete_user_uc

    target_user_id = str(uuid.uuid4())
    response = admin_client.delete(f"/api/v1/users/{target_user_id}")

    assert response.status_code == 204
    mock_delete_user_uc.execute.assert_called_once_with(uuid.UUID(target_user_id))


def test_delete_user_forbidden_for_other_user(client, dummy_user, mock_delete_user_uc):
    app.dependency_overrides[get_current_user] = lambda: dummy_user
    app.dependency_overrides[get_delete_user_use_case] = lambda: mock_delete_user_uc

    other_user_id = str(uuid.uuid4())
    response = client.delete(f"/api/v1/users/{other_user_id}")

    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]
    mock_delete_user_uc.execute.assert_not_called()


def test_delete_user_not_found(client, dummy_user, mock_delete_user_uc):
    app.dependency_overrides[get_current_user] = lambda: dummy_user
    mock_delete_user_uc.execute.side_effect = ValueError("User not found")
    app.dependency_overrides[get_delete_user_use_case] = lambda: mock_delete_user_uc

    user_id = str(dummy_user.id)
    response = client.delete(f"/api/v1/users/{user_id}")

    assert response.status_code == 404


def test_get_user_by_id_success(
    admin_client, dummy_admin, dummy_user, mock_get_user_by_id_uc
):
    app.dependency_overrides[get_current_admin] = lambda: dummy_admin
    mock_get_user_by_id_uc.execute.return_value = dummy_user
    app.dependency_overrides[get_user_by_id_use_case] = lambda: mock_get_user_by_id_uc

    user_id = str(dummy_user.id)
    response = admin_client.get(f"/api/v1/users/{user_id}")

    assert response.status_code == 200
    assert response.json()["id"] == user_id
    mock_get_user_by_id_uc.execute.assert_called_once_with(dummy_user.id)


def test_get_user_by_id_not_found(admin_client, dummy_admin, mock_get_user_by_id_uc):
    app.dependency_overrides[get_current_admin] = lambda: dummy_admin
    mock_get_user_by_id_uc.execute.side_effect = ValueError("User not found")
    app.dependency_overrides[get_user_by_id_use_case] = lambda: mock_get_user_by_id_uc

    user_id = str(uuid.uuid4())
    response = admin_client.get(f"/api/v1/users/{user_id}")

    assert response.status_code == 404
