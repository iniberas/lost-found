from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
from app.domain.entities.user import Admin, User
from app.infrastructure.repositories.user import UserRepository


@pytest.mark.asyncio
async def test_save_and_find_user_by_email(db_session, dummy_user):
    repo = UserRepository(db_session)

    assert await repo.find_by_email(dummy_user.email) is None

    await repo.save(dummy_user)

    await db_session.commit()

    saved_user = await repo.find_by_email(dummy_user.email)

    assert saved_user is not None
    assert saved_user.id == dummy_user.id
    assert saved_user.name == "Test User"
    assert saved_user.email == dummy_user.email


@pytest.mark.asyncio
async def test_save_and_get_by_id(db_session, dummy_user):
    repo = UserRepository(db_session)
    await repo.save(dummy_user)
    await db_session.commit()

    saved_user = await repo.get_by_id(dummy_user.id)

    assert saved_user is not None
    assert saved_user.id == dummy_user.id
    assert isinstance(saved_user, User)
    assert not isinstance(saved_user, Admin)


@pytest.mark.asyncio
async def test_save_admin_returns_admin_entity(db_session, dummy_admin):
    repo = UserRepository(db_session)
    await repo.save(dummy_admin)
    await db_session.commit()

    saved_admin = await repo.get_by_id(dummy_admin.id)

    assert saved_admin is not None
    assert saved_admin.id == dummy_admin.id
    assert isinstance(saved_admin, Admin)
    assert saved_admin.email == dummy_admin.email


@pytest.mark.asyncio
async def test_update_existing_user(db_session, dummy_user):
    repo = UserRepository(db_session)
    await repo.save(dummy_user)
    await db_session.commit()

    dummy_user.update_name("Updated Name")
    dummy_user.update_phone_number("+6289999999999")

    await repo.save(dummy_user)
    await db_session.commit()

    updated_user = await repo.get_by_id(dummy_user.id)

    assert updated_user.name == "Updated Name"
    assert updated_user.phone_number == "+6289999999999"


@pytest.mark.asyncio
async def test_search_users_by_query(db_session, dummy_user, dummy_admin):
    repo = UserRepository(db_session)
    await repo.save(dummy_user)
    await repo.save(dummy_admin)
    await db_session.commit()

    results_email = await repo.search(query="admin")
    assert len(results_email) == 1
    assert results_email[0].id == dummy_admin.id

    results_name = await repo.search(query="User")
    assert len(results_name) == 2


@pytest.mark.asyncio
async def test_search_users_by_date_range(db_session):
    repo = UserRepository(db_session)
    now = datetime.now(timezone.utc)

    user1 = User(
        id=uuid4(),
        created_at=now - timedelta(days=5),
        updated_at=now - timedelta(days=5),
        name="Old User",
        email="old@x.co",
        phone_number="+6281111111111",
        password_hash="hash",
    )
    user2 = User(
        id=uuid4(),
        created_at=now,
        updated_at=now,
        name="New User",
        email="new@x.co",
        phone_number="+6282222222222",
        password_hash="hash",
    )

    await repo.save(user1)
    await repo.save(user2)
    await db_session.commit()

    results = await repo.search(
        created_at_from=now - timedelta(days=2), created_at_to=now + timedelta(days=1)
    )

    assert len(results) == 1
    assert results[0].id == user2.id


@pytest.mark.asyncio
async def test_search_users_by_deleted_status(db_session, dummy_user):
    repo = UserRepository(db_session)

    await repo.save(dummy_user)
    await db_session.commit()

    dummy_user.delete()
    await repo.save(dummy_user)
    await db_session.commit()

    active_results = await repo.search(is_deleted=False)
    assert len(active_results) == 0

    deleted_results = await repo.search(is_deleted=True)
    assert len(deleted_results) == 1
    assert deleted_results[0].id == dummy_user.id


@pytest.mark.asyncio
async def test_search_users_sorting_and_pagination(db_session):
    repo = UserRepository(db_session)
    now = datetime.now(timezone.utc)

    for i in range(3):
        user = User(
            id=uuid4(),
            created_at=now + timedelta(minutes=i),
            updated_at=now,
            name=f"User {i}",
            email=f"user{i}@x.co",
            phone_number="+6281111111111",
            password_hash="hash",
        )
        await repo.save(user)

    await db_session.commit()

    results_asc = await repo.search(
        sort_by="created_at", sort_order="asc", limit=2, offset=0
    )
    assert len(results_asc) == 2
    assert results_asc[0].name == "User 0"
    assert results_asc[1].name == "User 1"

    results_desc = await repo.search(
        sort_by="created_at", sort_order="desc", limit=2, offset=0
    )
    assert len(results_desc) == 2
    assert results_desc[0].name == "User 2"
    assert results_desc[1].name == "User 1"


@pytest.mark.asyncio
async def test_count_search(db_session, dummy_user, dummy_admin):
    repo = UserRepository(db_session)
    await repo.save(dummy_user)
    await repo.save(dummy_admin)
    await db_session.commit()

    total_count = await repo.count_search()
    assert total_count == 2

    filtered_count = await repo.count_search(query="admin")
    assert filtered_count == 1
