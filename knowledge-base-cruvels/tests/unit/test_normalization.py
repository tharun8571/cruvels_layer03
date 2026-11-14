"""Unit tests for taxonomy repair and text cleaning."""

from kb_cruvels.ingestion.normalize import clean_statutory_text
from kb_cruvels.sources.open_india_law.source_mapping import (
    coerce_upstream_field,
    repair_upstream_taxonomy,
)


def test_coerce_upstream_field():
    assert coerce_upstream_field("year", "2023") == 2023
    assert coerce_upstream_field("year", "") is None
    assert coerce_upstream_field("in_force", "true") is True
    assert coerce_upstream_field("in_force", "False") is False
    assert coerce_upstream_field("acts_referenced", ["Act A", "Act B"]) == ["Act A", "Act B"]
    assert coerce_upstream_field("title", "  Sample Title  ") == "Sample Title"


def test_repair_upstream_taxonomy_central():
    row = {
        "jurisdiction": "central",
        "state": "central",
        "instrument_type": "legislation",
        "act_status": "in_force",
    }
    tax = repair_upstream_taxonomy(row)
    assert tax["jurisdiction"] == "central"
    assert tax["state_or_ut"] is None
    assert tax["instrument_type"] == "legislation"
    assert tax["status"] == "in_force"
    assert tax["in_force"] is True


def test_repair_upstream_taxonomy_state():
    row = {
        "jurisdiction": "state",
        "state": "maharashtra",
        "instrument_type": "legislation",
        "act_status": "in_force",
    }
    tax = repair_upstream_taxonomy(row)
    assert tax["jurisdiction"] == "state"
    assert tax["state_or_ut"] == "maharashtra"


def test_repair_upstream_taxonomy_regulatory():
    # Regulatory instruments should have jurisdiction=central and instrument_type=regulation
    row = {
        "jurisdiction": "regulatory",
        "state": "central",
        "regulatory_body": "RBI",
        "act_status": "superseded",
    }
    tax = repair_upstream_taxonomy(row)
    assert tax["jurisdiction"] == "central"
    assert tax["instrument_type"] == "regulation"
    assert tax["status"] == "superseded"
    assert tax["in_force"] is False


def test_clean_statutory_text():
    dirty = "Section 1.\x00\r\n(1) The text\u00a0here.\n\n\n\n(2) Next part."
    cleaned = clean_statutory_text(dirty)
    assert "\x00" not in cleaned
    assert "\r" not in cleaned
    assert "\u00a0" not in cleaned
    assert "\n\n\n\n" not in cleaned
    assert "(1) The text here." in cleaned
