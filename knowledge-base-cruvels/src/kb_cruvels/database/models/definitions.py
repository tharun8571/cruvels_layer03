"""LegalDefinition ORM table definition for structured statutory definitions."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
)

from kb_cruvels.database.models.base import Base


class LegalDefinition(Base):
    """Structured legal definition extracted from Constitution, Acts, and authoritative sources."""

    __tablename__ = "legal_definitions"

    id = Column(String(64), primary_key=True, index=True)
    term = Column(Text, nullable=False, index=True)
    term_normalized = Column(Text, nullable=False, index=True)
    definition_text = Column(Text, nullable=False)
    source_act_title = Column(Text, nullable=False, index=True)
    source_section_number = Column(String(255), nullable=False, index=True)
    source_provision_id = Column(String(64), ForeignKey("statutory_provisions.id", ondelete="SET NULL"), nullable=True, index=True)
    legal_domain = Column(String(128), default="general", nullable=False, index=True)  # Criminal, Civil, Corporate, Constitutional, etc.
    related_terms = Column(JSON, default=list)
    key_cases = Column(JSON, default=list)
    canonical_hash = Column(String(64), nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_definitions_term_domain", "term_normalized", "legal_domain"),
        Index("ix_definitions_act_sec", "source_act_title", "source_section_number"),
    )

    def __repr__(self) -> str:
        return f"<LegalDefinition(term='{self.term}', act='{self.source_act_title}')>"
