import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest
from app.core.dependencies import (
    get_create_found_report_use_case,
    get_delete_found_report_use_case,
    get_found_report_by_id_use_case,
    get_hand_over_to_admin_use_case,
    get_potential_lost_reports_use_case,
    get_resolve_found_report_use_case,
    get_search_found_reports_use_case,
    get_update_found_report_use_case,
)
from app.domain.entities.category import Category
from app.domain.entities.point import Point
from app.domain.entities.report import (
    FoundReport,
    FoundStatus,
    LostReport,
    ReportStatus,
)
from app.domain.entities.user import Admin, User
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
def mock_create_hand_over_uc():
    return AsyncMock()


@pytest.fixture
def mock_update_uc():
    return AsyncMock()


@pytest.fixture
def mock_resolve_uc():
    return AsyncMock()


@pytest.fixture
def mock_hand_over_admin_uc():
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
def dummy_admin():
    return Admin.new_admin("Super", "admin@x.com", "+6201234567890", "hash")


@pytest.fixture
def dummy_category():
    return Category.new_category("Electronics")


@pytest.fixture
def dummy_found_report(dummy_reporter, dummy_category):
    report = FoundReport.new_found_report(
        reporter=dummy_reporter,
        incident_date=datetime.now(timezone.utc),
        title="Found Laptop",
        description="Found it somewhere.",
        location_name="Cafe",
        categories=[dummy_category],
        photos=["found.jpg"],
        location_point=Point(-6.2, 106.8),
    )
    return report


@pytest.fixture
def dummy_lost_report(dummy_reporter, dummy_category):
    report = LostReport.new_lost_report(
        reporter=dummy_reporter,
        incident_date=datetime.now(timezone.utc),
        title="Lost a Laptop",
        description="Lost near the cafe.",
        location_name="Cafe Area",
        categories=[dummy_category],
        photos=["lost.jpg"],
    )
    return report


def test_search_found_reports_success(
    unauthenticated_client, mock_search_uc, dummy_found_report
):
    paginated_result = Paginated(
        items=[dummy_found_report],
        total_items=1,
        current_page=1,
        total_pages=1,
        limit=20,
    )
    mock_search_uc.execute.return_value = paginated_result
    app.dependency_overrides[get_search_found_reports_use_case] = lambda: mock_search_uc

    response = unauthenticated_client.get("/api/v1/found-reports?query=Laptop&limit=10")

    assert response.status_code == 200
    data = response.json()
    assert data["total_items"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Found Laptop"
    assert data["items"][0]["id"] == str(dummy_found_report.id)


def test_get_found_report_by_id_success(
    unauthenticated_client, mock_get_by_id_uc, dummy_found_report
):
    mock_get_by_id_uc.execute.return_value = dummy_found_report
    app.dependency_overrides[get_found_report_by_id_use_case] = lambda: (
        mock_get_by_id_uc
    )

    report_id = str(dummy_found_report.id)
    response = unauthenticated_client.get(f"/api/v1/found-reports/{report_id}")

    assert response.status_code == 200
    assert response.json()["id"] == report_id


def test_get_found_report_by_id_not_found(unauthenticated_client, mock_get_by_id_uc):
    mock_get_by_id_uc.execute.side_effect = ValueError("Found report not found")
    app.dependency_overrides[get_found_report_by_id_use_case] = lambda: (
        mock_get_by_id_uc
    )

    response = unauthenticated_client.get(f"/api/v1/found-reports/{uuid.uuid4()}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_create_found_report_success(
    client, mock_create_uc, dummy_found_report, dummy_category
):
    mock_create_uc.execute.return_value = dummy_found_report
    app.dependency_overrides[get_create_found_report_use_case] = lambda: mock_create_uc

    form_data = {
        "title": "Found Laptop",
        "description": "Found it somewhere.",
        "location_name": "Cafe",
        "incident_date": datetime.now(timezone.utc).isoformat(),
        "category_ids": [str(dummy_category.id)],
        "latitude": -6.2,
        "longitude": 106.8,
    }

    files = {"photos": ("found.jpg", b"fake_image_data", "image/jpeg")}

    response = client.post("/api/v1/found-reports", data=form_data, files=files)

    assert response.status_code == 201
    assert response.json()["title"] == "Found Laptop"
    mock_create_uc.execute.assert_called_once()


def test_update_found_report_success(client, mock_update_uc, dummy_found_report):
    mock_update_uc.execute.return_value = dummy_found_report
    app.dependency_overrides[get_update_found_report_use_case] = lambda: mock_update_uc

    form_data = {"title": "Updated Title", "description": "Updated Description"}

    report_id = str(dummy_found_report.id)
    response = client.patch(f"/api/v1/found-reports/{report_id}", data=form_data)

    assert response.status_code == 200
    mock_update_uc.execute.assert_called_once()


def test_resolve_found_report_success(client, mock_resolve_uc, dummy_found_report):
    dummy_found_report._update_found_status(FoundStatus.RETURNED_TO_OWNER)
    dummy_found_report._report_status = ReportStatus.RESOLVED

    mock_resolve_uc.execute.return_value = dummy_found_report
    app.dependency_overrides[get_resolve_found_report_use_case] = lambda: (
        mock_resolve_uc
    )

    form_data = {"notes": "Item given back to the owner safely."}

    files = {"proof_photos": ("proof.jpg", b"fake_proof_data", "image/jpeg")}

    report_id = str(dummy_found_report.id)
    response = client.post(
        f"/api/v1/found-reports/{report_id}/resolve", data=form_data, files=files
    )

    assert response.status_code == 200
    assert response.json()["report_status"] == ReportStatus.RESOLVED.value
    assert response.json()["found_status"] == FoundStatus.RETURNED_TO_OWNER.value
    mock_resolve_uc.execute.assert_called_once()


def test_hand_over_to_admin_success(
    client, mock_hand_over_admin_uc, dummy_found_report, dummy_admin
):
    dummy_found_report._update_found_status(FoundStatus.HELD_BY_ADMIN)

    mock_hand_over_admin_uc.execute.return_value = dummy_found_report
    app.dependency_overrides[get_hand_over_to_admin_use_case] = lambda: (
        mock_hand_over_admin_uc
    )

    report_id = str(dummy_found_report.id)
    admin_id = str(dummy_admin.id)

    form_data = {"admin_id": admin_id}

    response = client.post(
        f"/api/v1/found-reports/{report_id}/hand_over-to-admin", data=form_data
    )

    assert response.status_code == 200
    assert response.json()["found_status"] == FoundStatus.HELD_BY_ADMIN.value
    mock_hand_over_admin_uc.execute.assert_called_once()


def test_delete_found_report_success(client, mock_delete_uc):
    mock_delete_uc.execute.return_value = None
    app.dependency_overrides[get_delete_found_report_use_case] = lambda: mock_delete_uc

    report_id = str(uuid.uuid4())
    response = client.delete(f"/api/v1/found-reports/{report_id}")

    assert response.status_code == 204
    mock_delete_uc.execute.assert_called_once()


def test_potential_matches_success(
    unauthenticated_client, mock_potential_matches_uc, dummy_lost_report
):
    mock_potential_matches_uc.execute.return_value = [dummy_lost_report]
    app.dependency_overrides[get_potential_lost_reports_use_case] = lambda: (
        mock_potential_matches_uc
    )

    report_id = str(uuid.uuid4())
    response = unauthenticated_client.get(
        f"/api/v1/found-reports/{report_id}/potential-matches"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == str(dummy_lost_report.id)
