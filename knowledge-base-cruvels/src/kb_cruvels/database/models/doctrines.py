"""LegalDoctrine ORM table definition for fundamental legal principles and doctrines."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Index,
    String,
    Text,
)

from kb_cruvels.database.models.base import Base


class LegalDoctrine(Base):
    """Canonical model for established legal doctrines, principles, and maxims."""

    __tablename__ = "legal_doctrines"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    name_normalized = Column(String(255), nullable=False, index=True)
    latin_maxim = Column(String(255), nullable=True)
    category = Column(String(128), default="general", nullable=False, index=True)  # Constitutional, Administrative, Criminal, Civil, Evidence
    summary = Column(Text, nullable=False)
    detailed_explanation = Column(Text, nullable=False)
    
    # Linked authorities
    constitutional_provisions = Column(JSON, default=list)  # ["Article 14", "Article 21", ...]
    statutory_provisions = Column(JSON, default=list)  # [{"act": "Code of Civil Procedure, 1908", "section": "11"}, ...]
    leading_judgments = Column(JSON, default=list)  # [{"citation": "...", "case_title": "...", "relevance": "..."}]
    exceptions = Column(JSON, default=list)
    key_elements = Column(JSON, default=list)
    canonical_hash = Column(String(64), nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_doctrines_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<LegalDoctrine(name='{self.name}', category='{self.category}')>"
