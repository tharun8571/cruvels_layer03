"""Source reconciliation between manifest expectations and actual database records."""

from __future__ import annotations

from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from kb_cruvels.database.models.instruments import LegalInstrument
from kb_cruvels.database.models.provisions import StatutoryProvision
from kb_cruvels.sources.open_india_law.manifest import LEGISLATION_INVENTORY


def reconcile_corpus_counts(db: Session) -> dict[str, Any]:
    """
    Reconcile database counts against upstream published inventory expectations.
    """
    total_db_provisions = db.query(func.count(StatutoryProvision.id)).scalar() or 0
    total_db_instruments = db.query(func.count(LegalInstrument.id)).scalar() or 0

    # Group DB provisions by jurisdiction & state
    state_breakdown_raw = (
        db.query(
            LegalInstrument.jurisdiction,
            LegalInstrument.state_or_ut,
            func.count(StatutoryProvision.id).label("provisions_count"),
            func.count(func.distinct(LegalInstrument.id)).label("instruments_count"),
        )
        .join(StatutoryProvision, StatutoryProvision.instrument_id == LegalInstrument.id)
        .group_by(LegalInstrument.jurisdiction, LegalInstrument.state_or_ut)
        .all()
    )

    db_state_map = {}
    for j, s, p_count, i_count in state_breakdown_raw:
        key = s or j
        db_state_map[key] = {"provisions": p_count, "instruments": i_count}

    reconciliation_rows = []
    manifest_expected_provisions = 0
    manifest_expected_instruments = 0

    for item in LEGISLATION_INVENTORY:
        key = item["state"] or item["jurisdiction"]
        expected_p = item["expected_rows"]
        expected_i = item["instruments"]
        manifest_expected_provisions += expected_p
        manifest_expected_instruments += expected_i

        actual = db_state_map.get(key, {"provisions": 0, "instruments": 0})
        reconciliation_rows.append({
            "partition": item["file"],
            "jurisdiction_key": key,
            "expected_provisions": expected_p,
            "actual_provisions": actual["provisions"],
            "expected_instruments": expected_i,
            "actual_instruments": actual["instruments"],
            "coverage_pct": round((actual["provisions"] / expected_p) * 100, 2) if expected_p > 0 else 0.0,
        })

    return {
        "manifest_expected_provisions": manifest_expected_provisions,
        "actual_database_provisions": total_db_provisions,
        "manifest_expected_instruments": manifest_expected_instruments,
        "actual_database_instruments": total_db_instruments,
        "overall_coverage_pct": round((total_db_provisions / manifest_expected_provisions) * 100, 2) if manifest_expected_provisions > 0 else 0.0,
        "partitions": reconciliation_rows,
    }
