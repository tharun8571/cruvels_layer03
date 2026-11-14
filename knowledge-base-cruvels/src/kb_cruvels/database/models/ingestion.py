"""IngestionRun and IngestionCheckpoint ORM table definitions."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    BigInteger,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from kb_cruvels.database.models.base import Base


class IngestionRun(Base):
    """Tracks top-level ingestion executions and aggregate outcomes."""

    __tablename__ = "ingestion_runs"

    id = Column(String(64), primary_key=True, index=True)
    snapshot_version = Column(String(64), default="v2026.08", nullable=False)
    status = Column(String(32), default="started", nullable=False, index=True)  # started, completed, failed, partial
    total_files = Column(Integer, default=0, nullable=False)
    files_completed = Column(Integer, default=0, nullable=False)
    records_processed = Column(BigInteger, default=0, nullable=False)
    records_committed = Column(BigInteger, default=0, nullable=False)
    records_quarantined = Column(BigInteger, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    checkpoints = relationship("IngestionCheckpoint", back_populates="run", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<IngestionRun(id='{self.id}', status='{self.status}', committed={self.records_committed})>"


class IngestionCheckpoint(Base):
    """Tracks durable per-file, per-batch progress for resumable execution."""

    __tablename__ = "ingestion_checkpoints"

    id = Column(String(64), primary_key=True, index=True)
    run_id = Column(String(64), ForeignKey("ingestion_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False, index=True)
    jurisdiction = Column(String(64), nullable=False, index=True)
    batch_index = Column(Integer, default=0, nullable=False)
    records_in_batch = Column(Integer, default=0, nullable=False)
    records_committed_cumulative = Column(BigInteger, default=0, nullable=False)
    status = Column(String(32), default="in_progress", nullable=False)  # in_progress, committed, failed
    last_processed_chunk_id = Column(String(255), nullable=True)
    checkpoint_data = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    run = relationship("IngestionRun", back_populates="checkpoints")

    __table_args__ = (
        Index("ix_checkpoints_run_file", "run_id", "filename"),
    )
