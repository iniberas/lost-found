from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
import pytest_asyncio
from app.domain.entities.category import Category
from app.domain.entities.point import Point
from app.domain.entities.proof import Proof
from app.domain.entities.report import (
    FoundReport,
    FoundStatus,
    LostReport,
    ReportStatus,
)
from app.infrastructure.database.models.category import CategoryModel
from app.infrastructure.database.models.proof import ProofModel
from app.infrastructure.repositories.report import (
    FoundReportRepository,
    LostReportRepository,
)
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
async def saved_category(db_session):

    cat_id = uuid4()
    cat_model = CategoryModel(id=cat_id, name="Electronics", is_active=True)
    db_session.add(cat_model)
    await db_session.commit()
    return Category(id=cat_id, name="Electronics", is_active=True)


@pytest_asyncio.fixture(scope="function")
async def saved_category_2(db_session):
    cat_id = uuid4()
    cat_model = CategoryModel(id=cat_id, name="Wallets", is_active=True)
    db_session.add(cat_model)
    await db_session.commit()
    return Category(id=cat_id, name="Wallets", is_active=True)


@pytest.mark.asyncio
async def test_save_and_get_lost_report(db_session, saved_dummy_user, saved_category):
    repo = LostReportRepository(db_session)

    report_id = uuid4()
    point = Point(latitude=-6.2000, longitude=106.8166)

    report = LostReport(
        id=report_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        reporter=saved_dummy_user,
        report_status=ReportStatus.OPEN,
        incident_date=datetime.now(timezone.utc) - timedelta(days=1),
        title="Lost my Phone",
        description="Lost it somewhere near the park.",
        location_name="Central Park",
        categories=[saved_category],
        photos=["phone.jpg"],
        location_point=point,
    )

    await repo.save(report)
    await db_session.commit()

    saved_report = await repo.get_by_id(report_id)

    assert saved_report is not None
    assert saved_report.id == report_id
    assert saved_report.title == "Lost my Phone"
    assert saved_report.reporter.id == saved_dummy_user.id
    assert len(saved_report.categories) == 1
    assert saved_report.categories[0].id == saved_category.id
    assert saved_report.location_point.latitude == pytest.approx(-6.2000)
    assert saved_report.location_point.longitude == pytest.approx(106.8166)


@pytest.mark.asyncio
async def test_update_lost_report(
    db_session, saved_dummy_user, saved_category, saved_category_2
):
    repo = LostReportRepository(db_session)

    report = LostReport.new_lost_report(
        reporter=saved_dummy_user,
        incident_date=datetime.now(timezone.utc) - timedelta(days=1),
        title="Original Title",
        description="Original Desc",
        location_name="Area 51",
        categories=[saved_category],
        photos=["1.jpg"],
    )
    await repo.save(report)
    await db_session.commit()

    report.update_title("Updated Title")
    report.confirm_found()
    report.update_categories([saved_category_2])

    await repo.save(report)
    await db_session.commit()

    updated_report = await repo.get_by_id(report.id)

    assert updated_report.title == "Updated Title"
    assert updated_report.report_status == ReportStatus.RESOLVED
    assert len(updated_report.categories) == 1
    assert updated_report.categories[0].id == saved_category_2.id


@pytest.mark.asyncio
async def test_search_lost_reports_with_filters(
    db_session, saved_dummy_user, saved_category
):
    repo = LostReportRepository(db_session)
    now = datetime.now(timezone.utc)

    r1 = LostReport.new_lost_report(
        reporter=saved_dummy_user,
        incident_date=now,
        title="Red Wallet",
        description="Lost inside the mall",
        location_name="Mall",
        categories=[saved_category],
    )

    r2 = LostReport.new_lost_report(
        reporter=saved_dummy_user,
        incident_date=now - timedelta(days=5),
        title="Blue Backpack",
        description="Lost at the train station",
        location_name="Station",
        categories=[saved_category],
    )

    await repo.save(r1)
    await repo.save(r2)
    await db_session.commit()

    res_query = await repo.search(query="backpack")
    assert len(res_query) == 1
    assert res_query[0].id == r2.id

    res_date = await repo.search(incident_date_from=now - timedelta(days=1))
    assert len(res_date) == 1
    assert res_date[0].id == r1.id

    count = await repo.count_search(query="Lost")
    assert count == 2


