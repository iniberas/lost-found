import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest
from app.core.dependencies import (
    get_create_lost_report_use_case,
    get_delete_lost_report_use_case,
    get_lost_report_by_id_use_case,
    get_potential_found_reports_use_case,
    get_resolve_lost_report_use_case,
    get_search_lost_reports_use_case,
    get_update_lost_report_use_case,
)
from app.domain.entities.category import Category
from app.domain.entities.point import Point
from app.domain.entities.report import FoundReport, LostReport, ReportStatus
from app.domain.entities.user import User
from app.main import app
from app.schemas.pagination import Paginated


@pytest.fixture
def mock_search_uc():
    return AsyncMock()


@pytest.fixture
def mock_get_by_id_uc():
    return AsyncMock()


@pytest.fixture
def mock_create_uc():
    return AsyncMock()


@pytest.fixture
def mock_update_uc():
    return AsyncMock()


@pytest.fixture
def mock_resolve_uc():
    return AsyncMock()


@pytest.fixture
def mock_delete_uc():
    return AsyncMock()


@pytest.fixture
def mock_potential_matches_uc():
    return AsyncMock()


@pytest.fixture
def dummy_reporter():
    return User.new_user("John", "john@x.com", "+6201234567890", "hash")


@pytest.fixture
def dummy_category():
    return Category.new_category("Electronics")


@pytest.fixture
def dummy_lost_report(dummy_reporter, dummy_category):
    report = LostReport.new_lost_report(
        reporter=dummy_reporter,
        incident_date=datetime.now(timezone.utc),
        title="Lost Laptop",
        description="Lost it somewhere.",
        location_name="Cafe",
        categories=[dummy_category],
        photos=["laptop.jpg"],
        location_point=Point(-6.2, 106.8),
    )
    return report


@pytest.fixture
def dummy_found_report(dummy_reporter, dummy_category):
    report = FoundReport.new_found_report(
        reporter=dummy_reporter,
        incident_date=datetime.now(timezone.utc),
        title="Found a Laptop",
        description="Found near the cafe.",
        location_name="Cafe Area",
        categories=[dummy_category],
        photos=["found_laptop.jpg"],
    )
    return report


def test_search_lost_reports_success(
    unauthenticated_client, mock_search_uc, dummy_lost_report
):

    paginated_result = Paginated(
        items=[dummy_lost_report],
        total_items=1,
        current_page=1,
        total_pages=1,
        limit=20,
    )
    mock_search_uc.execute.return_value = paginated_result
    app.dependency_overrides[get_search_lost_reports_use_case] = lambda: mock_search_uc

    response = unauthenticated_client.get("/api/v1/lost-reports?query=Laptop&limit=10")

    assert response.status_code == 200
    data = response.json()
    assert data["total_items"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Lost Laptop"
    assert data["items"][0]["id"] == str(dummy_lost_report.id)


def test_get_lost_report_by_id_success(
    unauthenticated_client, mock_get_by_id_uc, dummy_lost_report
):
    mock_get_by_id_uc.execute.return_value = dummy_lost_report
    app.dependency_overrides[get_lost_report_by_id_use_case] = lambda: mock_get_by_id_uc

    report_id = str(dummy_lost_report.id)
    response = unauthenticated_client.get(f"/api/v1/lost-reports/{report_id}")

    assert response.status_code == 200
    assert response.json()["id"] == report_id


def test_get_lost_report_by_id_not_found(unauthenticated_client, mock_get_by_id_uc):
    mock_get_by_id_uc.execute.side_effect = ValueError("Lost report not found")
    app.dependency_overrides[get_lost_report_by_id_use_case] = lambda: mock_get_by_id_uc

    response = unauthenticated_client.get(f"/api/v1/lost-reports/{uuid.uuid4()}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_create_lost_report_success(
    client, mock_create_uc, dummy_lost_report, dummy_category
):
    mock_create_uc.execute.return_value = dummy_lost_report
    app.dependency_overrides[get_create_lost_report_use_case] = lambda: mock_create_uc

    form_data = {
        "title": "Lost Laptop",
        "description": "Lost it somewhere.",
        "location_name": "Cafe",
        "incident_date": datetime.now(timezone.utc).isoformat(),
        "category_ids": [str(dummy_category.id)],
        "latitude": -6.2,
        "longitude": 106.8,
    }

    files = {"photos": ("laptop.jpg", b"fake_image_data", "image/jpeg")}

    response = client.post("/api/v1/lost-reports", data=form_data, files=files)

    assert response.status_code == 201
    assert response.json()["title"] == "Lost Laptop"
    mock_create_uc.execute.assert_called_once()


def test_update_lost_report_success(client, mock_update_uc, dummy_lost_report):
    mock_update_uc.execute.return_value = dummy_lost_report
    app.dependency_overrides[get_update_lost_report_use_case] = lambda: mock_update_uc

    form_data = {"title": "Updated Title", "description": "Updated Description"}

    report_id = str(dummy_lost_report.id)
    response = client.patch(f"/api/v1/lost-reports/{report_id}", data=form_data)

    assert response.status_code == 200
    mock_update_uc.execute.assert_called_once()


def test_update_lost_report_forbidden(client, mock_update_uc):
    mock_update_uc.execute.side_effect = PermissionError(
        "You can only edit your own reports"
    )
    app.dependency_overrides[get_update_lost_report_use_case] = lambda: mock_update_uc

    form_data = {"title": "Updated"}
    response = client.patch(f"/api/v1/lost-reports/{uuid.uuid4()}", data=form_data)

    assert response.status_code == 403
    assert "own reports" in response.json()["detail"]


def test_resolve_lost_report_success(client, mock_resolve_uc, dummy_lost_report):

    dummy_lost_report.confirm_found()
    mock_resolve_uc.execute.return_value = dummy_lost_report
    app.dependency_overrides[get_resolve_lost_report_use_case] = lambda: mock_resolve_uc

    report_id = str(dummy_lost_report.id)
    response = client.post(f"/api/v1/lost-reports/{report_id}/resolve")

    assert response.status_code == 200
    assert response.json()["report_status"] == ReportStatus.RESOLVED.value
    mock_resolve_uc.execute.assert_called_once()


def test_delete_lost_report_success(client, mock_delete_uc):
    mock_delete_uc.execute.return_value = None
    app.dependency_overrides[get_delete_lost_report_use_case] = lambda: mock_delete_uc

    report_id = str(uuid.uuid4())
    response = client.delete(f"/api/v1/lost-reports/{report_id}")

    assert response.status_code == 204
    mock_delete_uc.execute.assert_called_once()


def test_delete_lost_report_not_found(client, mock_delete_uc):
    mock_delete_uc.execute.side_effect = ValueError("Lost report not found")
    app.dependency_overrides[get_delete_lost_report_use_case] = lambda: mock_delete_uc

    response = client.delete(f"/api/v1/lost-reports/{uuid.uuid4()}")

    assert response.status_code == 404


def test_potential_matches_success(
    unauthenticated_client, mock_potential_matches_uc, dummy_found_report
):
    mock_potential_matches_uc.execute.return_value = [dummy_found_report]
    app.dependency_overrides[get_potential_found_reports_use_case] = lambda: (
        mock_potential_matches_uc
    )

    report_id = str(uuid.uuid4())
    response = unauthenticated_client.get(
        f"/api/v1/lost-reports/{report_id}/potential-matches"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == str(dummy_found_report.id)
