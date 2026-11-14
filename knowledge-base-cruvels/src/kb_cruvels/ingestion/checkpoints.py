"""Durable checkpoint state management for resumable ingestion."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from kb_cruvels.core.config import settings
from kb_cruvels.database.repositories.ingestion_repo import IngestionRepository


class CheckpointManager:
    """Coordinates file-system JSON and PostgreSQL database checkpoints."""

    def __init__(self, run_id: str, db: Session | None = None):
        self.run_id = run_id
        self.db = db
        self.repo = IngestionRepository(db) if db else None
        self.state_file = settings.checkpoints_dir / f"ingestion-state-{run_id}.json"

    def load_disk_state(self) -> dict[str, Any]:
        """Load state from local JSON checkpoint file."""
        if self.state_file.exists():
            try:
                with open(self.state_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "run_id": self.run_id,
            "completed_files": [],
            "file_progress": {},
            "total_records_committed": 0,
            "last_updated": datetime.utcnow().isoformat(),
        }

    def save_disk_state(self, state: dict[str, Any]) -> None:
        """Atomically persist state to disk."""
        state["last_updated"] = datetime.utcnow().isoformat()
        temp_file = self.state_file.with_suffix(".tmp")
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
        temp_file.replace(self.state_file)

    def is_file_completed(self, filename: str) -> bool:
        """Check if file was fully processed and committed."""
        if self.repo:
            if self.repo.is_file_completed(self.run_id, filename):
                return True
        state = self.load_disk_state()
        return filename in state.get("completed_files", [])

    def record_batch_commit(
        self,
        filename: str,
        jurisdiction: str,
        batch_index: int,
        records_in_batch: int,
        cumulative_committed: int,
        last_chunk_id: str | None = None,
    ) -> None:
        """Save batch progress to both database and disk checkpoint."""
        if self.repo:
            self.repo.record_checkpoint(
                run_id=self.run_id,
                filename=filename,
                jurisdiction=jurisdiction,
                batch_index=batch_index,
                records_in_batch=records_in_batch,
                records_committed_cumulative=cumulative_committed,
                status="committed",
                last_chunk_id=last_chunk_id,
            )

        state = self.load_disk_state()
        state.setdefault("file_progress", {})[filename] = {
            "last_batch_index": batch_index,
            "records_in_batch": records_in_batch,
            "records_committed": cumulative_committed,
            "last_chunk_id": last_chunk_id,
        }
        state["total_records_committed"] = state.get("total_records_committed", 0) + records_in_batch
        self.save_disk_state(state)

    def mark_file_completed(self, filename: str, total_records: int) -> None:
        """Mark a file as completely ingested."""
        if self.repo:
            self.repo.record_checkpoint(
                run_id=self.run_id,
                filename=filename,
                jurisdiction="all",
                batch_index=999999,
                records_in_batch=total_records,
                records_committed_cumulative=total_records,
                status="file_completed",
            )

        state = self.load_disk_state()
        completed = set(state.get("completed_files", []))
        completed.add(filename)
        state["completed_files"] = list(completed)
        self.save_disk_state(state)
