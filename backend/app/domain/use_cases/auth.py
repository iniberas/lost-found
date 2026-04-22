from app.domain.interfaces.auth import IPasswordHasher, ITokenService
from app.domain.interfaces.user import IUserRepository
import uuid
from datetime import datetime
from app.domain.entities.user import User


class RegisterUserUseCase:
    def __init__(self, repo: IUserRepository, hasher: IPasswordHasher):
        self.repo = repo
        self.hasher = hasher

    def execute(self, name: str, email: str, phone_number: str, password: str) -> User:
        if self.repo.find_by_email(email):
            raise ValueError(f"User with email {email} already exists.")

        hashed_pw = self.hasher.hash(password)
        new_user = User(
            id=uuid.uuid4(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            name=name,
            email=email,
            phone_number=phone_number,
            password_hash=hashed_pw,
        )
        self.repo.save(new_user)

        return new_user


class LoginUserUseCase:
    def __init__(
        self,
        repo: IUserRepository,
        hasher: IPasswordHasher,
        token_service: ITokenService,
    ):
        self.repo = repo
        self.hasher = hasher
        self.token_service = token_service

    def execute(self, email: str, password: str) -> dict:
        user = self.repo.find_by_email(email)

        if not user or not user.verify_password(password, self.hasher):
            raise ValueError("Invalid email or password")

        access_token = self.token_service.create_access_token({"sub": user.email})
        refresh_token = self.token_service.create_refresh_token({"sub": user.email})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }


class RefreshTokenUseCase:
    def __init__(self, repo: IUserRepository, token_service: ITokenService):
        self.repo = repo
        self.token_service = token_service

    def execute(self, refresh_token: str) -> dict:
        try:
            payload = self.token_service.decode_token(refresh_token)
            email: str = payload.get("sub")
            if email is None:
                raise ValueError("Invalid token structure")
        except Exception:
            raise ValueError("Could not validate credentials")

        user = self.repo.find_by_email(email)
        if not user:
            raise ValueError("User not found")

        new_access_token = self.token_service.create_access_token({"sub": user.email})
        return {"access_token": new_access_token, "token_type": "bearer"}


class GetUserUseCase:
    def __init__(self, repo: IUserRepository):
        self.repo = repo

    def execute(self, email: str) -> User:
        user = self.repo.find_by_email(email)
        if not user:
            raise ValueError("User not found")

        return user
