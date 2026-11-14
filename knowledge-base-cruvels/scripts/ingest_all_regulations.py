"""Download and ingest all 12 Subordinate Regulation partitions into Knowledge Base Cruvels."""

from __future__ import annotations

from pathlib import Path

from kb_cruvels.core.logging import logger
from kb_cruvels.database.session import get_db_context
from kb_cruvels.ingestion.download import download_source_file
from kb_cruvels.ingestion.import_records import BatchRecordImporter
from kb_cruvels.sources.open_india_law.adapter import OpenIndiaLawAdapter
from kb_cruvels.sources.open_india_law.parquet_reader import stream_parquet_records

REGULATORY_FILES = [
    "in_rbi_regulations.parquet",
    "in_sebi_regulations.parquet",
    "in_mca_regulations.parquet",
    "in_cbic_regulations.parquet",
    "in_trai_regulations.parquet",
    "in_irdai_regulations.parquet",
    "in_moefcc_regulations.parquet",
    "in_law-commission_regulations.parquet",
    "in_state-gst_regulations.parquet",
    "in_dgft_regulations.parquet",
    "in_dfs_regulations.parquet",
    "in_cpcb_regulations.parquet",
]


def ingest_all_regulations():
    base_dir = Path("data/raw/open-india-law/v2026.08")
    base_dir.mkdir(parents=True, exist_ok=True)

    adapter = OpenIndiaLawAdapter(snapshot_version="v2026.08")
    total_records = 0
    total_committed = 0

    print("=== STARTING SUBORDINATE REGULATIONS INGESTION ===")

    for filename in REGULATORY_FILES:
        target_path = base_dir / filename
        url = f"https://huggingface.co/datasets/vaquill/open-india-law/resolve/main/{filename}"

        if not target_path.exists():
            print(f"\n[1/2] Downloading {filename}...")
            download_source_file(url, target_path)
        else:
            print(f"\n[1/2] {filename} already exists locally.")

        print(f"[2/2] Streaming and importing records from {filename}...")
        file_committed = 0
        batch = []
        batch_size = 1000

        with get_db_context() as session:
            importer = BatchRecordImporter(db=session, adapter=adapter)

            for raw_batch in stream_parquet_records(target_path, batch_size=batch_size):
                comm_c, quar_c, _, _ = importer.import_batch(raw_batch)
                file_committed += comm_c
                total_records += len(raw_batch)
                session.commit()
                if file_committed % 5000 == 0:
                    print(f"    [{filename}] {file_committed:,} provisions committed...", flush=True)

            total_committed += file_committed

        print(f"  -> Successfully imported {file_committed:,} provisions from {filename}")

    print("\n" + "=" * 60)
    print("  ALL 12 REGULATORY PARTITIONS INGESTED SUCCESSFULLY!")
    print(f"  Total Records Streamed: {total_records:,}")
    print(f"  Total Provisions Committed: {total_committed:,}")
    print("=" * 60)


if __name__ == "__main__":
    ingest_all_regulations()
