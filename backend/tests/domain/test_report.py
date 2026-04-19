import pytest
from uuid import uuid4
from datetime import datetime, timedelta, timezone

from app.domain.entities.user import User, Admin
from app.domain.entities.category import Category
from app.domain.entities.proof import Proof
from app.domain.entities.report import (
    ReportStatus,
    ReportType,
    FoundStatus,
    LostReport,
    FoundReport,
)


@pytest.fixture
def sample_user():
    return User(
        id=uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="John Doe",
        email="john@example.com",
        phone_number="+6281234567890",
        password_hash="hashed_secret"
    )

@pytest.fixture
def sample_admin():
    return Admin(
        id=uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="Admin",
        email="admin@example.com",
        phone_number="+6281234567891",
        password_hash="hashed_secret"
    )

@pytest.fixture
def sample_categories():
    return [Category(id=1, name="Electronics"), Category(id=2, name="Wallets")]

@pytest.fixture
def sample_proof():
    return Proof(
        id=uuid4(),
        created_at=datetime.now(timezone.utc),
        photos=["proof_photo1.jpg"],
        notes="Handed over directly."
    )

@pytest.fixture
def base_lost_kwargs(sample_user, sample_categories):
    return {
        "id": uuid4(),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "reporter": sample_user,
        "report_status": ReportStatus.OPEN,
        "date": datetime.now(timezone.utc),
        "title": "Lost my iPhone",
        "description": "Lost near the library.",
        "location_name": "Library",
        "categories": [sample_categories[0]],
        "photos": ["photo1.jpg"]
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
        "date": datetime.now(timezone.utc),
        "title": "Found an iPhone",
        "description": "Found on a bench.",
        "location_name": "Park Bench",
        "categories": [sample_categories[0]],
        "photos": ["found_phone.jpg"],
        "holder": sample_user
    }


def test_report_add_category(base_lost_kwargs, sample_categories):
    report = LostReport(**base_lost_kwargs)
    new_cat = sample_categories[1]
    
    past_time = report.updated_at
    report.add_category(new_cat)
    
    assert len(report.categories) == 2
    assert new_cat in report.categories
    assert report.updated_at > past_time


@pytest.mark.parametrize(
    "field_to_update, update_method_name, new_val",
    [
        ("title", "update_title", "New Title"),
        ("description", "update_description", "New Description"),
        ("date", "update_date", datetime.now(timezone.utc) + timedelta(days=1)),
        ("report_status", "update_report_status", ReportStatus.RESOLVED),
    ]
)
def test_update_report_modifies_field_and_timestamp(
    base_lost_kwargs, field_to_update, update_method_name, new_val
):
    past_time = datetime.now(timezone.utc) - timedelta(days=1)
    base_lost_kwargs["updated_at"] = past_time
    report = LostReport(**base_lost_kwargs)

    update_method = getattr(report, update_method_name)
    update_method(new_val)

    assert getattr(report, field_to_update) == new_val
    assert report.updated_at > past_time


def test_update_report_location_modifies_fields_and_timestamp(base_lost_kwargs):
    past_time = datetime.now(timezone.utc) - timedelta(days=1)
    base_lost_kwargs["updated_at"] = past_time
    report = LostReport(**base_lost_kwargs)
    
    report.update_location("New Building", -6.2, 106.8)
    
    assert report.location_name == "New Building"
    assert report.latitude == -6.2
    assert report.longitude ==  106.8
    assert report.updated_at > past_time


@pytest.mark.parametrize(
    "method_name, invalid_data, expected_error",
    [
        ("update_title", "", "Title cannot be empty"),
        ("update_title", "   ", "Title cannot be empty"),
    ]
)
def test_update_report_fails_with_invalid_data(
    base_lost_kwargs, method_name, invalid_data, expected_error
):
    report = LostReport(**base_lost_kwargs)
    update_method = getattr(report, method_name)
    
    with pytest.raises(ValueError, match=expected_error):
        update_method(invalid_data)


