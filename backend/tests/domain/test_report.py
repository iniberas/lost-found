from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from app.domain.entities.category import Category
from app.domain.entities.point import Point
from app.domain.entities.proof import Proof
from app.domain.entities.report import (
    FoundReport,
    FoundStatus,
    LostReport,
    ReportStatus,
    ReportType,
)
from app.domain.entities.storage_location import StorageLocation
from app.domain.entities.user import Admin, User
from app.domain.exceptions import FutureDateError, StateTransitionError, ValidationError


@pytest.fixture
def sample_user():
    return User.new_user(
        name="John Doe",
        email="john@example.com",
        phone_number="+6281234567890",
        password_hash="hashed_secret",
    )


@pytest.fixture
def sample_admin():
    return Admin.new_admin(
        name="Admin",
        email="admin@example.com",
        phone_number="+6281234567891",
        password_hash="hashed_secret",
    )


@pytest.fixture
def sample_categories():
    return [
        Category.new_category(name="Electronics"),
        Category.new_category(name="Wallets"),
    ]


@pytest.fixture
def sample_proof():
    return Proof.new_proof(
        photos=["proof_photo1.jpg"],
        notes="Handed over directly to owner",
    )


@pytest.fixture
def sample_storage_location():
    return StorageLocation(
        id=uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="Pos Satpam Utama",
        description="Pos penjagaan gerbang utama",
        location_point=Point(latitude=-6.2, longitude=106.8),
        is_active=True,
    )


@pytest.fixture
def base_lost_kwargs(sample_user, sample_categories):
    return {
        "id": uuid4(),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "reporter": sample_user,
        "report_status": ReportStatus.OPEN,
        "incident_date": datetime.now(timezone.utc) - timedelta(hours=1),
        "title": "Lost my iPhone",
        "description": "Lost near the main library building.",
        "location_name": "Library",
        "categories": [sample_categories[0]],
        "photos": ["photo1.jpg"],
    }


@pytest.fixture
def base_found_kwargs(sample_user, sample_categories):
    return {
        "id": uuid4(),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "reporter": sample_user,
        "report_status": ReportStatus.OPEN,
        "found_status": FoundStatus.HELD_BY_FINDER,
        "incident_date": datetime.now(timezone.utc) - timedelta(hours=1),
        "title": "Found an iPhone",
        "description": "Found on a bench near the main entrance.",
        "location_name": "Park Bench",
        "categories": [sample_categories[0]],
        "photos": ["found_phone.jpg"],
        "holder": sample_user,
        "storage_location": None,  
    }


@pytest.fixture
def new_lost_kwargs(sample_user, sample_categories):
    return {
        "reporter": sample_user,
        "incident_date": datetime.now(timezone.utc) - timedelta(hours=1),
        "title": "Lost my iPhone",
        "description": "Lost near the main library building.",
        "location_name": "Library",
        "categories": [sample_categories[0]],
        "photos": ["photo1.jpg"],
    }


@pytest.fixture
def new_found_kwargs(sample_user, sample_categories):
    return {
        "reporter": sample_user,
        "incident_date": datetime.now(timezone.utc) - timedelta(hours=1),
        "title": "Found an iPhone",
        "description": "Found on a bench near the main entrance.",
        "location_name": "Park Bench",
        "categories": [sample_categories[0]],
        "photos": ["found_phone.jpg"],
    }


@pytest.mark.parametrize(
    "photos, location_point",
    [
        (None, None),
        ([], None),
        (["photo1.jpg"], None),
        (["photo1.jpg"], Point(-6.200, 106.816)),
        (["p.jpg"] * 10, Point(0.0, 0.0)),
    ],
)
def test_create_lost_report_success(new_lost_kwargs, photos, location_point):
    new_lost_kwargs["photos"] = photos
    new_lost_kwargs["location_point"] = location_point
    report = LostReport.new_lost_report(**new_lost_kwargs)

    assert report.id is not None
    assert report.created_at is not None
    assert report.updated_at == report.created_at
    assert report.report_status == ReportStatus.OPEN
    assert report.report_type == ReportType.LOST
    assert report.photos == (photos if photos else [])
    assert report.location_point == location_point


