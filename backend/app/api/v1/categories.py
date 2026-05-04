from typing import List, Optional

from app.core.dependencies import get_search_categories_use_case
from app.domain.use_cases.category import SearchCategoriesUseCase
from app.schemas.category import CategoryResponse
from fastapi import APIRouter, Depends, Query

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponse])
async def search_categories(
    query: Optional[str] = Query(None),
    use_case: SearchCategoriesUseCase = Depends(get_search_categories_use_case),
):
    categories = await use_case.execute(query=query)
    return [CategoryResponse.model_validate(c) for c in categories]
