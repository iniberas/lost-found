import uuid
from datetime import datetime
from typing import Optional

from app.core.dependencies import (
    get_delete_user_use_case,
    get_search_users_use_case,
    get_user_by_id_use_case,
)
from app.domain.use_cases.user import (
    DeleteUserUseCase,
    GetUserByIdUseCase,
    SearchUsersUseCase,
)
from app.schemas.pagination import Paginated
from app.schemas.user import UserResponse
from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=Paginated[UserResponse])
async def search_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = None,
    created_at_from: Optional[datetime] = None,
    created_at_to: Optional[datetime] = None,
    is_deleted: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    use_case: SearchUsersUseCase = Depends(get_search_users_use_case),
):
    result = await use_case.execute(
        page=page,
        limit=limit,
        query=query,
        created_at_from=created_at_from,
        created_at_to=created_at_to,
        is_deleted=is_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return result


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    use_case: GetUserByIdUseCase = Depends(get_user_by_id_use_case),
):
    try:
        user = await use_case.execute(user_id)
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    use_case: DeleteUserUseCase = Depends(get_delete_user_use_case),
):
    try:
        await use_case.execute(user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