@pytest.mark.asyncio
async def test_spatial_search_lost_reports(
    db_session, saved_dummy_user, saved_category
):
    repo = LostReportRepository(db_session)

    r_jkt = LostReport.new_lost_report(
        reporter=saved_dummy_user,
        incident_date=datetime.now(timezone.utc),
        title="Lost in Jakarta",
        description="Desc 1234567890",
        location_name="Jakarta",
        categories=[saved_category],
    )
    r_jkt._location_point = Point(-6.2, 106.8)

    r_lon = LostReport.new_lost_report(
        reporter=saved_dummy_user,
        incident_date=datetime.now(timezone.utc),
        title="Lost in London",
        description="Desc 1234567890",
        location_name="London",
        categories=[saved_category],
    )
    r_lon._location_point = Point(51.5, -0.1)

    await repo.save(r_jkt)
    await repo.save(r_lon)
    await db_session.commit()

    target_point = Point(-6.205, 106.805)
    radius_meters = 10000

    results = await repo.search(
        location_point=target_point, location_radius=radius_meters
    )

    assert len(results) == 1
    assert results[0].title == "Lost in Jakarta"


@pytest.mark.asyncio
async def test_save_and_get_found_report(
    db_session, saved_dummy_user, saved_dummy_admin, saved_category
):
    repo = FoundReportRepository(db_session)

    report_id = uuid4()

    report = FoundReport(
        id=report_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        reporter=saved_dummy_user,
        report_status=ReportStatus.OPEN,
        found_status=FoundStatus.HELD_BY_ADMIN,
        incident_date=datetime.now(timezone.utc) - timedelta(hours=2),
        title="Found Keys",
        description="Found a set of keys",
        location_name="Lobby",
        categories=[saved_category],
        photos=["keys.jpg"],
        holder=saved_dummy_admin,
        finder_name="Jane Doe",
        finder_contact="08111111111",
    )

    await repo.save(report)
    await db_session.commit()

    saved_report = await repo.get_by_id(report_id)

    assert saved_report is not None
    assert saved_report.id == report_id
    assert saved_report.title == "Found Keys"
    assert saved_report.holder.id == saved_dummy_admin.id
    assert saved_report.finder_name == "Jane Doe"
    assert saved_report.found_status == FoundStatus.HELD_BY_ADMIN


@pytest.mark.asyncio
async def test_update_found_report_with_proof(
    db_session, saved_dummy_user, saved_category
):
    repo = FoundReportRepository(db_session)

    report = FoundReport.new_found_report(
        reporter=saved_dummy_user,
        incident_date=datetime.now(timezone.utc) - timedelta(hours=2),
        title="Found Keys",
        description="Found a set of keys",
        location_name="Lobby",
        categories=[saved_category],
        photos=["keys.jpg"],
    )

    await repo.save(report)
    await db_session.commit()

    proof_id = uuid4()
    proof_model = ProofModel(
        id=proof_id,
        created_at=datetime.now(timezone.utc),
        photos=["proof1.jpg"],
        notes="Handed to owner safely",
    )
    db_session.add(proof_model)
    await db_session.commit()

    proof_entity = Proof(
        id=proof_id,
        created_at=proof_model.created_at,
        photos=["proof1.jpg"],
        notes="Handed to owner safely",
    )

    report.confirm_return(proof_entity)
    await repo.save(report)
    await db_session.commit()

    updated_report = await repo.get_by_id(report.id)

    assert updated_report.report_status == ReportStatus.RESOLVED
    assert updated_report.found_status == FoundStatus.RETURNED_TO_OWNER
    assert updated_report.proof is not None
    assert updated_report.proof.id == proof_id
    assert updated_report.proof.notes == "Handed to owner safely"


@pytest.mark.asyncio
async def test_find_potential_matches(db_session, saved_dummy_user, saved_category):
    lost_repo = LostReportRepository(db_session)
    found_repo = FoundReportRepository(db_session)

    point_a = Point(-6.200, 106.816)
    point_b = Point(-6.205, 106.810)

    lost_report = LostReport.new_lost_report(
        reporter=saved_dummy_user,
        incident_date=datetime.now(timezone.utc),
        title="Lost Laptop",
        description="Lost at cafe",
        location_name="Cafe",
        categories=[saved_category],
        photos=[],
    )
    lost_report._location_point = point_a

    found_report = FoundReport.new_found_report(
        reporter=saved_dummy_user,
        incident_date=datetime.now(timezone.utc),
        title="Found Laptop",
        description="Found near cafe",
        location_name="Cafe Area",
        categories=[saved_category],
        photos=["laptop.jpg"],
    )
    found_report._location_point = point_b

    await lost_repo.save(lost_report)
    await found_repo.save(found_report)
    await db_session.commit()

    lost_matches = await lost_repo.find_potential_matches(found_report)
    assert len(lost_matches) == 1
    assert lost_matches[0].id == lost_report.id

    found_matches = await found_repo.find_potential_matches(lost_report)
    assert len(found_matches) == 1
    assert found_matches[0].id == found_report.id