@pytest.mark.parametrize(
    "field, invalid_value, expected_error",
    [
        ("title", "", "Title cannot be empty"),
        ("title", "   ", "Title cannot be empty"),
        ("title", "A", "Title must be at least 2 characters long"),
        ("title", "A" * 256, "Title cannot exceed 255 characters"),
        ("description", "", "Description cannot be empty"),
        ("description", "   ", "Description cannot be empty"),
        ("description", "Short", "Description must be at least 10 characters long"),
        ("description", "A" * 2048, "Description cannot exceed 2047 characters"),
        ("location_name", "", "Location name cannot be empty"),
        ("location_name", "   ", "Location name cannot be empty"),
        ("location_name", "A", "Location name must be at least 2 characters long"),
        ("location_name", "A" * 256, "Location name cannot exceed 255 characters"),
        ("categories", [], "A report must have at least one category assigned"),
        (
            "photos",
            ["p.jpg"] * 11,
            "A report cannot exceed the maximum limit of 10 photos",
        ),
    ],
)
def test_create_lost_report_fails_with_invalid_data(
    new_lost_kwargs, field, invalid_value, expected_error
):
    new_lost_kwargs[field] = invalid_value
    with pytest.raises(ValidationError, match=expected_error):
        LostReport.new_lost_report(**new_lost_kwargs)


def test_create_lost_report_fails_with_future_incident_date(new_lost_kwargs):
    new_lost_kwargs["incident_date"] = datetime.now(timezone.utc) + timedelta(days=1)
    with pytest.raises(FutureDateError):
        LostReport.new_lost_report(**new_lost_kwargs)


def test_create_lost_report_fails_with_naive_incident_date(new_lost_kwargs):
    new_lost_kwargs["incident_date"] = datetime(2024, 1, 1)
    with pytest.raises(ValidationError, match="include timezone"):
        LostReport.new_lost_report(**new_lost_kwargs)


@pytest.mark.parametrize(
    "field, update_method, new_value",
    [
        ("title", "update_title", "New Title Here"),
        ("description", "update_description", "New Description Here!"),
        (
            "incident_date",
            "update_incident_date",
            datetime.now(timezone.utc) - timedelta(days=1),
        ),
    ],
)
def test_update_lost_report_modifies_field_and_timestamp(
    base_lost_kwargs, field, update_method, new_value
):
    past_time = datetime.now(timezone.utc) - timedelta(days=1)
    base_lost_kwargs["updated_at"] = past_time
    report = LostReport(**base_lost_kwargs)

    getattr(report, update_method)(new_value)

    assert getattr(report, field) == new_value
    assert report.updated_at > past_time


@pytest.mark.parametrize(
    "method, invalid_value, expected_error",
    [
        ("update_title", "", "Title cannot be empty"),
        ("update_title", "   ", "Title cannot be empty"),
        ("update_title", "A", "Title must be at least 2 characters long"),
        ("update_description", "", "Description cannot be empty"),
        ("update_description", "   ", "Description cannot be empty"),
        (
            "update_description",
            "Tiny",
            "Description must be at least 10 characters long",
        ),
    ],
)
def test_update_lost_report_fails_with_invalid_data(
    base_lost_kwargs, method, invalid_value, expected_error
):
    report = LostReport(**base_lost_kwargs)
    with pytest.raises(ValidationError, match=expected_error):
        getattr(report, method)(invalid_value)


