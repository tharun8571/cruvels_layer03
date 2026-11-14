"""Service layer for Historical Versions and Temporal Lineage."""

from __future__ import annotations

from sqlalchemy.orm import Session

from kb_cruvels.database.models.temporal import ProvisionVersion


class TemporalService:
    """Business service for historical statutory versions."""

    def __init__(self, db: Session):
        self.db = db

    def get_versions_for_provision(self, provision_id: str) -> list[ProvisionVersion]:
        """Fetch all historical versions for a statutory provision."""
        return (
            self.db.query(ProvisionVersion)
            .filter(ProvisionVersion.provision_id == provision_id)
            .order_by(ProvisionVersion.version_number.asc())
            .all()
        )
