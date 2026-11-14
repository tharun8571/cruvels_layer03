#!/usr/bin/env python3
"""
Ingest official Criminal Law Concordance (Transition Mapping) into Knowledge Base Cruvels:
- Indian Penal Code (IPC, 1860) <-> Bharatiya Nyaya Sanhita (BNS, 2023)
- Code of Criminal Procedure (CrPC, 1973) <-> Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023)
- Indian Evidence Act (IEA, 1872) <-> Bharatiya Sakshya Adhiniyam (BSA, 2023)

Populates the PostgreSQL `cross_reference_links` table with bidirectional relational links
and saves the canonical JSON archive to `data/staging/curated_intake/new_criminal_laws_mapping.json`.
"""

from __future__ import annotations

import csv
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WORKSPACE_ROOT / "src"))

from kb_cruvels.database.models.cross_references import CrossReferenceLink
from kb_cruvels.database.models.instruments import LegalInstrument
from kb_cruvels.database.models.provisions import StatutoryProvision
from kb_cruvels.database.session import SessionLocal

MAPPING_SOURCES = {
    "IPC_BNS": {
        "url": "https://raw.githubusercontent.com/SANGRAMLEMBE/Nyaya-RAG/main/data/mappings/ipc_bns_map.csv",
        "source_act": "Indian Penal Code, 1860",
        "target_act": "Bharatiya Nyaya Sanhita, 2023",
        "source_code": "IPC",
        "target_code": "BNS",
        "source_col": "ipc_section",
        "target_col": "bns_section",
    },
    "CRPC_BNSS": {
        "url": "https://raw.githubusercontent.com/SANGRAMLEMBE/Nyaya-RAG/main/data/mappings/crpc_bnss_map.csv",
        "source_act": "Code of Criminal Procedure, 1973",
        "target_act": "Bharatiya Nagarik Suraksha Sanhita, 2023",
        "source_code": "CrPC",
        "target_code": "BNSS",
        "source_col": "crpc_section",
        "target_col": "bnss_section",
    },
    "IEA_BSA": {
        "url": "https://raw.githubusercontent.com/SANGRAMLEMBE/Nyaya-RAG/main/data/mappings/iea_bsa_map.csv",
        "source_act": "Indian Evidence Act, 1872",
        "target_act": "Bharatiya Sakshya Adhiniyam, 2023",
        "source_code": "IEA",
        "target_code": "BSA",
        "source_col": "iea_section",
        "target_col": "bsa_section",
    },
}


def make_id(src_id: str, tgt_id: str, rel: str) -> str:
    seed = f"{src_id}:{rel}:{tgt_id}"
    return f"xref_{hashlib.sha256(seed.encode('utf-8')).hexdigest()[:16]}"


def build_provision_index(session) -> dict[tuple[str, str], str]:
    """Index existing statutory provisions in PostgreSQL for exact relational resolution."""
    print("Building provision lookup index from PostgreSQL...")
    lookup: dict[tuple[str, str], str] = {}
    rows = (
        session.query(LegalInstrument.title, StatutoryProvision.section_number_norm, StatutoryProvision.id)
        .join(StatutoryProvision, StatutoryProvision.instrument_id == LegalInstrument.id)
        .filter(
            LegalInstrument.title.ilike("%Penal Code%")
            | LegalInstrument.title.ilike("%Nyaya Sanhita%")
            | LegalInstrument.title.ilike("%Criminal Procedure%")
            | LegalInstrument.title.ilike("%Nagarik Suraksha%")
            | LegalInstrument.title.ilike("%Evidence Act%")
            | LegalInstrument.title.ilike("%Sakshya Adhiniyam%")
        )
        .all()
    )
    for act_title, sec_norm, prov_id in rows:
        key_act = ""
        act_lower = act_title.lower()
        if "nyaya sanhita" in act_lower:
            key_act = "BNS"
        elif "penal code" in act_lower:
            key_act = "IPC"
        elif "nagarik suraksha" in act_lower:
            key_act = "BNSS"
        elif "criminal procedure" in act_lower:
            key_act = "CrPC"
        elif "sakshya adhiniyam" in act_lower:
            key_act = "BSA"
        elif "evidence act" in act_lower:
            key_act = "IEA"

        if key_act and sec_norm:
            lookup[(key_act, sec_norm.upper())] = prov_id

    print(f"Loaded {len(lookup)} provision IDs for criminal law statutes.")
    return lookup


