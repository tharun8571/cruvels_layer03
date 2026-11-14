"""LegalProcedure ORM table definition for procedural workflows."""

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


class LegalProcedure(Base):
    """Canonical model for structured legal procedures and court workflows."""

    __tablename__ = "legal_procedures"

    id = Column(String(64), primary_key=True, index=True)
    procedure_name = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(128), nullable=False, index=True)  # civil, criminal, bail, appeal, writ, consumer, arbitration, corporate
    governing_act = Column(String(255), nullable=False)
    governing_sections = Column(JSON, default=list)  # ["Section 480", "Section 482"]
    forum_jurisdiction = Column(String(255), nullable=False)  # Magistrate Court, Sessions Court, High Court, Supreme Court, NCLT
    summary = Column(Text, nullable=False)
    
    # Step-by-step procedure structure
    prerequisites = Column(JSON, default=list)
    stages = Column(JSON, default=list)  # [{"stage_number": 1, "stage_title": "...", "description": "...", "timeline": "..."}]
    limitation_period = Column(String(255), nullable=True)
    required_documents = Column(JSON, default=list)
    common_grounds = Column(JSON, default=list)
    leading_cases = Column(JSON, default=list)
    canonical_hash = Column(String(64), nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_procedures_category_forum", "category", "forum_jurisdiction"),
    )

    def __repr__(self) -> str:
        return f"<LegalProcedure(name='{self.procedure_name}', category='{self.category}')>"
