from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.api.dependencies import get_db
from app.api.v1.auth import router as auth_router
from app.infrastructure.database.session import engine
from app.infrastructure.database.models.base import Base


app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "message": "Ada database hore hore"}
    except Exception as e:
        print(f"DB Connection Error: {e}")
        raise HTTPException(status_code=500, detail="koneksi gagal huhuuu")
    
app.include_router(auth_router)

Base.metadata.create_all(bind=engine)
