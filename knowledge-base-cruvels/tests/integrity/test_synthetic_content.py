"""Integrity tests asserting zero synthetic / placeholder text in stored provisions."""

from kb_cruvels.verification.synthetic_content import audit_synthetic_content


def test_zero_synthetic_content(db_session):
    result = audit_synthetic_content(db_session)
    assert result["is_100_percent_verbatim"] is True
    assert result["suspicious_provisions_found"] == 0
    assert len(result["flagged_samples"]) == 0
