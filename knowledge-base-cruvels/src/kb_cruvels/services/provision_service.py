"""Service layer for Statutory Provisions and Exact Resolution."""

from __future__ import annotations

from sqlalchemy.orm import Session

from kb_cruvels.core.exceptions import ProvisionNotFoundError
from kb_cruvels.database.models.provisions import StatutoryProvision
from kb_cruvels.database.repositories.provision_repo import ProvisionRepository


class ProvisionService:
    """Business service for exact statutory resolution and provision retrieval."""

    def __init__(self, db: Session):
        self.repo = ProvisionRepository(db)

    def get_provision_by_id(self, provision_id: str) -> StatutoryProvision:
        """Fetch provision or raise ProvisionNotFoundError."""
        prov = self.repo.get_by_id(provision_id)
        if not prov:
            raise ProvisionNotFoundError(f"Statutory provision with ID '{provision_id}' not found.")
        return prov

    def resolve_exact_provision(
        self,
        act_identifier: str,
        section_number: str,
        jurisdiction: str | None = None,
        state_or_ut: str | None = None,
    ) -> StatutoryProvision:
        """
        Exact statutory resolution for queries like:
        'What does Section 193 of the BNSS provide?'
        """
        prov = self.repo.resolve_exact(
            act_identifier=act_identifier,
            section_number=section_number,
            jurisdiction=jurisdiction,
            state_or_ut=state_or_ut,
        )
        if not prov:
            raise ProvisionNotFoundError(
                f"Could not resolve Section '{section_number}' in Act '{act_identifier}' (jurisdiction={jurisdiction or 'any'})."
            )
        return prov

    def list_provisions_by_instrument(
        self, instrument_id: str, limit: int = 100, offset: int = 0
    ) -> tuple[list[StatutoryProvision], int]:
        """List sections belonging to a legal instrument."""
        return self.repo.list_by_instrument(instrument_id, limit=min(limit, 500), offset=max(offset, 0))

    def get_total_count(self) -> int:
        return self.repo.count_total()
