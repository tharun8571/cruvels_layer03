"""Open India Law dataset adapter: maps upstream records to canonical domain models."""

from __future__ import annotations

import hashlib
from collections.abc import Generator
from pathlib import Path
from typing import Any

from kb_cruvels.domain.identifiers import (
    calculate_sha256,
    extract_act_identity,
    normalize_section_number,
    normalize_statutory_text,
)
from kb_cruvels.domain.instruments import (
    InstrumentType,
    LegalInstrumentDomain,
    SourceStatus,
)
from kb_cruvels.domain.provisions import (
    ProvisionType,
    StatutoryProvisionDomain,
)
from kb_cruvels.sources.base import BaseSourceAdapter
from kb_cruvels.sources.open_india_law.source_mapping import (
    MAPPING_VERSION,
    UPSTREAM_LEGISLATION_SCHEMA,
    coerce_upstream_field,
    repair_upstream_taxonomy,
)


class OpenIndiaLawAdapter(BaseSourceAdapter):
    """Adapter for transforming Open India Law published parquet/JSONL records."""

    def __init__(self, snapshot_version: str = "v2026.08"):
        self.snapshot_version = snapshot_version
        self.mapping_version = MAPPING_VERSION

    @staticmethod
    def generate_instrument_id(jurisdiction: str, state_or_ut: str | None, title: str, year: int | None) -> str:
        """Generate a deterministic identifier for a legal instrument."""
        key = f"{jurisdiction}:{state_or_ut or 'all'}:{title.lower().strip()}:{year or 0}"
        return f"inst_{hashlib.sha256(key.encode('utf-8')).hexdigest()[:16]}"

    @staticmethod
    def generate_provision_id(instrument_id: str, section_number_norm: str) -> str:
        """Generate a deterministic identifier for a statutory provision."""
        key = f"{instrument_id}:sec_{section_number_norm}"
        return f"prov_{hashlib.sha256(key.encode('utf-8')).hexdigest()[:16]}"

    def adapt_record(
        self, raw_row: dict[str, Any]
    ) -> tuple[LegalInstrumentDomain, StatutoryProvisionDomain]:
        """
        Adapt a single upstream record into canonical domain entities.
        
        Preserves:
        - Real statutory wording (verbatim text)
        - Lettered section numbers (53A, 72A)
        - Jurisdictional taxonomy
        - Checksum provenance
        - Full unmapped payload
        """
        # 1. Coerce fields
        coerced: dict[str, Any] = {
            k: coerce_upstream_field(k, v) for k, v in raw_row.items()
        }

        # 2. Repair taxonomy
        taxonomy = repair_upstream_taxonomy(coerced)

        raw_title = coerced.get("title") or coerced.get("act_id") or "Untitled Enactment"
        year_val = coerced.get("year")
        clean_title, extracted_year = extract_act_identity(raw_title, year_val)
        final_year = extracted_year or year_val

        jurisdiction = taxonomy["jurisdiction"]
        state_or_ut = taxonomy["state_or_ut"]

        # Generate deterministic instrument ID
        inst_id = self.generate_instrument_id(jurisdiction, state_or_ut, clean_title, final_year)

        # 3. Build LegalInstrumentDomain
        instrument = LegalInstrumentDomain(
            id=inst_id,
            source_act_id=str(coerced.get("act_id") or inst_id),
            title=raw_title,
            short_title=clean_title if clean_title != raw_title else None,
            year=final_year,
            act_number=coerced.get("act_number"),
            instrument_type=InstrumentType(taxonomy["instrument_type"]),
            jurisdiction=jurisdiction,
            state_or_ut=state_or_ut,
            status=SourceStatus(taxonomy["status"]),
            in_force=taxonomy["in_force"],
            doc_type=coerced.get("doc_type") or "legislation",
            legal_subject=coerced.get("legal_subject"),
            department=coerced.get("department"),
            regulatory_body=coerced.get("regulatory_body"),
            source_url=coerced.get("source_url"),
            snapshot_version=self.snapshot_version,
            extra_metadata={
                k: v for k, v in raw_row.items() if k not in UPSTREAM_LEGISLATION_SCHEMA
            },
        )

        # 4. Process Statutory Provision
        raw_sec = str(coerced.get("section_number") or "0").strip()
        sec_norm = normalize_section_number(raw_sec) or "0"
        prov_id = self.generate_provision_id(inst_id, sec_norm)

        raw_text = str(coerced.get("text") or "")
        canonical_text = normalize_statutory_text(raw_text)

        raw_hash = calculate_sha256(raw_text)
        canonical_hash = calculate_sha256(canonical_text)

        # Provision type mapping
        prov_type_str = str(coerced.get("provision_type") or coerced.get("section_type") or "section").lower()
        if "article" in prov_type_str or "art" in prov_type_str:
            prov_type = ProvisionType.ARTICLE
        elif "rule" in prov_type_str:
            prov_type = ProvisionType.RULE
        elif "regulation" in prov_type_str:
            prov_type = ProvisionType.REGULATION
        elif "schedule" in prov_type_str:
            prov_type = ProvisionType.SCHEDULE
        elif "preamble" in prov_type_str or sec_norm == "PREAMBLE":
            prov_type = ProvisionType.PREAMBLE
        elif "clause" in prov_type_str:
            prov_type = ProvisionType.CLAUSE
        elif "definition" in prov_type_str:
            prov_type = ProvisionType.DEFINITION
        else:
            prov_type = ProvisionType.SECTION

        provision = StatutoryProvisionDomain(
            id=prov_id,
            instrument_id=inst_id,
            source_chunk_id=coerced.get("chunk_id"),
            section_number=raw_sec,
            section_number_norm=sec_norm,
            section_title=coerced.get("section_title"),
            chapter=coerced.get("chapter"),
            part=coerced.get("part"),
            provision_type=prov_type,
            source_text=raw_text,
            canonical_text=canonical_text,
            raw_hash=raw_hash,
            canonical_hash=canonical_hash,
            status=taxonomy["status"],
            in_force=taxonomy["in_force"],
            has_proviso=bool(coerced.get("has_proviso", False)),
            has_non_obstante=bool(coerced.get("has_non_obstante", False)),
            acts_referenced=coerced.get("acts_referenced") or [],
            defined_terms=coerced.get("defined_terms") or [],
            amendment_count=int(coerced.get("amendment_count") or 0),
            source_url=coerced.get("source_url"),
            snapshot_version=self.snapshot_version,
            extra_metadata={
                "mapping_version": self.mapping_version,
                "raw_jurisdiction": coerced.get("jurisdiction"),
                "raw_category": coerced.get("category"),
                "doc_type": coerced.get("doc_type"),
            },
        )

        return instrument, provision

    def read_records(
        self, source_path: Path, batch_size: int = 1000
    ) -> Generator[list[dict[str, Any]], None, None]:
        """Stream raw records from a parquet or jsonl file in batches."""
        from kb_cruvels.sources.open_india_law.parquet_reader import (
            stream_parquet_records,
        )

        yield from stream_parquet_records(source_path, batch_size=batch_size)
