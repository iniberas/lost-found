from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from app.domain.entities.user import Admin, SuperAdmin, User
from app.domain.exceptions import StateTransitionError, ValidationError


def make_user(**overrides):
    defaults = {
        "id": uuid4(),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "name": "Budi",
        "email": "budi@apps.ipb.ac.id",
        "phone_number": "+6281234567890",
        "password_hash": "hashed_secret",
    }
    defaults.update(overrides)
    return User(**defaults)


@pytest.mark.parametrize(
    "name, email, phone_number",
    [
        (
            "Budi",
            "budi@apps.ipb.ac.id",
            "+628123456789",
        ),  # 11 digits after country code
        (
            "Susi Similikiti",
            "SusiSimilikiti123@gmail.com",
            "+628123456789012",
        ),  # 15 digits total (max)
        ("AB", "ab@x.co", "+19876543210"),  # NAME_MIN_LEN exactly
        ("  Budi  ", "budi@apps.ipb.ac.id", "+6281234567890"),  # name gets stripped
    ],
)
def test_create_user_success(name, email, phone_number):
    user = User(
        id=uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name=name,
        email=email,
        phone_number=phone_number,
        password_hash="hashed_secret",
    )
    assert user.name == name.strip()
    assert user.email == email.strip().lower()
    assert user.phone_number == phone_number
    assert user.password_hash == "hashed_secret"


@pytest.mark.parametrize(
    "field, invalid_data, expected_error",
    [
        # --- name ---
        ("name", "A", "Name must be at least 2 characters long"),  # NAME_MIN_LEN - 1
        ("name", "A" * 256, "Name cannot exceed 255 characters"),  # NAME_MAX_LEN + 1
        ("name", "", "Name cannot be empty"),
        ("name", "   ", "Name cannot be empty"),
        ("name", "1234567", "Name cannot consist entirely of numbers"),
        # --- email ---
        ("email", "@apps.ipb.ac.id", "Invalid email format"),
        ("email", "budi.without.domain", "Invalid email format"),
        ("email", "budi@", "Invalid email format"),
        ("email", "budi@.com", "Invalid email format"),
        ("email", "", "Email cannot be empty"),
        ("email", "   ", "Email cannot be empty"),
        # --- phone number ---
        ("phone_number", "081234567890", "Invalid phone number format"),  # missing +
        ("phone_number", "08123abc456", "Invalid phone number format"),  # non-digits
        ("phone_number", "628123abc456", "Invalid phone number format"),  # missing +
        ("phone_number", "6281234567890", "Invalid phone number format"),  # missing +
        (
            "phone_number",
            "+6281234567890123",
            "Invalid phone number format",
        ),  # > 15 digits total
        ("phone_number", "+62 812 3456 7890", "Invalid phone number format"),  # spaces
        (
            "phone_number",
            "+6281234567",
            "Invalid phone number format",
        ),  # < 11 digits after country code
        (
            "phone_number",
            "+0812345678901",
            "Invalid phone number format",
        ),  # starts with +0
        ("phone_number", "", "Phone number cannot be empty"),
        ("phone_number", "   ", "Phone number cannot be empty"),
        # --- password hash ---
        ("password_hash", "", "Password hash cannot be empty"),
        ("password_hash", "   ", "Password hash cannot be empty"),
    ],
)
def test_create_user_fails_with_invalid_data(field, invalid_data, expected_error):
    attributes = {
        "id": uuid4(),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "name": "Budi",
        "email": "budi@apps.ipb.ac.id",
        "phone_number": "+6281234567890",
        "password_hash": "hashed_secret",
    }
    attributes[field] = invalid_data
    with pytest.raises((ValidationError, ValueError), match=expected_error):
        User(**attributes)


@pytest.mark.parametrize(
    "field, expected_error",
    [
        ("created_at", "Created at must include timezone information"),
        ("updated_at", "Updated at must include timezone information"),
    ],
)
def test_create_user_fails_with_naive_datetime(field, expected_error):
    attributes = {
        "id": uuid4(),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "name": "Budi",
        "email": "budi@apps.ipb.ac.id",
        "phone_number": "+6281234567890",
        "password_hash": "hashed_secret",
    }
    attributes[field] = datetime(2024, 1, 1)  # naive
    with pytest.raises((ValidationError, ValueError), match=expected_error):
        User(**attributes)


