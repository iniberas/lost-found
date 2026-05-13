from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from app.domain.interfaces.auth import IPasswordHasher, ITokenService
from jose import JWTError, jwt, ExpiredSignatureError
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PasslibHasher(IPasswordHasher):
    def hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify(self, plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)


class JWTTokenService(ITokenService):
    def __init__(
        self,
        secret_key: str,
        algorithm: str,
        access_token_expire_minutes: int,
        refresh_token_expire_days: int,
    ):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire_minutes = access_token_expire_minutes
        self.refresh_token_expire_days = refresh_token_expire_days

    def create_access_token(self, data: dict) -> str:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=self.access_token_expire_minutes
        )

        return self._encode({
            **data,
            "exp": expire,
            "type": "access",
        })

    def create_refresh_token(self, data: dict) -> str:
        expire = datetime.now(timezone.utc) + timedelta(
            days=self.refresh_token_expire_days
        )

        return self._encode({
            **data,
            "exp": expire,
            "type": "refresh",
        })

    def decode_token(self, token: str) -> Dict[str, Any]:
        try:
            return jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
            )

        except ExpiredSignatureError:
            raise ValueError("Token expired")

        except JWTError:
            raise ValueError("Invalid token")

    def _encode(self, data: dict) -> str:
        return jwt.encode(
            data,
            self.secret_key,
            algorithm=self.algorithm,
        )
