"""Integration tests for Phase 1 API endpoints: Judgments, Doctrines, Definitions, Procedures, Forms, Templates, Notifications, Cross-References."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from kb_cruvels.api.dependencies import get_db
from kb_cruvels.data.curated_seed import seed_phase1_curated_data
from kb_cruvels.database.models.base import Base
from kb_cruvels.main import app

engine_test = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(scope="module", autouse=True)
def setup_phase1_test_db():
    Base.metadata.create_all(bind=engine_test)
    with TestingSessionLocal() as session:
        seed_phase1_curated_data(session)
    yield
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_get_judgments(client: TestClient):
    response = client.get("/v1/judgments")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 5
    assert len(data["items"]) >= 5
    first = data["items"][0]
    assert "citation" in first
    assert "case_title" in first


def test_get_judgment_by_citation(client: TestClient):
    response = client.get("/v1/judgments/(1973) 4 SCC 225")
    assert response.status_code == 200
    data = response.json()
    assert "Kesavananda Bharati" in data["case_title"]
    assert "Basic Structure Doctrine" in data["doctrines_applied"]


def test_get_doctrines(client: TestClient):
    response = client.get("/v1/doctrines")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    names = [d["name"] for d in data]
    assert "Basic Structure Doctrine" in names
    assert "Audi Alteram Partem" in names


def test_get_definitions(client: TestClient):
    response = client.get("/v1/definitions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5


def test_get_procedures(client: TestClient):
    response = client.get("/v1/procedures")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    proc_names = [p["procedure_name"] for p in data]
    assert "Anticipatory Bail Procedure" in proc_names


def test_get_forms_and_templates(client: TestClient):
    res_f = client.get("/v1/forms")
    assert res_f.status_code == 200
    assert len(res_f.json()) >= 1

    res_t = client.get("/v1/templates")
    assert res_t.status_code == 200
    assert len(res_t.json()) >= 1


def test_get_notifications(client: TestClient):
    response = client.get("/v1/notifications")
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_get_cross_references(client: TestClient):
    response = client.get("/v1/cross-references")
    assert response.status_code == 200
    assert len(response.json()) >= 1
