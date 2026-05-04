from unittest.mock import AsyncMock

import pytest
from app.core.dependencies import get_search_categories_use_case
from app.domain.entities.category import Category
from app.main import app


@pytest.fixture
def mock_search_uc():
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


def test_search_categories_empty_result(unauthenticated_client, mock_search_uc):
    mock_search_uc.execute.return_value = []
    app.dependency_overrides[get_search_categories_use_case] = lambda: mock_search_uc

    response = unauthenticated_client.get("/api/v1/categories?query=UnknownCategory")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0

    mock_search_uc.execute.assert_called_once_with(query="UnknownCategory")
