import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest
from app.core.dependencies import (
    get_audit_log_by_id_use_case,
    get_create_category_form,
    get_create_category_use_case,
    get_current_admin,
    get_current_superadmin,
    get_delete_storage_location_use_case,
    get_hand_over_to_admin_use_case,
    get_search_lost_reports_use_case,
    get_search_users_use_case,
    get_update_category_form,
    get_update_category_use_case,
    get_update_found_report_use_case,
    get_user_by_id_use_case,
)
from app.domain.entities.audit_log import ActionType, AuditLog, EntityType
from app.domain.entities.category import Category
from app.domain.entities.point import Point
from app.domain.entities.storage_location import StorageLocation
from app.domain.entities.user import Admin, SuperAdmin
from app.main import app
from app.schemas.admin import AdminCreateCategoryRequest, AdminUpdateCategoryRequest
from app.schemas.pagination import Paginated
from fastapi import HTTPException


@pytest.fixture
def mock_admin():
    return Admin.new_admin(
        name="Admin Test",
        email="admin@test.com",
        phone_number="+6201234567890",
        password_hash="hashed_password",
    )


@pytest.fixture
def mock_superadmin():
    return SuperAdmin.new_superadmin(
        id=uuid.uuid4(),
        name="Super Admin",
        email="super@test.com",
        phone_number="+6201234567890",
        password_hash="hashed_password",
    )


@pytest.fixture
def dummy_category():
    return Category(id=uuid.uuid4(), name="Electronics", is_active=True)


@pytest.fixture
def dummy_storage_location():
    return StorageLocation(
        id=uuid.uuid4(),
        name="Main Office",
        description="Lobby area",
        location_point=Point(latitude=-6.2, longitude=106.81),
        is_active=True,
    )


def test_search_users_success(unauthenticated_client, mock_admin):
    mock_uc = AsyncMock()
    mock_uc.execute.return_value = Paginated(
        items=[mock_admin], total_items=1, current_page=1, total_pages=1, limit=20
    )
    app.dependency_overrides[get_current_admin] = lambda: mock_admin
    app.dependency_overrides[get_search_users_use_case] = lambda: mock_uc

    response = unauthenticated_client.get("/api/v1/admin/users?query=Admin")

    assert response.status_code == 200
    assert response.json()["items"][0]["email"] == mock_admin.email
    mock_uc.execute.assert_called_once()


def test_create_admin_only_by_superadmin_fail(unauthenticated_client, mock_admin):
    app.dependency_overrides[get_current_admin] = lambda: mock_admin

    def mock_unauthorized_superadmin():
        raise HTTPException(status_code=403, detail="Not authorized")

    app.dependency_overrides[get_current_superadmin] = mock_unauthorized_superadmin

    payload = {
        "name": "New Admin",
        "email": "newadmin@test.com",
        "phone_number": "0812345",
        "password": "password123",
    }
    response = unauthenticated_client.post("/api/v1/admin/users/admin", json=payload)

    assert response.status_code in [403, 401]


def test_get_user_not_found(unauthenticated_client, mock_admin):
    mock_uc = AsyncMock()
    mock_uc.execute.side_effect = ValueError("User not found")
    app.dependency_overrides[get_current_admin] = lambda: mock_admin
    app.dependency_overrides[get_user_by_id_use_case] = lambda: mock_uc

    response = unauthenticated_client.get(f"/api/v1/admin/users/{uuid.uuid4()}")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


def test_create_category_duplicate_name(unauthenticated_client, mock_admin):
    mock_uc = AsyncMock()
    mock_uc.execute.side_effect = ValueError("Category already exists")
    app.dependency_overrides[get_current_admin] = lambda: mock_admin
    app.dependency_overrides[get_create_category_use_case] = lambda: mock_uc
    app.dependency_overrides[get_create_category_form] = lambda: (
        AdminCreateCategoryRequest(name="Duplicate")
    )

    response = unauthenticated_client.post(
        "/api/v1/admin/categories/", json={"name": "Duplicate"}
    )
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


