"""IPFS India Laws dataset adapter.

Maps upstream records from endomorphosis/ipfs_india_laws into canonical domain models
(LegalInstrumentDomain, StatutoryProvisionDomain, ProvisionNodeDomain) preserving exact
provenance, official DSpace India Code URLs, verbatim text, and AST hierarchy.
"""

from __future__ import annotations

import hashlib
import json
import re
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
    ProvisionNodeDomain,
    ProvisionType,
    StatutoryProvisionDomain,
)
from kb_cruvels.ingestion.parse_structure import parse_statutory_structure


def clean_section_title(raw_title: str | None, section_num: str | None = None) -> str:
    """Extract clean section title removing leading 'Section X.' prefix."""
    if not raw_title:
        return ""
    t = raw_title.strip()
    # Remove leading 'Section 12.', 'Sec. 12A.', 'Article 21.', etc.
    cleaned = re.sub(
        r"^(?:section|sec|article|art)\.?\s*[0-9a-zA-Z_\-]+\.?\s*[\:\—\-]?\s*",
        "",
        t,
        flags=re.IGNORECASE,
    ).strip()
    return cleaned.rstrip(".").strip() if cleaned else t


class IpfsIndiaLawsAdapter:
    """Adapter for transforming endomorphosis/ipfs_india_laws records."""

    def __init__(self, snapshot_version: str = "ipfs_india_laws_2026"):
        self.snapshot_version = snapshot_version

    @staticmethod
    def generate_instrument_id(
        jurisdiction: str,
        state_or_ut: str | None,
        title: str,
        year: int | None,
    ) -> str:
        """Generate deterministic identifier for a legal instrument."""
        key = f"{jurisdiction}:{state_or_ut or 'all'}:{title.lower().strip()}:{year or 0}"
        return f"inst_{hashlib.sha256(key.encode('utf-8')).hexdigest()[:16]}"

    @staticmethod
    def generate_provision_id(instrument_id: str, section_number_norm: str) -> str:
        """Generate deterministic identifier for a statutory provision."""
        key = f"{instrument_id}:sec_{section_number_norm}"
        return f"prov_{hashlib.sha256(key.encode('utf-8')).hexdigest()[:16]}"

    def adapt_law(self, raw_row: dict[str, Any]) -> LegalInstrumentDomain:
        """Adapt a row from laws.parquet to LegalInstrumentDomain."""
        raw_title = str(raw_row.get("title") or "Untitled Enactment").strip()
        metadata = {}
        meta_str = raw_row.get("metadata_json")
        if meta_str and isinstance(meta_str, str):
            try:
                metadata = json.loads(meta_str)
            except Exception:
                pass

        official_meta = (
            metadata.get("metadata", {}).get("official_metadata", {})
            or metadata.get("official_metadata", {})
        )
        act_year_meta = official_meta.get("act_year")
        default_year = int(act_year_meta) if act_year_meta and str(act_year_meta).isdigit() else None

        # Extract clean title and year
        clean_title, extracted_year = extract_act_identity(raw_title, default_year)
        final_year = extracted_year or default_year

        inst_id = self.generate_instrument_id("central", None, clean_title, final_year)

        act_number_raw = (
            official_meta.get("act_number")
            or raw_row.get("official_identifier")
            or raw_row.get("identifier")
        )
        act_number = None
        if act_number_raw:
            raw_s = str(act_number_raw).strip()
            if raw_s.isdigit() and final_year:
                act_number = f"Act {raw_s} of {final_year}"[:120]
            else:
                act_number = raw_s[:120]

        department = str(official_meta.get("ministry"))[:250] if official_meta.get("ministry") else None

        return LegalInstrumentDomain(
            id=inst_id,
            source_act_id=str(raw_row.get("id") or inst_id)[:250],
            title=raw_title,
            short_title=(clean_title[:500] if clean_title != raw_title else None) if clean_title else None,
            year=final_year,
            act_number=act_number,
            instrument_type=InstrumentType.LEGISLATION,
            jurisdiction="central",
            state_or_ut=None,
            status=SourceStatus.IN_FORCE,
            in_force=True,
            doc_type="legislation",
            legal_subject=None,
            department=department,
            regulatory_body=None,
            source_url=raw_row.get("source_url") or metadata.get("canonical_law_url"),
            snapshot_version=self.snapshot_version,
            extra_metadata={
                "upstream_source": "endomorphosis/ipfs_india_laws",
                "collector": metadata.get("collector") or metadata.get("metadata", {}).get("collector"),
                "canonical_law_url": metadata.get("canonical_law_url"),
                "content_sha256": metadata.get("metadata", {}).get("content_sha256"),
                "enforcement_date": official_meta.get("enforcement_date"),
                "long_title": official_meta.get("long_title"),
                "state_name": official_meta.get("state_name"),
            },
        )

    @staticmethod
    def extract_preamble_text(raw_text: str | None) -> str | None:
        """
        Extract full verbatim preamble text from the beginning of an enactment text.
        Stops right before Section 1 (or equivalent primary section).
        If the text contains no Section 1 and is introductory, treats the text as preamble.
        """
        if not raw_text or not raw_text.strip():
            return None

        text = raw_text.strip()
        sec1_pattern = re.compile(
            r"(?:^|\n)\s*(?:Section\s+1\b|1\.\s+Short\s+title|Article\s+1\b|1\.\s+Title\b|1\.\s+Extent\b|1\.\s+Name\b|1\.\s+Commencement\b)",
            re.IGNORECASE,
        )
        m = sec1_pattern.search(text)
        if m:
            preamble = text[:m.start()].strip()
        else:
            has_other_sec = re.search(r"(?:^|\n)\s*(?:Section\s+[2-9]|(?:\d+\.))\s+", text)
            if not has_other_sec and len(text) < 15000:
                preamble = text
            else:
                preamble = ""

        if preamble and len(preamble) >= 20:
            return preamble
        return None

    def adapt_preamble(
        self,
        instrument_id: str,
        raw_law_row: dict[str, Any],
    ) -> tuple[StatutoryProvisionDomain, list[ProvisionNodeDomain]] | None:
        """Adapt preamble from laws.parquet to StatutoryProvisionDomain + AST nodes."""
        raw_text = raw_law_row.get("text")
        preamble_text = self.extract_preamble_text(raw_text)
        if not preamble_text:
            return None

        prov_id = self.generate_provision_id(instrument_id, "PREAMBLE")
        canonical_text = normalize_statutory_text(preamble_text)
        raw_hash = calculate_sha256(preamble_text)
        canonical_hash = calculate_sha256(canonical_text)

        has_proviso = bool(re.search(r"\bProvided\s+(?:further\s+|also\s+)?that\b", preamble_text, re.IGNORECASE))
        has_non_obstante = bool(
            re.search(
                r"\bNotwithstanding\s+anything\s+contained\b",
                preamble_text,
                re.IGNORECASE,
            )
        )

        metadata = {}
        meta_str = raw_law_row.get("metadata_json")
        if meta_str and isinstance(meta_str, str):
            try:
                metadata = json.loads(meta_str)
            except Exception:
                pass
        official_meta = (
            metadata.get("metadata", {}).get("official_metadata", {})
            or metadata.get("official_metadata", {})
        )

        provision = StatutoryProvisionDomain(
            id=prov_id,
            instrument_id=instrument_id,
            source_chunk_id=raw_law_row.get("id"),
            section_number="PREAMBLE",
            section_number_norm="PREAMBLE",
            section_title="Preamble",
            chapter=None,
            part=None,
            provision_type=ProvisionType.PREAMBLE,
            source_text=preamble_text,
            canonical_text=canonical_text,
            raw_hash=raw_hash,
            canonical_hash=canonical_hash,
            status="IN_FORCE",
            in_force=True,
            has_proviso=has_proviso,
            has_non_obstante=has_non_obstante,
            acts_referenced=[],
            defined_terms=[],
            amendment_count=0,
            source_url=raw_law_row.get("source_url") or metadata.get("canonical_law_url"),
            snapshot_version=self.snapshot_version,
            extra_metadata={
                "upstream_source": "endomorphosis/ipfs_india_laws",
                "long_title": official_meta.get("long_title"),
                "enforcement_date": official_meta.get("enforcement_date"),
                "canonical_law_url": metadata.get("canonical_law_url"),
            },
        )

        nodes = parse_statutory_structure(prov_id, preamble_text)
        return provision, nodes

    def adapt_article(
        self,
        instrument_id: str,
        raw_row: dict[str, Any],
    ) -> tuple[StatutoryProvisionDomain, list[ProvisionNodeDomain]]:
        """Adapt a row from articles.parquet to StatutoryProvisionDomain + AST nodes."""
        raw_sec = str(raw_row.get("article_number") or raw_row.get("document_number") or "0").strip()[:60]
        sec_norm = (normalize_section_number(raw_sec) or "0")[:60]
        prov_id = self.generate_provision_id(instrument_id, sec_norm)

        raw_title = raw_row.get("title")
        section_title = clean_section_title(raw_title, sec_norm)

        raw_text = str(raw_row.get("text") or "").strip()
        canonical_text = normalize_statutory_text(raw_text)

        raw_hash = calculate_sha256(raw_text)
        canonical_hash = calculate_sha256(canonical_text)

        # Detect provision type
        sec_norm_upper = sec_norm.upper()
        if "ARTICLE" in sec_norm_upper or "ART" in sec_norm_upper:
            prov_type = ProvisionType.ARTICLE
        elif "SCH" in sec_norm_upper or "SCHEDULE" in sec_norm_upper:
            prov_type = ProvisionType.SCHEDULE
        elif "PREAMBLE" in sec_norm_upper:
            prov_type = ProvisionType.PREAMBLE
        else:
            prov_type = ProvisionType.SECTION

        # Check for provisos / non-obstante clauses
        has_proviso = bool(re.search(r"\bProvided\s+(?:further\s+|also\s+)?that\b", raw_text, re.IGNORECASE))
        has_non_obstante = bool(
            re.search(
                r"\bNotwithstanding\s+anything\s+contained\b",
                raw_text,
                re.IGNORECASE,
            )
        )

        provision = StatutoryProvisionDomain(
            id=prov_id,
            instrument_id=instrument_id,
            source_chunk_id=raw_row.get("id"),
            section_number=raw_sec,
            section_number_norm=sec_norm,
            section_title=section_title or raw_title,
            chapter=None,
            part=None,
            provision_type=prov_type,
            source_text=raw_text,
            canonical_text=canonical_text,
            raw_hash=raw_hash,
            canonical_hash=canonical_hash,
            status="IN_FORCE",
            in_force=True,
            has_proviso=has_proviso,
            has_non_obstante=has_non_obstante,
            acts_referenced=[],
            defined_terms=[],
            amendment_count=0,
            source_url=raw_row.get("source_url"),
            snapshot_version=self.snapshot_version,
            extra_metadata={
                "upstream_source": "endomorphosis/ipfs_india_laws",
                "raw_title": raw_title,
            },
        )

        # Structural AST hierarchy
        nodes = parse_statutory_structure(prov_id, raw_text)

        return provision, nodes
