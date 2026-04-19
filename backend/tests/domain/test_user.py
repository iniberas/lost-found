import pytest
from uuid import uuid4
from datetime import datetime, timedelta
from app.domain.entities.user import User


@pytest.mark.parametrize(
    "name, email, phone_number",
    [
        ("Budi", "budi@apps.ipb.ac.id", "+628123456789"),
        ("Susi Similikiti", "SusiSimilikiti123@gmail.com", "+628123456789012"),
    ],
)
def test_create_user_success(name, email, phone_number):
    user = User(
        id=uuid4(),
        created_at=datetime.now(),
        updated_at=datetime.now(),
        name=name,
        email=email,
        phone_number=phone_number,
        password_hash="hashed_secret",
    )
    assert user.name == name
    assert user.email == email.lower()
    assert user.phone_number == phone_number
    assert user.password_hash == "hashed_secret"


@pytest.mark.parametrize(
    "field, invalid_data, expected_error",
    [
        ("name", "", "Name cannot be empty"),
        ("name", "   ", "Name cannot be empty"),
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
def test_create_user_fails_with_invalid_data(field, invalid_data, expected_error):
    attributes = {
        "id": uuid4(),
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "name": "Budi",
        "email": "budi@apps.ipb.ac.id",
        "phone_number": "+6281234567890",
        "password_hash": "hashed_secret",
    }

    attributes[field] = invalid_data

    with pytest.raises(ValueError, match=expected_error):
        User(**attributes)


@pytest.mark.parametrize(
    "field, new_data",
    [
        ("name", "Siti"),
        ("email", "siti@gmail.com"),
        ("phone_number", "+628123123123"),
        ("password_hash", "new_hashed_secret"),
    ],
)
def test_update_user_modifies_field_and_timestamp(field, new_data):
    past_time = datetime.now() - timedelta(days=1)
    user = User(
        id=uuid4(),
        created_at=past_time,
        updated_at=past_time,
        name="Budi",
        email="budi@apps.ipb.ac.id",
        phone_number="+6281234567890",
        password_hash="hashed_secret",
    )

    match field:
        case "name":
            user.update_name(new_name=new_data)
        case "email":
            user.update_email(new_email=new_data)
        case "phone_number":
            user.update_phone_number(new_phone_number=new_data)
        case "password_hash":
            user.update_password_hash(new_password_hash=new_data)

    assert user.updated_at > past_time


@pytest.mark.parametrize(
    "field, invalid_data, expected_error",
    [
        ("name", "", "Name cannot be empty"),
        ("name", "   ", "Name cannot be empty"),
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
    user = User(
        id=uuid4(),
        created_at=datetime.now(),
        updated_at=datetime.now(),
        name="Budi",
        email="budi@apps.ipb.ac.id",
        phone_number="+6281234567890",
        password_hash="hashed_secret",
    )
    with pytest.raises(ValueError, match=expected_error):
        match field:
            case "name":
                user.update_name(new_name=invalid_data)
            case "email":
                user.update_email(new_email=invalid_data)
            case "phone_number":
                user.update_phone_number(new_phone_number=invalid_data)
            case "password_hash":
                user.update_password_hash(new_password_hash=invalid_data)
