from datetime import datetime, timezone
from uuid import uuid4

import pytest
import pytest_asyncio
from app.domain.entities.category import Category
from app.domain.entities.contact_request import ContactRequest, RequestStatus
from app.domain.entities.report import LostReport
from app.infrastructure.database.models.category import CategoryModel
from app.infrastructure.repositories.contact_request import ContactRequestRepository
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
async def test_save_and_get_contact_request(
    db_session, saved_dummy_user, saved_dummy_admin, saved_dummy_report
):
    repo = ContactRequestRepository(db_session)
    req_id = uuid4()

    req = ContactRequest(
        id=req_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        requester=saved_dummy_user,
        target_user=saved_dummy_admin,
        report_id=saved_dummy_report.id,
        status=RequestStatus.PENDING,
        message="Saya menemukan barang Anda.",
    )

    await repo.save(req)
    await db_session.commit()

    saved_req = await repo.get_by_id(req_id)

    assert saved_req is not None
    assert saved_req.id == req_id
    assert saved_req.requester.id == saved_dummy_user.id
    assert saved_req.target_user.id == saved_dummy_admin.id
    assert saved_req.report_id == saved_dummy_report.id
    assert saved_req.status == RequestStatus.PENDING
    assert saved_req.message == "Saya menemukan barang Anda."


@pytest.mark.asyncio
async def test_update_contact_request(
    db_session, saved_dummy_user, saved_dummy_admin, saved_dummy_report
):
    repo = ContactRequestRepository(db_session)

    req = ContactRequest.new_request(
        requester=saved_dummy_user,
        target_user=saved_dummy_admin,
        report_id=saved_dummy_report.id,
        message="Barangmu ada di saya.",
    )
    await repo.save(req)
    await db_session.commit()

    req.approve()
    await repo.save(req)
    await db_session.commit()

    updated_req = await repo.get_by_id(req.id)

    assert updated_req.status == RequestStatus.APPROVED
    assert updated_req.responded_at is not None


@pytest.mark.asyncio
async def test_search_contact_request(
    db_session, saved_dummy_user, saved_dummy_admin, saved_dummy_report
):
    repo = ContactRequestRepository(db_session)

    req1 = ContactRequest.new_request(
        requester=saved_dummy_user,
        target_user=saved_dummy_admin,
        report_id=saved_dummy_report.id,
    )
    req2 = ContactRequest.new_request(
        requester=saved_dummy_admin,
        target_user=saved_dummy_user,
        report_id=saved_dummy_report.id,
    )
    req2.reject()

    await repo.save(req1)
    await repo.save(req2)
    await db_session.commit()

    res_requester = await repo.search(requester_id=saved_dummy_user.id)
    assert len(res_requester) == 1
    assert res_requester[0].id == req1.id

    res_rejected = await repo.search(status=RequestStatus.REJECTED)
    assert len(res_rejected) == 1
    assert res_rejected[0].id == req2.id


@pytest.mark.asyncio
async def test_delete_contact_request(
    db_session, saved_dummy_user, saved_dummy_admin, saved_dummy_report
):
    repo = ContactRequestRepository(db_session)
    req = ContactRequest.new_request(
        requester=saved_dummy_user,
        target_user=saved_dummy_admin,
        report_id=saved_dummy_report.id,
    )

    await repo.save(req)
    await db_session.commit()

    await repo.delete(req.id)

    deleted_req = await repo.get_by_id(req.id)
    assert deleted_req is None
