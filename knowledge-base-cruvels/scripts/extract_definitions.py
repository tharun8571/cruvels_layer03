#!/usr/bin/env python3
"""
Extract and index statutory legal definitions into the dedicated `legal_definitions` table.

Processes all Central and State statutory enactments, extracting verbatim
definition clauses, mapping legal domains, linking to source provisions, and
indexing them for dictionary-level legal retrieval via /v1/definitions.
"""

from __future__ import annotations

import glob
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import pyarrow.parquet as pq
from sqlalchemy.dialects.postgresql import insert as pg_insert

# Ensure workspace src is on path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WORKSPACE_ROOT / "src"))

from kb_cruvels.core.logging import logger
from kb_cruvels.database.models.definitions import LegalDefinition
from kb_cruvels.database.models.instruments import LegalInstrument
from kb_cruvels.database.models.provisions import StatutoryProvision
from kb_cruvels.database.session import SessionLocal


def infer_legal_domain(act_title: str, legal_subject: str = "") -> str:
    """Classify enactment into legal domain for filtered retrieval."""
    combined = f"{act_title.lower()} {legal_subject.lower()}"
    if any(k in combined for k in ["penal", "nyaya", "criminal", "crpc", "nagarik", "sakshya", "evidence", "ndps", "pocso", "uapa", "police", "corruption", "arms", "extradition"]):
        return "Criminal Law"
    if any(k in combined for k in ["company", "companies", "corporate", "insolvency", "bankruptcy", "ibc", "sebi", "securities", "competition", "partnership", "llp", "chartered accountants"]):
        return "Corporate & Commercial Law"
    if any(k in combined for k in ["contract", "arbitration", "conciliation", "negotiable", "banking", "finance", "money-laundering", "pmla", "fema", "foreign exchange", "consumer"]):
        return "Banking, Finance & Commercial"
    if any(k in combined for k in ["constitution", "fundamental", "citizenship", "election", "representation of the people", "rti", "information act", "delimit"]):
        return "Constitutional & Administrative Law"
    if any(k in combined for k in ["civil procedure", "cpc", "specific relief", "limitation", "property", "easement", "trust", "registration", "stamp", "court fees", "rent"]):
        return "Civil & Property Law"
    if any(k in combined for k in ["information technology", "data protection", "telecom", "trai", "digital", "cyber", "copyright", "patent", "trademark", "semiconductor"]):
        return "Technology & Intellectual Property"
    if any(k in combined for k in ["labour", "labor", "industrial", "factories", "wage", "social security", "workmen", "trade union", "employment", "provident", "pension"]):
        return "Labour & Employment Law"
    if any(k in combined for k in ["tax", "gst", "customs", "excise", "revenue", "income-tax", "stamp duty"]):
        return "Taxation & Revenue Law"
    if any(k in combined for k in ["environment", "forest", "pollution", "wildlife", "climate", "air", "water"]):
        return "Environmental Law"
    return "Statutory & Regulatory"


def clean_term_string(raw: str) -> str:
    """Clean markdown artifacts, quotes, and punctuation from defined terms."""
    clean = re.sub(r"[_*\"'`“”‘’]", "", raw).strip()
    clean = re.sub(r"\s+", " ", clean)
    return clean


# Regex pattern 1: Standard clause with quotes: (a) "term" means/includes...
PAT_CLAUSE_QUOTED = re.compile(
    r"(?P<clause>\(\s*_?([a-zA-Z0-9]+)_?\s*\))\s*[\"“'](?P<term>[^\"”']{2,90})[\"”']\s*(?P<def_text>(?:means|includes|shall mean|has the same meaning|shall include|denotes|signifies|does not include)[\s\S]*?)(?=(?:\n\s*\(\s*_?[a-zA-Z0-9]+_?\s*\)\s*[\"“'])|(?:\n\s*\*\*\d+\.)|\Z)",
    re.IGNORECASE,
)

