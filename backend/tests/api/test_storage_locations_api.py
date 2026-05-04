import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest
from app.core.dependencies import (
    get_search_storage_locations_use_case,
    get_storage_location_by_id_use_case,
)
from app.domain.entities.point import Point
from app.domain.entities.storage_location import StorageLocation
from app.main import app
from app.schemas.pagination import Paginated


@pytest.fixture
def mock_search_uc():
    return AsyncMock()


@pytest.fixture
def mock_get_by_id_uc():
    return AsyncMock()


@pytest.fixture
def dummy_location():
    return StorageLocation(
        id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="Pos Satpam Utama",
        description="Gerbang depan kampus",
        location_point=Point(-6.2, 106.8),
        is_active=True,
    )


@pytest.fixture
def inactive_location():
    return StorageLocation(
        id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="Gudang Lama",
        description="Gudang yang sudah tidak dipakai",
        location_point=Point(0.0, 0.0),
        is_active=False,
    )


def test_search_storage_locations_success(client, mock_search_uc, dummy_location):
    paginated_res = Paginated(
        items=[dummy_location], total_items=1, current_page=1, total_pages=1, limit=20
    )
    mock_search_uc.execute.return_value = paginated_res
    app.dependency_overrides[get_search_storage_locations_use_case] = lambda: (
        mock_search_uc
    )

    response = client.get("/api/v1/storage-locations?query=Pos")

    assert response.status_code == 200
    data = response.json()
    assert data["total_items"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == "Pos Satpam Utama"

    mock_search_uc.execute.assert_called_once_with(
        page=1, limit=20, query="Pos", is_active=True
    )


def test_get_storage_location_success(client, mock_get_by_id_uc, dummy_location):
    mock_get_by_id_uc.execute.return_value = dummy_location
    app.dependency_overrides[get_storage_location_by_id_use_case] = lambda: (
        mock_get_by_id_uc
    )

    loc_id = str(dummy_location.id)
    response = client.get(f"/api/v1/storage-locations/{loc_id}")

    assert response.status_code == 200
    assert response.json()["id"] == loc_id
    assert response.json()["name"] == dummy_location.name
    mock_get_by_id_uc.execute.assert_called_once_with(location_id=dummy_location.id)


def test_get_storage_location_not_found(client, mock_get_by_id_uc):
    mock_get_by_id_uc.execute.side_effect = ValueError("Storage location not found")
    app.dependency_overrides[get_storage_location_by_id_use_case] = lambda: (
        mock_get_by_id_uc
    )

    loc_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/storage-locations/{loc_id}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_storage_location_inactive_returns_404(
    client, mock_get_by_id_uc, inactive_location
):

    mock_get_by_id_uc.execute.return_value = inactive_location
    app.dependency_overrides[get_storage_location_by_id_use_case] = lambda: (
        mock_get_by_id_uc
    )

    loc_id = str(inactive_location.id)
    response = client.get(f"/api/v1/storage-locations/{loc_id}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
