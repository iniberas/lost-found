from datetime import datetime, timezone
from uuid import uuid4

import pytest
from app.domain.entities.point import Point
from app.domain.entities.storage_location import StorageLocation
from app.domain.exceptions import StateTransitionError, ValidationError


@pytest.fixture
def sample_point():
    return Point(latitude=-6.200000, longitude=106.816666)


@pytest.fixture
def base_location_kwargs(sample_point):
    return {
        "name": "Pos Satpam Utama",
        "description": "Berada di gerbang depan kampus.",
        "location_point": sample_point,
    }


def test_new_location_success(base_location_kwargs):
    loc = StorageLocation.new_location(**base_location_kwargs)

    assert loc.id is not None
    assert loc.name == base_location_kwargs["name"]
    assert loc.description == base_location_kwargs["description"]
    assert loc.location_point == base_location_kwargs["location_point"]
    assert loc.is_active is True
    assert loc.created_at == loc.updated_at


@pytest.mark.parametrize(
    "field, invalid_value, expected_error",
    [
        ("name", "", "Name cannot be empty"),
        ("name", "   ", "Name cannot be empty"),
        ("name", "A", "Name must be at least 2 characters long"),
        ("name", "A" * 256, "cannot exceed 255 characters"),
        ("description", "", "Description cannot be empty"),
        ("description", "A" * 2048, "cannot exceed 2047 characters"),
        ("location_point", None, "Location point is required"),
    ],
)
def test_create_location_fails_with_invalid_data(
    base_location_kwargs, field, invalid_value, expected_error
):
    base_location_kwargs[field] = invalid_value
    with pytest.raises(ValidationError, match=expected_error):
        StorageLocation.new_location(**base_location_kwargs)


def test_create_location_fails_with_naive_datetime(sample_point):
    with pytest.raises(ValidationError, match="timezone"):
        StorageLocation(
            id=uuid4(),
            created_at=datetime(2024, 1, 1),  # Naive
            updated_at=datetime.now(timezone.utc),
            name="Valid Name",
            is_active=True,
            description="Valid Desc",
            location_point=sample_point,
        )


@pytest.mark.parametrize(
    "method, valid_arg, attr_name",
    [
        ("update_name", "Gudang Baru", "name"),
        ("update_description", "Deskripsi baru nih", "description"),
        ("update_location_point", Point(1.0, 1.0), "location_point"),
    ],
)
def test_update_location_fields_success(
    base_location_kwargs, method, valid_arg, attr_name
):
    loc = StorageLocation.new_location(**base_location_kwargs)
    past_updated_at = loc.updated_at

    getattr(loc, method)(valid_arg)

    assert getattr(loc, attr_name) == valid_arg
    assert loc.updated_at > past_updated_at


def test_delete_location(base_location_kwargs):
    loc = StorageLocation.new_location(**base_location_kwargs)
    past_updated_at = loc.updated_at

    loc.delete()

    assert loc.is_active is False
    assert loc.updated_at > past_updated_at


def test_activate_location(base_location_kwargs):
    loc = StorageLocation.new_location(**base_location_kwargs)
    loc.delete()  
    past_updated_at = loc.updated_at

    loc.activate()

    assert loc.is_active is True
    assert loc.updated_at > past_updated_at


def test_activate_fails_if_already_active(base_location_kwargs):
    loc = StorageLocation.new_location(**base_location_kwargs)
    with pytest.raises(StateTransitionError, match="already active"):
        loc.activate()


@pytest.mark.parametrize(
    "method_name, valid_arg",
    [
        ("update_name", "New Name"),
        ("update_description", "New Desc"),
        ("update_location_point", Point(1.0, 1.0)),
        ("delete", None),
    ],
)
def test_mutations_fail_if_inactive(base_location_kwargs, method_name, valid_arg):
    loc = StorageLocation.new_location(**base_location_kwargs)
    loc.delete()  

    with pytest.raises(StateTransitionError, match="inactive and cannot be modified"):
        if valid_arg is not None:
            getattr(loc, method_name)(valid_arg)
        else:
            getattr(loc, method_name)()
