import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import pytest
from app.domain.entities.category import Category
from app.domain.entities.report import (
    FoundReport,
    FoundStatus,
    LostReport,
    ReportStatus,
)
from app.domain.entities.user import Admin, User
from app.domain.use_cases.report import (
    CreateFoundReportUseCase,
    CreateHandOverReportUseCase,
    CreateLostReportUseCase,
    DeleteFoundReportUseCase,
    DeleteLostReportUseCase,
    FindPotentialFoundReportsUseCase,
    FindPotentialLostReportsUseCase,
    GetLostReportByIdUseCase,
    HandOverToAdminUseCase,
    ResolveFoundReportUseCase,
    ResolveLostReportUseCase,
    SearchLostReportsUseCase,
    UpdateFoundReportUseCase,
    UpdateLostReportUseCase,
)
from app.schemas.pagination import Paginated


@pytest.fixture
def mock_user_repo():
    return AsyncMock()


@pytest.fixture
def mock_lost_repo():
    return AsyncMock()


@pytest.fixture
def mock_found_repo():
    return AsyncMock()


@pytest.fixture
def mock_category_repo():
    return AsyncMock()


@pytest.fixture
def mock_proof_repo():
    return AsyncMock()


@pytest.fixture
def mock_storage():
    storage = AsyncMock()
    storage.save_files.return_value = ["mocked_photo.jpg"]
    return storage


@pytest.fixture
def reporter():
    return User.new_user(
        name="Reporter",
        email="reporter@example.com",
        phone_number="+628111111111",
        password_hash="hash",
    )


@pytest.fixture
def other_user():
    return User.new_user(
        name="Other",
        email="other@example.com",
        phone_number="+628222222222",
        password_hash="hash",
    )


@pytest.fixture
def admin():
    return Admin.new_admin(
        name="Admin",
        email="admin@example.com",
        phone_number="+628333333333",
        password_hash="hash",
    )


@pytest.fixture
def category():
    return Category.new_category(name="Electronics")


@pytest.fixture
def lost_report(reporter, category):
    return LostReport.new_lost_report(
        reporter=reporter,
        incident_date=datetime.now(timezone.utc) - timedelta(days=1),
        title="Lost Laptop",
        description="Lost my laptop in the library.",
        location_name="Library",
        categories=[category],
        photos=["laptop.jpg"],
    )


@pytest.fixture
def found_report(reporter, category):
    return FoundReport.new_found_report(
        reporter=reporter,
        incident_date=datetime.now(timezone.utc) - timedelta(days=1),
        title="Found Laptop",
        description="Found a laptop on the desk.",
        location_name="Library",
        categories=[category],
        photos=["found.jpg"],
    )


@pytest.mark.asyncio
async def test_create_lost_report_success(
    mock_lost_repo, mock_category_repo, mock_storage, reporter, category
):
    usecase = CreateLostReportUseCase(mock_lost_repo, mock_category_repo, mock_storage)
    mock_category_repo.get_by_ids.return_value = [category]

    report = await usecase.execute(
        reporter=reporter,
        incident_date=datetime.now(timezone.utc) - timedelta(days=1),
        title="Lost Item",
        description="Description here",
        location_name="Location",
        category_ids=[category.id],
        photo_files=[(b"data", "file.jpg")],
    )

    assert report.title == "Lost Item"
    assert report.reporter.id == reporter.id
    mock_lost_repo.save.assert_called_once()
    mock_category_repo.get_by_ids.assert_called_once_with([category.id])


@pytest.mark.asyncio
async def test_create_found_report_success(
    mock_found_repo, mock_category_repo, mock_storage, reporter, category
):
    usecase = CreateFoundReportUseCase(
        mock_found_repo, mock_category_repo, mock_storage
    )
    mock_category_repo.get_by_ids.return_value = [category]

    report = await usecase.execute(
        reporter=reporter,
        incident_date=datetime.now(timezone.utc) - timedelta(days=1),
        title="Found Item",
        description="Description here",
        location_name="Location",
        category_ids=[category.id],
        photo_files=[(b"data", "file.jpg")],
    )

    assert report.title == "Found Item"
    assert report.reporter.id == reporter.id
    mock_found_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_create_hand_over_report_success(
    mock_found_repo, mock_category_repo, mock_storage, admin, category
):
    usecase = CreateHandOverReportUseCase(
        mock_found_repo, mock_category_repo, mock_storage
    )
    mock_category_repo.get_by_ids.return_value = [category]

    report = await usecase.execute(
        reporter=admin,
        incident_date=datetime.now(timezone.utc) - timedelta(days=1),
        title="Handed Over Item",
        description="Description here",
        location_name="Location",
        category_ids=[category.id],
        photo_files=[(b"data", "file.jpg")],
        finder_name="Jane Doe",
        finder_contact="08111111111",
    )

    assert report.title == "Handed Over Item"
    assert report.holder.id == admin.id
    assert report.found_status == FoundStatus.HELD_BY_ADMIN
    mock_found_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_get_lost_report_by_id_success(mock_lost_repo, lost_report):
    usecase = GetLostReportByIdUseCase(mock_lost_repo)
    mock_lost_repo.get_by_id.return_value = lost_report

    result = await usecase.execute(lost_report.id)
    assert result.id == lost_report.id


