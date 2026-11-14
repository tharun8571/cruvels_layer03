"""Repository for StatutoryProvision queries, exact statutory resolution, and full-text search."""

from __future__ import annotations

from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session, joinedload

from kb_cruvels.database.models.instruments import LegalInstrument
from kb_cruvels.database.models.provisions import StatutoryProvision
from kb_cruvels.domain.identifiers import normalize_section_number
from kb_cruvels.domain.provisions import StatutoryProvisionDomain


class ProvisionRepository:
    """Handles exact statutory resolution, full-text queries, and provision persistence."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, provision_id: str) -> StatutoryProvision | None:
        """Fetch provision by primary key with instrument loaded."""
        return (
            self.db.query(StatutoryProvision)
            .options(joinedload(StatutoryProvision.instrument), joinedload(StatutoryProvision.nodes))
            .filter(StatutoryProvision.id == provision_id)
            .first()
        )

    def resolve_exact(
        self,
        act_identifier: str,
        section_number: str,
        jurisdiction: str | None = None,
        state_or_ut: str | None = None,
    ) -> StatutoryProvision | None:
        """
        Exact statutory resolution for queries like:
        'What does Section 193 of the BNSS provide?'
        
        Matches by:
        1. Act ID or Act Title (exact, short title, or ILIKE)
        2. Normalized section identifier (e.g., '193', '53A')
        3. Optional jurisdiction filter
        """
        sec_norm = normalize_section_number(section_number)

        query = (
            self.db.query(StatutoryProvision)
            .join(LegalInstrument, StatutoryProvision.instrument_id == LegalInstrument.id)
            .options(joinedload(StatutoryProvision.instrument), joinedload(StatutoryProvision.nodes))
            .filter(StatutoryProvision.section_number_norm == sec_norm)
        )

        if jurisdiction:
            query = query.filter(LegalInstrument.jurisdiction == jurisdiction)
        if state_or_ut:
            query = query.filter(LegalInstrument.state_or_ut == state_or_ut)

        # 1. Try matching by instrument ID
        prov = query.filter(LegalInstrument.id == act_identifier).first()
        if prov:
            return prov

        # 2. Try matching by source_act_id
        prov = query.filter(LegalInstrument.source_act_id == act_identifier).first()
        if prov:
            return prov

        # 3. Clean and standardize act query string
        clean_act = act_identifier.strip()
        clean_act_lower = clean_act.lower()
        if clean_act_lower.startswith("the "):
            core_act = clean_act[4:].strip()
        else:
            core_act = clean_act

        # Handle well-known acronyms
        acronym_map = {
            "bns": "Bharatiya Nyaya Sanhita",
            "bnss": "Bharatiya Nagarik Suraksha Sanhita",
            "bsa": "Bharatiya Sakshya Adhiniyam",
            "ipc": "Indian Penal Code",
            "crpc": "Code of Criminal Procedure",
            "cpc": "Code of Civil Procedure",
            "iea": "Indian Evidence Act",
            "it act": "Information Technology Act",
            "dpdp act": "Digital Personal Data Protection Act",
            "dpdp": "Digital Personal Data Protection Act",
            "ni act": "Negotiable Instruments Act",
            "tpa": "Transfer of Property Act",
            "sra": "Specific Relief Act",
            "ibc": "Insolvency and Bankruptcy Code",
            "pmla": "Prevention of Money Laundering Act",
            "pocso": "Protection of Children from Sexual Offences",
            "ndps": "Narcotic Drugs and Psychotropic Substances",
            "rera": "Real Estate (Regulation and Development)",
        }
        if clean_act_lower in acronym_map:
            core_act = acronym_map[clean_act_lower]

        # 4. Exact Title or Short Title Match (case-insensitive)
        prov = query.filter(
            or_(
                func.lower(LegalInstrument.title) == clean_act_lower,
                func.lower(LegalInstrument.short_title) == clean_act_lower,
                func.lower(LegalInstrument.title) == f"the {clean_act_lower}",
                func.lower(LegalInstrument.title).ilike(f"%{core_act}%"),
            )
        ).order_by(
            # Prioritize Central jurisdiction over State
            case((LegalInstrument.jurisdiction == "central", 1), else_=2),
            # Prioritize titles starting with the core name
            case((LegalInstrument.title.ilike(f"{core_act}%"), 1), (LegalInstrument.title.ilike(f"The {core_act}%"), 1), else_=2),
        ).first()
        if prov:
            return prov

        # 5. Fallback to broad substring search
        return query.filter(LegalInstrument.title.ilike(f"%{clean_act}%")).first()

    def search_provisions(
        self,
        query_text: str,
        jurisdiction: str | None = None,
        state_or_ut: str | None = None,
        act_title: str | None = None,
        in_force_only: bool = True,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[StatutoryProvision], int]:
        """
        Full-text lexical search across statutory provisions.
        Uses PostgreSQL full-text search when available, or ILIKE fallback.
        """
        stmt = (
            self.db.query(StatutoryProvision)
            .join(LegalInstrument, StatutoryProvision.instrument_id == LegalInstrument.id)
            .options(joinedload(StatutoryProvision.instrument))
        )

        if in_force_only:
            stmt = stmt.filter(StatutoryProvision.in_force.is_(True))
        if jurisdiction:
            stmt = stmt.filter(LegalInstrument.jurisdiction == jurisdiction)
        if state_or_ut:
            stmt = stmt.filter(LegalInstrument.state_or_ut == state_or_ut)
        if act_title:
            stmt = stmt.filter(LegalInstrument.title.ilike(f"%{act_title}%"))

        if query_text:
            terms = [t.strip() for t in query_text.split() if t.strip()]
            if terms:
                # Each term should match at least one of the fields (title, text, chapter, section_number)
                term_filters = [
                    or_(
                        StatutoryProvision.source_text.ilike(f"%{term}%"),
                        StatutoryProvision.section_title.ilike(f"%{term}%"),
                        StatutoryProvision.section_number.ilike(f"%{term}%"),
                        StatutoryProvision.chapter.ilike(f"%{term}%"),
                        LegalInstrument.title.ilike(f"%{term}%"),
                    )
                    for term in terms
                ]
                from sqlalchemy import and_
                stmt = stmt.filter(and_(*term_filters))

        total = stmt.count()
        items = stmt.order_by(StatutoryProvision.created_at.desc()).offset(offset).limit(limit).all()
        return items, total

    def list_by_instrument(
        self, instrument_id: str, limit: int = 100, offset: int = 0
    ) -> tuple[list[StatutoryProvision], int]:
        """List all sections under a specific LegalInstrument."""
        stmt = (
            self.db.query(StatutoryProvision)
            .filter(StatutoryProvision.instrument_id == instrument_id)
            .order_by(StatutoryProvision.section_number_norm.asc())
        )
        total = stmt.count()
        items = stmt.offset(offset).limit(limit).all()
        return items, total

    def upsert_provision(self, domain: StatutoryProvisionDomain) -> StatutoryProvision:
        """Insert or update a statutory provision idempotently."""
        prov = (
            self.db.query(StatutoryProvision)
            .filter(
                StatutoryProvision.instrument_id == domain.instrument_id,
                StatutoryProvision.section_number_norm == domain.section_number_norm,
            )
            .first()
        )

        if prov:
            # Update existing
            prov.section_number = domain.section_number
            prov.section_title = domain.section_title
            prov.chapter = domain.chapter
            prov.part = domain.part
            prov.provision_type = domain.provision_type.value
            prov.source_text = domain.source_text
            prov.canonical_text = domain.canonical_text
            prov.raw_hash = domain.raw_hash
            prov.canonical_hash = domain.canonical_hash
            prov.status = domain.status
            prov.in_force = domain.in_force
            prov.has_proviso = domain.has_proviso
            prov.has_non_obstante = domain.has_non_obstante
            prov.acts_referenced = domain.acts_referenced
            prov.defined_terms = domain.defined_terms
            prov.amendment_count = domain.amendment_count
            prov.source_url = domain.source_url
            prov.snapshot_version = domain.snapshot_version
            prov.extra_metadata = domain.extra_metadata
        else:
            # Create new
            prov = StatutoryProvision(
                id=domain.id,
                instrument_id=domain.instrument_id,
                source_chunk_id=domain.source_chunk_id,
                section_number=domain.section_number,
                section_number_norm=domain.section_number_norm,
                section_title=domain.section_title,
                chapter=domain.chapter,
                part=domain.part,
                provision_type=domain.provision_type.value,
                source_text=domain.source_text,
                canonical_text=domain.canonical_text,
                raw_hash=domain.raw_hash,
                canonical_hash=domain.canonical_hash,
                status=domain.status,
                in_force=domain.in_force,
                has_proviso=domain.has_proviso,
                has_non_obstante=domain.has_non_obstante,
                acts_referenced=domain.acts_referenced,
                defined_terms=domain.defined_terms,
                amendment_count=domain.amendment_count,
                source_url=domain.source_url,
                snapshot_version=domain.snapshot_version,
                extra_metadata=domain.extra_metadata,
            )
            self.db.add(prov)

        return prov

    def count_total(self) -> int:
        return self.db.query(func.count(StatutoryProvision.id)).scalar() or 0
