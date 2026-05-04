from typing import Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Lost and Found"

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int
    POSTGRES_HOST: str = "localhost"

    DATABASE_URL: Optional[str] = None
    TEST_DATABASE_URL: Optional[str] = None

    BACKEND_PORT: int
    FRONTEND_PORT: int

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    UPLOAD_DIR: str = "uploads"
    DEBUG: bool = False

    BASE_URL: Optional[str] = None
    BACKEND_CORS_ORIGINS: list[str] = []

    model_config = SettingsConfigDict(
        case_sensitive=True, env_file=".env", extra="ignore"
    )

    @model_validator(mode="after")
    def assemble_dynamic_settings(self) -> "Settings":

        if not self.DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )

        if not self.TEST_DATABASE_URL:
            self.TEST_DATABASE_URL = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:5434/test_db"
            )

        if not self.BASE_URL:
            self.BASE_URL = f"http://localhost:{self.BACKEND_PORT}"

        if not self.BACKEND_CORS_ORIGINS:
            self.BACKEND_CORS_ORIGINS = [
                f"http://localhost:{self.FRONTEND_PORT}",
                f"http://127.0.0.1:{self.FRONTEND_PORT}",
                f"http://0.0.0.0:{self.FRONTEND_PORT}",
            ]

        return self


settings = Settings()