def test_create_user_fails_with_naive_deleted_at():
    attributes = {
        "id": uuid4(),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "name": "Budi",
        "email": "budi@apps.ipb.ac.id",
        "phone_number": "+6281234567890",
        "password_hash": "hashed_secret",
        "deleted_at": datetime(2024, 1, 1),  # naive
    }
    with pytest.raises(
        (ValidationError, ValueError),
        match="Deleted at must include timezone information",
    ):
        User(**attributes)


def test_new_user_assigns_uuid_and_timestamps():
    user = User.new_user(
        name="Budi",
        email="budi@apps.ipb.ac.id",
        phone_number="+6281234567890",
        password_hash="hashed_secret",
    )
    assert isinstance(user.id, __import__("uuid").UUID)
    assert user.created_at.tzinfo is not None
    assert user.updated_at == user.created_at


@pytest.mark.parametrize(
    "raw_email, expected",
    [
        ("BUDI@EXAMPLE.COM", "budi@example.com"),
        ("Budi@Example.COM", "budi@example.com"),
        (" budi@example.com ", "budi@example.com"),
    ],
)
def test_user_email_is_lowercased_and_stripped(raw_email, expected):
    user = make_user(email=raw_email)
    assert user.email == expected


@pytest.mark.parametrize(
    "field, valid_data",
    [
        ("name", "Siti"),
        ("email", "siti@gmail.com"),
        ("phone_number", "+628123123123"),
        ("password_hash", "new_hashed_secret"),
    ],
)
def test_update_user_modifies_field_and_updates_timestamp(field, valid_data):
    past_time = datetime.now(timezone.utc) - timedelta(days=1)
    user = make_user(created_at=past_time, updated_at=past_time)

    update_method = getattr(user, f"update_{field}")
    update_method(valid_data)

    assert user.updated_at > past_time


def test_update_email_is_lowercased_and_stripped():
    user = make_user(email="old@x.com")
    user.update_email("  NEW@EXAMPLE.COM  ")
    assert user.email == "new@example.com"


def test_update_name_is_stripped():
    user = make_user(name="Old Name")
    user.update_name("  New Name  ")
    assert user.name == "New Name"


@pytest.mark.parametrize(
    "field, invalid_data, expected_error",
    [
        ("name", "", "Name cannot be empty"),
        ("name", "   ", "Name cannot be empty"),
        ("name", "A", "Name must be at least 2 characters long"),
        ("name", "A" * 256, "Name cannot exceed 255 characters"),
        ("name", "12345678", "Name cannot consist entirely of numbers"),
        ("email", "@apps.ipb.ac.id", "Invalid email format"),
        ("email", "budi.without.domain", "Invalid email format"),
        ("email", "", "Email cannot be empty"),
        ("email", "   ", "Email cannot be empty"),
        ("phone_number", "081234567890", "Invalid phone number format"),
        ("phone_number", "08123abc456", "Invalid phone number format"),
        ("phone_number", "628123abc456", "Invalid phone number format"),
        ("phone_number", "6281234567890", "Invalid phone number format"),
        ("phone_number", "+6281234567890123", "Invalid phone number format"),
        ("phone_number", "+62 812 3456 7890", "Invalid phone number format"),
        ("phone_number", "+6281234567", "Invalid phone number format"),
        ("phone_number", "", "Phone number cannot be empty"),
        ("phone_number", "   ", "Phone number cannot be empty"),
        ("password_hash", "", "Password hash cannot be empty"),
        ("password_hash", "   ", "Password hash cannot be empty"),
    ],
)
def test_update_user_fails_with_invalid_data(field, invalid_data, expected_error):
    user = make_user()
    with pytest.raises((ValidationError, ValueError), match=expected_error):
        update_method = getattr(user, f"update_{field}")
        update_method(invalid_data)


