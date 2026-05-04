import uuid
from unittest.mock import AsyncMock

import pytest
from app.domain.entities.contact_request import ContactRequest, RequestStatus
from app.domain.entities.user import User
from app.domain.use_cases.contact_request import (
    ApproveContactRequestUseCase,
    CancelContactRequestUseCase,
    CreateContactRequestUseCase,
    RejectContactRequestUseCase,
    SearchContactRequestsUseCase,
)
from app.schemas.pagination import Paginated


@pytest.fixture
def mock_request_repo():
    return AsyncMock()


@pytest.fixture
def mock_user_repo():
    return AsyncMock()


@pytest.fixture
def mock_audit_log_repo():
    return AsyncMock()


@pytest.fixture
def requester():
    return User.new_user("Requester", "req@x.com", "+628111111111", "h")


@pytest.fixture
def target_user():
    return User.new_user("Target", "tgt@x.com", "+628222222222", "h")


@pytest.fixture
def dummy_request(requester, target_user):
    return ContactRequest.new_request(
        requester=requester,
        target_user=target_user,
        report_id=uuid.uuid4(),
        message="Hello",
    )


@pytest.mark.asyncio
async def test_create_contact_request_success(
    mock_request_repo, mock_user_repo, mock_audit_log_repo, requester, target_user
):
    usecase = CreateContactRequestUseCase(
        mock_request_repo, mock_user_repo, mock_audit_log_repo
    )
    mock_user_repo.get_by_id.return_value = target_user
    mock_request_repo.search.return_value = []

    report_id = uuid.uuid4()
    req = await usecase.execute(
        requester=requester,
        target_user_id=target_user.id,
        report_id=report_id,
        message="I found it",
    )

    assert req.requester.id == requester.id
    assert req.target_user.id == target_user.id
    assert req.report_id == report_id
    mock_request_repo.save.assert_called_once()
    mock_audit_log_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_create_contact_request_fails_if_target_not_found(
    mock_request_repo, mock_user_repo, mock_audit_log_repo, requester
):
    usecase = CreateContactRequestUseCase(
        mock_request_repo, mock_user_repo, mock_audit_log_repo
    )
    mock_user_repo.get_by_id.return_value = None

    with pytest.raises(ValueError, match="Target user not found"):
        await usecase.execute(requester, uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_create_contact_request_fails_if_already_pending(
    mock_request_repo,
    mock_user_repo,
    mock_audit_log_repo,
    requester,
    target_user,
    dummy_request,
):
    usecase = CreateContactRequestUseCase(
        mock_request_repo, mock_user_repo, mock_audit_log_repo
    )
    mock_user_repo.get_by_id.return_value = target_user
    mock_request_repo.search.return_value = [dummy_request]

    with pytest.raises(ValueError, match="already have a pending contact request"):
        await usecase.execute(requester, target_user.id, dummy_request.report_id)


@pytest.mark.asyncio
async def test_approve_contact_request_success(
    mock_request_repo, mock_audit_log_repo, target_user, dummy_request
):
    usecase = ApproveContactRequestUseCase(mock_request_repo, mock_audit_log_repo)
    mock_request_repo.get_by_id.return_value = dummy_request

    req = await usecase.execute(actor=target_user, request_id=dummy_request.id)

    assert req.status == RequestStatus.APPROVED
    mock_request_repo.save.assert_called_once()
    mock_audit_log_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_approve_contact_request_fails_permission(
    mock_request_repo, mock_audit_log_repo, requester, dummy_request
):
    usecase = ApproveContactRequestUseCase(mock_request_repo, mock_audit_log_repo)
    mock_request_repo.get_by_id.return_value = dummy_request

    with pytest.raises(PermissionError, match="Only the target user can approve"):
        await usecase.execute(actor=requester, request_id=dummy_request.id)


@pytest.mark.asyncio
async def test_reject_contact_request_success(
    mock_request_repo, mock_audit_log_repo, target_user, dummy_request
):
    usecase = RejectContactRequestUseCase(mock_request_repo, mock_audit_log_repo)
    mock_request_repo.get_by_id.return_value = dummy_request

    req = await usecase.execute(actor=target_user, request_id=dummy_request.id)

    assert req.status == RequestStatus.REJECTED
    mock_request_repo.save.assert_called_once()
    mock_audit_log_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_cancel_contact_request_success(
    mock_request_repo, mock_audit_log_repo, requester, dummy_request
):
    usecase = CancelContactRequestUseCase(mock_request_repo, mock_audit_log_repo)
    mock_request_repo.get_by_id.return_value = dummy_request

    req = await usecase.execute(actor=requester, request_id=dummy_request.id)

    assert req.status == RequestStatus.CANCELED
    mock_request_repo.save.assert_called_once()
    mock_audit_log_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_cancel_contact_request_fails_permission(
    mock_request_repo, mock_audit_log_repo, target_user, dummy_request
):
    usecase = CancelContactRequestUseCase(mock_request_repo, mock_audit_log_repo)
    mock_request_repo.get_by_id.return_value = dummy_request

    with pytest.raises(PermissionError, match="Only the requester can cancel"):
        await usecase.execute(actor=target_user, request_id=dummy_request.id)


@pytest.mark.asyncio
async def test_search_contact_requests(mock_request_repo, dummy_request):
    usecase = SearchContactRequestsUseCase(mock_request_repo)
    mock_request_repo.search.return_value = [dummy_request]
    mock_request_repo.count_search.return_value = 1

    result = await usecase.execute(page=1, limit=10)

    assert isinstance(result, Paginated)
    assert result.total_items == 1
    assert len(result.items) == 1
