from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import ArgusPasswordHasher, JWTTokenService
from app.domain.entities.user import User
from app.domain.interfaces.user import IUserRepository
from typing import Optional
from app.domain.services.auth import RegisterUserUseCase, LoginUserUseCase, RefreshTokenUseCase
from app.db.repositories.user import SqlAlchemyUserRepository

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