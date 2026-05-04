import uuid
from unittest.mock import AsyncMock

import pytest
from app.domain.entities.category import Category
from app.domain.entities.user import User
from app.domain.use_cases.category import (
    CreateCategoryUseCase,
    DeleteCategoryUseCase,
    SearchCategoriesUseCase,
    UpdateCategoryUseCase,
)


@pytest.fixture
def mock_category_repo():
    return AsyncMock()


@pytest.fixture
def mock_audit_log_repo():
    return AsyncMock()


@pytest.fixture
def dummy_actor():
    return User.new_user(
        name="Admin",
        email="admin@example.com",
        phone_number="+628111111111",
        password_hash="hash",
    )


@pytest.fixture
def dummy_category():
    return Category.new_category(name="Electronics")


@pytest.mark.asyncio
async def test_create_category_success(
    mock_category_repo, mock_audit_log_repo, dummy_actor
):
    usecase = CreateCategoryUseCase(mock_category_repo, mock_audit_log_repo)

    mock_category_repo.get_by_name.return_value = None

    category = await usecase.execute(actor=dummy_actor, name="Smartphones")

    assert category.name == "Smartphones"
    assert category.is_active is True
    mock_category_repo.get_by_name.assert_called_once_with("Smartphones")
    mock_category_repo.save.assert_called_once()
    mock_audit_log_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_create_category_fails_if_exists(
    mock_category_repo, mock_audit_log_repo, dummy_actor, dummy_category
):
    usecase = CreateCategoryUseCase(mock_category_repo, mock_audit_log_repo)

    mock_category_repo.get_by_name.return_value = dummy_category

    with pytest.raises(ValueError, match="already exists"):
        await usecase.execute(actor=dummy_actor, name="Electronics")

    mock_category_repo.save.assert_not_called()
    mock_audit_log_repo.save.assert_not_called()


@pytest.mark.asyncio
async def test_update_category_success(
    mock_category_repo, mock_audit_log_repo, dummy_actor, dummy_category
):
    usecase = UpdateCategoryUseCase(mock_category_repo, mock_audit_log_repo)
    mock_category_repo.get_by_id.return_value = dummy_category

    updated_category = await usecase.execute(
        actor=dummy_actor, category_id=dummy_category.id, new_name="Home Appliances"
    )

    assert updated_category.name == "Home Appliances"
    mock_category_repo.save.assert_called_once()
    mock_audit_log_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_update_category_fails_if_not_found(
    mock_category_repo, mock_audit_log_repo, dummy_actor
):
    usecase = UpdateCategoryUseCase(mock_category_repo, mock_audit_log_repo)
    mock_category_repo.get_by_id.return_value = None

    with pytest.raises(ValueError, match="Category not found"):
        await usecase.execute(
            actor=dummy_actor, category_id=uuid.uuid4(), new_name="New Name"
        )


@pytest.mark.asyncio
async def test_search_categories_success(mock_category_repo, dummy_category):
    usecase = SearchCategoriesUseCase(mock_category_repo)
    mock_category_repo.search.return_value = [dummy_category]

    results = await usecase.execute(query="Electro")

    assert len(results) == 1
    assert results[0].name == "Electronics"
    mock_category_repo.search.assert_called_once_with(query="Electro", is_active=None)


@pytest.mark.asyncio
async def test_delete_category_success(
    mock_category_repo, mock_audit_log_repo, dummy_actor, dummy_category
):
    usecase = DeleteCategoryUseCase(mock_category_repo, mock_audit_log_repo)
    mock_category_repo.get_by_id.return_value = dummy_category

    await usecase.execute(actor=dummy_actor, category_id=dummy_category.id)

    assert dummy_category.is_active is False
    mock_category_repo.save.assert_called_once()
    mock_audit_log_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_delete_category_fails_if_not_found(
    mock_category_repo, mock_audit_log_repo, dummy_actor
):
    usecase = DeleteCategoryUseCase(mock_category_repo, mock_audit_log_repo)
    mock_category_repo.get_by_id.return_value = None

    with pytest.raises(ValueError, match="Category not found"):
        await usecase.execute(actor=dummy_actor, category_id=uuid.uuid4())