def test_update_incident_date_fails_with_future_date(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    with pytest.raises(FutureDateError):
        report.update_incident_date(datetime.now(timezone.utc) + timedelta(days=1))


def test_update_location_name_and_point(base_lost_kwargs):
    past_time = datetime.now(timezone.utc) - timedelta(days=1)
    base_lost_kwargs["updated_at"] = past_time
    report = LostReport(**base_lost_kwargs)

    new_point = Point(-6.2, 106.8)
    report.update_location_name("New Building")
    report.update_location_point(new_point)

    assert report.location_name == "New Building"
    assert report.location_point == new_point
    assert report.updated_at > past_time


def test_update_location_point_to_none_clears_it(base_lost_kwargs):
    base_lost_kwargs["location_point"] = Point(-6.2, 106.8)
    report = LostReport(**base_lost_kwargs)
    report.update_location_point(None)
    assert report.location_point is None


@pytest.mark.parametrize(
    "method, invalid_location, expected_error",
    [
        ("update_location_name", "", "Location name cannot be empty"),
        ("update_location_name", "   ", "Location name cannot be empty"),
        (
            "update_location_name",
            "A",
            "Location name must be at least 2 characters long",
        ),
    ],
)
def test_update_location_name_fails_with_invalid_data(
    base_lost_kwargs, method, invalid_location, expected_error
):
    report = LostReport(**base_lost_kwargs)
    with pytest.raises(ValidationError, match=expected_error):
        getattr(report, method)(invalid_location)


def test_update_categories_modifies_categories(base_lost_kwargs, sample_categories):
    report = LostReport(**base_lost_kwargs)
    past_time = report.updated_at
    new_cats = [sample_categories[1]]

    report.update_categories(new_cats)

    assert report.categories == new_cats
    assert len(report.categories) == 1
    assert report.updated_at > past_time


def test_update_categories_fails_with_empty_list(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    with pytest.raises(ValidationError, match="at least one category"):
        report.update_categories([])


def test_update_categories_fails_with_inactive_category(base_lost_kwargs):
    
    report = LostReport(**base_lost_kwargs)
    inactive_cat = Category(id=uuid4(), name="Inactive Category", is_active=False)

    with pytest.raises(ValidationError, match="found|inactive"):
        report.update_categories([inactive_cat])


def test_categories_getter_is_defensive_copy(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    report.categories.append(Category.new_category("Injected"))
    assert len(report.categories) == 1


def test_update_photos_modifies_photos(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    past_time = report.updated_at
    new_photos = ["new_photo1.jpg", "new_photo2.jpg"]

    report.update_photos(new_photos)

    assert report.photos == new_photos
    assert report.updated_at > past_time


def test_update_photos_fails_if_max_limit_reached(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    with pytest.raises(ValidationError, match="maximum limit"):
        report.update_photos([f"p{i}.jpg" for i in range(11)])


def test_photos_getter_is_defensive_copy(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    report.photos.append("injected.jpg")
    assert "injected.jpg" not in report.photos


def test_lost_report_delete(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    past_time = report.updated_at
    report.delete()

    assert report.deleted_at is not None
    assert report.report_status == ReportStatus.CLOSED
    assert report.updated_at > past_time


def test_lost_report_delete_fails_if_already_deleted(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    report.delete()
    with pytest.raises((StateTransitionError, ValueError)):
        report.delete()


def test_lost_report_confirm_found(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    report.confirm_found()
    assert report.report_status == ReportStatus.RESOLVED


def test_lost_report_confirm_found_fails_if_already_resolved(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    report.confirm_found()
    with pytest.raises((StateTransitionError, ValueError), match="already"):
        report.confirm_found()


def test_lost_report_confirm_found_fails_if_deleted(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    report.delete()
    with pytest.raises((StateTransitionError, ValueError)):
        report.confirm_found()


@pytest.mark.parametrize(
    "method, arg_factory",
    [
        ("update_title", lambda **_: "New Title Here"),
        ("update_description", lambda **_: "New Description Here!"),
        ("update_location_name", lambda **_: "New Location"),
        ("update_photos", lambda **_: ["new.jpg"]),
        ("update_categories", lambda **kw: [kw["cat"]]),
    ],
)
def test_mutations_fail_after_delete(
    base_lost_kwargs, sample_categories, method, arg_factory
):
    report = LostReport(**base_lost_kwargs)
    report.delete()
    arg = arg_factory(cat=sample_categories[1])
    with pytest.raises((StateTransitionError, ValueError)):
        getattr(report, method)(arg)


@pytest.mark.parametrize(
    "photos, location_point",
    [
        (["photo.jpg"], None),
        (["p.jpg"] * 10, Point(-6.2, 106.8)),
        (["photo1.jpg", "photo2.jpg"], None),
    ],
)
def test_create_found_report_success(new_found_kwargs, photos, location_point):
    new_found_kwargs["photos"] = photos
    new_found_kwargs["location_point"] = location_point
    report = FoundReport.new_found_report(**new_found_kwargs)

    assert report.id is not None
    assert report.created_at is not None
    assert report.report_type == ReportType.FOUND
    assert report.found_status == FoundStatus.HELD_BY_FINDER
    assert report.holder == new_found_kwargs["reporter"]
    assert report.photos == photos
    assert report.storage_location is None  


@pytest.mark.parametrize(
    "field, invalid_value, expected_error",
    [
        ("title", "", "Title cannot be empty"),
        ("categories", [], "A report must have at least one category assigned"),
        ("photos", [], "A found report must have at least one photo"),
        (
            "photos",
            None,
            "A found report must have at least one photo",
        ),  
        (
            "photos",
            ["p.jpg"] * 11,
            "A report cannot exceed the maximum limit of 10 photos",
        ),
    ],
)
def test_create_found_report_fails_with_invalid_data(
    new_found_kwargs, field, invalid_value, expected_error
):
    
    new_found_kwargs[field] = invalid_value
    with pytest.raises(ValidationError, match=expected_error):
        FoundReport.new_found_report(**new_found_kwargs)


@pytest.mark.parametrize(
    "finder_name, finder_contact",
    [
        ("Budi", "+6281234567890"),
        ("AB", "ab"),
    ],
)
def test_new_hand_over_report_success(
    sample_admin,
    sample_categories,
    finder_name,
    finder_contact,
    sample_storage_location,
):
    report = FoundReport.new_hand_over_report(
        reporter=sample_admin,
        incident_date=datetime.now(timezone.utc) - timedelta(hours=1),
        title="Found an iPhone",
        description="Found on a bench.",
        location_name="Park",
        categories=sample_categories,
        photos=["found.jpg"],
        finder_name=finder_name,
        finder_contact=finder_contact,
        storage_location=sample_storage_location,  
    )

    assert report.report_type == ReportType.FOUND
    assert report.found_status == FoundStatus.HELD_BY_ADMIN
    assert report.holder == sample_admin
    assert report.handed_over_at is not None
    assert report.handed_over_at >= report.created_at
    assert report.finder_name == finder_name
    assert report.finder_contact == finder_contact
    assert report.storage_location == sample_storage_location


@pytest.mark.parametrize(
    "finder_name, finder_contact, expected_error",
    [
        ("A", "+6281", "Finder name must be at least 2 characters long"),
        ("A" * 256, "+6281", "Finder name cannot exceed 255 characters"),
        ("Budi", "A", "Finder contact must be at least 2 characters long"),
        ("Budi", "A" * 256, "Finder contact cannot exceed 255 characters"),
        ("  ", "+6281", "Finder name cannot be empty"),
        ("Budi", "  ", "Finder contact cannot be empty"),
    ],
)
def test_new_hand_over_report_fails_with_invalid_finder_info(
    sample_admin,
    sample_categories,
    finder_name,
    finder_contact,
    expected_error,
    sample_storage_location,
):
    with pytest.raises(ValidationError, match=expected_error):
        FoundReport.new_hand_over_report(
            reporter=sample_admin,
            incident_date=datetime.now(timezone.utc) - timedelta(hours=1),
            title="Found an iPhone",
            description="Found on a bench.",
            location_name="Park",
            categories=sample_categories,
            photos=["found.jpg"],
            finder_name=finder_name,
            finder_contact=finder_contact,
            storage_location=sample_storage_location,
        )


def test_found_report_confirm_return(base_found_kwargs, sample_proof):
    report = FoundReport(**base_found_kwargs)
    report.confirm_return(sample_proof)

    assert report.found_status == FoundStatus.RETURNED_TO_OWNER
    assert report.report_status == ReportStatus.RESOLVED
    assert report.proof == sample_proof


def test_found_report_confirm_return_fails_if_already_returned(
    base_found_kwargs, sample_proof
):
    report = FoundReport(**base_found_kwargs)
    report.confirm_return(sample_proof)
    with pytest.raises((StateTransitionError, ValueError), match="already"):
        report.confirm_return(sample_proof)


def test_found_report_confirm_return_fails_if_deleted(base_found_kwargs, sample_proof):
    report = FoundReport(**base_found_kwargs)
    report.delete()
    with pytest.raises((StateTransitionError, ValueError)):
        report.confirm_return(sample_proof)


def test_found_report_hand_over_to_admin(
    base_found_kwargs, sample_admin, sample_storage_location
):
    report = FoundReport(**base_found_kwargs)
    original_holder = report.holder
    original_created_at = report.created_at

    report.hand_over_to_admin(sample_admin, sample_storage_location)

    assert report.found_status == FoundStatus.HELD_BY_ADMIN
    assert report.holder == sample_admin
    assert report.holder != original_holder  
    assert report.handed_over_at is not None
    assert report.handed_over_at >= original_created_at  
    assert report.storage_location == sample_storage_location


def test_found_report_hand_over_to_admin_fails_if_not_admin(
    base_found_kwargs, sample_user, sample_storage_location
):
    report = FoundReport(**base_found_kwargs)
    with pytest.raises(ValidationError, match="Only an admin"):
        report.hand_over_to_admin(sample_user, sample_storage_location)


def test_found_report_hand_over_to_admin_fails_if_already_returned(
    base_found_kwargs, sample_admin, sample_proof, sample_storage_location
):
    report = FoundReport(**base_found_kwargs)
    report.confirm_return(sample_proof)
    with pytest.raises(
        (StateTransitionError, ValueError), match="already been returned"
    ):
        report.hand_over_to_admin(sample_admin, sample_storage_location)


def test_found_report_hand_over_to_admin_fails_if_already_held_by_admin(
    base_found_kwargs, sample_admin, sample_storage_location
):
    report = FoundReport(**base_found_kwargs)
    report.hand_over_to_admin(sample_admin, sample_storage_location)
    with pytest.raises(
        (StateTransitionError, ValueError), match="already been handed over"
    ):
        report.hand_over_to_admin(sample_admin, sample_storage_location)


def test_found_report_hand_over_to_admin_fails_if_deleted(
    base_found_kwargs, sample_admin, sample_storage_location
):
    report = FoundReport(**base_found_kwargs)
    report.delete()
    with pytest.raises((StateTransitionError, ValueError)):
        report.hand_over_to_admin(sample_admin, sample_storage_location)


def test_found_report_update_photos_fails_with_empty_list(base_found_kwargs):
    base_found_kwargs["photos"] = ["only_photo.jpg"]
    report = FoundReport(**base_found_kwargs)
    with pytest.raises(ValidationError, match="at least one photo"):
        report.update_photos([])


def test_found_report_update_photos_succeeds(base_found_kwargs):
    base_found_kwargs["photos"] = ["photo1.jpg", "photo2.jpg"]
    report = FoundReport(**base_found_kwargs)
    report.update_photos(["new_photo.jpg"])
    assert "new_photo.jpg" in report.photos
    assert len(report.photos) == 1


def test_found_report_update_finder_info(base_found_kwargs):
    report = FoundReport(**base_found_kwargs)
    past_time = datetime.now(timezone.utc) - timedelta(days=1)
    report._updated_at = past_time

    report.update_finder_name("New Finder Name")
    report.update_finder_contact("New Contact Info")

    assert report.finder_name == "New Finder Name"
    assert report.finder_contact == "New Contact Info"
    assert report.updated_at > past_time


def test_found_report_update_holder(base_found_kwargs, sample_admin):
    report = FoundReport(**base_found_kwargs)
    past_time = datetime.now(timezone.utc) - timedelta(days=1)
    report._updated_at = past_time

    report.update_holder(sample_admin)

    assert report.holder == sample_admin
    assert report.updated_at > past_time


def test_found_report_update_storage_location(
    base_found_kwargs, sample_storage_location
):
    report = FoundReport(**base_found_kwargs)
    past_time = datetime.now(timezone.utc) - timedelta(days=1)
    report._updated_at = past_time

    report.update_storage_location(sample_storage_location)

    assert report.storage_location == sample_storage_location
    assert report.updated_at > past_time


@pytest.mark.parametrize(
    "method, invalid_value, expected_error",
    [
        ("update_finder_name", "A", "Finder name must be at least 2 characters long"),
        (
            "update_finder_contact",
            "A",
            "Finder contact must be at least 2 characters long",
        ),
    ],
)
def test_found_report_update_finder_info_fails_with_invalid_data(
    base_found_kwargs, method, invalid_value, expected_error
):
    report = FoundReport(**base_found_kwargs)
    with pytest.raises(ValidationError, match=expected_error):
        getattr(report, method)(invalid_value)


@pytest.mark.parametrize(
    "field, dt_value",
    [
        ("created_at", datetime(2024, 1, 1)),
        ("updated_at", datetime(2024, 1, 1)),
        ("deleted_at", datetime(2024, 1, 1)),
    ],
)
def test_report_fails_with_naive_core_timestamps(base_lost_kwargs, field, dt_value):
    base_lost_kwargs[field] = dt_value
    with pytest.raises(ValidationError, match="include timezone"):
        LostReport(**base_lost_kwargs)


def test_found_report_fails_with_naive_handed_over_at(base_found_kwargs):
    base_found_kwargs["handed_over_at"] = datetime(2024, 1, 1)
    with pytest.raises(ValidationError, match="include timezone"):
        FoundReport(**base_found_kwargs)


def test_report_equality_same_id(base_lost_kwargs):
    r1 = LostReport(**base_lost_kwargs)
    base_lost_kwargs["title"] = "Different Title OK"
    r2 = LostReport(**base_lost_kwargs)
    assert r1 == r2


def test_report_inequality_different_id(base_lost_kwargs):
    r1 = LostReport(**base_lost_kwargs)
    base_lost_kwargs["id"] = uuid4()
    r2 = LostReport(**base_lost_kwargs)
    assert r1 != r2


def test_report_not_equal_to_non_report(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    assert report != "not a report"
    assert report is not None


def test_reports_hashable_and_usable_in_set(base_lost_kwargs):
    r1 = LostReport(**base_lost_kwargs)
    base_lost_kwargs["id"] = uuid4()
    r2 = LostReport(**base_lost_kwargs)
    s = {r1, r2}
    assert len(s) == 2
