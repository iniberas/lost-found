from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import TokenResponse, UserLoginRequest, UserResponse, UserRegisterRequest, AccessTokenResponse, RefreshTokenRequest
from app.domain.use_cases.auth import LoginUserUseCase, RegisterUserUseCase, RefreshTokenUseCase
from app.api.dependencies import get_login_use_case, get_register_use_case, get_current_user, get_refresh_use_case

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserRegisterRequest, use_case: RegisterUserUseCase = Depends(get_register_use_case)):
    try:
        return use_case.execute(request.username, request.email, request.password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest, use_case: LoginUserUseCase = Depends(get_login_use_case)):
    try:
        return use_case.execute(request.email, request.password)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    

@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(request: RefreshTokenRequest, use_case: RefreshTokenUseCase = Depends(get_refresh_use_case)):
    try:
        return use_case.execute(request.refresh_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/user/me", response_model=UserResponse)
def read_user_me(current_user = Depends(get_current_user)):
    return current_user