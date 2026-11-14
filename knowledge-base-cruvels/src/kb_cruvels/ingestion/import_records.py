"""Transactional batch importer for canonical database models."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from kb_cruvels.database.models.provisions import ProvisionNode
from kb_cruvels.database.repositories.instrument_repo import InstrumentRepository
from kb_cruvels.database.repositories.provision_repo import ProvisionRepository
from kb_cruvels.domain.instruments import LegalInstrumentDomain
from kb_cruvels.domain.provisions import StatutoryProvisionDomain
from kb_cruvels.ingestion.parse_structure import parse_statutory_structure
from kb_cruvels.ingestion.validate import validate_provision_record
from kb_cruvels.sources.open_india_law.adapter import OpenIndiaLawAdapter


class BatchRecordImporter:
    """Processes, validates, and transactionally commits batches of legal records."""

    def __init__(self, db: Session, adapter: OpenIndiaLawAdapter):
        self.db = db
        self.adapter = adapter
        self.inst_repo = InstrumentRepository(db)
        self.prov_repo = ProvisionRepository(db)

    def import_batch(
        self, raw_records: list[dict[str, Any]]
    ) -> tuple[int, int, list[dict[str, Any]], list[dict[str, Any]]]:
        """
        Process a batch of raw records:
        - Adapts to domain models
        - Validates content integrity and non-empty text
        - Performs conservative AST structural parsing
        - Transactionally commits valid instruments & provisions
        - Quarantines invalid records
        """
        valid_staged: list[dict[str, Any]] = []
        quarantined: list[dict[str, Any]] = []
        committed_count = 0

        # Group by instrument to minimize duplicate instrument upserts in a single batch
        instrument_cache: dict[str, LegalInstrumentDomain] = {}
        valid_pairs: list[tuple[LegalInstrumentDomain, StatutoryProvisionDomain]] = []

        for raw_row in raw_records:
            try:
                inst_domain, prov_domain = self.adapter.adapt_record(raw_row)
                is_valid, validation_errors = validate_provision_record(inst_domain, prov_domain)

                if not is_valid:
                    quarantined.append({
                        "raw_record": raw_row,
                        "validation_errors": validation_errors,
                    })
                    continue

                instrument_cache[inst_domain.id] = inst_domain
                valid_pairs.append((inst_domain, prov_domain))
                valid_staged.append(prov_domain.model_dump(mode="json"))

            except Exception as exc:
                quarantined.append({
                    "raw_record": raw_row,
                    "validation_errors": [f"Adaptation exception: {exc!s}"],
                })

        if not valid_pairs:
            return 0, len(quarantined), valid_staged, quarantined

        # Execute transactional database commit
        try:
            # 1. Upsert Legal Instruments
            for inst in instrument_cache.values():
                self.inst_repo.upsert_instrument(inst)

            self.db.flush()

            # 2. Upsert Statutory Provisions & Nodes
            for inst_domain, prov_domain in valid_pairs:
                self.prov_repo.upsert_provision(prov_domain)
                self.db.flush()

                # Parse and attach structural AST nodes if not already present
                nodes = parse_statutory_structure(prov_domain.id, prov_domain.source_text)
                if nodes:
                    # Clean previous nodes for idempotent rerun
                    self.db.query(ProvisionNode).filter(ProvisionNode.provision_id == prov_domain.id).delete()
                    for node in nodes:
                        db_node = ProvisionNode(
                            id=node.node_id,
                            provision_id=prov_domain.id,
                            parent_node_id=node.parent_node_id,
                            node_type=node.node_type.value,
                            ordinal=node.ordinal,
                            text=node.text,
                            char_start=node.char_start,
                            char_end=node.char_end,
                            order_index=node.order_index,
                        )
                        self.db.add(db_node)

                committed_count += 1

            self.db.commit()

        except Exception as exc:
            self.db.rollback()
            raise exc

        return committed_count, len(quarantined), valid_staged, quarantined
