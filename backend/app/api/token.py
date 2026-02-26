from fastapi import APIRouter, status, Depends, HTTPException
from app.schemas.user import AccessTokenResponse, RefreshTokenRequest
from app.domain.services.auth import RefreshTokenUseCase
from app.api.dependencies import get_refresh_use_case

router = APIRouter()


@router.post("/refresh", response_model=AccessTokenResponse)
def register(request: RefreshTokenRequest, use_case: RefreshTokenUseCase = Depends(get_refresh_use_case)):
    try:
        return use_case.execute(request.refresh_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
