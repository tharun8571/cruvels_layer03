"""Pydantic schemas for Statutory Provisions API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from kb_cruvels.api.schemas.instruments import InstrumentSummary


class ProvisionNodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    node_type: str
    ordinal: str
    text: str
    char_start: int | None = None
    char_end: int | None = None
    order_index: int


class ProvisionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    instrument_id: str
    section_number: str
    section_number_norm: str
    section_title: str | None = None
    chapter: str | None = None
    provision_type: str
    status: str
    in_force: bool
    canonical_hash: str


class ProvisionResponse(ProvisionSummary):
    model_config = ConfigDict(from_attributes=True)

    part: str | None = None
    # Real statutory text
    source_text: str = Field(..., description="Exact verbatim statutory wording from source")
    canonical_text: str = Field(..., description="Canonical normalized statutory text")
    raw_hash: str
    has_proviso: bool
    has_non_obstante: bool
    acts_referenced: list[str] = Field(default_factory=list)
    defined_terms: list[str] = Field(default_factory=list)
    amendment_count: int = 0
    source_url: str | None = None
    snapshot_version: str
    extra_metadata: dict[str, Any] = Field(default_factory=dict)
    
    # Nested parent instrument and parsed nodes
    instrument: InstrumentSummary | None = None
    nodes: list[ProvisionNodeResponse] = Field(default_factory=list)


class ProvisionListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[ProvisionSummary]