def test_update_category_success(unauthenticated_client, mock_admin, dummy_category):
    mock_uc = AsyncMock()
    dummy_category.update_name("Updated Name")
    mock_uc.execute.return_value = dummy_category
    app.dependency_overrides[get_current_admin] = lambda: mock_admin
    app.dependency_overrides[get_update_category_use_case] = lambda: mock_uc
    app.dependency_overrides[get_update_category_form] = lambda: (
        AdminUpdateCategoryRequest(name="Updated Name")
    )

    response = unauthenticated_client.put(
        f"/api/v1/admin/categories/{dummy_category.id}", json={"name": "Updated Name"}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


def test_search_audit_logs_unauthorized(unauthenticated_client):

    app.dependency_overrides = {}
    response = unauthenticated_client.get("/api/v1/admin/audit-logs")
    assert response.status_code in [401, 403]


def test_get_audit_log_by_id_success(unauthenticated_client, mock_admin):
    log_id = uuid.uuid4()
    mock_log = AuditLog(
        id=log_id,
        created_at=datetime.now(timezone.utc),
        actor_id=mock_admin.id,
        entity_type=EntityType.CATEGORY,
        entity_id=uuid.uuid4(),
        action=ActionType.CREATE,
        changes={"name": "New"},
    )
    mock_uc = AsyncMock()
    mock_uc.execute.return_value = mock_log
    app.dependency_overrides[get_current_admin] = lambda: mock_admin
    app.dependency_overrides[get_audit_log_by_id_use_case] = lambda: mock_uc

    response = unauthenticated_client.get(f"/api/v1/admin/audit-logs/{log_id}")
    assert response.status_code == 200
    assert response.json()["id"] == str(log_id)
    assert response.json()["action"] == "create"


def test_create_storage_location_validation_error(unauthenticated_client, mock_admin):

    payload = {
        "name": "Warehouse",
        "description": "Valid desc",
        "location_point": {"latitude": 200, "longitude": 100},
    }
    app.dependency_overrides[get_current_admin] = lambda: mock_admin

    response = unauthenticated_client.post(
        "/api/v1/admin/storage-locations", json=payload
    )

    assert response.status_code in [422, 400]


def test_delete_storage_location_success(unauthenticated_client, mock_admin):
    mock_uc = AsyncMock()
    mock_uc.execute.return_value = None
    app.dependency_overrides[get_current_admin] = lambda: mock_admin
    app.dependency_overrides[get_delete_storage_location_use_case] = lambda: mock_uc

    loc_id = uuid.uuid4()
    response = unauthenticated_client.delete(
        f"/api/v1/admin/storage-locations/{loc_id}"
    )
    assert response.status_code == 204
    mock_uc.execute.assert_called_once_with(actor=mock_admin, location_id=loc_id)


def test_search_lost_reports_with_filters(unauthenticated_client, mock_admin):
    mock_uc = AsyncMock()
    mock_uc.execute.return_value = Paginated(
        items=[], total_items=0, current_page=1, total_pages=0, limit=20
    )
    app.dependency_overrides[get_current_admin] = lambda: mock_admin
    app.dependency_overrides[get_search_lost_reports_use_case] = lambda: mock_uc

    params = {
        "page": 1,
        "limit": 10,
        "query": "Wallet",
    }
    response = unauthenticated_client.get(
        "/api/v1/admin/reports/lost-reports", params=params
    )
    assert response.status_code == 200
    mock_uc.execute.assert_called_once()


def test_hand_over_to_admin_permission_error(unauthenticated_client, mock_admin):
    mock_uc = AsyncMock()
    mock_uc.execute.side_effect = PermissionError(
        "Not authorized to handover this report"
    )
    app.dependency_overrides[get_current_admin] = lambda: mock_admin
    app.dependency_overrides[get_hand_over_to_admin_use_case] = lambda: mock_uc

    report_id = uuid.uuid4()
    target_admin_id = uuid.uuid4()

    response = unauthenticated_client.post(
        f"/api/v1/admin/reports/found-reports/{report_id}/hand-over",
        data={"admin_id": str(target_admin_id)},
    )
    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]


def test_update_found_report_not_found(unauthenticated_client, mock_admin):
    mock_uc = AsyncMock()
    mock_uc.execute.side_effect = ValueError("Report not found")
    app.dependency_overrides[get_current_admin] = lambda: mock_admin
    app.dependency_overrides[get_update_found_report_use_case] = lambda: mock_uc

    report_id = uuid.uuid4()
    response = unauthenticated_client.put(
        f"/api/v1/admin/reports/found-reports/{report_id}",
        json={"title": "Updated Title"},
    )
    assert response.status_code == 404
