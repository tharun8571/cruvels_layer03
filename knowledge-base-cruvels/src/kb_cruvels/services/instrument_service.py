"""Service layer for Legal Instruments."""

from __future__ import annotations

from sqlalchemy.orm import Session

from kb_cruvels.core.exceptions import InstrumentNotFoundError
from kb_cruvels.database.models.instruments import LegalInstrument
from kb_cruvels.database.repositories.instrument_repo import InstrumentRepository


class InstrumentService:
    """Business service for querying Legal Instruments."""

    def __init__(self, db: Session):
        self.repo = InstrumentRepository(db)

    def get_instrument_by_id(self, instrument_id: str) -> LegalInstrument:
        """Fetch instrument or raise InstrumentNotFoundError."""
        inst = self.repo.get_by_id(instrument_id)
        if not inst:
            raise InstrumentNotFoundError(f"Legal instrument with ID '{instrument_id}' not found.")
        return inst

    def list_instruments(
        self,
        jurisdiction: str | None = None,
        state_or_ut: str | None = None,
        year: int | None = None,
        query: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[LegalInstrument], int]:
        """List instruments with filtering and pagination."""
        return self.repo.list_instruments(
            jurisdiction=jurisdiction,
            state_or_ut=state_or_ut,
            year=year,
            query=query,
            limit=min(limit, 200),
            offset=max(offset, 0),
        )

    def get_total_count(self) -> int:
        return self.repo.count_total()
