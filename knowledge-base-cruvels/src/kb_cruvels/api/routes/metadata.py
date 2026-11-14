"""Metadata and Corpus Statistics API endpoints."""

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from kb_cruvels.api.dependencies import get_db
from kb_cruvels.api.schemas.metadata import CorpusStatsResponse
from kb_cruvels.core.config import settings
from kb_cruvels.database.models.instruments import LegalInstrument
from kb_cruvels.database.models.provisions import StatutoryProvision
from kb_cruvels.sources.open_india_law.manifest import build_manifest_data

router = APIRouter(prefix=settings.API_PREFIX, tags=["Metadata"])


@router.get("/metadata/stats", response_model=CorpusStatsResponse)
def get_corpus_stats(db: Session = Depends(get_db)) -> CorpusStatsResponse:
    """Retrieve verified summary counts and jurisdictional breakdown of the stored legal corpus."""
    total_inst = db.query(func.count(LegalInstrument.id)).scalar() or 0
    total_prov = db.query(func.count(StatutoryProvision.id)).scalar() or 0
    in_force_prov = db.query(func.count(StatutoryProvision.id)).filter(StatutoryProvision.in_force.is_(True)).scalar() or 0

    central_prov = (
        db.query(func.count(StatutoryProvision.id))
        .join(LegalInstrument, StatutoryProvision.instrument_id == LegalInstrument.id)
        .filter(LegalInstrument.jurisdiction == "central")
        .scalar()
        or 0
    )

    state_prov = (
        db.query(func.count(StatutoryProvision.id))
        .join(LegalInstrument, StatutoryProvision.instrument_id == LegalInstrument.id)
        .filter(LegalInstrument.jurisdiction == "state")
        .scalar()
        or 0
    )

    ut_prov = (
        db.query(func.count(StatutoryProvision.id))
        .join(LegalInstrument, StatutoryProvision.instrument_id == LegalInstrument.id)
        .filter(LegalInstrument.jurisdiction == "union_territory")
        .scalar()
        or 0
    )

    return CorpusStatsResponse(
        total_instruments=total_inst,
        total_provisions=total_prov,
        total_in_force_provisions=in_force_prov,
        central_provisions=central_prov,
        state_provisions=state_prov,
        union_territory_provisions=ut_prov,
        snapshot_version=settings.UPSTREAM_SNAPSHOT,
    )


@router.get("/metadata/manifest")
def get_upstream_manifest() -> dict[str, Any]:
    """Retrieve full upstream source manifest with all Central, State, and UT files, checksums, and expected rows."""
    return build_manifest_data(settings.UPSTREAM_SNAPSHOT)
