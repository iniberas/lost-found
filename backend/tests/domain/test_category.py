import uuid

import pytest
from app.domain.entities.category import Category
from app.domain.exceptions import ValidationError


@pytest.fixture
def valid_id():
    return uuid.uuid4()


@pytest.mark.parametrize(
    "name",
    [
        "AB",
        "Electronics",
        "Lost & Found",
        "A" * 255,
        "  Padded Name  ",
    ],
)
def test_create_category_success(valid_id, name):
    cat = Category.new_category(name=name)
    assert cat.name == name.strip()


@pytest.mark.parametrize(
    "name, expected_error",
    [
        ("", "Name cannot be empty"),
        ("   ", "Name cannot be empty"),
        ("A ", "Name must be at least 2 characters long"),
        ("A", "Name must be at least 2 characters long"),  # NAME_MIN_LEN - 1
        ("A" * 256, "Name cannot exceed 255 characters"),  # NAME_MAX_LEN + 1
    ],
)
def test_create_category_fails_with_invalid_name(name, expected_error):
    with pytest.raises(ValidationError, match=expected_error):
        Category.new_category(name=name)


def test_new_category_assigns_uuid_name_and_is_active():
    cat = Category.new_category("Electronics")
    assert isinstance(cat.id, uuid.UUID)
    assert cat.name == "Electronics"
    assert cat.is_active


def test_new_category_generates_unique_ids():
    cat1 = Category.new_category("Electronics")
    cat2 = Category.new_category("Electronics")
    assert cat1.id != cat2.id


def test_category_equality_same_id(valid_id):
    cat1 = Category(id=valid_id, name="Electronics", is_active=True)
    cat2 = Category(id=valid_id, name="Wallets", is_active=True)
    assert cat1 == cat2


def test_category_inequality_different_id():
    cat1 = Category(id=uuid.uuid4(), name="Electronics", is_active=True)
    cat2 = Category(id=uuid.uuid4(), name="Electronics", is_active=True)
    assert cat1 != cat2


def test_category_not_equal_to_non_category(valid_id):
    cat = Category(id=valid_id, name="Electronics", is_active=True)
    assert cat != "Electronics"
    assert cat != valid_id
    assert cat is not None


def test_category_hashable_and_usable_in_set():
    cat1 = Category.new_category("Electronics")
    cat2 = Category.new_category("Wallets")
    s = {cat1, cat2}
    assert len(s) == 2


def test_category_same_id_deduped_in_set(valid_id):
    cat1 = Category(id=valid_id, name="Electronics", is_active=True)
    cat2 = Category(id=valid_id, name="Wallets", is_active=True)
    s = {cat1, cat2}
    assert len(s) == 1


def test_category_id_property_returns_correct_value(valid_id):
    cat = Category(id=valid_id, name="Electronics", is_active=True)
    assert cat.id is valid_id


def test_category_name_is_stripped():
    cat = Category.new_category("  Electronics  ")
    assert cat.name == "Electronics"


def test_category_update_name_success():
    cat = Category.new_category("Electronics")
    cat.update_name("  Home Appliances  ")
    assert cat.name == "Home Appliances"


@pytest.mark.parametrize(
    "invalid_name, expected_error",
    [
        ("", "Name cannot be empty"),
        ("   ", "Name cannot be empty"),
        ("A ", "Name must be at least 2 characters long"),
        ("A", "Name must be at least 2 characters long"),
        ("A" * 256, "Name cannot exceed 255 characters"),
    ],
)
def test_category_update_name_fails_with_invalid_data(invalid_name, expected_error):
    cat = Category.new_category("Electronics")
    with pytest.raises(ValidationError, match=expected_error):
        cat.update_name(invalid_name)


def test_category_update_name_fails_if_deleted():
    cat = Category.new_category("Electronics")
    cat.delete()
    with pytest.raises(ValidationError, match="cannot be modified"):
        cat.update_name("New Name")


def test_category_delete():
    cat = Category.new_category("Electronics")
    cat.delete()
    assert not cat.is_active
