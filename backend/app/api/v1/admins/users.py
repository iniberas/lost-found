import uuid
from datetime import datetime
from typing import Optional

from app.core.dependencies import (
    get_create_admin_use_case,
    get_current_admin,
    get_current_superadmin,
    get_delete_user_use_case,
    get_search_users_use_case,
    get_user_by_id_use_case,
)
from app.domain.entities.user import Admin, SuperAdmin
from app.domain.use_cases.user import (
    CreateAdminUseCase,
    DeleteUserUseCase,
    GetUserByIdUseCase,
    SearchUsersUseCase,
)
from app.schemas.admin import AdminCreateAdminRequest, AdminUserResponse
from app.schemas.pagination import Paginated
from fastapi import APIRouter, Depends, HTTPException, Query, status

router = APIRouter(prefix="/users")


@router.get("", response_model=Paginated[AdminUserResponse])
async def search_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = None,
    role: Optional[str] = None,
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
        role=role,
        created_at_from=created_at_from,
        created_at_to=created_at_to,
        is_deleted=is_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    return Paginated(
        items=[AdminUserResponse.model_validate(u) for u in result.items],
        total_items=result.total_items,
        current_page=result.current_page,
        total_pages=result.total_pages,
        limit=result.limit,
    )


@router.get("/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: uuid.UUID,
    use_case: GetUserByIdUseCase = Depends(get_user_by_id_use_case),
):
    try:
        user = await use_case.execute(user_id)
        return AdminUserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/admin", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED
)
async def create_admin(
    body: AdminCreateAdminRequest,
    current_superadmin: SuperAdmin = Depends(get_current_superadmin),
    use_case: CreateAdminUseCase = Depends(get_create_admin_use_case),
):
    """
    Endpoint khusus untuk mendaftarkan Admin baru. Hanya dapat diakses oleh SuperAdmin.
    """
    try:
        admin = await use_case.execute(
            actor=current_superadmin,
            name=body.name,
            email=body.email,
            phone_number=body.phone_number,
            password=body.password,
        )
        return AdminUserResponse.model_validate(admin)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    current_admin: Admin = Depends(get_current_admin),
    use_case: DeleteUserUseCase = Depends(get_delete_user_use_case),
):
    try:
        await use_case.execute(actor=current_admin, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
