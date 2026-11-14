"""Unified Ingestion Orchestrator for Central, State, and UT legal corpora."""

from __future__ import annotations

import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from kb_cruvels.core.config import settings
from kb_cruvels.core.logging import logger
from kb_cruvels.database.repositories.ingestion_repo import IngestionRepository
from kb_cruvels.ingestion.checkpoints import CheckpointManager
from kb_cruvels.ingestion.discover import discover_available_files
from kb_cruvels.ingestion.download import download_source_file
from kb_cruvels.ingestion.import_records import BatchRecordImporter
from kb_cruvels.ingestion.staging import write_quarantine_batch, write_staging_batch
from kb_cruvels.sources.open_india_law.adapter import OpenIndiaLawAdapter
from kb_cruvels.sources.open_india_law.parquet_reader import stream_parquet_records


class IngestionOrchestrator:
    """End-to-end streaming ingestion pipeline orchestrator."""

    def __init__(
        self,
        db_session: Session | None = None,
        snapshot_version: str = "v2026.08",
        batch_size: int = 1000,
    ):
        self.db = db_session
        self.snapshot_version = snapshot_version
        self.batch_size = batch_size
        self.adapter = OpenIndiaLawAdapter(snapshot_version=snapshot_version)

    def run(
        self,
        run_id: str | None = None,
        jurisdiction: str | None = None,
        state_or_ut: str | None = None,
        target_file: Path | None = None,
        auto_download: bool = True,
        dry_run: bool = False,
        limit_records: int = 0,
    ) -> dict[str, Any]:
        """
        Execute full or filtered ingestion workflow across discovered partitions.
        """
        active_run_id = run_id or f"run_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        logger.info(f"Starting ingestion run: {active_run_id} (jurisdiction={jurisdiction}, state={state_or_ut})")

        # 1. Discover files to process
        discovered = discover_available_files()
        files_to_process = []

        if target_file:
            files_to_process.append({
                "filename": target_file.name,
                "local_path": str(target_file),
                "jurisdiction": jurisdiction or "custom",
                "state_or_ut": state_or_ut,
                "expected_rows": 0,
            })
        else:
            for item in discovered:
                if jurisdiction and item["jurisdiction"] != jurisdiction:
                    continue
                if state_or_ut and item["state_or_ut"] != state_or_ut:
                    continue
                files_to_process.append(item)

        if not files_to_process:
            logger.warning("No files matched the specified ingestion criteria.")
            return {
                "run_id": active_run_id,
                "status": "no_files_matched",
                "records_processed": 0,
                "records_committed": 0,
                "records_quarantined": 0,
            }

        # Initialize checkpoint and database tracker
        ckpt_mgr = CheckpointManager(run_id=active_run_id, db=self.db)
        if self.db:
            ingest_repo = IngestionRepository(self.db)
            ingest_repo.create_or_get_run(active_run_id, self.snapshot_version, total_files=len(files_to_process))

        importer = BatchRecordImporter(self.db, self.adapter) if self.db else None

        total_processed = 0
        total_committed = 0
        total_quarantined = 0
        completed_files = 0
        file_metrics = []

        start_time = time.time()

        for file_info in files_to_process:
            fname = file_info["filename"]
            logger.info(f"--- Processing partition: {fname} ---")

            if ckpt_mgr.is_file_completed(fname):
                logger.info(f"Partition {fname} was previously completed in checkpoint. Skipping.")
                completed_files += 1
                continue

            file_path_str = file_info.get("local_path")
            local_path = Path(file_path_str) if file_path_str else (settings.raw_dir / fname)

            # Check if file exists locally or download
            if not local_path.exists():
                if auto_download and file_info.get("download_url"):
                    try:
                        download_source_file(file_info["download_url"], local_path)
                    except Exception as exc:
                        logger.error(f"Could not download {fname}: {exc}")
                        file_metrics.append({"file": fname, "status": "download_failed", "error": str(exc)})
                        continue
                else:
                    logger.warning(f"File {fname} not found locally at {local_path} and auto_download=False. Skipping.")
                    file_metrics.append({"file": fname, "status": "missing_local_file"})
                    continue

            # Stream records and process in batches
            file_processed = 0
            file_committed = 0
            file_quarantined = 0
            batch_idx = 0

            try:
                for batch in stream_parquet_records(local_path, batch_size=self.batch_size):
                    batch_idx += 1
                    file_processed += len(batch)

                    if dry_run or not self.db:
                        # Validation only
                        committed, quarantined, staged_recs, q_recs = 0, 0, [], []
                        for row in batch:
                            try:
                                inst, prov = self.adapter.adapt_record(row)
                                staged_recs.append(prov.model_dump(mode="json"))
                                committed += 1
                            except Exception as e:
                                q_recs.append({"raw": row, "error": str(e)})
                                quarantined += 1
                    else:
                        committed, quarantined, staged_recs, q_recs = importer.import_batch(batch)

                    file_committed += committed
                    file_quarantined += quarantined

                    # Write staging & quarantine batch files
                    if staged_recs:
                        write_staging_batch(active_run_id, batch_idx, staged_recs)
                    if q_recs:
                        write_quarantine_batch(active_run_id, batch_idx, q_recs)

                    # Durable batch checkpoint
                    ckpt_mgr.record_batch_commit(
                        filename=fname,
                        jurisdiction=file_info.get("jurisdiction", "central"),
                        batch_index=batch_idx,
                        records_in_batch=len(batch),
                        cumulative_committed=file_committed,
                    )

                    if self.db:
                        ingest_repo.update_run_progress(
                            active_run_id,
                            records_processed_delta=len(batch),
                            records_committed_delta=committed,
                            records_quarantined_delta=quarantined,
                        )

                    if limit_records and (total_processed + file_processed) >= limit_records:
                        logger.info(f"Reached limit_records target ({limit_records}). Stopping batch loop.")
                        break

                # Mark file completed
                ckpt_mgr.mark_file_completed(fname, file_committed)
                if self.db:
                    ingest_repo.update_run_progress(active_run_id, files_completed_delta=1)

                completed_files += 1
                total_processed += file_processed
                total_committed += file_committed
                total_quarantined += file_quarantined

                file_metrics.append({
                    "file": fname,
                    "status": "completed",
                    "processed": file_processed,
                    "committed": file_committed,
                    "quarantined": file_quarantined,
                })
                logger.info(f"Finished {fname}: {file_committed} committed, {file_quarantined} quarantined.")

            except Exception as exc:
                logger.error(f"Error while processing {fname}: {exc}")
                file_metrics.append({
                    "file": fname,
                    "status": "failed",
                    "error": str(exc),
                    "committed": file_committed,
                })
                # Continue with next file

            if limit_records and total_processed >= limit_records:
                break

        elapsed = time.time() - start_time
        final_status = "completed" if completed_files == len(files_to_process) else "partial"

        if self.db:
            ingest_repo.update_run_progress(active_run_id, status=final_status)

        report = {
            "run_id": active_run_id,
            "status": final_status,
            "elapsed_seconds": round(elapsed, 2),
            "files_total": len(files_to_process),
            "files_completed": completed_files,
            "records_processed": total_processed,
            "records_committed": total_committed,
            "records_quarantined": total_quarantined,
            "file_metrics": file_metrics,
        }

        # Save summary report to reports/
        report_path = settings.reports_dir / active_run_id / "ingestion_summary.json"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        import json
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        logger.info(f"Ingestion run {active_run_id} finished: {total_committed} records committed in {elapsed:.1f}s.")
        return report
