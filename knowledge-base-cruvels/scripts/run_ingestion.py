#!/usr/bin/env python3
"""Operational script to execute the ingestion pipeline."""

import argparse
import json
from pathlib import Path

from kb_cruvels.database.session import get_db_context
from kb_cruvels.ingestion.orchestrator import IngestionOrchestrator


def main():
    parser = argparse.ArgumentParser(description="Run Knowledge Base Cruvels Ingestion Pipeline")
    parser.add_argument("--jurisdiction", "-j", help="Filter: 'central' or state")
    parser.add_argument("--state", "-s", help="Specific state or UT")
    parser.add_argument("--file", "-f", type=Path, help="Specific parquet file")
    parser.add_argument("--batch-size", "-b", type=int, default=1000, help="Batch size")
    parser.add_argument("--limit", "-l", type=int, default=0, help="Record limit")
    parser.add_argument("--dry-run", action="store_true", help="Validate without committing")
    args = parser.parse_args()

    with get_db_context() as db:
        orchestrator = IngestionOrchestrator(db_session=db, batch_size=args.batch_size)
        report = orchestrator.run(
            jurisdiction=args.jurisdiction,
            state_or_ut=args.state,
            target_file=args.file,
            limit_records=args.limit,
            dry_run=args.dry_run,
        )
        print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
