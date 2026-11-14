"""SourceArtifact ORM table definition for raw file provenance."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text,
)

from kb_cruvels.database.models.base import Base


class SourceArtifact(Base):
    """Tracks upstream source files, sizes, SHA-256 hashes, and verification state."""

    __tablename__ = "source_artifacts"

    id = Column(String(64), primary_key=True, index=True)
    publisher = Column(String(128), default="open-india-law", nullable=False)
    snapshot_version = Column(String(64), default="v2026.08", nullable=False, index=True)
    filename = Column(String(255), nullable=False, unique=True, index=True)
    jurisdiction = Column(String(64), nullable=False, index=True)
    record_type = Column(String(64), default="legislation", nullable=False)
    file_size_bytes = Column(BigInteger, default=0, nullable=False)
    record_count = Column(Integer, default=0, nullable=False)
    sha256_hash = Column(String(64), nullable=True, index=True)
    source_url = Column(Text, nullable=False)
    license_spdx = Column(String(64), default="CC-BY-4.0", nullable=False)
    downloaded_at = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<SourceArtifact(filename='{self.filename}', jurisdiction='{self.jurisdiction}', verified={self.is_verified})>"
