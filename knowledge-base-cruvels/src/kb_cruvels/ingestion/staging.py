"""Staging and Quarantine batch storage using PyArrow."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pyarrow as pa
import pyarrow.parquet as pq

from kb_cruvels.core.config import settings


def write_staging_batch(
    run_id: str,
    batch_index: int,
    records: list[dict[str, Any]],
) -> Path:
    """Write a normalized batch of records to data/staging/<run_id>/."""
    staging_dir = settings.staging_dir / run_id
    staging_dir.mkdir(parents=True, exist_ok=True)
    batch_file = staging_dir / f"normalized-batch-{batch_index:06d}.parquet"

    if not records:
        return batch_file

    table = pa.Table.from_pylist(records)
    pq.write_table(table, batch_file, compression="zstd")
    return batch_file


def write_quarantine_batch(
    run_id: str,
    batch_index: int,
    quarantined_records: list[dict[str, Any]],
) -> Path:
    """Write invalid/unresolved records to data/quarantine/<run_id>/."""
    quarantine_dir = settings.quarantine_dir / run_id
    quarantine_dir.mkdir(parents=True, exist_ok=True)
    quarantine_file = quarantine_dir / f"unresolved-records-{batch_index:06d}.jsonl"

    with open(quarantine_file, "a", encoding="utf-8") as f:
        f.writelines(json.dumps(rec, ensure_ascii=False, default=str) + "\n" for rec in quarantined_records)

    return quarantine_file
