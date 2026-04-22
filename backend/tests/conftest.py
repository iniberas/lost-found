import os
import pytest
from dotenv import load_dotenv
from uuid import uuid4
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app 
from app.api.dependencies import get_db, get_current_user, get_current_admin_user
from app.domain.entities.user import User, Admin
from app.infrastructure.database.models.base import Base


load_dotenv()

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")


engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def dummy_user():
    return User(
        id=uuid4(),
        created_at=datetime.now(),
        updated_at=datetime.now(),
        name="Test User",
        email="test@apps.ipb.ac.id",
        phone_number="08123456789",
        password_hash="fake_hashed_password_123"
    )


@pytest.fixture
def dummy_admin():
    return Admin(
        id=uuid4(),
        created_at=datetime.now(),
        updated_at=datetime.now(),
        name="Admin User",
        email="admin@ipb.ac.id",
        phone_number="08987654321",
        password_hash="fake_admin_hash_123"
    )


@pytest.fixture(scope="function")
def client(db_session, dummy_user):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass 

    def override_get_current_user():
        return dummy_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    with TestClient(app) as test_client:
        yield test_client
        
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_client(db_session, dummy_admin):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        return dummy_admin
        
    def override_get_current_admin_user():
        return dummy_admin

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_current_admin_user] = override_get_current_admin_user
    
    with TestClient(app) as test_client:
        yield test_client
        
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def unauthenticated_client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
        
    app.dependency_overrides.clear()