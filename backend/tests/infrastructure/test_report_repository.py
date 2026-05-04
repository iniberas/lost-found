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
from app.domain.entities.storage_location import StorageLocation
from app.infrastructure.database.models.category import CategoryModel
from app.infrastructure.database.models.proof import ProofModel
from app.infrastructure.database.models.storage_location import StorageLocationModel
from app.infrastructure.repositories.report import (
    FoundReportRepository,
    LostReportRepository,
)
from app.infrastructure.repositories.user import UserRepository
from geoalchemy2.elements import WKTElement


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


@pytest_asyncio.fixture(scope="function")
async def saved_storage_location(db_session):
    loc_id = uuid4()

    geom = WKTElement("POINT(106.8166 -6.2000)", srid=4326)
    loc_model = StorageLocationModel(
        id=loc_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="Pos Satpam Utama",
        description="Gerbang depan kampus",
        location_point=geom,
        is_active=True,
    )
    db_session.add(loc_model)
    await db_session.commit()
    return StorageLocation(
        id=loc_id,
        created_at=loc_model.created_at,
        updated_at=loc_model.updated_at,
        name="Pos Satpam Utama",
        description="Gerbang depan kampus",
        location_point=Point(-6.2000, 106.8166),
        is_active=True,
    )


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
async def test_search_sort_by_distance(db_session, saved_dummy_user, saved_category):
    repo = LostReportRepository(db_session)

    target_point = Point(-6.1754, 106.8272)

    r_near = LostReport.new_lost_report(
        reporter=saved_dummy_user,
        incident_date=datetime.now(timezone.utc),
        title="Near Monas",
        description="Lost in Gambir",
        location_name="Gambir",
        categories=[saved_category],
    )
    r_near._location_point = Point(-6.1760, 106.8270)

    r_far = LostReport.new_lost_report(
        reporter=saved_dummy_user,
        incident_date=datetime.now(timezone.utc),
        title="Far from Monas",
        description="Lost in Blok M",
        location_name="Blok M",
        categories=[saved_category],
    )
    r_far._location_point = Point(-6.2444, 106.8006)

    await repo.save(r_far)
    await repo.save(r_near)
    await db_session.commit()

    res_asc = await repo.search(
        location_point=target_point,
        sort_by="distance",
        sort_order="asc",
        location_radius=20000,
    )
    assert len(res_asc) == 2
    assert res_asc[0].id == r_near.id
    assert res_asc[1].id == r_far.id

    res_desc = await repo.search(
        location_point=target_point,
        sort_by="distance",
        sort_order="desc",
        location_radius=20000,
    )
    assert len(res_desc) == 2
    assert res_desc[0].id == r_far.id
    assert res_desc[1].id == r_near.id


@pytest.mark.asyncio
async def test_search_pagination(db_session, saved_dummy_user, saved_category):
    repo = LostReportRepository(db_session)
    now = datetime.now(timezone.utc)

    for i in range(5):
        r = LostReport.new_lost_report(
            reporter=saved_dummy_user,
            incident_date=now - timedelta(days=i),
            title=f"Report {i}",
            description="Pagination Test",
            location_name="Loc",
            categories=[saved_category],
        )

        r._created_at = now - timedelta(minutes=i)
        await repo.save(r)

    await db_session.commit()

    res = await repo.search(sort_by="created_at", sort_order="desc", limit=2, offset=1)

    assert len(res) == 2
    assert res[0].title == "Report 1"
    assert res[1].title == "Report 2"


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
    db_session,
    saved_dummy_user,
    saved_dummy_admin,
    saved_category,
    saved_storage_location,
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
        storage_location=saved_storage_location,
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
    assert saved_report.storage_location is not None
    assert saved_report.storage_location.id == saved_storage_location.id


@pytest.mark.asyncio
async def test_search_found_reports_with_complex_filters(
    db_session,
    saved_dummy_user,
    saved_dummy_admin,
    saved_category,
    saved_storage_location,
):
    repo = FoundReportRepository(db_session)
    now = datetime.now(timezone.utc)

    r1 = FoundReport.new_hand_over_report(
        reporter=saved_dummy_admin,
        incident_date=now,
        title="Found Wallet",
        description="At lobbysssssssssssssssssss",
        location_name="Lobby",
        categories=[saved_category],
        photos=["wallet.jpg"],
        finder_name="Budi",
        finder_contact="08111",
        storage_location=saved_storage_location,
    )
    r1._report_status = ReportStatus.OPEN

    r2 = FoundReport.new_found_report(
        reporter=saved_dummy_user,
        incident_date=now - timedelta(days=1),
        title="Found Keys",
        description="At parkssssssssssssssssssssssssss",
        location_name="Park",
        categories=[saved_category],
        photos=["keys.jpg"],
    )
    r2._report_status = ReportStatus.RESOLVED
    r2._found_status = FoundStatus.RETURNED_TO_OWNER

    await repo.save(r1)
    await repo.save(r2)
    await db_session.commit()

    res_storage = await repo.search(storage_location_id=saved_storage_location.id)
    assert len(res_storage) == 1
    assert res_storage[0].id == r1.id

    res_status = await repo.search(found_status=FoundStatus.RETURNED_TO_OWNER)
    assert len(res_status) == 1
    assert res_status[0].id == r2.id

    res_report_status = await repo.search(report_status=[ReportStatus.OPEN])
    assert len(res_report_status) == 1
    assert res_report_status[0].id == r1.id


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
