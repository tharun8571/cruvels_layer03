"""Domain models for Legal Instruments (Acts, Ordinances, Regulations)."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class InstrumentType(str, Enum):
    LEGISLATION = "legislation"
    REGULATION = "regulation"
    ORDINANCE = "ordinance"
    RULES = "rules"
    CONSTITUTION = "constitution"
    OTHER = "other"


class JurisdictionLevel(str, Enum):
    CENTRAL = "central"
    STATE = "state"
    UNION_TERRITORY = "union_territory"


class SourceStatus(str, Enum):
    IN_FORCE = "in_force"
    REPEALED = "repealed"
    SPENT = "spent"
    SUPERSEDED = "superseded"
    UNKNOWN = "unknown"


class LegalInstrumentDomain(BaseModel):
    """Domain model representing a primary or subordinate legal enactment."""

    model_config = ConfigDict(frozen=True, from_attributes=True)

    id: str | None = Field(default=None, description="Internal UUID or deterministic key")
    source_act_id: str = Field(..., description="Upstream source identifier (e.g. IndiaCode / Vaquill act_id)")
    title: str = Field(..., description="Full official title of the legal instrument")
    short_title: str | None = Field(default=None, description="Short title if distinct")
    year: int | None = Field(default=None, description="Year of enactment / publication")
    act_number: str | None = Field(default=None, description="Act Number where available, e.g. 'Act No. 46 of 2023'")
    instrument_type: InstrumentType = Field(default=InstrumentType.LEGISLATION)
    jurisdiction: str = Field(..., description="Jurisdiction: 'central' or state/UT code (e.g., 'maharashtra')")
    state_or_ut: str | None = Field(default=None, description="Specific State or UT name")
    status: SourceStatus = Field(default=SourceStatus.IN_FORCE, description="Legal enforceability status")
    in_force: bool = Field(default=True, description="True if currently active and in force")
    doc_type: str | None = Field(default="legislation", description="Document type taxonomy")
    legal_subject: str | None = Field(default=None, description="Legal subject area")
    department: str | None = Field(default=None, description="Ministry or Government Department")
    regulatory_body: str | None = Field(default=None, description="Regulatory body if applicable (e.g. RBI, SEBI)")
    source_url: str | None = Field(default=None, description="Source provenance URL")
    snapshot_version: str = Field(default="v2026.08", description="Upstream snapshot version tag")
    extra_metadata: dict[str, Any] = Field(default_factory=dict, description="Additional unmapped metadata fields")
