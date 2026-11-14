"""Schema definitions, mapping metadata, and taxonomy normalizers for Open India Law."""

from __future__ import annotations

from typing import Any

MAPPING_VERSION = "1.0.0"

#: Complete canonical schema published by Open India Law (August 2026 snapshot)
UPSTREAM_LEGISLATION_SCHEMA = (
    "act_id",
    "chunk_id",
    "title",
    "chapter",
    "section_number",
    "section_title",
    "text",
    "jurisdiction",
    "state",
    "instrument_type",
    "act_status",
    "in_force",
    "doc_type",
    "provision_type",
    "section_type",
    "legal_subject",
    "has_proviso",
    "has_non_obstante",
    "delegation_type",
    "department",
    "regulatory_body",
    "acts_referenced",
    "defined_terms",
    "amendment_count",
    "year",
    "source_url",
    "language_code",
)

INT_FIELDS: set[str] = {
    "year",
    "amendment_count",
    "chunk_index",
    "total_chunks",
    "char_start",
    "char_end",
}

BOOL_FIELDS: set[str] = {
    "in_force",
    "has_proviso",
    "has_non_obstante",
    "box_aware",
}

LIST_FIELDS: set[str] = {
    "acts_referenced",
    "defined_terms",
    "judges",
}


def coerce_upstream_field(field_name: str, value: Any) -> Any:
    """Coerce raw values into strongly typed Python primitives."""
    if value is None:
        return None

    if field_name in INT_FIELDS:
        try:
            return int(value) if str(value).strip() != "" else None
        except (ValueError, TypeError):
            return None

    if field_name in BOOL_FIELDS:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            v_lower = value.strip().lower()
            if v_lower in ("true", "1", "t", "yes"):
                return True
            if v_lower in ("false", "0", "f", "no"):
                return False
        return bool(value)

    if field_name in LIST_FIELDS:
        if isinstance(value, list):
            return [str(item).strip() for item in value if item is not None]
        if isinstance(value, str) and value.strip():
            # If serialized as comma or json
            return [value.strip()]
        return []

    if isinstance(value, (str, int, float)):
        return str(value).strip()

    return str(value)


def repair_upstream_taxonomy(row: dict[str, Any]) -> dict[str, Any]:
    """
    Repair upstream taxonomy inconsistencies identified in Open India Law v2026.08:
    1. Unify 'state' vs 'jurisdiction' (central vs state level).
    2. Decompose regulatory instruments into jurisdiction='central' and instrument_type='regulation'.
    3. Normalize 'superseded' act_status.
    """
    state_val = str(row.get("state") or "").strip().lower()
    raw_jurisdiction = str(row.get("jurisdiction") or "").strip().lower()
    raw_inst_type = str(row.get("instrument_type") or "").strip().lower()
    raw_act_status = str(row.get("act_status") or "").strip().lower()

    # Determine real jurisdiction
    if state_val == "central" or raw_jurisdiction == "central":
        jurisdiction = "central"
        state_or_ut = None
    elif state_val:
        jurisdiction = "state"
        state_or_ut = state_val
    elif raw_jurisdiction not in ("regulatory", "central", ""):
        jurisdiction = "state"
        state_or_ut = raw_jurisdiction
    else:
        jurisdiction = "central"
        state_or_ut = None

    # Determine instrument type
    if raw_inst_type in ("regulation", "regulatory", "rules", "rule") or raw_jurisdiction == "regulatory" or row.get("regulatory_body"):
        instrument_type = "regulation"
    else:
        instrument_type = "legislation"

    # Status normalization
    if raw_act_status in ("repealed", "spent", "superseded", "in_force"):
        status = raw_act_status
    elif row.get("is_repealed") is True:
        status = "repealed"
    else:
        status = "in_force"

    in_force = (status == "in_force")

    return {
        "jurisdiction": jurisdiction,
        "state_or_ut": state_or_ut,
        "instrument_type": instrument_type,
        "status": status,
        "in_force": in_force,
    }