# Regex pattern 2: Clause with unquoted term: (a) term .— means/includes...
PAT_CLAUSE_UNQUOTED = re.compile(
    r"(?P<clause>\(\s*_?([a-zA-Z0-9]+)_?\s*\))\s*(?P<term>[A-Za-z][A-Za-z0-9\s,-]{2,60})\s*[.―—–-]+\s*(?P<def_text>(?:means|includes|shall mean|has the same meaning|shall include|denotes|signifies)[\s\S]*?)(?=(?:\n\s*\(\s*_?[a-zA-Z0-9]+_?\s*\))|(?:\n\s*\*\*\d+\.)|\Z)",
    re.IGNORECASE,
)

# Regex pattern 3: Standalone quoted term: "the State" includes... or "court" includes...
PAT_STANDALONE = re.compile(
    r"(?:^|\n|\.\s+)[\"“'](?P<term>[A-Za-z][A-Za-z0-9\s,-]{2,60})[\"”']\s*(?P<def_text>(?:means|includes|shall mean|has the same meaning|shall include|denotes|signifies)[\s\S]*?)(?=(?:\n\s*[\"“'])|(?:\n\s*\(\s*_?[a-zA-Z0-9]+_?\s*\))|(?:\n\s*\*\*\d+\.)|\Z)",
    re.IGNORECASE,
)


