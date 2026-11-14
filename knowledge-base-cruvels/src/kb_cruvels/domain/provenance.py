"""Domain models for Source Artifacts, Provenance tracking, and Content Hash Auditing."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SourceArtifactDomain(BaseModel):
    """Represents an upstream source file, archive, or published dataset partition."""

    model_config = ConfigDict(frozen=True, from_attributes=True)

    id: str | None = Field(default=None, description="Internal source artifact ID")
    publisher: str = Field(default="open-india-law", description="Upstream publisher name")
    snapshot_version: str = Field(default="v2026.08", description="Snapshot identity tag")
    filename: str = Field(..., description="Original filename in repository (e.g. in_central_legislation.parquet)")
    jurisdiction: str = Field(..., description="Jurisdiction covered: 'central' or state/UT code")
    record_type: str = Field(default="legislation", description="Record type: 'legislation' or 'regulations'")
    file_size_bytes: int = Field(default=0, description="Size of the raw file in bytes")
    record_count: int = Field(default=0, description="Total number of records reported in source")
    sha256_hash: str | None = Field(default=None, description="SHA-256 checksum of raw source file")
    source_url: str = Field(..., description="Direct download URL from publisher")
    license_spdx: str = Field(default="CC-BY-4.0", description="SPDX License identifier")
    downloaded_at: datetime | None = Field(default=None, description="Timestamp when file was acquired")
    is_verified: bool = Field(default=False, description="Whether checksum and schema were verified")


class ContentHashAudit(BaseModel):
    """Audit outcome for content hash recalculation."""

    provision_id: str
    stored_canonical_hash: str
    recalculated_canonical_hash: str
    is_match: bool
    byte_length: int
    inspected_at: datetime = Field(default_factory=datetime.utcnow)
