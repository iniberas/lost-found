from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.api.dependencies import get_db
from app.api.login import router as login_router
from app.api.register import router as register_router
from app.api.token import router as token_router
from app.db.session import Base, engine

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
    
app.include_router(login_router)
app.include_router(register_router)
app.include_router(token_router)

Base.metadata.create_all(bind=engine)
