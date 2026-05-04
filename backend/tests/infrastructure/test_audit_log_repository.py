from datetime import datetime, timezone
from uuid import uuid4

import pytest
import pytest_asyncio
from app.domain.entities.audit_log import ActionType, AuditLog, EntityType
from app.domain.entities.category import Category
from app.domain.entities.report import LostReport
from app.infrastructure.database.models.category import CategoryModel
from app.infrastructure.repositories.audit_log import AuditLogRepository
from app.infrastructure.repositories.report import LostReportRepository
from app.infrastructure.repositories.user import UserRepository


@pytest_asyncio.fixture(scope="function")
async def saved_dummy_user(db_session, dummy_user):
    repo = UserRepository(db_session)
    await repo.save(dummy_user)
    await db_session.commit()
    return dummy_user


@pytest_asyncio.fixture(scope="function")
async def saved_dummy_admin(db_session, dummy_admin):
    repo = UserRepository(db_session)
    await repo.save(dummy_admin)
    await db_session.commit()
    return dummy_admin


@pytest_asyncio.fixture(scope="function")
async def saved_dummy_report(db_session, saved_dummy_user):

    cat_id = uuid4()
    cat_model = CategoryModel(id=cat_id, name="Test Category", is_active=True)
    db_session.add(cat_model)
    await db_session.commit()
    cat = Category(id=cat_id, name="Test Category", is_active=True)

    repo = LostReportRepository(db_session)
    report = LostReport.new_lost_report(
        reporter=saved_dummy_user,
        incident_date=datetime.now(timezone.utc),
        title="Dummy Report for FK",
        description="This is needed to satisfy foreign key constraints.",
        location_name="Test Location",
        categories=[cat],
    )
    await repo.save(report)
    await db_session.commit()
    return report


@pytest.mark.asyncio
async def test_save_and_get_audit_log(db_session, saved_dummy_user, saved_dummy_report):
    repo = AuditLogRepository(db_session)
    log_id = uuid4()

    log = AuditLog(
        id=log_id,
        created_at=datetime.now(timezone.utc),
        actor_id=saved_dummy_user.id,
        entity_type=EntityType.FOUND_REPORT,
        entity_id=saved_dummy_report.id,
        action=ActionType.STATUS_CHANGE,
        changes={"old_status": "open", "new_status": "resolved"},
    )

    await repo.save(log)
    await db_session.commit()

    saved_log = await repo.get_by_id(log_id)

    assert saved_log is not None
    assert saved_log.id == log_id
    assert saved_log.actor_id == saved_dummy_user.id
    assert saved_log.entity_type == EntityType.FOUND_REPORT
    assert saved_log.action == ActionType.STATUS_CHANGE
    assert saved_log.changes["new_status"] == "resolved"


@pytest.mark.asyncio
async def test_search_and_count_audit_logs(
    db_session, saved_dummy_user, saved_dummy_admin, saved_dummy_report
):
    repo = AuditLogRepository(db_session)

    logs = [
        AuditLog.new_log(
            actor_id=saved_dummy_user.id,
            entity_type=EntityType.LOST_REPORT,
            entity_id=saved_dummy_report.id,
            action=ActionType.CREATE,
        ),
        AuditLog.new_log(
            actor_id=saved_dummy_user.id,
            entity_type=EntityType.FOUND_REPORT,
            entity_id=saved_dummy_report.id,
            action=ActionType.HANDOVER,
        ),
        AuditLog.new_log(
            actor_id=saved_dummy_admin.id,
            entity_type=EntityType.LOST_REPORT,
            entity_id=saved_dummy_report.id,
            action=ActionType.UPDATE,
        ),
    ]

    for log in logs:
        await repo.save(log)
    await db_session.commit()

    res_actor_1 = await repo.search(actor_id=saved_dummy_user.id)
    assert len(res_actor_1) == 2

    count_actor_2 = await repo.count_search(actor_id=saved_dummy_admin.id)
    assert count_actor_2 == 1

    res_action = await repo.search(action=ActionType.CREATE)
    assert len(res_action) == 1
    assert res_action[0].actor_id == saved_dummy_user.id
