from datetime import datetime, timezone
from uuid import uuid4

import pytest
from app.domain.entities.audit_log import ActionType, AuditLog, EntityType
from app.domain.exceptions import ValidationError


@pytest.fixture
def base_log_kwargs():
    return {
        "actor_id": uuid4(),
        "entity_type": EntityType.FOUND_REPORT,
        "entity_id": uuid4(),
        "action": ActionType.STATUS_CHANGE,
        "changes": {"status": ["open", "resolved"]},
    }


def test_new_log_success(base_log_kwargs):
    log = AuditLog.new_log(**base_log_kwargs)

    assert log.id is not None
    assert log.created_at is not None
    assert log.actor_id == base_log_kwargs["actor_id"]
    assert log.entity_type == base_log_kwargs["entity_type"]
    assert log.entity_id == base_log_kwargs["entity_id"]
    assert log.action == base_log_kwargs["action"]
    assert log.changes == base_log_kwargs["changes"]


def test_create_audit_log_fails_with_naive_datetime(base_log_kwargs):
    with pytest.raises(ValidationError, match="timezone"):
        AuditLog(
            id=uuid4(),
            created_at=datetime(2024, 1, 1),  # Naive datetime
            **base_log_kwargs,
        )


def test_changes_is_defensive_copy(base_log_kwargs):
    log = AuditLog.new_log(**base_log_kwargs)

    log.changes["new_key"] = "hacked"

    assert "new_key" not in log.changes
    assert log.changes == base_log_kwargs["changes"]


def test_audit_log_equality(base_log_kwargs):
    log_id = uuid4()
    now = datetime.now(timezone.utc)

    log1 = AuditLog(id=log_id, created_at=now, **base_log_kwargs)
    log2 = AuditLog(id=log_id, created_at=now, **base_log_kwargs)
    log3 = AuditLog.new_log(**base_log_kwargs)  # Beda ID

    assert log1 == log2
    assert log1 != log3
    assert log1 != "not an audit log"
