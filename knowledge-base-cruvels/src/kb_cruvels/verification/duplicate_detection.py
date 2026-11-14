"""Duplicate provision and collision detection module."""

from __future__ import annotations

from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from kb_cruvels.database.models.provisions import StatutoryProvision


def audit_duplicate_provisions(db: Session) -> dict[str, Any]:
    """
    Check for duplicate section identifiers under the same legal instrument.
    """
    duplicates_query = (
        db.query(
            StatutoryProvision.instrument_id,
            StatutoryProvision.section_number_norm,
            func.count(StatutoryProvision.id).label("count"),
        )
        .group_by(StatutoryProvision.instrument_id, StatutoryProvision.section_number_norm)
        .having(func.count(StatutoryProvision.id) > 1)
        .all()
    )

    duplicate_list = [
        {"instrument_id": item[0], "section_number_norm": item[1], "count": item[2]}
        for item in duplicates_query
    ]

    return {
        "duplicate_groups_count": len(duplicate_list),
        "duplicates": duplicate_list[:20],
        "has_collisions": len(duplicate_list) > 0,
    }
