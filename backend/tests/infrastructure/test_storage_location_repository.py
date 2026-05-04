from datetime import datetime, timezone
from uuid import uuid4

import pytest
import pytest_asyncio
from app.domain.entities.point import Point
from app.domain.entities.storage_location import StorageLocation
from app.infrastructure.repositories.storage_location import StorageLocationRepository
from app.infrastructure.repositories.user import UserRepository


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


@pytest.mark.asyncio
async def test_save_and_get_storage_location(db_session):
    repo = StorageLocationRepository(db_session)
    loc_id = uuid4()
    point = Point(latitude=-6.2000, longitude=106.8166)

    loc = StorageLocation(
        id=loc_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="Pos Satpam Depan",
        is_active=True,
        description="Dekat gerbang masuk",
        location_point=point,
    )

    await repo.save(loc)
    await db_session.commit()

    saved_loc = await repo.get_by_id(loc_id)

    assert saved_loc is not None
    assert saved_loc.id == loc_id
    assert saved_loc.name == "Pos Satpam Depan"
    assert saved_loc.location_point.latitude == pytest.approx(-6.2000)
    assert saved_loc.location_point.longitude == pytest.approx(106.8166)
    assert saved_loc.is_active is True


@pytest.mark.asyncio
async def test_update_storage_location(db_session):
    repo = StorageLocationRepository(db_session)

    loc = StorageLocation.new_location(
        name="Locker Room",
        description="Ruang loker mahasiswa",
        location_point=Point(0.0, 0.0),
    )
    await repo.save(loc)
    await db_session.commit()

    loc.update_name("Locker Room A")
    loc.update_location_point(Point(-6.1, 106.1))

    await repo.save(loc)
    await db_session.commit()

    updated_loc = await repo.get_by_id(loc.id)

    assert updated_loc.name == "Locker Room A"
    assert updated_loc.location_point.latitude == pytest.approx(-6.1)


@pytest.mark.asyncio
async def test_get_by_name_and_search_storage_location(db_session):
    repo = StorageLocationRepository(db_session)

    loc1 = StorageLocation.new_location("Gudang Fisika", "Gedung A", Point(1.0, 1.0))
    loc2 = StorageLocation.new_location("Gudang Kimia", "Gedung B", Point(1.0, 1.0))
    loc2.delete()

    await repo.save(loc1)
    await repo.save(loc2)
    await db_session.commit()

    res_name = await repo.get_by_name("gudang fisika")
    assert res_name is not None
    assert res_name.id == loc1.id

    res_active = await repo.search(is_active=True)
    assert len(res_active) >= 1
    assert loc1.id in [r.id for r in res_active]
    assert loc2.id not in [r.id for r in res_active]

    res_query = await repo.search(query="Kimia")
    assert len(res_query) == 1
    assert res_query[0].id == loc2.id


@pytest.mark.asyncio
async def test_delete_storage_location_from_db(db_session):

    repo = StorageLocationRepository(db_session)
    loc = StorageLocation.new_location("Gudang Sementara", "X", Point(0.0, 0.0))

    await repo.save(loc)
    await db_session.commit()

    await repo.delete(loc.id)

    deleted_loc = await repo.get_by_id(loc.id)
    assert deleted_loc is None
