"""Repository for tracking Ingestion Runs, Checkpoints, and Source Artifacts."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from kb_cruvels.database.models.ingestion import IngestionCheckpoint, IngestionRun
from kb_cruvels.database.models.provenance import SourceArtifact


class IngestionRepository:
    """Handles durable tracking of ingestion pipelines and checkpoints."""

    def __init__(self, db: Session):
        self.db = db

    def create_or_get_run(self, run_id: str, snapshot_version: str = "v2026.08", total_files: int = 0) -> IngestionRun:
        """Create or retrieve a top-level ingestion run."""
        run = self.db.query(IngestionRun).filter(IngestionRun.id == run_id).first()
        if not run:
            run = IngestionRun(
                id=run_id,
                snapshot_version=snapshot_version,
                status="started",
                total_files=total_files,
                files_completed=0,
                records_processed=0,
                records_committed=0,
                records_quarantined=0,
                started_at=datetime.utcnow(),
            )
            self.db.add(run)
            self.db.commit()
            self.db.refresh(run)
        return run

    def update_run_progress(
        self,
        run_id: str,
        files_completed_delta: int = 0,
        records_processed_delta: int = 0,
        records_committed_delta: int = 0,
        records_quarantined_delta: int = 0,
        status: str | None = None,
        error_message: str | None = None,
    ) -> IngestionRun:
        """Atomically update run metrics."""
        run = self.db.query(IngestionRun).filter(IngestionRun.id == run_id).first()
        if run:
            run.files_completed += files_completed_delta
            run.records_processed += records_processed_delta
            run.records_committed += records_committed_delta
            run.records_quarantined += records_quarantined_delta
            if status:
                run.status = status
                if status in ("completed", "failed"):
                    run.completed_at = datetime.utcnow()
            if error_message:
                run.error_message = error_message
            self.db.commit()
            self.db.refresh(run)
        return run

    def record_checkpoint(
        self,
        run_id: str,
        filename: str,
        jurisdiction: str,
        batch_index: int,
        records_in_batch: int,
        records_committed_cumulative: int,
        status: str = "committed",
        last_chunk_id: str | None = None,
        checkpoint_data: dict[str, Any] | None = None,
    ) -> IngestionCheckpoint:
        import hashlib
        key = f"{run_id}:{filename}:{batch_index}"
        ckpt_id = f"ckpt_{hashlib.sha256(key.encode('utf-8')).hexdigest()[:24]}"
        ckpt = self.db.query(IngestionCheckpoint).filter(IngestionCheckpoint.id == ckpt_id).first()
        if not ckpt:
            ckpt = IngestionCheckpoint(
                id=ckpt_id,
                run_id=run_id,
                filename=filename,
                jurisdiction=jurisdiction,
                batch_index=batch_index,
                records_in_batch=records_in_batch,
                records_committed_cumulative=records_committed_cumulative,
                status=status,
                last_processed_chunk_id=last_chunk_id,
                checkpoint_data=checkpoint_data or {},
                timestamp=datetime.utcnow(),
            )
            self.db.add(ckpt)
        else:
            ckpt.records_in_batch = records_in_batch
            ckpt.records_committed_cumulative = records_committed_cumulative
            ckpt.status = status
            ckpt.last_processed_chunk_id = last_chunk_id
            ckpt.checkpoint_data = checkpoint_data or {}
            ckpt.timestamp = datetime.utcnow()

        self.db.commit()
        return ckpt

    def get_latest_checkpoint(self, run_id: str, filename: str) -> IngestionCheckpoint | None:
        """Fetch latest checkpoint for a specific file in a run."""
        return (
            self.db.query(IngestionCheckpoint)
            .filter(IngestionCheckpoint.run_id == run_id, IngestionCheckpoint.filename == filename)
            .order_by(IngestionCheckpoint.batch_index.desc())
            .first()
        )

    def is_file_completed(self, run_id: str, filename: str) -> bool:
        """Check if a file was previously marked completed."""
        ckpt = (
            self.db.query(IngestionCheckpoint)
            .filter(
                IngestionCheckpoint.run_id == run_id,
                IngestionCheckpoint.filename == filename,
                IngestionCheckpoint.status == "file_completed",
            )
            .first()
        )
        return ckpt is not None

    def upsert_source_artifact(
        self,
        filename: str,
        jurisdiction: str,
        record_type: str,
        file_size_bytes: int,
        record_count: int,
        source_url: str,
        sha256_hash: str | None = None,
        is_verified: bool = False,
        snapshot_version: str = "v2026.08",
    ) -> SourceArtifact:
        """Record or update a source artifact entry."""
        art_id = f"art_{filename}"
        artifact = self.db.query(SourceArtifact).filter(SourceArtifact.filename == filename).first()
        if not artifact:
            artifact = SourceArtifact(
                id=art_id,
                filename=filename,
                jurisdiction=jurisdiction,
                record_type=record_type,
                file_size_bytes=file_size_bytes,
                record_count=record_count,
                source_url=source_url,
                sha256_hash=sha256_hash,
                is_verified=is_verified,
                snapshot_version=snapshot_version,
            )
            self.db.add(artifact)
        else:
            artifact.file_size_bytes = file_size_bytes
            artifact.record_count = record_count
            artifact.sha256_hash = sha256_hash
            artifact.is_verified = is_verified
            artifact.source_url = source_url

        self.db.commit()
        return artifact
