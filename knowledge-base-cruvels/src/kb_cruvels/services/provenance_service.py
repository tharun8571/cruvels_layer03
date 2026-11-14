"""Service layer for Provenance tracking and Source Artifacts."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from kb_cruvels.database.models.provenance import SourceArtifact
from kb_cruvels.verification.source_reconciliation import reconcile_corpus_counts
from kb_cruvels.verification.text_integrity import audit_text_integrity


class ProvenanceService:
    """Business service for provenance audit and file artifacts."""

    def __init__(self, db: Session):
        self.db = db

    def list_source_artifacts(self) -> list[SourceArtifact]:
        """List all tracked source artifacts."""
        return self.db.query(SourceArtifact).order_by(SourceArtifact.filename.asc()).all()

    def audit_integrity(self, sample_size: int = 1000) -> dict[str, Any]:
        """Perform text and hash integrity check."""
        return audit_text_integrity(self.db, sample_size=sample_size)

    def reconcile_counts(self) -> dict[str, Any]:
        """Perform source-to-database count reconciliation."""
        return reconcile_corpus_counts(self.db)