@pytest.mark.asyncio
async def test_get_lost_report_by_id_not_found(mock_lost_repo):
    usecase = GetLostReportByIdUseCase(mock_lost_repo)
    mock_lost_repo.get_by_id.return_value = None

    with pytest.raises(ValueError, match="Lost report not found"):
        await usecase.execute(uuid.uuid4())


@pytest.mark.asyncio
async def test_search_lost_reports_success(mock_lost_repo, lost_report):
    usecase = SearchLostReportsUseCase(mock_lost_repo)
    mock_lost_repo.search.return_value = [lost_report]
    mock_lost_repo.count_search.return_value = 1

    result = await usecase.execute(page=1, limit=10, query="Laptop")

    assert isinstance(result, Paginated)
    assert result.total_items == 1
    assert len(result.items) == 1
    mock_lost_repo.search.assert_called_once()
    mock_lost_repo.count_search.assert_called_once()


@pytest.mark.asyncio
async def test_update_lost_report_success(
    mock_lost_repo, mock_category_repo, mock_storage, reporter, lost_report
):
    usecase = UpdateLostReportUseCase(mock_lost_repo, mock_category_repo, mock_storage)
    mock_lost_repo.get_by_id.return_value = lost_report

    updated_report = await usecase.execute(
        user=reporter,
        report_id=lost_report.id,
        title="Updated Lost Laptop",
        photos_to_add=[(b"data", "new.jpg")],
        photos_to_remove=["laptop.jpg"],
    )

    assert updated_report.title == "Updated Lost Laptop"
    assert "mocked_photo.jpg" in updated_report.photos
    assert "laptop.jpg" not in updated_report.photos
    mock_lost_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_update_lost_report_permission_error(
    mock_lost_repo, mock_category_repo, mock_storage, other_user, lost_report
):
    usecase = UpdateLostReportUseCase(mock_lost_repo, mock_category_repo, mock_storage)
    mock_lost_repo.get_by_id.return_value = lost_report

    with pytest.raises(PermissionError, match="You can only edit your own reports"):
        await usecase.execute(
            user=other_user,
            report_id=lost_report.id,
            title="Hacked Title",
        )


@pytest.mark.asyncio
async def test_update_lost_report_rollback_photos_on_error(
    mock_lost_repo, mock_category_repo, mock_storage, reporter, lost_report
):
    usecase = UpdateLostReportUseCase(mock_lost_repo, mock_category_repo, mock_storage)
    mock_lost_repo.get_by_id.return_value = lost_report

    mock_lost_repo.save.side_effect = Exception("DB Error")

    with pytest.raises(Exception, match="DB Error"):
        await usecase.execute(
            user=reporter,
            report_id=lost_report.id,
            photos_to_add=[(b"data", "new.jpg")],
        )

    mock_storage.delete_file.assert_called_once_with("mocked_photo.jpg")


