"""Pydantic schemas for Legal Instruments API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class InstrumentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_act_id: str
    title: str
    short_title: str | None = None
    year: int | None = None
    act_number: str | None = None
    instrument_type: str
    jurisdiction: str
    state_or_ut: str | None = None
    status: str
    in_force: bool


class InstrumentResponse(InstrumentSummary):
    model_config = ConfigDict(from_attributes=True)

    doc_type: str | None = None
    legal_subject: str | None = None
    department: str | None = None
    regulatory_body: str | None = None
    source_url: str | None = None
    snapshot_version: str
    extra_metadata: dict[str, Any] = Field(default_factory=dict)


class InstrumentListResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[InstrumentSummary]
