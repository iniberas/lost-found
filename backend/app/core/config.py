from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Lost and Found"
    DATABASE_URL: str  

    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173", 
        "http://localhost:3000"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()