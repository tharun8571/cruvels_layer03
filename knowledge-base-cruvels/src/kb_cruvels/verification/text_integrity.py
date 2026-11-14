"""Text Integrity and Cryptographic Hash Auditing."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from kb_cruvels.database.models.provisions import StatutoryProvision
from kb_cruvels.domain.identifiers import calculate_sha256, normalize_statutory_text


def audit_text_integrity(
    db: Session,
    sample_size: int = 1000,
    instrument_id: str | None = None,
) -> dict[str, Any]:
    """
    Recalculate SHA-256 hashes from actual stored statutory bytes
    and verify 100% cryptographic parity against stored canonical hashes.
    """
    query = db.query(StatutoryProvision)
    if instrument_id:
        query = query.filter(StatutoryProvision.instrument_id == instrument_id)

    total_checked = 0
    mismatches = 0
    empty_texts = 0
    mismatch_details: list[dict[str, Any]] = []

    provisions = query.limit(sample_size).all()

    for prov in provisions:
        total_checked += 1
        raw_text = prov.source_text or ""
        if len(raw_text.strip()) == 0:
            empty_texts += 1

        recalculated_raw_hash = calculate_sha256(raw_text)
        recalculated_canonical = calculate_sha256(normalize_statutory_text(raw_text))

        is_raw_match = (prov.raw_hash == recalculated_raw_hash)
        is_canonical_match = (prov.canonical_hash == recalculated_canonical)

        if not is_raw_match or not is_canonical_match:
            mismatches += 1
            mismatch_details.append({
                "provision_id": prov.id,
                "section": prov.section_number_norm,
                "instrument_id": prov.instrument_id,
                "stored_canonical_hash": prov.canonical_hash,
                "recalculated_canonical_hash": recalculated_canonical,
            })

    parity_pct = round(((total_checked - mismatches) / total_checked) * 100, 2) if total_checked > 0 else 100.0

    return {
        "total_provisions_audited": total_checked,
        "hash_parity_percentage": parity_pct,
        "mismatches_count": mismatches,
        "empty_text_count": empty_texts,
        "mismatch_samples": mismatch_details[:10],
    }
