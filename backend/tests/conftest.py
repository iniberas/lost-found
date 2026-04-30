import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from uuid import uuid4

import pytest
import pytest_asyncio
from app.core.dependencies import get_current_admin, get_current_user
from app.domain.entities.user import Admin, User
from app.infrastructure.database.models.base import Base
from app.infrastructure.database.session import get_session
from app.main import app
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

load_dotenv()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")


@pytest_asyncio.fixture(scope="function")
async def async_engine():
    engine = create_async_engine(TEST_DATABASE_URL)

    # Use Alembic to setup the test DB instead of Base.metadata
    # This usually requires a subprocess call or using alembic's config API
    # But for a quick fix, just make sure the DB is wiped:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        # We drop everything to ensure a clean start
        await conn.run_sync(Base.metadata.drop_all)

    # NOW run alembic upgrade head programmatically or via CLI before tests
    # ... code to run alembic ...

    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(async_engine):
    TestingSessionLocal = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    async with TestingSessionLocal() as session:
        yield session
        # Aman untuk berjaga-jaga jika ada transaksi yang lupa di-commit/rollback di test
        await session.rollback()


@pytest.fixture
def dummy_user():
    return User(
        id=uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="Test User",
        email="test@apps.ipb.ac.id",
        phone_number="+6281234567890",
        password_hash="fake_hashed_password_123",
    )


@pytest.fixture
def dummy_admin():
    return Admin(
        id=uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        name="Admin User",
        email="admin@ipb.ac.id",
        phone_number="+6289876543210",
        password_hash="fake_admin_hash_123",
    )


@pytest.fixture(scope="function")
def client(dummy_user, async_engine):
    TestingSessionLocal = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async def override_get_session():
        async with TestingSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def override_get_current_user():
        return dummy_user

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_current_user] = override_get_current_user

    @asynccontextmanager
    async def mock_lifespan(app):
        yield

    app.router.lifespan_context = mock_lifespan

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_client(dummy_admin, async_engine):
    TestingSessionLocal = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async def override_get_session():
        async with TestingSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def override_get_current_user():
        return dummy_admin

    async def override_get_current_admin():
        return dummy_admin

    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_current_admin] = override_get_current_admin

    @asynccontextmanager
    async def mock_lifespan(app):
        yield

    app.router.lifespan_context = mock_lifespan

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def unauthenticated_client(async_engine):
    TestingSessionLocal = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async def override_get_session():
        async with TestingSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_session] = override_get_session

    @asynccontextmanager
    async def mock_lifespan(app):
        yield

    app.router.lifespan_context = mock_lifespan

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
