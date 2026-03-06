from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.infrastructure.database.session import SessionLocal
from app.core.security import ArgusPasswordHasher, JWTTokenService
from app.domain.entities.user import User
from app.domain.interfaces.user import IUserRepository
from typing import Optional, Annotated
from app.domain.use_cases.auth import RegisterUserUseCase, LoginUserUseCase, RefreshTokenUseCase, GetUserUseCase
from app.infrastructure.repositories.user import SqlAlchemyUserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_hasher():
    return ArgusPasswordHasher()

def get_user_repo(db: Session = Depends(get_db)):
    return SqlAlchemyUserRepository(db)

def get_token_service():
    return JWTTokenService()

def get_register_use_case(repo = Depends(get_user_repo), hasher = Depends(get_hasher)):
    return RegisterUserUseCase(repo, hasher)

def get_login_use_case(repo = Depends(get_user_repo), hasher = Depends(get_hasher), tokens = Depends(get_token_service)):
    return LoginUserUseCase(repo, hasher, tokens)

def get_refresh_use_case(repo = Depends(get_user_repo), tokens = Depends(get_token_service)):
    return RefreshTokenUseCase(repo, tokens)

def get_profile_use_case(repo = Depends(get_user_repo)):
    return GetUserUseCase(repo)

async def get_current_user(
        token: Annotated[str, Depends(oauth2_scheme)],
        profile_use_case: GetUserUseCase = Depends(get_profile_use_case),
        token_service: JWTTokenService = Depends(get_token_service)
):
    try:
        payload = token_service.decode_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token claims")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    try:
        return profile_use_case.execute(email)
    except Exception:
        raise HTTPException(status_code=401, detail="User not found")