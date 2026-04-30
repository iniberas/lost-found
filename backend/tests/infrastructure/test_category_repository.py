import pytest
from uuid import uuid4

from app.domain.entities.category import Category
from app.infrastructure.repositories.category import CategoryRepository


@pytest.mark.asyncio
async def test_save_and_get_by_id(db_session):
    repo = CategoryRepository(db_session)
    category = Category.new_category("Electronics")
    
    await repo.save(category)
    await db_session.commit()
    
    saved_category = await repo.get_by_id(category.id)
    
    assert saved_category is not None
    assert saved_category.id == category.id
    assert saved_category.name == "Electronics"
    assert saved_category.is_active is True


@pytest.mark.asyncio
async def test_get_by_id_returns_none_if_not_found(db_session):
    repo = CategoryRepository(db_session)
    result = await repo.get_by_id(uuid4())
    assert result is None


@pytest.mark.asyncio
async def test_update_existing_category(db_session):
    repo = CategoryRepository(db_session)
    category = Category.new_category("Old Name")
    
    await repo.save(category)
    await db_session.commit()
    
    category.update_name("New Name")
    
    await repo.save(category)
    await db_session.commit()
    
    updated_category = await repo.get_by_id(category.id)
    assert updated_category.name == "New Name"


@pytest.mark.asyncio
async def test_get_by_ids(db_session):
    repo = CategoryRepository(db_session)
    
    cat1 = Category.new_category("Cat 1")
    cat2 = Category.new_category("Cat 2")
    cat3 = Category.new_category("Cat 3")
    
    await repo.save(cat1)
    await repo.save(cat2)
    await repo.save(cat3)
    await db_session.commit()
    
    results = await repo.get_by_ids([cat1.id, cat3.id])
    
    assert len(results) == 2
    fetched_ids = [c.id for c in results]
    assert cat1.id in fetched_ids
    assert cat3.id in fetched_ids
    assert cat2.id not in fetched_ids


@pytest.mark.asyncio
async def test_get_by_ids_returns_empty_list_for_empty_input(db_session):
    repo = CategoryRepository(db_session)
    results = await repo.get_by_ids([])
    assert results == []


@pytest.mark.asyncio
async def test_get_by_name(db_session):
    repo = CategoryRepository(db_session)
    
    cat = Category.new_category("Smartphones")
    await repo.save(cat)
    await db_session.commit()
    
    saved_cat = await repo.get_by_name("  smartphones  ")
    
    assert saved_cat is not None
    assert saved_cat.id == cat.id
    
    not_found = await repo.get_by_name("Tablets")
    assert not_found is None


@pytest.mark.asyncio
async def test_search_categories(db_session):
    repo = CategoryRepository(db_session)
    
    cat1 = Category.new_category("Apple Phones")
    cat2 = Category.new_category("Samsung Phones")
    cat3 = Category.new_category("Laptops")
    cat4 = Category.new_category("Old Tablets")
    cat4.delete()
    
    await repo.save(cat1)
    await repo.save(cat2)
    await repo.save(cat3)
    await repo.save(cat4)
    await db_session.commit()
    
    all_cat = await repo.search()
    assert len(all_cat) == 4
    assert all_cat[0].name == "Apple Phones"
    assert all_cat[1].name == "Laptops"
    assert all_cat[2].name == "Old Tablets"
    assert all_cat[3].name == "Samsung Phones"

    all_active = await repo.search(is_active=True)
    assert len(all_active) == 3
    assert all_active[0].name == "Apple Phones"
    assert all_active[1].name == "Laptops"
    assert all_active[2].name == "Samsung Phones"
    
    phones = await repo.search(query="phones")
    assert len(phones) == 2
    assert phones[0].name == "Apple Phones"
    assert phones[1].name == "Samsung Phones"


@pytest.mark.asyncio
async def test_delete_category(db_session):
    repo = CategoryRepository(db_session)
    category = Category.new_category("To Be Deleted")
    
    await repo.save(category)
    await db_session.commit()
    
    assert await repo.get_by_id(category.id) is not None
    
    await repo.delete(category.id)
    await db_session.commit()
    
    assert await repo.get_by_id(category.id) is None