"""Integrity tests for source provenance and attribution metadata."""

from kb_cruvels.database.models.provisions import StatutoryProvision


def test_provenance_metadata_presence(db_session):
    provisions = db_session.query(StatutoryProvision).all()
    assert len(provisions) > 0

    for prov in provisions:
        assert prov.snapshot_version == "v2026.08"
        assert prov.source_url is not None
        assert prov.source_url.startswith("http")
        assert len(prov.canonical_hash) == 64
        assert len(prov.raw_hash) == 64
