"""Pytest fixtures and test environment configuration."""

import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from kb_cruvels.api.dependencies import get_db as api_get_db
from kb_cruvels.database.engine import Base
from kb_cruvels.database.session import get_db
from kb_cruvels.ingestion.orchestrator import IngestionOrchestrator
from kb_cruvels.main import app

# Use in-memory SQLite for rapid isolated unit/integration tests
TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def test_engine():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_engine):
    connection = test_engine.connect()
    transaction = connection.begin()
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSessionLocal()

    # Pre-populate sample fixture data into the test database with unique run_id
    orch = IngestionOrchestrator(db_session=session)
    sample_file = Path("tests/fixtures/sample_legislation.parquet")
    if sample_file.exists():
        orch.run(target_file=sample_file, run_id=f"test_run_{uuid.uuid4().hex[:8]}")

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[api_get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