def test_report_add_duplicate_category_fails(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    existing_cat = report.categories[0]
    
    with pytest.raises(ValueError, match="Category already exists in this report"):
        report.add_category(existing_cat)


def test_report_remove_category(base_lost_kwargs, sample_categories):
    base_lost_kwargs["categories"] = sample_categories
    report = LostReport(**base_lost_kwargs)
    cat_to_remove = sample_categories[0]
    
    past_time = report.updated_at
    report.remove_category(cat_to_remove)
    
    assert len(report.categories) == 1
    assert cat_to_remove not in report.categories
    assert report.updated_at > past_time


def test_report_remove_last_category(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    last_cat = report.categories[0]
    
    with pytest.raises(ValueError, match="A report must have at least one category"):
        report.remove_category(last_cat)


def test_report_add_photo(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    past_time = report.updated_at
    
    report.add_photo("new_photo.jpg")
    
    assert "new_photo.jpg" in report.photos
    assert report.updated_at > past_time


def test_report_remove_photo(base_lost_kwargs):
    base_lost_kwargs["photos"] = ["photo1.jpg", "photo2.jpg"]
    report = LostReport(**base_lost_kwargs)
    past_time = report.updated_at
    
    report.remove_photo("photo1.jpg")
    
    assert "photo1.jpg" not in report.photos
    assert report.updated_at > past_time


def test_report_add_photo_fails_if_max_limit_reached(base_lost_kwargs):
    base_lost_kwargs["photos"] = ["p1.jpg", "p2.jpg", "p3.jpg", "p4.jpg", "p5.jpg"]
    report = LostReport(**base_lost_kwargs)
    
    with pytest.raises(ValueError, match="Maximum photo limit reached"):
        report.add_photo("p6.jpg")


def test_report_delete(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    past_time = report.updated_at
    
    report.delete()
    
    assert report.deleted_at is not None
    assert report.report_status == ReportStatus.CLOSED
    assert report.updated_at > past_time


def test_report_delete_fails_if_already_deleted(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    report.delete()
    
    with pytest.raises(ValueError, match="Report is already deleted"):
        report.delete()


@pytest.mark.parametrize(
    "photos, lat, lon",
    [
        (None, None, None),
        (["photo1.jpg"], -6.200, 106.816),
    ]
)
def test_create_lost_report_success(base_lost_kwargs, photos, lat, lon):
    base_lost_kwargs["photos"] = photos
    base_lost_kwargs["latitude"] = lat
    base_lost_kwargs["longitude"] = lon
    
    report = LostReport(**base_lost_kwargs)
    
    assert report.report_type == ReportType.LOST
    assert report.photos == (photos if photos else [])
    assert report.latitude == lat
    assert report.longitude == lon


@pytest.mark.parametrize(
    "field, invalid_data, expected_error",
    [
        ("title", "", "Title cannot be empty"),
        ("categories", [], "A report must have at least one category"),
    ]
)
def test_create_lost_report_fails_with_invalid_data(
    base_lost_kwargs, field, invalid_data, expected_error
):
    base_lost_kwargs[field] = invalid_data
    with pytest.raises(ValueError, match=expected_error):
        LostReport(**base_lost_kwargs)


def test_lost_report_confirm_found(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    report.confirm_found()
    assert report.report_status == ReportStatus.RESOLVED


def test_lost_report_confirm_found_fails_if_already_found(base_lost_kwargs):
    report = LostReport(**base_lost_kwargs)
    report.confirm_found()
    
    with pytest.raises(ValueError, match="Report is already resolved"):
        report.confirm_found()


def test_create_found_report_success(base_found_kwargs):
    report = FoundReport(**base_found_kwargs)
    
    assert report.report_type == ReportType.FOUND
    assert report.found_status == FoundStatus.HELD_BY_FINDER
    assert len(report.photos) > 0


@pytest.mark.parametrize(
    "field, invalid_data, expected_error",
    [
        ("title", "", "Title cannot be empty"),
        ("categories", [], "A report must have at least one category"),
        ("photos", [], "A found report must have at least one photo"),
        ("photos", None, "A found report must have at least one photo"),
    ]
)
def test_create_found_report_fails_with_invalid_data(
    base_found_kwargs, field, invalid_data, expected_error
):
    base_found_kwargs[field] = invalid_data
    with pytest.raises(ValueError, match=expected_error):
        FoundReport(**base_found_kwargs)


def test_found_report_confirm_return(base_found_kwargs, sample_proof):
    report = FoundReport(**base_found_kwargs)
    report.confirm_return(sample_proof)
    
    assert report.found_status == FoundStatus.RETURNED_TO_OWNER
    assert report.report_status == ReportStatus.RESOLVED
    assert report.proof == sample_proof


def test_found_report_confirm_return_fails_if_already_returned(base_found_kwargs, sample_proof):
    report = FoundReport(**base_found_kwargs)
    report.confirm_return(sample_proof)
    
    with pytest.raises(ValueError, match="Item has already been returned"):
        report.confirm_return(sample_proof)


def test_found_report_remove_last_photo_fails(base_found_kwargs):
    report = FoundReport(**base_found_kwargs)
    last_photo = report.photos[0]
    
    with pytest.raises(ValueError, match="A found report must have at least one photo"):
        report.remove_photo(last_photo)


def test_found_report_transfer_to_admin(base_found_kwargs, sample_admin):
    report = FoundReport(**base_found_kwargs)
    report.transfer_to_admin(sample_admin)
    
    assert report.found_status == FoundStatus.HELD_BY_ADMIN
    assert report.holder == sample_admin


def test_found_report_transfer_to_admin_fails_if_already_returned(base_found_kwargs, sample_admin, sample_proof):
    report = FoundReport(**base_found_kwargs)
    report.confirm_return(sample_proof)
    
    with pytest.raises(ValueError, match="Cannot transfer an item that has already been returned"):
        report.transfer_to_admin(sample_admin)