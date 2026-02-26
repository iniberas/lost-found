import os
from datetime import datetime, timedelta
from typing import Dict, Any
from jose import jwt
from app.domain.interfaces.auth import IPasswordHasher, ITokenService
from passlib.context import CryptContext


class ArgusPasswordHasher(IPasswordHasher):
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def hash(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def verify(self, plain: str, hashed: str) -> bool:
        return self.pwd_context.verify(plain, hashed)


class JWTSettings:
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback_insecure_secret")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

class JWTTokenService(ITokenService):
    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=JWTSettings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire, "type": "access"})
        return jwt.encode(to_encode, JWTSettings.SECRET_KEY, algorithm=JWTSettings.ALGORITHM)

    def create_refresh_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=JWTSettings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        return jwt.encode(to_encode, JWTSettings.SECRET_KEY, algorithm=JWTSettings.ALGORITHM)

    def decode_token(self, token: str) -> Dict[str, Any]:
        return jwt.decode(token, JWTSettings.SECRET_KEY, algorithms=[JWTSettings.ALGORITHM])