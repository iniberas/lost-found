from fastapi import APIRouter, status, Depends, HTTPException
from app.schemas.user import UserRegisterRequest, UserResponse
from app.domain.services.auth import RegisterUserUseCase
from app.api.dependencies import get_register_use_case

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserRegisterRequest, use_case: RegisterUserUseCase = Depends(get_register_use_case)):
    try:
        return use_case.execute(request.username, request.email, request.password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
