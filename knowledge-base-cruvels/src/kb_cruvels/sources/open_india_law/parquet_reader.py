"""Memory-efficient streaming Parquet and JSONL reader using PyArrow and DuckDB."""

from __future__ import annotations

import gzip
import json
from collections.abc import Generator
from pathlib import Path
from typing import Any

import pyarrow.parquet as pq


def inspect_parquet_file(file_path: Path) -> dict[str, Any]:
    """Inspect metadata and schema of a Parquet file without loading data."""
    if not file_path.exists():
        raise FileNotFoundError(f"Parquet file not found: {file_path}")

    parquet_file = pq.ParquetFile(file_path)
    metadata = parquet_file.metadata
    schema = parquet_file.schema_arrow

    return {
        "num_rows": metadata.num_rows,
        "num_row_groups": metadata.num_row_groups,
        "num_columns": metadata.num_columns,
        "column_names": schema.names,
        "schema": {name: str(schema.field(name).type) for name in schema.names},
        "serialized_size_bytes": file_path.stat().st_size,
    }


def stream_parquet_records(
    file_path: Path,
    batch_size: int = 1000,
    columns: list[str] | None = None,
) -> Generator[list[dict[str, Any]], None, None]:
    """
    Stream records from Parquet file in memory-efficient row batches using PyArrow.
    Does not load the whole dataset into RAM.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    # Handle JSONL / JSONL.gz files if provided
    if file_path.name.endswith(".jsonl.gz") or file_path.name.endswith(".jsonl"):
        yield from stream_jsonl_records(file_path, batch_size=batch_size)
        return

    parquet_file = pq.ParquetFile(file_path)

    # Use specified columns or all available in file
    avail_cols = parquet_file.schema_arrow.names
    target_cols = [c for c in columns if c in avail_cols] if columns else avail_cols

    for batch in parquet_file.iter_batches(batch_size=batch_size, columns=target_cols):
        # Convert PyArrow RecordBatch to list of dicts
        pydict = batch.to_pydict()
        num_rows = batch.num_rows
        batch_records = [
            {col: pydict[col][i] for col in target_cols}
            for i in range(num_rows)
        ]
        yield batch_records


def stream_jsonl_records(
    file_path: Path,
    batch_size: int = 1000,
) -> Generator[list[dict[str, Any]], None, None]:
    """Stream records from JSONL or JSONL.gz file in batches."""
    opener = gzip.open if file_path.name.endswith(".gz") else open

    batch: list[dict[str, Any]] = []
    with opener(file_path, "rt", encoding="utf-8") as f:
        for line in f:
            line_str = line.strip()
            if not line_str:
                continue
            try:
                record = json.loads(line_str)
                batch.append(record)
                if len(batch) >= batch_size:
                    yield batch
                    batch = []
            except json.JSONDecodeError:
                continue

    if batch:
        yield batch
