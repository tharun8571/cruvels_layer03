#!/usr/bin/env python3
"""Operational script to audit corpus text integrity, duplicates, and synthetic content."""

import json

from kb_cruvels.database.session import get_db_context
from kb_cruvels.verification.duplicate_detection import audit_duplicate_provisions
from kb_cruvels.verification.source_reconciliation import reconcile_corpus_counts
from kb_cruvels.verification.synthetic_content import audit_synthetic_content
from kb_cruvels.verification.text_integrity import audit_text_integrity


def main():
    print("=== Knowledge Base Cruvels - Corpus Audit ===")
    with get_db_context() as db:
        print("\n1. Auditing Text Integrity and SHA-256 Hashes...")
        integrity = audit_text_integrity(db)
        print(json.dumps(integrity, indent=2))

        print("\n2. Auditing Duplicate Provisions...")
        duplicates = audit_duplicate_provisions(db)
        print(json.dumps(duplicates, indent=2))

        print("\n3. Auditing Synthetic Content...")
        synthetic = audit_synthetic_content(db)
        print(json.dumps(synthetic, indent=2))

        print("\n4. Reconciling Corpus Against Manifest...")
        reconciliation = reconcile_corpus_counts(db)
        print(f"Total Stored Provisions: {reconciliation['actual_database_provisions']}")
        print(f"Total Stored Instruments: {reconciliation['actual_database_instruments']}")
        print(f"Coverage: {reconciliation['overall_coverage_pct']}%")


if __name__ == "__main__":
    main()
