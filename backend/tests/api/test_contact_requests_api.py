import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest
from app.core.dependencies import (
    get_approve_contact_request_use_case,
    get_cancel_contact_request_use_case,
    get_create_contact_request_use_case,
    get_current_user,
    get_reject_contact_request_use_case,
    get_search_contact_requests_use_case,
)
from app.domain.entities.contact_request import ContactRequest, RequestStatus
from app.domain.entities.user import User
from app.domain.exceptions import ValidationError
from app.main import app
from app.schemas.pagination import Paginated


@pytest.fixture
def mock_create_uc():
    return AsyncMock()


@pytest.fixture
def mock_search_uc():
    return AsyncMock()


@pytest.fixture
def mock_approve_uc():
    return AsyncMock()


@pytest.fixture
def mock_reject_uc():
    return AsyncMock()


@pytest.fixture
def mock_cancel_uc():
    return AsyncMock()


@pytest.fixture
def dummy_requester():
    return User.new_user("Requester", "req@x.com", "+628111111111", "hash")


@pytest.fixture
def dummy_target():
    return User.new_user("Target", "tgt@x.com", "+628222222222", "hash")


@pytest.fixture
def dummy_request(dummy_requester, dummy_target):
    return ContactRequest(
        id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        requester=dummy_requester,
        target_user=dummy_target,
        report_id=uuid.uuid4(),
        status=RequestStatus.PENDING,
        message="Hello, I found your item.",
        responded_at=None,
    )


def test_create_contact_request_success(
    client, mock_create_uc, dummy_requester, dummy_request
):
    app.dependency_overrides[get_current_user] = lambda: dummy_requester
    mock_create_uc.execute.return_value = dummy_request
    app.dependency_overrides[get_create_contact_request_use_case] = lambda: (
        mock_create_uc
    )

    payload = {
        "target_user_id": str(dummy_request.target_user.id),
        "report_id": str(dummy_request.report_id),
        "message": "Hello, I found your item.",
    }

    response = client.post("/api/v1/contact-requests", json=payload)

    assert response.status_code == 201
    assert response.json()["message"] == payload["message"]
    mock_create_uc.execute.assert_called_once()


def test_create_contact_request_unprocessable(client, mock_create_uc, dummy_requester):
    app.dependency_overrides[get_current_user] = lambda: dummy_requester
    mock_create_uc.execute.side_effect = ValidationError("Invalid data")
    app.dependency_overrides[get_create_contact_request_use_case] = lambda: (
        mock_create_uc
    )

    payload = {
        "target_user_id": str(uuid.uuid4()),
        "report_id": str(uuid.uuid4()),
        "message": "",
    }

    response = client.post("/api/v1/contact-requests", json=payload)

    assert response.status_code == 422
    assert "Invalid data" in response.json()["detail"]


def test_get_my_contact_requests_incoming(
    client, mock_search_uc, dummy_target, dummy_request
):
    app.dependency_overrides[get_current_user] = lambda: dummy_target

    paginated_res = Paginated(
        items=[dummy_request], total_items=1, current_page=1, total_pages=1, limit=20
    )
    mock_search_uc.execute.return_value = paginated_res
    app.dependency_overrides[get_search_contact_requests_use_case] = lambda: (
        mock_search_uc
    )

    response = client.get("/api/v1/contact-requests?request_type=incoming")

    assert response.status_code == 200
    assert response.json()["total_items"] == 1
    mock_search_uc.execute.assert_called_once_with(
        page=1, limit=20, requester_id=None, target_user_id=dummy_target.id, status=None
    )


def test_get_my_contact_requests_outgoing(
    client, mock_search_uc, dummy_requester, dummy_request
):
    app.dependency_overrides[get_current_user] = lambda: dummy_requester

    paginated_res = Paginated(
        items=[dummy_request], total_items=1, current_page=1, total_pages=1, limit=20
    )
    mock_search_uc.execute.return_value = paginated_res
    app.dependency_overrides[get_search_contact_requests_use_case] = lambda: (
        mock_search_uc
    )

    response = client.get("/api/v1/contact-requests?request_type=outgoing")

    assert response.status_code == 200
    assert response.json()["total_items"] == 1
    mock_search_uc.execute.assert_called_once_with(
        page=1,
        limit=20,
        requester_id=dummy_requester.id,
        target_user_id=None,
        status=None,
    )


def test_get_my_contact_requests_invalid_type(client, dummy_requester):
    app.dependency_overrides[get_current_user] = lambda: dummy_requester

    response = client.get("/api/v1/contact-requests?request_type=invalid_type")

    assert response.status_code == 400
    assert "request_type must be" in response.json()["detail"]


def test_approve_request_success(client, mock_approve_uc, dummy_target, dummy_request):
    app.dependency_overrides[get_current_user] = lambda: dummy_target
    dummy_request._status = RequestStatus.APPROVED
    mock_approve_uc.execute.return_value = dummy_request
    app.dependency_overrides[get_approve_contact_request_use_case] = lambda: (
        mock_approve_uc
    )

    req_id = str(dummy_request.id)
    response = client.post(f"/api/v1/contact-requests/{req_id}/approve")

    assert response.status_code == 200
    assert response.json()["status"] == RequestStatus.APPROVED.value
    mock_approve_uc.execute.assert_called_once()


def test_approve_request_forbidden(client, mock_approve_uc, dummy_target):
    app.dependency_overrides[get_current_user] = lambda: dummy_target
    mock_approve_uc.execute.side_effect = PermissionError("Not allowed")
    app.dependency_overrides[get_approve_contact_request_use_case] = lambda: (
        mock_approve_uc
    )

    req_id = str(uuid.uuid4())
    response = client.post(f"/api/v1/contact-requests/{req_id}/approve")

    assert response.status_code == 403
    assert "Not allowed" in response.json()["detail"]


def test_reject_request_success(client, mock_reject_uc, dummy_target, dummy_request):
    app.dependency_overrides[get_current_user] = lambda: dummy_target
    dummy_request._status = RequestStatus.REJECTED
    mock_reject_uc.execute.return_value = dummy_request
    app.dependency_overrides[get_reject_contact_request_use_case] = lambda: (
        mock_reject_uc
    )

    req_id = str(dummy_request.id)
    response = client.post(f"/api/v1/contact-requests/{req_id}/reject")

    assert response.status_code == 200
    assert response.json()["status"] == RequestStatus.REJECTED.value
    mock_reject_uc.execute.assert_called_once()


def test_cancel_request_success(client, mock_cancel_uc, dummy_requester, dummy_request):
    app.dependency_overrides[get_current_user] = lambda: dummy_requester
    dummy_request._status = RequestStatus.CANCELED
    mock_cancel_uc.execute.return_value = dummy_request
    app.dependency_overrides[get_cancel_contact_request_use_case] = lambda: (
        mock_cancel_uc
    )

    req_id = str(dummy_request.id)
    response = client.post(f"/api/v1/contact-requests/{req_id}/cancel")

    assert response.status_code == 200
    assert response.json()["status"] == RequestStatus.CANCELED.value
    mock_cancel_uc.execute.assert_called_once()


def test_cancel_request_not_found(client, mock_cancel_uc, dummy_requester):
    app.dependency_overrides[get_current_user] = lambda: dummy_requester
    mock_cancel_uc.execute.side_effect = ValueError("Request not found")
    app.dependency_overrides[get_cancel_contact_request_use_case] = lambda: (
        mock_cancel_uc
    )

    req_id = str(uuid.uuid4())
    response = client.post(f"/api/v1/contact-requests/{req_id}/cancel")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
