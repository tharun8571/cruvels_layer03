"""Integration tests for Parquet batch loading and adapter conversion."""

from pathlib import Path

from kb_cruvels.sources.open_india_law.adapter import OpenIndiaLawAdapter
from kb_cruvels.sources.open_india_law.parquet_reader import (
    inspect_parquet_file,
    stream_parquet_records,
)


def test_inspect_parquet_file():
    fixture_path = Path("tests/fixtures/sample_legislation.parquet")
    meta = inspect_parquet_file(fixture_path)
    assert meta["num_rows"] == 7
    assert "section_number" in meta["column_names"]
    assert "text" in meta["column_names"]
    assert "jurisdiction" in meta["column_names"]


def test_stream_and_adapt_parquet_records():
    fixture_path = Path("tests/fixtures/sample_legislation.parquet")
    adapter = OpenIndiaLawAdapter()

    batches = list(stream_parquet_records(fixture_path, batch_size=3))
    assert len(batches) == 3  # 3 + 3 + 1

    total_rows = sum(len(b) for b in batches)
    assert total_rows == 7

    first_record = batches[0][0]
    inst, prov = adapter.adapt_record(first_record)
    assert inst.title == "Bharatiya Nagarik Suraksha Sanhita, 2023"
    assert prov.section_number_norm == "193"
    assert len(prov.canonical_hash) == 64