@pytest.mark.parametrize(
    "method_name, valid_arg",
    [
        ("update_name", "Siti"),
        ("update_email", "siti@gmail.com"),
        ("update_phone_number", "+628123123123"),
        ("update_password_hash", "new_hashed_secret"),
    ],
)
def test_update_user_fails_if_deleted(method_name, valid_arg):
    user = make_user()
    user.delete()

    with pytest.raises((StateTransitionError, ValueError)):
        getattr(user, method_name)(valid_arg)


def test_delete_user_sets_deleted_at():
    user = make_user()
    user.delete()

    assert user.deleted_at is not None
    assert user.deleted_at.tzinfo is not None


def test_delete_user_fails_if_already_deleted():
    user = make_user()
    user.delete()
    with pytest.raises((StateTransitionError, ValueError)):
        user.delete()


def test_verify_password_delegates_to_hasher():
    user = make_user(password_hash="hashed_secret")
    mock_hasher = MagicMock()
    mock_hasher.verify.return_value = True

    result = user.verify_password("plain_password", mock_hasher)

    mock_hasher.verify.assert_called_once_with("plain_password", "hashed_secret")
    assert result is True


def test_verify_password_returns_false_on_mismatch():
    user = make_user(password_hash="hashed_secret")
    mock_hasher = MagicMock()
    mock_hasher.verify.return_value = False

    result = user.verify_password("wrong_password", mock_hasher)
    assert result is False


def test_user_equality_same_id():
    shared_id = uuid4()
    now = datetime.now(timezone.utc)
    u1 = User(
        id=shared_id,
        created_at=now,
        updated_at=now,
        name="Budi",
        email="budi@x.com",
        phone_number="+6281234567890",
        password_hash="h",
    )
    u2 = User(
        id=shared_id,
        created_at=now,
        updated_at=now,
        name="Siti",
        email="siti@x.com",
        phone_number="+6281234567890",
        password_hash="h",
    )
    assert u1 == u2


def test_user_inequality_different_id():
    u1 = make_user()
    u2 = make_user()
    assert u1 != u2


def test_user_not_equal_to_non_user():
    user = make_user()
    assert user != "not a user"
    assert user is not None


def test_user_hashable_and_usable_in_set():
    u1 = make_user()
    u2 = make_user()
    s = {u1, u2}
    assert len(s) == 2


def test_admin_is_instance_of_user():
    admin = Admin(
        id=uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="Admin",
        email="admin@example.com",
        phone_number="+6281234567891",
        password_hash="hashed_secret",
    )
    assert isinstance(admin, User)
    assert isinstance(admin, Admin)


def test_new_admin_assigns_uuid_and_timestamps():
    admin = Admin.new_admin(
        name="Admin",
        email="admin@example.com",
        phone_number="+6281234567891",
        password_hash="hashed_secret",
    )

    assert isinstance(admin.id, __import__("uuid").UUID)
    assert isinstance(admin, Admin)
    assert isinstance(admin, User)
    assert admin.created_at.tzinfo is not None
    assert admin.updated_at == admin.created_at
    assert admin.name == "Admin"
    assert admin.email == "admin@example.com"
    assert admin.phone_number == "+6281234567891"


def test_superadmin_is_instance_of_user():
    superadmin = SuperAdmin(
        id=uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="Super Admin",
        email="superadmin@example.com",
        phone_number="+6281234567892",
        password_hash="hashed_secret",
    )
    assert isinstance(superadmin, User)
    assert isinstance(superadmin, SuperAdmin)


def test_new_superadmin_assigns_uuid_and_timestamps():
    superadmin = SuperAdmin.new_superadmin(
        name="Super Admin",
        email="superadmin@example.com",
        phone_number="+6281234567892",
        password_hash="hashed_secret",
    )

    assert isinstance(superadmin.id, __import__("uuid").UUID)
    assert isinstance(superadmin, SuperAdmin)
    assert isinstance(superadmin, Admin)
    assert isinstance(superadmin, User)
    assert superadmin.created_at.tzinfo is not None
    assert superadmin.updated_at == superadmin.created_at
    assert superadmin.name == "Super Admin"
    assert superadmin.email == "superadmin@example.com"
    assert superadmin.phone_number == "+6281234567892"
