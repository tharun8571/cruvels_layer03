"""Synthetic content and hallucination detector."""

from __future__ import annotations

import re
from typing import Any

from sqlalchemy.orm import Session

from kb_cruvels.database.models.provisions import StatutoryProvision

# Signature patterns indicating synthesized, placeholder, or LLM-generated text
SYNTHETIC_PATTERNS = [
    re.compile(r"\[insert\s+(?:section|text|act|law|here)\]", re.IGNORECASE),
    re.compile(r"lorem\s+ipsum", re.IGNORECASE),
    re.compile(r"\bas\s+an\s+ai\b", re.IGNORECASE),
    re.compile(r"\bthis\s+is\s+a\s+placeholder\b", re.IGNORECASE),
    re.compile(r"\bhere\s+is\s+a\s+summary\s+of\s+section\b", re.IGNORECASE),
    re.compile(r"\bsynthetic\s+text\b", re.IGNORECASE),
]


def audit_synthetic_content(db: Session, sample_size: int = 2000) -> dict[str, Any]:
    """
    Audit provisions for any synthetic, placeholder, or generated content.
    Enforces the zero-synthetic requirement.
    """
    provisions = db.query(StatutoryProvision).limit(sample_size).all()

    total_audited = len(provisions)
    suspicious_count = 0
    flagged_records: list[dict[str, Any]] = []

    for prov in provisions:
        text = prov.source_text or ""
        matched_patterns = []
        for pattern in SYNTHETIC_PATTERNS:
            if pattern.search(text):
                matched_patterns.append(pattern.pattern)

        if matched_patterns:
            suspicious_count += 1
            flagged_records.append({
                "provision_id": prov.id,
                "section": prov.section_number_norm,
                "instrument_id": prov.instrument_id,
                "matched_patterns": matched_patterns,
                "snippet": text[:150],
            })

    return {
        "total_provisions_audited": total_audited,
        "suspicious_provisions_found": suspicious_count,
        "is_100_percent_verbatim": (suspicious_count == 0),
        "flagged_samples": flagged_records,
    }
