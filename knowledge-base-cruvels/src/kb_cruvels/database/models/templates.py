"""LegalForm and DocumentTemplate ORM table definitions."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Index,
    String,
    Text,
)

from kb_cruvels.database.models.base import Base


class LegalForm(Base):
    """Canonical model for standard court application forms and legal petitions."""

    __tablename__ = "legal_forms"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(128), nullable=False, index=True)  # bail, writ, appeal, affidavit, notice, consumer, general
    governing_act = Column(String(255), nullable=True)
    governing_section = Column(String(128), nullable=True)
    description = Column(Text, nullable=False)
    fillable_fields = Column(JSON, default=list)  # [{"field_name": "...", "label": "...", "required": true}]
    template_format = Column(Text, nullable=False)
    drafting_notes = Column(JSON, default=list)
    canonical_hash = Column(String(64), nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_forms_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<LegalForm(title='{self.title}', category='{self.category}')>"


class DocumentTemplate(Base):
    """Canonical model for basic commercial, civil, and corporate agreement templates."""

    __tablename__ = "document_templates"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(128), nullable=False, index=True)  # commercial, employment, real_estate, corporate, intellectual_property
    description = Column(Text, nullable=False)
    standard_clauses = Column(JSON, default=list)  # ["Confidentiality", "Dispute Resolution", "Termination", ...]
    template_content = Column(Text, nullable=False)
    governing_statutes = Column(JSON, default=list)  # ["Indian Contract Act, 1872", "Arbitration and Conciliation Act, 1996"]
    is_vetted = Column(Boolean, default=True, nullable=False)
    canonical_hash = Column(String(64), nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_templates_category", "category"),
    )

    def __repr__(self) -> str:
        return f"<DocumentTemplate(title='{self.title}', category='{self.category}')>"