@pytest.mark.asyncio
async def test_update_found_report_success(
    mock_found_repo, mock_category_repo, mock_storage, reporter, found_report
):
    usecase = UpdateFoundReportUseCase(
        mock_found_repo, mock_category_repo, mock_storage
    )
    mock_found_repo.get_by_id.return_value = found_report

    updated_report = await usecase.execute(
        user=reporter,
        report_id=found_report.id,
        finder_name="Updated Finder",
        finder_contact="08999999999",
    )

    assert updated_report.finder_name == "Updated Finder"
    assert updated_report.finder_contact == "08999999999"
    mock_found_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_resolve_lost_report_success(mock_lost_repo, reporter, lost_report):
    usecase = ResolveLostReportUseCase(mock_lost_repo)
    mock_lost_repo.get_by_id.return_value = lost_report

    resolved = await usecase.execute(report_id=lost_report.id, user=reporter)

    assert resolved.report_status == ReportStatus.RESOLVED
    mock_lost_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_resolve_found_report_success(
    mock_found_repo, mock_proof_repo, mock_storage, reporter, found_report
):
    usecase = ResolveFoundReportUseCase(mock_found_repo, mock_proof_repo, mock_storage)
    mock_found_repo.get_by_id.return_value = found_report

    resolved = await usecase.execute(
        report_id=found_report.id,
        user=reporter,
        photo_files=[(b"data", "proof.jpg")],
        notes="Item was safely returned.",
    )

    assert resolved.report_status == ReportStatus.RESOLVED
    assert resolved.found_status == FoundStatus.RETURNED_TO_OWNER
    assert resolved.proof is not None
    assert resolved.proof.notes == "Item was safely returned."

    mock_storage.save_files.assert_called_once()
    mock_proof_repo.save.assert_called_once()
    mock_found_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_resolve_found_report_rollback_on_error(
    mock_found_repo, mock_proof_repo, mock_storage, reporter, found_report
):
    usecase = ResolveFoundReportUseCase(mock_found_repo, mock_proof_repo, mock_storage)
    mock_found_repo.get_by_id.return_value = found_report
    mock_found_repo.save.side_effect = Exception("Crash")

    with pytest.raises(Exception, match="Crash"):
        await usecase.execute(
            report_id=found_report.id,
            user=reporter,
            photo_files=[(b"data", "proof.jpg")],
            notes="Notes 1234567890",
        )

    mock_storage.delete_file.assert_called_once_with("mocked_photo.jpg")


@pytest.mark.asyncio
async def test_hand_over_to_admin_success(
    mock_found_repo, mock_user_repo, reporter, admin, found_report
):
    usecase = HandOverToAdminUseCase(mock_found_repo, mock_user_repo)

    mock_found_repo.get_by_id.return_value = found_report
    mock_user_repo.get_by_id.return_value = admin

    report = await usecase.execute(
        report_id=found_report.id, user=reporter, admin_id=admin.id
    )

    assert report.found_status == FoundStatus.HELD_BY_ADMIN
    assert report.holder.id == admin.id
    assert report.handed_over_at is not None

    mock_user_repo.get_by_id.assert_called_once_with(admin.id)
    mock_found_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_delete_lost_report_success(mock_lost_repo, reporter, lost_report):
    usecase = DeleteLostReportUseCase(mock_lost_repo)
    mock_lost_repo.get_by_id.return_value = lost_report

    await usecase.execute(report_id=lost_report.id, user=reporter)

    assert lost_report.deleted_at is not None
    assert lost_report.report_status == ReportStatus.CLOSED
    mock_lost_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_delete_found_report_permission_error(
    mock_found_repo, other_user, found_report
):
    usecase = DeleteFoundReportUseCase(mock_found_repo)
    mock_found_repo.get_by_id.return_value = found_report

    with pytest.raises(PermissionError, match="You can only delete your own reports"):
        await usecase.execute(report_id=found_report.id, user=other_user)


@pytest.mark.asyncio
async def test_find_potential_found_reports(
    mock_lost_repo, mock_found_repo, lost_report, found_report
):
    usecase = FindPotentialFoundReportsUseCase(mock_lost_repo, mock_found_repo)
    mock_lost_repo.get_by_id.return_value = lost_report
    mock_found_repo.find_potential_matches.return_value = [found_report]

    matches = await usecase.execute(lost_report_id=lost_report.id)

    assert len(matches) == 1
    assert matches[0].id == found_report.id
    mock_found_repo.find_potential_matches.assert_called_once_with(lost_report)


@pytest.mark.asyncio
async def test_find_potential_lost_reports(
    mock_lost_repo, mock_found_repo, lost_report, found_report
):
    usecase = FindPotentialLostReportsUseCase(mock_lost_repo, mock_found_repo)
    mock_found_repo.get_by_id.return_value = found_report
    mock_lost_repo.find_potential_matches.return_value = [lost_report]

    matches = await usecase.execute(found_report_id=found_report.id)

    assert len(matches) == 1
    assert matches[0].id == lost_report.id
    mock_lost_repo.find_potential_matches.assert_called_once_with(found_report)
