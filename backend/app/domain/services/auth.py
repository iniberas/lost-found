from app.domain.interfaces.auth import IPasswordHasher, ITokenService
from app.domain.interfaces.user import IUserRepository
import uuid
from app.domain.entities.user import User

class RegisterUserUseCase:
    def __init__(self, repo: IUserRepository, hasher: IPasswordHasher):
        self.repo = repo
        self.hasher = hasher
    
    def execute(self, username, email, password) -> dict:
        if self.repo.find_by_email(email):
            raise Exception(f"User {email} already exists.")

        hashed_pw = self.hasher.hash(password)
        new_user = User(id=str(uuid.uuid4()), username=username, email=email, password_hash=hashed_pw)
        self.repo.save(new_user)
        return {"id": new_user.id, "email": new_user.email}

class LoginUserUseCase:
    def __init__(self, repo: IUserRepository, hasher: IPasswordHasher, token_service: ITokenService):
        self.repo = repo
        self.hasher = hasher
        self.token_service = token_service
    
    def execute(self, email, password) -> dict:
        user = self.repo.find_by_email(email)
        if not user:
            raise Exception("Invalid email")

        if not user.verify_password(password, self.hasher):
            raise Exception("Invalid password")

        access_token = self.token_service.create_access_token({"sub": user.email})
        refresh_token = self.token_service.create_refresh_token({"sub": user.email})
        
        return {
            "access_token": access_token, 
            "refresh_token": refresh_token,
            "token_type": "bearer"
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
                raise Exception("Invalid token")
        except Exception:
            raise Exception("Invalid token")

        user = self.repo.find_by_email(email)
        if not user:
            raise Exception("User not found")

        new_access_token = self.token_service.create_access_token({"sub": user.email})
        return {"access_token": new_access_token, "token_type": "bearer"}