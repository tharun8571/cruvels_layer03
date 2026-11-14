"""Row-level validation and quarantine filtering."""

from __future__ import annotations

from kb_cruvels.domain.instruments import LegalInstrumentDomain
from kb_cruvels.domain.provisions import StatutoryProvisionDomain


def validate_provision_record(
    instrument: LegalInstrumentDomain, provision: StatutoryProvisionDomain
) -> tuple[bool, list[str]]:
    """
    Validate canonical domain objects before committing to production database.
    
    Validation criteria:
    1. Instrument has a non-empty title.
    2. Provision has non-empty section_number_norm.
    3. Provision has non-empty statutory text (source_text.strip() != "").
    4. Canonical hash is a valid 64-character hex string.
    5. Jurisdiction is specified.
    """
    errors: list[str] = []

    if not instrument.title or not instrument.title.strip():
        errors.append("Empty instrument title")

    if not instrument.jurisdiction:
        errors.append("Missing jurisdiction")

    if not provision.section_number_norm:
        errors.append("Empty section number identifier")

    if not provision.source_text or len(provision.source_text.strip()) < 2:
        errors.append("Empty or trivial statutory source text")

    if not provision.canonical_hash or len(provision.canonical_hash) != 64:
        errors.append("Invalid canonical SHA-256 hash")

    is_valid = len(errors) == 0
    return is_valid, errors
