import uuid
from unittest.mock import AsyncMock

import pytest
from app.domain.entities.audit_log import ActionType, AuditLog, EntityType
from app.domain.entities.user import Admin, User
from app.domain.use_cases.audit_log import (
    GetAuditLogByIdUseCase,
    SearchAuditLogsUseCase,
)
from app.schemas.pagination import Paginated


@pytest.fixture
def mock_audit_log_repo():
    return AsyncMock()


@pytest.fixture
def admin_actor():
    return Admin.new_admin(
        name="Admin",
        email="admin@example.com",
        phone_number="+628111111111",
        password_hash="hash",
    )


@pytest.fixture
def user_actor():
    return User.new_user(
        name="User",
        email="user@example.com",
        phone_number="+628222222222",
        password_hash="hash",
    )


@pytest.fixture
def dummy_log():
    return AuditLog.new_log(
        actor_id=uuid.uuid4(),
        entity_type=EntityType.FOUND_REPORT,
        entity_id=uuid.uuid4(),
        action=ActionType.CREATE,
    )


@pytest.mark.asyncio
async def test_get_audit_log_by_id_success(mock_audit_log_repo, admin_actor, dummy_log):
    usecase = GetAuditLogByIdUseCase(mock_audit_log_repo)
    mock_audit_log_repo.get_by_id.return_value = dummy_log

    result = await usecase.execute(actor=admin_actor, log_id=dummy_log.id)

    assert result.id == dummy_log.id
    mock_audit_log_repo.get_by_id.assert_called_once_with(dummy_log.id)


@pytest.mark.asyncio
async def test_get_audit_log_by_id_fails_if_not_admin(
    mock_audit_log_repo, user_actor, dummy_log
):
    usecase = GetAuditLogByIdUseCase(mock_audit_log_repo)

    with pytest.raises(
        PermissionError, match="Only administrators can view audit logs"
    ):
        await usecase.execute(actor=user_actor, log_id=dummy_log.id)

    mock_audit_log_repo.get_by_id.assert_not_called()


@pytest.mark.asyncio
async def test_get_audit_log_by_id_not_found(mock_audit_log_repo, admin_actor):
    usecase = GetAuditLogByIdUseCase(mock_audit_log_repo)
    mock_audit_log_repo.get_by_id.return_value = None

    with pytest.raises(ValueError, match="Audit log not found"):
        await usecase.execute(actor=admin_actor, log_id=uuid.uuid4())


@pytest.mark.asyncio
async def test_search_audit_logs_success(mock_audit_log_repo, admin_actor, dummy_log):
    usecase = SearchAuditLogsUseCase(mock_audit_log_repo)
    mock_audit_log_repo.search.return_value = [dummy_log]
    mock_audit_log_repo.count_search.return_value = 1

    result = await usecase.execute(actor=admin_actor, page=1, limit=10)

    assert isinstance(result, Paginated)
    assert result.total_items == 1
    assert len(result.items) == 1
    assert result.items[0].id == dummy_log.id
    mock_audit_log_repo.search.assert_called_once()
    mock_audit_log_repo.count_search.assert_called_once()


@pytest.mark.asyncio
async def test_search_audit_logs_fails_if_not_admin(mock_audit_log_repo, user_actor):
    usecase = SearchAuditLogsUseCase(mock_audit_log_repo)

    with pytest.raises(
        PermissionError, match="Only administrators can view audit logs"
    ):
        await usecase.execute(actor=user_actor, page=1, limit=10)

    mock_audit_log_repo.search.assert_not_called()
