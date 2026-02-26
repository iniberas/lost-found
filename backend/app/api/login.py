from fastapi import APIRouter, Depends, HTTPException
from app.schemas.user import TokenResponse, UserLoginRequest
from app.domain.services.auth import LoginUserUseCase
from app.api.dependencies import get_login_use_case

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest, use_case: LoginUserUseCase = Depends(get_login_use_case)):
    try:
        return use_case.execute(request.email, request.password)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))