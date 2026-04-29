import asyncio
from contextlib import asynccontextmanager

from app.api.v1 import router as api_router
from app.core.config import settings
from app.domain.exceptions import StateTransitionError, ValidationError
from app.infrastructure.database.models.base import Base
# setup alembic pls :')
from app.infrastructure.database.models.category import CategoryModel
from app.infrastructure.database.models.proof import ProofModel
from app.infrastructure.database.models.report import FoundReportModel, LostReportModel, ReportModel
from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.session import engine
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    max_retries = 5
    delay_seconds = 3
    for attempt in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("Successfully connected to the database and created tables!")
            break
        except Exception as e:
            print(
                f"Database connection refused (attempt {attempt + 1}/{max_retries}). Waiting {delay_seconds} seconds..."
            )
            if attempt == max_retries - 1:
                raise Exception(
                    "Could not connect to the database after multiple retries"
                ) from e
            await asyncio.sleep(delay_seconds)
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(StateTransitionError)
async def state_transition_error_handler(request: Request, exc: StateTransitionError):
    return JSONResponse(status_code=422, content={"detail": str(exc)})


app.include_router(api_router)
app.mount(
    "/uploads",
    StaticFiles(directory=settings.UPLOAD_DIR, check_dir=False),
    name="uploads",
)


@app.get("/health")
async def health():
    return {"status": "ok"}
