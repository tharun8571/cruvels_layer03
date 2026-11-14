"""Temporal tests for historical provision versions and lineage."""

from datetime import date

from kb_cruvels.database.models.provisions import StatutoryProvision
from kb_cruvels.database.models.temporal import ProvisionVersion
from kb_cruvels.services.temporal_service import TemporalService


def test_provision_historical_versions(db_session):
    prov = db_session.query(StatutoryProvision).first()
    assert prov is not None

    # Attach historical version
    v1 = ProvisionVersion(
        id=f"ver_{prov.id}_1",
        provision_id=prov.id,
        version_number=1,
        amendment_title="Original Enactment Version",
        effective_from=date(2023, 1, 1),
        effective_to=date(2024, 1, 1),
        is_current=False,
        version_text="Previous wording of section before amendment.",
        canonical_hash="0000000000000000000000000000000000000000000000000000000000000000",
        change_note="Initial version before 2024 amendment",
    )
    db_session.add(v1)
    db_session.commit()

    service = TemporalService(db_session)
    versions = service.get_versions_for_provision(prov.id)
    assert len(versions) == 1
    assert versions[0].version_number == 1
    assert versions[0].is_current is False
