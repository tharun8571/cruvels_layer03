"""StatutoryProvision and ProvisionNode ORM table definitions."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from kb_cruvels.database.models.base import Base


class StatutoryProvision(Base):
    """Canonical model for a section, article, or rule of legislation."""

    __tablename__ = "statutory_provisions"

    id = Column(String(64), primary_key=True, index=True)
    instrument_id = Column(String(64), ForeignKey("legal_instruments.id", ondelete="CASCADE"), nullable=False, index=True)
    source_chunk_id = Column(String(255), nullable=True, index=True)
    section_number = Column(String(64), nullable=False)
    section_number_norm = Column(String(64), nullable=False, index=True)
    section_title = Column(Text, nullable=True)
    chapter = Column(String(255), nullable=True)
    part = Column(String(255), nullable=True)
    provision_type = Column(String(64), default="section", nullable=False, index=True)

    # Verbatim statutory text
    source_text = Column(Text, nullable=False)
    canonical_text = Column(Text, nullable=False)

    # Checksums
    raw_hash = Column(String(64), nullable=False, index=True)
    canonical_hash = Column(String(64), nullable=False, index=True)

    # Legal attributes
    status = Column(String(64), default="in_force", nullable=False, index=True)
    in_force = Column(Boolean, default=True, nullable=False, index=True)
    has_proviso = Column(Boolean, default=False, nullable=False)
    has_non_obstante = Column(Boolean, default=False, nullable=False)
    acts_referenced = Column(JSON, default=list)
    defined_terms = Column(JSON, default=list)
    amendment_count = Column(Integer, default=0, nullable=False)

    # Provenance
    source_url = Column(Text, nullable=True)
    snapshot_version = Column(String(64), default="v2026.08", nullable=False)
    extra_metadata = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    instrument = relationship("LegalInstrument", back_populates="provisions")
    nodes = relationship("ProvisionNode", back_populates="provision", cascade="all, delete-orphan")
    versions = relationship("ProvisionVersion", back_populates="provision", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("instrument_id", "section_number_norm", name="uq_instrument_section_norm"),
        Index("ix_provisions_inst_sec", "instrument_id", "section_number_norm"),
        Index("ix_provisions_status_in_force", "status", "in_force"),
    )

    def __repr__(self) -> str:
        return f"<StatutoryProvision(id='{self.id}', section='{self.section_number_norm}', instrument_id='{self.instrument_id}')>"


class ProvisionNode(Base):
    """Hierarchical AST structural element within a statutory provision."""

    __tablename__ = "provision_nodes"

    id = Column(String(64), primary_key=True, index=True)
    provision_id = Column(String(64), ForeignKey("statutory_provisions.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_node_id = Column(String(64), ForeignKey("provision_nodes.id", ondelete="SET NULL"), nullable=True, index=True)
    node_type = Column(String(64), default="subsection", nullable=False, index=True)
    ordinal = Column(String(64), nullable=False)
    text = Column(Text, nullable=False)
    char_start = Column(Integer, nullable=True)
    char_end = Column(Integer, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    provision = relationship("StatutoryProvision", back_populates="nodes")
    parent = relationship("ProvisionNode", remote_side=[id], backref="children")

    __table_args__ = (
        Index("ix_provision_nodes_prov_order", "provision_id", "order_index"),
    )
