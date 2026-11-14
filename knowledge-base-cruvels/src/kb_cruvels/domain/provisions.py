"""Domain models for Statutory Provisions and structural AST nodes."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ProvisionType(str, Enum):
    SECTION = "section"
    ARTICLE = "article"
    RULE = "rule"
    REGULATION = "regulation"
    ORDER = "order"
    SCHEDULE = "schedule"
    PREAMBLE = "preamble"
    CLAUSE = "clause"
    DEFINITION = "definition"
    OTHER = "other"


class NodeType(str, Enum):
    ROOT = "root"
    SUBSECTION = "subsection"
    CLAUSE = "clause"
    SUBCLAUSE = "subclause"
    PROVISO = "proviso"
    EXPLANATION = "explanation"
    EXCEPTION = "exception"
    ILLUSTRATION = "illustration"
    PARAGRAPH = "paragraph"


class ProvisionNodeDomain(BaseModel):
    """Represents a discrete structural AST element within a statutory provision."""

    model_config = ConfigDict(frozen=True, from_attributes=True)

    node_id: str | None = Field(default=None, description="Unique node identifier")
    provision_id: str | None = Field(default=None, description="Parent provision ID")
    parent_node_id: str | None = Field(default=None, description="Direct parent AST node ID")
    node_type: NodeType = Field(default=NodeType.SUBSECTION, description="Type of structural element")
    ordinal: str = Field(..., description="Ordinal marker, e.g. '(1)', '(a)', 'Proviso 1', 'Explanation 2'")
    text: str = Field(..., description="Verbatim text of this structural element")
    char_start: int | None = Field(default=None, description="Character start offset in source text")
    char_end: int | None = Field(default=None, description="Character end offset in source text")
    order_index: int = Field(default=0, description="Sequential ordering within provision")


class StatutoryProvisionDomain(BaseModel):
    """Domain model representing a canonical section-level legal provision."""

    model_config = ConfigDict(frozen=True, from_attributes=True)

    id: str | None = Field(default=None, description="Internal primary key UUID")
    instrument_id: str = Field(..., description="Foreign key to parent LegalInstrument")
    source_chunk_id: str | None = Field(default=None, description="Upstream chunk ID (e.g. Qdrant / parquet chunk_id)")
    section_number: str = Field(..., description="Raw section number from source, e.g. '193', '53A'")
    section_number_norm: str = Field(..., description="Normalized section identifier, e.g. '193', '53A'")
    section_title: str | None = Field(default=None, description="Section heading or title")
    chapter: str | None = Field(default=None, description="Chapter identifier or heading")
    part: str | None = Field(default=None, description="Part identifier or heading")
    provision_type: ProvisionType = Field(default=ProvisionType.SECTION)
    
    # Exact statutory wording
    source_text: str = Field(..., description="Exact verbatim text as extracted from source")
    canonical_text: str = Field(..., description="Normalized canonical statutory text")
    
    # Checksums
    raw_hash: str = Field(..., description="SHA-256 of raw source text")
    canonical_hash: str = Field(..., description="SHA-256 of canonical text")
    
    # Legal attributes
    status: str = Field(default="in_force", description="Status of this specific provision")
    in_force: bool = Field(default=True, description="True if provision is currently in force")
    has_proviso: bool = Field(default=False, description="Flag indicating presence of provisos")
    has_non_obstante: bool = Field(default=False, description="Flag indicating non-obstante clauses")
    acts_referenced: list[str] = Field(default_factory=list, description="Cross-referenced Acts")
    defined_terms: list[str] = Field(default_factory=list, description="Terms defined in this provision")
    amendment_count: int = Field(default=0, description="Number of historical amendments recorded")
    
    # Sourcing & Provenance
    source_url: str | None = Field(default=None, description="Direct provenance URL")
    snapshot_version: str = Field(default="v2026.08", description="Upstream snapshot tag")
    extra_metadata: dict[str, Any] = Field(default_factory=dict, description="Raw unmapped payload fields")
    
    # Parsed structure
    nodes: list[ProvisionNodeDomain] = Field(default_factory=list, description="Structural AST nodes if parsed")