def run_concordance_ingestion():
    print("=" * 70)
    print("KNOWLEDGE BASE CRUVELS: CRIMINAL LAW CONCORDANCE INGESTION")
    print("Mapping IPC <-> BNS, CrPC <-> BNSS, IEA <-> BSA")
    print("=" * 70)

    staging_dir = WORKSPACE_ROOT / "data" / "staging" / "curated_intake"
    staging_dir.mkdir(parents=True, exist_ok=True)
    raw_maps_dir = WORKSPACE_ROOT / "data" / "staging" / "mappings"
    raw_maps_dir.mkdir(parents=True, exist_ok=True)

    with SessionLocal() as session:
        prov_lookup = build_provision_index(session)

    all_links_payload = []
    db_records_to_upsert = []

    for group_key, cfg in MAPPING_SOURCES.items():
        cache_file = raw_maps_dir / f"{group_key.lower()}.csv"
        if not cache_file.exists():
            print(f"\nDownloading concordance table for {group_key}...")
            resp = requests.get(cfg["url"], timeout=15)
            resp.raise_for_status()
            cache_file.write_text(resp.text, encoding="utf-8")
        else:
            print(f"\nUsing cached concordance table: {cache_file.name}")

        with open(cache_file, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        print(f"Processing {len(rows)} mappings for {cfg['source_code']} <-> {cfg['target_code']}...")

        for row in rows:
            src_sec = row[cfg["source_col"]].strip()
            tgt_sec = row[cfg["target_col"]].strip()
            note = row.get("note", "").strip() or "Statutory provision"

            if not src_sec or not tgt_sec:
                continue

            # Forward Link: Legacy -> New Law (repeals_and_replaces)
            fwd_src_id = f"{cfg['source_code']}_{src_sec}"
            fwd_tgt_id = f"{cfg['target_code']}_{tgt_sec}"
            fwd_id = make_id(fwd_src_id, fwd_tgt_id, "repeals_and_replaces")

            fwd_src_prov_id = prov_lookup.get((cfg["source_code"], src_sec.upper()))
            fwd_tgt_prov_id = prov_lookup.get((cfg["target_code"], tgt_sec.upper()))

            fwd_item = {
                "id": fwd_id,
                "source_type": "statutory_provision",
                "source_id": fwd_src_id,
                "source_label": f"Section {src_sec}, {cfg['source_act']} ({note})",
                "target_type": "statutory_provision",
                "target_id": fwd_tgt_id,
                "target_label": f"Section {tgt_sec}, {cfg['target_act']} ({note})",
                "relationship_type": "repeals_and_replaces",
                "confidence_score": 1.0,
                "description": f"Section {src_sec} of {cfg['source_act']} has been repealed and replaced by Section {tgt_sec} of {cfg['target_act']} ({note}).",
                "extra_metadata": {
                    "source_act": cfg["source_act"],
                    "source_section": src_sec,
                    "target_act": cfg["target_act"],
                    "target_section": tgt_sec,
                    "subject": note,
                    "source_provision_id": fwd_src_prov_id,
                    "target_provision_id": fwd_tgt_prov_id,
                },
            }
            all_links_payload.append(fwd_item)
            db_records_to_upsert.append(fwd_item)

            # Reverse Link: New Law -> Legacy Law (corresponds_to)
            rev_src_id = fwd_tgt_id
            rev_tgt_id = fwd_src_id
            rev_id = make_id(rev_src_id, rev_tgt_id, "corresponds_to")

            rev_item = {
                "id": rev_id,
                "source_type": "statutory_provision",
                "source_id": rev_src_id,
                "source_label": f"Section {tgt_sec}, {cfg['target_act']} ({note})",
                "target_type": "statutory_provision",
                "target_id": rev_tgt_id,
                "target_label": f"Section {src_sec}, {cfg['source_act']} ({note})",
                "relationship_type": "corresponds_to",
                "confidence_score": 1.0,
                "description": f"Section {tgt_sec} of {cfg['target_act']} corresponds to legacy Section {src_sec} of repealed {cfg['source_act']} ({note}).",
                "extra_metadata": {
                    "source_act": cfg["target_act"],
                    "source_section": tgt_sec,
                    "target_act": cfg["source_act"],
                    "target_section": src_sec,
                    "subject": note,
                    "source_provision_id": fwd_tgt_prov_id,
                    "target_provision_id": fwd_src_prov_id,
                },
            }
            all_links_payload.append(rev_item)
            db_records_to_upsert.append(rev_item)

    # 1. Save canonical JSON artifact
    json_path = staging_dir / "new_criminal_laws_mapping.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_links_payload, f, indent=2, ensure_ascii=False)
    print(f"\n[Saved Canonical JSON] {json_path} ({len(all_links_payload):,} links)")

    # 2. Batch upsert into PostgreSQL
    print(f"\nIngesting {len(db_records_to_upsert):,} cross-reference links into PostgreSQL...")
    batch_size = 500
    committed = 0

    with SessionLocal() as session:
        for i in range(0, len(db_records_to_upsert), batch_size):
            batch = db_records_to_upsert[i : i + batch_size]
            for item in batch:
                existing = session.query(CrossReferenceLink).filter(CrossReferenceLink.id == item["id"]).first()
                if existing:
                    existing.source_label = item["source_label"]
                    existing.target_label = item["target_label"]
                    existing.description = item["description"]
                    existing.extra_metadata = item["extra_metadata"]
                else:
                    new_obj = CrossReferenceLink(
                        id=item["id"],
                        source_type=item["source_type"],
                        source_id=item["source_id"],
                        source_label=item["source_label"],
                        target_type=item["target_type"],
                        target_id=item["target_id"],
                        target_label=item["target_label"],
                        relationship_type=item["relationship_type"],
                        confidence_score=item["confidence_score"],
                        description=item["description"],
                        extra_metadata=item["extra_metadata"],
                        created_at=datetime.now(timezone.utc),
                    )
                    session.add(new_obj)
            session.commit()
            committed += len(batch)
            print(f"  -> Committed {committed:,} / {len(db_records_to_upsert):,} links...")

    # Final count check
    with SessionLocal() as session:
        total_links = session.query(CrossReferenceLink).count()
        print("\n" + "=" * 70)
        print(f"SUCCESS: Total records in cross_reference_links table: {total_links:,}")
        print("=" * 70)


if __name__ == "__main__":
    run_concordance_ingestion()
