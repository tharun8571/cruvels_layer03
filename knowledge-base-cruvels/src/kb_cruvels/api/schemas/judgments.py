"""Pydantic schemas for Court Judgments."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class JudgmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_title: str
    citation: str
    alternate_citations: list[str] = Field(default_factory=list)
    court: str
    court_type: str
    decision_date: date | None = None
    decision_year: int | None = None
    bench: list[str] = Field(default_factory=list)
    coram_size: int = 1
    parties: dict[str, Any] = Field(default_factory=dict)
    subject_area: str
    legal_issue: str | None = None
    ratio_decidendi: str
    summary: str | None = None
    statutes_cited: list[str] = Field(default_factory=list)
    sections_cited: list[str] = Field(default_factory=list)
    doctrines_applied: list[str] = Field(default_factory=list)
    overruled_cases: list[str] = Field(default_factory=list)
    followed_cases: list[str] = Field(default_factory=list)
    status: str
    source_url: str | None = None
    canonical_hash: str


class JudgmentDetailResponse(JudgmentResponse):
    full_text: str
    created_at: datetime


class JudgmentSearchResponse(BaseModel):
    items: list[JudgmentResponse]
    total: int
    limit: int
    offset: int
