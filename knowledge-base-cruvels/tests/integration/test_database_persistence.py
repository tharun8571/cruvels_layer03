"""Integration tests for database persistence, idempotent imports, and constraints."""

import uuid
from pathlib import Path

from kb_cruvels.database.models.instruments import LegalInstrument
from kb_cruvels.database.models.provisions import StatutoryProvision
from kb_cruvels.ingestion.orchestrator import IngestionOrchestrator


def test_idempotent_ingestion(db_session):
    orch = IngestionOrchestrator(db_session=db_session)
    fixture_path = Path("tests/fixtures/sample_legislation.parquet")

    # Initial count from conftest fixture setup
    initial_prov_count = db_session.query(StatutoryProvision).count()
    initial_inst_count = db_session.query(LegalInstrument).count()

    assert initial_prov_count == 7
    assert initial_inst_count >= 5

    # Run ingestion a second time with a fresh run_id to re-process all records
    reimport_run_id = f"reimport_run_{uuid.uuid4().hex[:8]}"
    report = orch.run(target_file=fixture_path, run_id=reimport_run_id)
    assert report["records_committed"] == 7

    # Assert record count is unchanged (no duplicated rows)
    final_prov_count = db_session.query(StatutoryProvision).count()
    final_inst_count = db_session.query(LegalInstrument).count()

    assert final_prov_count == initial_prov_count
    assert final_inst_count == initial_inst_count


def test_cascade_and_relationships(db_session):
    bnss = db_session.query(LegalInstrument).filter(LegalInstrument.title.ilike("%Bharatiya Nagarik%")).first()
    assert bnss is not None
    assert len(bnss.provisions) >= 3
