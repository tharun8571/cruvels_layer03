"""Integrity tests verifying 100% hash parity on actual stored statutory bytes."""

from kb_cruvels.verification.text_integrity import audit_text_integrity


def test_stored_text_hash_parity(db_session):
    result = audit_text_integrity(db_session)
    assert result["mismatches_count"] == 0
    assert result["empty_text_count"] == 0
    assert result["hash_parity_percentage"] == 100.0
