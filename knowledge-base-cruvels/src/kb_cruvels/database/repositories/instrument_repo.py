"""Repository for LegalInstrument queries and upserts."""

from __future__ import annotations

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from kb_cruvels.database.models.instruments import LegalInstrument
from kb_cruvels.domain.instruments import LegalInstrumentDomain


class InstrumentRepository:
    """Handles persistence and retrieval of Legal Instruments."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, instrument_id: str) -> LegalInstrument | None:
        """Fetch instrument by internal ID."""
        return self.db.query(LegalInstrument).filter(LegalInstrument.id == instrument_id).first()

    def get_by_source_act_id(self, source_act_id: str) -> LegalInstrument | None:
        """Fetch instrument by upstream source_act_id."""
        return self.db.query(LegalInstrument).filter(LegalInstrument.source_act_id == source_act_id).first()

    def find_by_title_and_jurisdiction(
        self, title: str, jurisdiction: str | None = None, state_or_ut: str | None = None
    ) -> LegalInstrument | None:
        """Find best matching instrument by exact or normalized title."""
        query = self.db.query(LegalInstrument)
        if jurisdiction:
            query = query.filter(LegalInstrument.jurisdiction == jurisdiction)
        if state_or_ut:
            query = query.filter(LegalInstrument.state_or_ut == state_or_ut)

        # Try exact title match first
        inst = query.filter(func.lower(LegalInstrument.title) == title.strip().lower()).first()
        if inst:
            return inst

        # Try short title match
        inst = query.filter(func.lower(LegalInstrument.short_title) == title.strip().lower()).first()
        if inst:
            return inst

        # Fallback to ILIKE match
        return query.filter(LegalInstrument.title.ilike(f"%{title.strip()}%")).first()

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
        stmt = self.db.query(LegalInstrument)

        if jurisdiction:
            stmt = stmt.filter(LegalInstrument.jurisdiction == jurisdiction)
        if state_or_ut:
            stmt = stmt.filter(LegalInstrument.state_or_ut == state_or_ut)
        if year:
            stmt = stmt.filter(LegalInstrument.year == year)
        if query:
            stmt = stmt.filter(
                or_(
                    LegalInstrument.title.ilike(f"%{query}%"),
                    LegalInstrument.short_title.ilike(f"%{query}%"),
                    LegalInstrument.act_number.ilike(f"%{query}%"),
                )
            )

        total = stmt.count()
        items = stmt.order_by(LegalInstrument.year.desc().nullslast(), LegalInstrument.title.asc()).offset(offset).limit(limit).all()
        return items, total

    def upsert_instrument(self, domain: LegalInstrumentDomain) -> LegalInstrument:
        """Insert or update a legal instrument."""
        inst = self.get_by_id(domain.id) if domain.id else None
        if not inst:
            inst = self.get_by_source_act_id(domain.source_act_id)

        if inst:
            # Update existing
            inst.title = domain.title
            inst.short_title = domain.short_title
            inst.year = domain.year
            inst.act_number = domain.act_number
            inst.instrument_type = domain.instrument_type.value
            inst.jurisdiction = domain.jurisdiction
            inst.state_or_ut = domain.state_or_ut
            inst.status = domain.status.value
            inst.in_force = domain.in_force
            inst.doc_type = domain.doc_type
            inst.legal_subject = domain.legal_subject
            inst.department = domain.department
            inst.regulatory_body = domain.regulatory_body
            inst.source_url = domain.source_url
            inst.snapshot_version = domain.snapshot_version
            inst.extra_metadata = domain.extra_metadata
        else:
            # Create new
            inst = LegalInstrument(
                id=domain.id,
                source_act_id=domain.source_act_id,
                title=domain.title,
                short_title=domain.short_title,
                year=domain.year,
                act_number=domain.act_number,
                instrument_type=domain.instrument_type.value,
                jurisdiction=domain.jurisdiction,
                state_or_ut=domain.state_or_ut,
                status=domain.status.value,
                in_force=domain.in_force,
                doc_type=domain.doc_type,
                legal_subject=domain.legal_subject,
                department=domain.department,
                regulatory_body=domain.regulatory_body,
                source_url=domain.source_url,
                snapshot_version=domain.snapshot_version,
                extra_metadata=domain.extra_metadata,
            )
            self.db.add(inst)

        return inst

    def count_total(self) -> int:
        return self.db.query(func.count(LegalInstrument.id)).scalar() or 0
