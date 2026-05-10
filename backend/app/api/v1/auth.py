from app.core.dependencies import (
    get_login_use_case,
    get_refresh_use_case,
    get_register_use_case,
)
from app.domain.use_cases.auth import (
    LoginUserUseCase,
    RefreshTokenUseCase,
    RegisterUserUseCase,
)
from app.schemas.auth import AccessTokenResponse, RefreshRequest, TokenResponse
from app.schemas.user import LoginUserRequest, RegisterUserRequest, UserResponse
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    body: RegisterUserRequest,
    use_case: RegisterUserUseCase = Depends(get_register_use_case),
):
    try:
        user = await use_case.execute(
            name=body.name,
            email=body.email,
            phone_number=body.phone_number,
            password=body.password,
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginUserRequest,
    use_case: LoginUserUseCase = Depends(get_login_use_case),
):
    try:
        token_dict = await use_case.execute(email=body.email, password=body.password)
        return TokenResponse(**token_dict)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(
    body: RefreshRequest,
    use_case: RefreshTokenUseCase = Depends(get_refresh_use_case),
):
    try:
        access_dict = await use_case.execute(body.refresh_token)
        return AccessTokenResponse(**access_dict)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/swagger-thing", include_in_schema=False)
async def login_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    use_case: LoginUserUseCase = Depends(get_login_use_case),
):
    try:
        token_dict = await use_case.execute(
            email=form_data.username, password=form_data.password
        )
        return TokenResponse(**token_dict)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
