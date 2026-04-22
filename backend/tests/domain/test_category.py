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
        "AB",  # exactly NAME_MIN_LEN
        "Electronics",
        "Lost & Found",
        "A" * 255,  # exactly NAME_MAX_LEN
        "  Padded Name  ",  # leading/trailing whitespace stripped
    ],
)
def test_create_category_success(valid_id, name):
    cat = Category(id=valid_id, name=name)
    assert cat.id == valid_id
    assert cat.name == name.strip()


@pytest.mark.parametrize(
    "name, expected_error",
    [
        ("", "Name cannot be empty"),
        ("   ", "Name cannot be empty"),
        ("A", "Name must be at least 2 characters long"),  # NAME_MIN_LEN - 1
        ("A" * 256, "Name cannot exceed 255 characters"),  # NAME_MAX_LEN + 1
    ],
)
def test_create_category_fails_with_invalid_name(valid_id, name, expected_error):
    with pytest.raises(ValidationError, match=expected_error):
        Category(id=valid_id, name=name)


def test_new_category_assigns_uuid_and_name():
    cat = Category.new_category("Electronics")
    assert isinstance(cat.id, uuid.UUID)
    assert cat.name == "Electronics"


def test_new_category_generates_unique_ids():
    cat1 = Category.new_category("Electronics")
    cat2 = Category.new_category("Electronics")
    assert cat1.id != cat2.id


def test_category_equality_same_id(valid_id):
    cat1 = Category(id=valid_id, name="Electronics")
    cat2 = Category(id=valid_id, name="Wallets")  # different name, same id
    assert cat1 == cat2


def test_category_inequality_different_id():
    cat1 = Category(id=uuid.uuid4(), name="Electronics")
    cat2 = Category(id=uuid.uuid4(), name="Electronics")
    assert cat1 != cat2


def test_category_not_equal_to_non_category(valid_id):
    cat = Category(id=valid_id, name="Electronics")
    assert cat != "Electronics"
    assert cat != valid_id
    assert cat is not None


def test_category_hashable_and_usable_in_set():
    cat1 = Category.new_category("Electronics")
    cat2 = Category.new_category("Wallets")
    s = {cat1, cat2}
    assert len(s) == 2


def test_category_same_id_deduped_in_set(valid_id):
    cat1 = Category(id=valid_id, name="Electronics")
    cat2 = Category(id=valid_id, name="Wallets")
    s = {cat1, cat2}
    assert len(s) == 1


def test_category_id_property_returns_correct_value(valid_id):
    cat = Category(id=valid_id, name="Electronics")
    assert cat.id is valid_id


def test_category_name_is_stripped():
    cat = Category(id=uuid.uuid4(), name="  Electronics  ")
    assert cat.name == "Electronics"
