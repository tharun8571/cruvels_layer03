"""LegalInstrument ORM table definition."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from kb_cruvels.database.models.base import Base


class LegalInstrument(Base):
    """Canonical model for an Indian Act, Regulation, Ordinance, or Constitution."""

    __tablename__ = "legal_instruments"

    id = Column(String(64), primary_key=True, index=True)
    source_act_id = Column(String(255), index=True, nullable=False)
    title = Column(Text, nullable=False, index=True)
    short_title = Column(String(512), nullable=True)
    year = Column(Integer, nullable=True, index=True)
    act_number = Column(String(128), nullable=True)
    instrument_type = Column(String(64), default="legislation", nullable=False, index=True)
    jurisdiction = Column(String(64), default="central", nullable=False, index=True)
    state_or_ut = Column(String(64), nullable=True, index=True)
    status = Column(String(64), default="in_force", nullable=False, index=True)
    in_force = Column(Boolean, default=True, nullable=False, index=True)
    doc_type = Column(String(64), default="legislation", nullable=True)
    legal_subject = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    regulatory_body = Column(String(255), nullable=True)
    source_url = Column(Text, nullable=True)
    snapshot_version = Column(String(64), default="v2026.08", nullable=False)
    extra_metadata = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    provisions = relationship("StatutoryProvision", back_populates="instrument", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_instruments_jurisdiction_year", "jurisdiction", "year"),
        Index("ix_instruments_state_title", "state_or_ut", "title"),
    )

    def __repr__(self) -> str:
        return f"<LegalInstrument(id='{self.id}', title='{self.title[:40]}', jurisdiction='{self.jurisdiction}')>"
