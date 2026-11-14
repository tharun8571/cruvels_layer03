"""Pydantic schemas for System Metadata, Health, and Manifest APIs."""

from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="System health state")
    database_connected: bool = Field(..., description="PostgreSQL database connectivity")
    version: str = Field(default="0.1.0", description="API software version")
    snapshot_version: str = Field(default="v2026.08", description="Current legal dataset snapshot")


class CorpusStatsResponse(BaseModel):
    total_instruments: int
    total_provisions: int
    total_in_force_provisions: int
    central_provisions: int
    state_provisions: int
    union_territory_provisions: int
    snapshot_version: str
    last_reconciliation_date: str | None = None
