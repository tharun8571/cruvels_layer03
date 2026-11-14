"""Pydantic schemas for Full-Text Search API."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class SearchResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    instrument_id: str
    instrument_title: str
    jurisdiction: str
    state_or_ut: str | None = None
    section_number: str
    section_number_norm: str
    section_title: str | None = None
    chapter: str | None = None
    canonical_text_snippet: str
    source_text: str
    canonical_hash: str
    in_force: bool
    status: str
    source_url: str | None = None


class SearchResponse(BaseModel):
    query: str
    total_matches: int
    limit: int
    offset: int
    results: list[SearchResultItem]
