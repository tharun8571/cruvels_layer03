"""Deduplicating importer for IPFS India Laws into PostgreSQL."""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from kb_cruvels.database.models.instruments import LegalInstrument
from kb_cruvels.database.models.provisions import ProvisionNode, StatutoryProvision
from kb_cruvels.domain.identifiers import extract_act_identity
from kb_cruvels.domain.instruments import LegalInstrumentDomain
from kb_cruvels.domain.provisions import ProvisionNodeDomain
from kb_cruvels.sources.ipfs_india_laws.adapter import IpfsIndiaLawsAdapter

logger = logging.getLogger(__name__)


class IpfsIndiaLawsImporter:
    """Imports IPFS India Laws records into PostgreSQL with strict deduplication."""

    def __init__(self, db: Session, adapter: IpfsIndiaLawsAdapter | None = None):
        self.db = db
        self.adapter = adapter or IpfsIndiaLawsAdapter()

    def match_or_create_instrument(self, raw_law_row: dict[str, Any]) -> tuple[LegalInstrument, bool]:
        """
        Find existing instrument or create a new one.
        Returns: (LegalInstrument, is_new: bool)
        Guarantees ZERO duplicate instruments.
        """
        domain_inst: LegalInstrumentDomain = self.adapter.adapt_law(raw_law_row)

        # 1. Match by deterministic ID
        inst = self.db.query(LegalInstrument).filter(LegalInstrument.id == domain_inst.id).first()
        if inst:
            self._enrich_instrument(inst, domain_inst)
            return inst, False

        # 2. Match by upstream source_act_id
        if domain_inst.source_act_id:
            inst = (
                self.db.query(LegalInstrument)
                .filter(LegalInstrument.source_act_id == domain_inst.source_act_id)
                .first()
            )
            if inst:
                self._enrich_instrument(inst, domain_inst)
                return inst, False

        # 3. Match by exact title
        inst = (
            self.db.query(LegalInstrument)
            .filter(func.lower(LegalInstrument.title) == domain_inst.title.lower().strip())
            .first()
        )
        if inst:
            self._enrich_instrument(inst, domain_inst)
            return inst, False

        # 4. Match by clean short_title and year
        clean_title, year = extract_act_identity(domain_inst.title, domain_inst.year)
        if clean_title:
            query = self.db.query(LegalInstrument).filter(
                func.lower(func.coalesce(LegalInstrument.short_title, LegalInstrument.title))
                == clean_title.lower().strip()
            )
            if year:
                query = query.filter(LegalInstrument.year == year)
            inst = query.first()
            if inst:
                self._enrich_instrument(inst, domain_inst)
                return inst, False

        # 5. No match exists: create new instrument
        new_inst = LegalInstrument(
            id=domain_inst.id,
            source_act_id=domain_inst.source_act_id,
            title=domain_inst.title,
            short_title=domain_inst.short_title,
            year=domain_inst.year,
            act_number=domain_inst.act_number,
            instrument_type=domain_inst.instrument_type.value,
            jurisdiction=domain_inst.jurisdiction,
            state_or_ut=domain_inst.state_or_ut,
            status=domain_inst.status.value,
            in_force=domain_inst.in_force,
            doc_type=domain_inst.doc_type,
            legal_subject=domain_inst.legal_subject,
            department=domain_inst.department,
            regulatory_body=domain_inst.regulatory_body,
            source_url=domain_inst.source_url,
            snapshot_version=domain_inst.snapshot_version,
            extra_metadata=domain_inst.extra_metadata,
        )
        self.db.add(new_inst)
        self.db.flush()
        return new_inst, True

    def _enrich_instrument(self, existing: LegalInstrument, incoming: LegalInstrumentDomain) -> None:
        """Enrich existing instrument with official India Code metadata if missing."""
        if not existing.source_url and incoming.source_url:
            existing.source_url = incoming.source_url
        if (not existing.act_number or existing.act_number.startswith("bitstream_")) and incoming.act_number:
            existing.act_number = incoming.act_number
        if incoming.department:
            current_dept = (existing.department or "").strip().lower()
            incoming_is_ministry = "ministry" in incoming.department.lower() or "department" in incoming.department.lower()
            current_is_ministry = "ministry" in current_dept or "department" in current_dept
            if not current_dept or (incoming_is_ministry and not current_is_ministry):
                existing.department = incoming.department

        # Enrich extra_metadata with official attributes
        if incoming.extra_metadata:
            meta = dict(existing.extra_metadata or {})
            for k in ("enforcement_date", "long_title", "canonical_law_url", "collector", "content_sha256", "state_name"):
                val = incoming.extra_metadata.get(k)
                if val and (k not in meta or not meta[k]):
                    meta[k] = val
            existing.extra_metadata = meta

    def upsert_preamble(
        self,
        instrument_id: str,
        raw_law_row: dict[str, Any],
        existing_map: dict[str, StatutoryProvision] | None = None,
    ) -> tuple[StatutoryProvision | None, str, int]:
        """
        Upsert the preamble for an instrument into PostgreSQL with structural AST hierarchy.
        Returns: (StatutoryProvision, action: 'SKIPPED' | 'UPDATED' | 'CREATED', node_count: int)
        Guarantees ZERO duplicate provisions.
        """
        adapted = self.adapter.adapt_preamble(instrument_id, raw_law_row)
        if not adapted:
            return None, "NO_PREAMBLE", 0

        domain_prov, domain_nodes = adapted

        if existing_map is not None:
            existing = existing_map.get(domain_prov.section_number_norm)
        else:
            existing = (
                self.db.query(StatutoryProvision)
                .filter(
                    StatutoryProvision.instrument_id == instrument_id,
                    StatutoryProvision.section_number_norm == domain_prov.section_number_norm,
                )
                .first()
            )

        if existing:
            # Check if existing record already has complete content
            existing_len = len(existing.source_text or "")
            incoming_len = len(domain_prov.source_text or "")
            is_same_hash = existing.canonical_hash == domain_prov.canonical_hash

            if is_same_hash or (existing_len >= incoming_len and existing.canonical_text):
                # Ensure metadata is enriched
                if domain_prov.source_url and not existing.source_url:
                    existing.source_url = domain_prov.source_url
                    self.db.flush()
                return existing, "SKIPPED", 0

            # Incoming is longer / verbatim preamble from endomorphosis
            existing.source_text = domain_prov.source_text
            existing.canonical_text = domain_prov.canonical_text
            existing.raw_hash = domain_prov.raw_hash
            existing.canonical_hash = domain_prov.canonical_hash
            existing.provision_type = domain_prov.provision_type.value
            existing.has_proviso = domain_prov.has_proviso
            existing.has_non_obstante = domain_prov.has_non_obstante
            if domain_prov.source_url and not existing.source_url:
                existing.source_url = domain_prov.source_url
            if domain_prov.extra_metadata:
                cur_meta = dict(existing.extra_metadata or {})
                cur_meta.update(domain_prov.extra_metadata)
                existing.extra_metadata = cur_meta
            existing.snapshot_version = domain_prov.snapshot_version
            self.db.flush()

            node_count = self._sync_nodes(existing.id, domain_nodes)
            return existing, "UPDATED", node_count

        # Insert new PREAMBLE provision
        new_prov = StatutoryProvision(
            id=domain_prov.id,
            instrument_id=instrument_id,
            source_chunk_id=domain_prov.source_chunk_id,
            section_number=domain_prov.section_number,
            section_number_norm=domain_prov.section_number_norm,
            section_title=domain_prov.section_title,
            chapter=domain_prov.chapter,
            part=domain_prov.part,
            provision_type=domain_prov.provision_type.value,
            source_text=domain_prov.source_text,
            canonical_text=domain_prov.canonical_text,
            raw_hash=domain_prov.raw_hash,
            canonical_hash=domain_prov.canonical_hash,
            status=domain_prov.status,
            in_force=domain_prov.in_force,
            has_proviso=domain_prov.has_proviso,
            has_non_obstante=domain_prov.has_non_obstante,
            acts_referenced=domain_prov.acts_referenced,
            defined_terms=domain_prov.defined_terms,
            amendment_count=domain_prov.amendment_count,
            source_url=domain_prov.source_url,
            snapshot_version=domain_prov.snapshot_version,
            extra_metadata=domain_prov.extra_metadata,
        )
        self.db.add(new_prov)
        self.db.flush()

        if existing_map is not None:
            existing_map[domain_prov.section_number_norm] = new_prov

        node_count = self._sync_nodes(new_prov.id, domain_nodes)
        return new_prov, "CREATED", node_count

    def get_existing_provisions_map(self, instrument_id: str) -> dict[str, StatutoryProvision]:
        """Fetch all existing provisions for an instrument in a single query."""
        rows = self.db.query(StatutoryProvision).filter(StatutoryProvision.instrument_id == instrument_id).all()
        return {p.section_number_norm: p for p in rows}

    def upsert_provision(
        self,
        instrument_id: str,
        raw_article_row: dict[str, Any],
        existing_map: dict[str, StatutoryProvision] | None = None,
    ) -> tuple[StatutoryProvision, str, int]:
        """
        Upsert a statutory provision and its AST nodes into PostgreSQL.
        Returns: (StatutoryProvision, action: 'SKIPPED' | 'UPDATED' | 'CREATED', node_count: int)
        Guarantees ZERO duplicate provisions.
        """
        domain_prov, domain_nodes = self.adapter.adapt_article(instrument_id, raw_article_row)

        if existing_map is not None:
            existing = existing_map.get(domain_prov.section_number_norm)
        else:
            existing = (
                self.db.query(StatutoryProvision)
                .filter(
                    StatutoryProvision.instrument_id == instrument_id,
                    StatutoryProvision.section_number_norm == domain_prov.section_number_norm,
                )
                .first()
            )

        if existing:
            has_valid_title = (
                existing.section_title
                and existing.section_title.strip() != existing.section_number
                and len(existing.section_title) < 250
            )

            updated = False

            # Content was missing, placeholder, or needs enrichment: update in-place
            if not existing.source_url and domain_prov.source_url:
                existing.source_url = domain_prov.source_url
                updated = True
            if not has_valid_title and domain_prov.section_title:
                existing.section_title = domain_prov.section_title
                updated = True

            # If incoming text is strictly longer or existing text was incomplete, update canonical text
            if len(domain_prov.source_text) > len(existing.source_text or "") or not existing.source_text:
                existing.source_text = domain_prov.source_text
                existing.canonical_text = domain_prov.canonical_text
                existing.raw_hash = domain_prov.raw_hash
                existing.canonical_hash = domain_prov.canonical_hash
                existing.has_proviso = domain_prov.has_proviso
                existing.has_non_obstante = domain_prov.has_non_obstante
                updated = True

            if not updated:
                return existing, "SKIPPED", 0

            existing.snapshot_version = domain_prov.snapshot_version
            self.db.flush()

            # Refresh AST nodes idempotently
            node_count = self._sync_nodes(existing.id, domain_nodes)
            return existing, "UPDATED", node_count

        # Insert new provision
        new_prov = StatutoryProvision(
            id=domain_prov.id,
            instrument_id=instrument_id,
            source_chunk_id=domain_prov.source_chunk_id,
            section_number=domain_prov.section_number,
            section_number_norm=domain_prov.section_number_norm,
            section_title=domain_prov.section_title,
            chapter=domain_prov.chapter,
            part=domain_prov.part,
            provision_type=domain_prov.provision_type.value,
            source_text=domain_prov.source_text,
            canonical_text=domain_prov.canonical_text,
            raw_hash=domain_prov.raw_hash,
            canonical_hash=domain_prov.canonical_hash,
            status=domain_prov.status,
            in_force=domain_prov.in_force,
            has_proviso=domain_prov.has_proviso,
            has_non_obstante=domain_prov.has_non_obstante,
            acts_referenced=domain_prov.acts_referenced,
            defined_terms=domain_prov.defined_terms,
            amendment_count=domain_prov.amendment_count,
            source_url=domain_prov.source_url,
            snapshot_version=domain_prov.snapshot_version,
            extra_metadata=domain_prov.extra_metadata,
        )
        self.db.add(new_prov)
        self.db.flush()

        if existing_map is not None:
            existing_map[domain_prov.section_number_norm] = new_prov

        node_count = self._sync_nodes(new_prov.id, domain_nodes)
        return new_prov, "CREATED", node_count

    def _sync_nodes(self, provision_id: str, nodes: list[ProvisionNodeDomain]) -> int:
        """Replace provision nodes idempotently."""
        if not nodes:
            return 0
        self.db.query(ProvisionNode).filter(ProvisionNode.provision_id == provision_id).delete()
        for node in nodes:
            db_node = ProvisionNode(
                id=node.node_id,
                provision_id=provision_id,
                parent_node_id=node.parent_node_id,
                node_type=node.node_type.value,
                ordinal=node.ordinal,
                text=node.text,
                char_start=node.char_start,
                char_end=node.char_end,
                order_index=node.order_index,
            )
            self.db.add(db_node)
        self.db.flush()
        return len(nodes)
