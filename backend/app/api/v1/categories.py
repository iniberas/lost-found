import uuid
from typing import List, Optional

from app.core.dependencies import (
    get_create_category_form,
    get_create_category_use_case,
    get_current_admin,
    get_delete_category_use_case,
    get_search_categories_use_case,
    get_update_category_form,
    get_update_category_use_case,
)
from app.domain.entities.user import Admin
from app.domain.exceptions import ValidationError
from app.domain.use_cases.category import (
    CreateCategoryUseCase,
    DeleteCategoryUseCase,
    SearchCategoriesUseCase,
    UpdateCategoryUseCase,
)
from app.schemas.category import (
    CategoryResponse,
    CreateCategoryRequest,
    UpdateCategoryRequest,
)
from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=List[CategoryResponse])
async def search_categories(
    query: Optional[str] = Query(None),
    use_case: SearchCategoriesUseCase = Depends(get_search_categories_use_case),
):
    categories = await use_case.execute(query=query)
    return [CategoryResponse.model_validate(c) for c in categories]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    body: CreateCategoryRequest = Depends(get_create_category_form),
    _: Admin = Depends(get_current_admin),
    use_case: CreateCategoryUseCase = Depends(get_create_category_use_case),
):
    try:
        category = await use_case.execute(name=body.name)
        return CategoryResponse.model_validate(category)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    body: UpdateCategoryRequest = Depends(get_update_category_form),
    _: Admin = Depends(get_current_admin),
    use_case: UpdateCategoryUseCase = Depends(get_update_category_use_case),
):
    try:
        category = await use_case.execute(category_id=category_id, new_name=body.name)
        return CategoryResponse.model_validate(category)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(e)
        )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    _: Admin = Depends(get_current_admin),
    use_case: DeleteCategoryUseCase = Depends(get_delete_category_use_case),
):
    try:
        await use_case.execute(category_id=category_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
