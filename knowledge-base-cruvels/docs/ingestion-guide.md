# Knowledge Base Cruvels - Ingestion Guide

**Document Version:** 1.0.0  
**Target Subsystem:** `src/kb_cruvels/ingestion/`

---

## 1. Upstream Dataset Topology & Manifest

The upstream Open India Law dataset (`v2026.08`) consists of:
- **37 Legislation Parquet files** (1 Central + 28 States + 8 UTs) totaling **174.59 MB** containing **1,098,577 provisions** across **22,265 instruments**.
- **12 Regulatory Parquet files** totaling **215.18 MB**.

The canonical inventory is managed in `data/manifests/source_manifest.json` and generated via:
```bash
kb-cruvels dataset manifest
```

---

## 2. Ingestion Commands & Workflow

### A. Inspect Dataset Inventory
Check which partitions are downloaded locally versus available remotely:
```bash
kb-cruvels dataset inspect
# Or directly via script:
python scripts/inspect_dataset.py
```

### B. Ingest Central Legislation
Ingest Central legislation in memory-bounded batches (default 1,000 rows):
```bash
kb-cruvels ingest run --jurisdiction central --batch-size 1000
```

### C. Ingest Specific State or Union Territory
```bash
kb-cruvels ingest run --state maharashtra --batch-size 1000
kb-cruvels ingest run --state delhi --batch-size 1000
```

### D. Ingest a Specific Local Parquet File
```bash
kb-cruvels ingest run --file data/raw/open-india-law/v2026.08/in_central_legislation.parquet
```

### E. Dry-Run Validation (Zero Database Writes)
```bash
kb-cruvels ingest run --jurisdiction central --dry-run
```

---

## 3. Resilience, Checkpointing & Recovery

The ingestion orchestrator (`IngestionOrchestrator`) is designed for 100% resumability:

1. **Dual Checkpoints**:
   - **Disk**: `data/checkpoints/ingestion-state-<run_id>.json`
   - **PostgreSQL**: `ingestion_checkpoints` table with `run_id`, `filename`, `batch_index`, `cumulative_committed`, and `last_processed_chunk_id`.
2. **Crash Recovery**:
   If an ingestion job is interrupted (e.g. SIGINT, network failure, process termination), re-running the command automatically checks completed files and resumes processing without duplicating records.
3. **Quarantine Store**:
   Rows with missing titles, empty statutory text, or corrupted fields are filtered out, written to `data/quarantine/<run_id>/unresolved-records-*.jsonl`, and logged for investigation without halting the pipeline.

---

## 4. Ingestion Performance & Memory Optimization

- **Streaming Batching**: Uses PyArrow `iter_batches()` to stream RecordBatches without reading entire multi-megabyte Parquet files into memory.
- **Connection Pooling**: Uses SQLAlchemy `QueuePool` with transaction batches of 1,000 records.
- **Zero In-Memory Drift**: Checkpoint commits happen within the same transactional block as database row upserts.
