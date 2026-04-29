import uuid
from unittest.mock import AsyncMock

import pytest
from app.core.dependencies import (
    get_create_category_use_case,
    get_delete_category_use_case,
    get_search_categories_use_case,
    get_update_category_use_case,
)
from app.domain.entities.category import Category
from app.domain.exceptions import ValidationError
from app.main import app


@pytest.fixture
def mock_search_uc():
    return AsyncMock()


@pytest.fixture
def mock_create_uc():
    return AsyncMock()


@pytest.fixture
def mock_update_uc():
    return AsyncMock()


@pytest.fixture
def mock_delete_uc():
    return AsyncMock()


@pytest.fixture
def dummy_category():

    cat = Category.new_category(name="Electronics")
    return cat


def test_search_categories_success(
    unauthenticated_client, mock_search_uc, dummy_category
):
    mock_search_uc.execute.return_value = [dummy_category]
    app.dependency_overrides[get_search_categories_use_case] = lambda: mock_search_uc

    response = unauthenticated_client.get("/api/v1/categories?query=Electro")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Electronics"
    assert data[0]["id"] == str(dummy_category.id)

    mock_search_uc.execute.assert_called_once_with(query="Electro")


def test_create_category_success(admin_client, mock_create_uc, dummy_category):
    mock_create_uc.execute.return_value = dummy_category
    app.dependency_overrides[get_create_category_use_case] = lambda: mock_create_uc

    response = admin_client.post("/api/v1/categories", data={"name": "Electronics"})

    assert response.status_code == 201
    res_data = response.json()
    assert res_data["name"] == "Electronics"
    mock_create_uc.execute.assert_called_once_with(name="Electronics")


def test_create_category_fails_if_not_admin(client):

    response = client.post("/api/v1/categories", data={"name": "Electronics"})
    assert response.status_code in [401, 403]


def test_create_category_conflict_duplicate_name(admin_client, mock_create_uc):
    mock_create_uc.execute.side_effect = ValueError(
        "A category named 'Electronics' already exists"
    )
    app.dependency_overrides[get_create_category_use_case] = lambda: mock_create_uc

    response = admin_client.post("/api/v1/categories", data={"name": "Electronics"})

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_create_category_unprocessable_entity(admin_client, mock_create_uc):
    mock_create_uc.execute.side_effect = ValidationError("Name cannot be empty")
    app.dependency_overrides[get_create_category_use_case] = lambda: mock_create_uc

    response = admin_client.post("/api/v1/categories", data={"name": "a"})

    assert response.status_code == 422
    assert "cannot be empty" in response.json()["detail"]


def test_update_category_success(admin_client, mock_update_uc, dummy_category):
    dummy_category._name = "Updated Name"
    mock_update_uc.execute.return_value = dummy_category
    app.dependency_overrides[get_update_category_use_case] = lambda: mock_update_uc

    cat_id = str(dummy_category.id)

    response = admin_client.put(
        f"/api/v1/categories/{cat_id}", data={"name": "Updated Name"}
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"
    mock_update_uc.execute.assert_called_once_with(
        category_id=uuid.UUID(cat_id), new_name="Updated Name"
    )


def test_update_category_not_found(admin_client, mock_update_uc):
    mock_update_uc.execute.side_effect = ValueError("Category not found")
    app.dependency_overrides[get_update_category_use_case] = lambda: mock_update_uc

    cat_id = str(uuid.uuid4())
    response = admin_client.put(
        f"/api/v1/categories/{cat_id}", data={"name": "New Name"}
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_delete_category_success(admin_client, mock_delete_uc):
    mock_delete_uc.execute.return_value = None
    app.dependency_overrides[get_delete_category_use_case] = lambda: mock_delete_uc

    cat_id = str(uuid.uuid4())
    response = admin_client.delete(f"/api/v1/categories/{cat_id}")

    assert response.status_code == 204
    mock_delete_uc.execute.assert_called_once_with(category_id=uuid.UUID(cat_id))


def test_delete_category_not_found(admin_client, mock_delete_uc):
    mock_delete_uc.execute.side_effect = ValueError("Category not found")
    app.dependency_overrides[get_delete_category_use_case] = lambda: mock_delete_uc

    cat_id = str(uuid.uuid4())
    response = admin_client.delete(f"/api/v1/categories/{cat_id}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"]
