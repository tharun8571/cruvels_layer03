"""Domain models for Historical Provision Versions and Temporal Lineage."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ProvisionVersionDomain(BaseModel):
    """Represents a discrete historical or amended version of a legal provision."""

    model_config = ConfigDict(frozen=True, from_attributes=True)

    id: str | None = Field(default=None, description="Version primary key")
    provision_id: str = Field(..., description="Foreign key to StatutoryProvision")
    version_number: int = Field(default=1, description="Sequential version index")
    amendment_act_id: str | None = Field(default=None, description="Amending Act identifier")
    amendment_title: str | None = Field(default=None, description="Title of amending legislation")
    effective_from: date | None = Field(default=None, description="Date when this version took effect")
    effective_to: date | None = Field(default=None, description="Date when this version was repealed/substituted")
    is_current: bool = Field(default=True, description="True if this is the active in-force version")
    version_text: str = Field(..., description="Verbatim statutory text of this version")
    canonical_hash: str = Field(..., description="SHA-256 hash of this version's text")
    change_note: str | None = Field(default=None, description="Summary of amendment or substitution")
    created_at: datetime = Field(default_factory=datetime.utcnow)
