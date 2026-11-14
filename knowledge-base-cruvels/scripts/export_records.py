#!/usr/bin/env python3
"""Operational script to export canonical database records to JSONL / Parquet."""

import argparse
import gzip
import json
from pathlib import Path

from kb_cruvels.core.config import settings
from kb_cruvels.database.models.instruments import LegalInstrument
from kb_cruvels.database.models.provisions import StatutoryProvision
from kb_cruvels.database.session import get_db_context


def main():
    parser = argparse.ArgumentParser(description="Export database records to JSONL.gz")
    parser.add_argument("--output-dir", "-o", type=Path, default=settings.exports_dir)
    parser.add_argument("--jurisdiction", "-j", help="Filter jurisdiction")
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    out_file = args.output_dir / f"export_{args.jurisdiction or 'all'}_legislation.jsonl.gz"

    print(f"Exporting records to {out_file}...")
    with get_db_context() as db:
        query = db.query(StatutoryProvision).join(LegalInstrument)
        if args.jurisdiction:
            query = query.filter(LegalInstrument.jurisdiction == args.jurisdiction)

        count = 0
        with gzip.open(out_file, "wt", encoding="utf-8") as f:
            for prov in query.yield_per(1000):
                rec = {
                    "id": prov.id,
                    "instrument_id": prov.instrument_id,
                    "instrument_title": prov.instrument.title,
                    "jurisdiction": prov.instrument.jurisdiction,
                    "state_or_ut": prov.instrument.state_or_ut,
                    "section_number": prov.section_number,
                    "section_number_norm": prov.section_number_norm,
                    "section_title": prov.section_title,
                    "chapter": prov.chapter,
                    "source_text": prov.source_text,
                    "canonical_text": prov.canonical_text,
                    "canonical_hash": prov.canonical_hash,
                    "status": prov.status,
                    "in_force": prov.in_force,
                }
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
                count += 1

        print(f"Successfully exported {count} records to {out_file}.")


if __name__ == "__main__":
    main()
