import uuid

from app.core.dependencies import (
    get_change_password_form,
    get_change_password_use_case,
    get_current_admin,
    get_current_user,
    get_delete_user_use_case,
    get_update_user_form,
    get_update_user_use_case,
    get_user_by_id_use_case,
)
from app.domain.entities.user import Admin, User
from app.domain.use_cases.user import (
    ChangePasswordUseCase,
    DeleteUserUseCase,
    GetUserByIdUseCase,
    UpdateUserUseCase,
)
from app.schemas.user import ChangePasswordRequest, UpdateUserRequest, UserResponse
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/users", tags=["users"])


# GET PROFILE (Self)
@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


# UPDATE PROFILE (Self)
@router.put("/me", response_model=UserResponse)
async def update_profile(
    body: UpdateUserRequest = Depends(get_update_user_form),
    current_user: User = Depends(get_current_user),
    use_case: UpdateUserUseCase = Depends(get_update_user_use_case),
):
    try:
        user = await use_case.execute(
            user_id=current_user.id,
            name=body.name,
            email=body.email,
            phone_number=body.phone_number,
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# CHANGE PASSWORD (Self)
@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest = Depends(get_change_password_form),
    current_user: User = Depends(get_current_user),
    use_case: ChangePasswordUseCase = Depends(get_change_password_use_case),
):
    try:
        await use_case.execute(
            user_id=current_user.id,
            old_password=body.old_password,
            new_password=body.new_password,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# DELETE USER (Self or Admin)
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    use_case: DeleteUserUseCase = Depends(get_delete_user_use_case),
):
    # Logika proteksi: Hanya admin atau user itu sendiri yang bisa hapus
    if not isinstance(current_user, Admin) and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    try:
        await use_case.execute(user_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# GET USER BY ID (Admin Only)
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    admin: Admin = Depends(get_current_admin),
    use_case: GetUserByIdUseCase = Depends(get_user_by_id_use_case),
):
    try:
        user = await use_case.execute(user_id)
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
