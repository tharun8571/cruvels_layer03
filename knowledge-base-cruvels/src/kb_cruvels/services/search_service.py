"""Service layer for Full-Text and Legal Queries."""

from __future__ import annotations

from sqlalchemy.orm import Session

from kb_cruvels.database.models.provisions import StatutoryProvision
from kb_cruvels.database.repositories.provision_repo import ProvisionRepository


class SearchService:
    """Business service for full-text search across Indian legislation."""

    def __init__(self, db: Session):
        self.repo = ProvisionRepository(db)

    def search_provisions(
        self,
        query: str,
        jurisdiction: str | None = None,
        state_or_ut: str | None = None,
        act_title: str | None = None,
        in_force_only: bool = True,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[StatutoryProvision], int]:
        """Execute full-text statutory search."""
        return self.repo.search_provisions(
            query_text=query,
            jurisdiction=jurisdiction,
            state_or_ut=state_or_ut,
            act_title=act_title,
            in_force_only=in_force_only,
            limit=min(limit, 100),
            offset=max(offset, 0),
        )