def extract_definitions_from_text(
    text: str,
    act_title: str,
    section_num: str,
    legal_domain: str,
    provision_id: str | None = None,
) -> list[dict]:
    """Extract individual definition clauses from a statutory text block."""
    results = []
    seen_terms_in_block = set()
    terms_in_block = []

    # 1. Primary: Clause-based quoted
    for m in PAT_CLAUSE_QUOTED.finditer(text):
        clause_id = m.group(2) or "0"
        raw_term = m.group("term")
        clean_term = clean_term_string(raw_term)
        if len(clean_term) < 2 or len(clean_term) > 90:
            continue
        norm_term = clean_term.lower()
        if norm_term in seen_terms_in_block:
            continue
        seen_terms_in_block.add(norm_term)
        terms_in_block.append(clean_term)

        def_text = m.group(0).strip()
        # Truncate runaways if excessive
        if len(def_text) > 4000:
            def_text = def_text[:4000] + "..."

        hash_key = f"{act_title}:{section_num}:{clause_id}:{norm_term}"
        def_id = f"def_{hashlib.sha256(hash_key.encode('utf-8')).hexdigest()[:16]}"
        canon_hash = hashlib.sha256(def_text.encode("utf-8")).hexdigest()

        results.append({
            "id": def_id,
            "term": clean_term,
            "term_normalized": norm_term,
            "definition_text": def_text,
            "source_act_title": act_title,
            "source_section_number": section_num,
            "source_provision_id": provision_id,
            "legal_domain": legal_domain,
            "related_terms": [],  # Populated after all terms collected
            "key_cases": [],
            "canonical_hash": canon_hash,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

    # 2. Secondary: Clause-based unquoted if few matches
    if len(results) < 2:
        for m in PAT_CLAUSE_UNQUOTED.finditer(text):
            clause_id = m.group(2) or "0"
            raw_term = m.group("term")
            clean_term = clean_term_string(raw_term)
            if len(clean_term) < 2 or len(clean_term) > 60:
                continue
            norm_term = clean_term.lower()
            if norm_term in seen_terms_in_block:
                continue
            seen_terms_in_block.add(norm_term)
            terms_in_block.append(clean_term)

            def_text = m.group(0).strip()
            if len(def_text) > 4000:
                def_text = def_text[:4000] + "..."

            hash_key = f"{act_title}:{section_num}:{clause_id}:{norm_term}"
            def_id = f"def_{hashlib.sha256(hash_key.encode('utf-8')).hexdigest()[:16]}"
            canon_hash = hashlib.sha256(def_text.encode("utf-8")).hexdigest()

            results.append({
                "id": def_id,
                "term": clean_term,
                "term_normalized": norm_term,
                "definition_text": def_text,
                "source_act_title": act_title,
                "source_section_number": section_num,
                "source_provision_id": provision_id,
                "legal_domain": legal_domain,
                "related_terms": [],
                "key_cases": [],
                "canonical_hash": canon_hash,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })

    # 3. Tertiary: Standalone quoted (e.g. Art. 12 "the State")
    if not results and ("unless the context otherwise requires" in text.lower() or "in this act" in text.lower()):
        for m in PAT_STANDALONE.finditer(text):
            raw_term = m.group("term")
            clean_term = clean_term_string(raw_term)
            if len(clean_term) < 2 or len(clean_term) > 60:
                continue
            norm_term = clean_term.lower()
            if norm_term in seen_terms_in_block:
                continue
            seen_terms_in_block.add(norm_term)
            terms_in_block.append(clean_term)

            def_text = m.group(0).strip()
            if len(def_text) > 4000:
                def_text = def_text[:4000] + "..."

            hash_key = f"{act_title}:{section_num}:standalone:{norm_term}"
            def_id = f"def_{hashlib.sha256(hash_key.encode('utf-8')).hexdigest()[:16]}"
            canon_hash = hashlib.sha256(def_text.encode("utf-8")).hexdigest()

            results.append({
                "id": def_id,
                "term": clean_term,
                "term_normalized": norm_term,
                "definition_text": def_text,
                "source_act_title": act_title,
                "source_section_number": section_num,
                "source_provision_id": provision_id,
                "legal_domain": legal_domain,
                "related_terms": [],
                "key_cases": [],
                "canonical_hash": canon_hash,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })

    # Populate related_terms among co-defined terms
    for item in results:
        co_terms = [t for t in terms_in_block if t.lower() != item["term_normalized"]]
        item["related_terms"] = co_terms[:8]

    return results


def run_definition_extraction(central_only: bool = False, batch_size: int = 1000):
    """Main extraction routine reading parquet partitions and upserting into database."""
    print("=" * 70)
    print("KNOWLEDGE BASE CRUVELS: STATUTORY LEGAL DEFINITIONS INGESTION")
    print("=" * 70)

    # 1. Build lookup for existing provisions in PostgreSQL DB
    print("\n[Step 1/3] Building provision index from PostgreSQL database...")
    prov_lookup: dict[tuple[str, str], str] = {}
    with SessionLocal() as session:
        rows = (
            session.query(LegalInstrument.title, StatutoryProvision.section_number_norm, StatutoryProvision.id)
            .join(StatutoryProvision, StatutoryProvision.instrument_id == LegalInstrument.id)
            .filter(StatutoryProvision.section_number_norm.in_(["1", "2", "3", "4", "5", "12", "36", "366"]))
            .all()
        )
        for act_title, sec_norm, prov_id in rows:
            clean_title = act_title.lower().strip()
            prov_lookup[(clean_title, sec_norm)] = prov_id

    print(f"Loaded {len(prov_lookup)} definition provision references from database.")

    # 2. Discover parquet files
    parquet_dir = WORKSPACE_ROOT / "data" / "raw" / "open-india-law" / "v2026.08"
    if central_only:
        parquet_files = [parquet_dir / "in_central_legislation.parquet"]
    else:
        # Central first, then state files
        central_file = parquet_dir / "in_central_legislation.parquet"
        state_files = sorted(glob.glob(str(parquet_dir / "*_legislation.parquet")))
        parquet_files = [central_file] + [Path(f) for f in state_files if Path(f) != central_file]

    print(f"\n[Step 2/3] Extracting definitions from {len(parquet_files)} legislation parquet partitions...")

    extracted_records: list[dict] = []
    seen_ids = set()
    total_chunks_scanned = 0
    domains_counter: dict[str, int] = {}

    for p_path in parquet_files:
        if not p_path.exists():
            continue
        try:
            table = pq.read_table(
                str(p_path),
                columns=["title", "section_number", "chunk_id", "text", "legal_subject", "chapter"],
            )
            total_chunks_scanned += len(table)
            
            for i in range(len(table)):
                raw_text = table["text"][i].as_py()
                if not raw_text or len(raw_text) < 30:
                    continue

                act_title = table["title"][i].as_py() or "Untitled Enactment"
                sec_num = table["section_number"][i].as_py() or "2"
                subject = table["legal_subject"][i].as_py() or ""
                chapter = table["chapter"][i].as_py() or ""

                # Only examine preliminary, definition sections, or sections 1-5 / Art 12 / 36 / 366
                # or chunks with definition keywords
                is_def_section = (
                    sec_num in ["1", "2", "3", "4", "5", "12", "36", "366"]
                    or "preliminary" in chapter.lower()
                    or "definition" in raw_text[:300].lower()
                    or "unless the context otherwise" in raw_text[:300].lower()
                )

                if not is_def_section:
                    continue

                domain = infer_legal_domain(act_title, subject)
                clean_norm_title = act_title.lower().strip()
                prov_id = prov_lookup.get((clean_norm_title, sec_num))

                defs = extract_definitions_from_text(
                    text=raw_text,
                    act_title=act_title,
                    section_num=sec_num,
                    legal_domain=domain,
                    provision_id=prov_id,
                )

                for d in defs:
                    if d["id"] not in seen_ids:
                        seen_ids.add(d["id"])
                        extracted_records.append(d)
                        domains_counter[domain] = domains_counter.get(domain, 0) + 1

        except Exception as exc:
            print(f"Warning: Could not process {p_path.name}: {exc}")

    print(f"\nExtracted {len(extracted_records)} unique statutory legal definitions across {total_chunks_scanned} chunks.")
    print("Domain Breakdown:")
    for dom, cnt in sorted(domains_counter.items(), key=lambda x: -x[1]):
        print(f"  - {dom}: {cnt:,} definitions")

    # 3. Batch Upsert to PostgreSQL
    print(f"\n[Step 3/3] Committing records to PostgreSQL in batches of {batch_size}...")
    committed = 0
    with SessionLocal() as session:
        for i in range(0, len(extracted_records), batch_size):
            batch = extracted_records[i : i + batch_size]
            stmt = pg_insert(LegalDefinition).values(batch)
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={
                    "term": stmt.excluded.term,
                    "term_normalized": stmt.excluded.term_normalized,
                    "definition_text": stmt.excluded.definition_text,
                    "source_act_title": stmt.excluded.source_act_title,
                    "source_section_number": stmt.excluded.source_section_number,
                    "source_provision_id": stmt.excluded.source_provision_id,
                    "legal_domain": stmt.excluded.legal_domain,
                    "related_terms": stmt.excluded.related_terms,
                    "canonical_hash": stmt.excluded.canonical_hash,
                    "updated_at": datetime.now(timezone.utc),
                },
            )
            session.execute(stmt)
            session.commit()
            committed += len(batch)
            if committed % 5000 == 0 or committed == len(extracted_records):
                print(f"  -> Committed {committed:,} / {len(extracted_records):,} definitions...")

    # Final DB check
    with SessionLocal() as session:
        total_in_db = session.query(LegalDefinition).count()
        print("\n" + "=" * 70)
        print(f"SUCCESS: Total records in legal_definitions table: {total_in_db:,}")
        print("=" * 70)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Extract and index statutory legal definitions")
    parser.add_argument("--central-only", action="store_true", help="Process only Central legislation")
    parser.add_argument("--batch-size", type=int, default=1000, help="DB commit batch size")
    args = parser.parse_args()

    run_definition_extraction(central_only=args.central_only, batch_size=args.batch_size)
