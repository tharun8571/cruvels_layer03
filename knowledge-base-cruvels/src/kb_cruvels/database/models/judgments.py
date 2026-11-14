"""CourtJudgment ORM table definition for landmark Supreme Court and High Court case law."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    Date,
    DateTime,
    Index,
    Integer,
    String,
    Text,
)

from kb_cruvels.database.models.base import Base


class CourtJudgment(Base):
    """Canonical model for landmark Supreme Court and High Court judgments."""

    __tablename__ = "court_judgments"

    id = Column(String(64), primary_key=True, index=True)
    case_title = Column(Text, nullable=False, index=True)
    citation = Column(String(255), nullable=False, index=True, unique=True)
    alternate_citations = Column(JSON, default=list)
    court = Column(String(128), nullable=False, index=True)  # Supreme Court of India, High Court of Delhi, etc.
    court_type = Column(String(64), default="supreme_court", nullable=False, index=True)
    decision_date = Column(Date, nullable=True, index=True)
    decision_year = Column(Integer, nullable=True, index=True)
    bench = Column(JSON, default=list)  # List of Judge names
    coram_size = Column(Integer, default=1, nullable=False)
    parties = Column(JSON, default=dict)  # {"petitioner": "...", "respondent": "..."}
    subject_area = Column(String(128), nullable=False, index=True)  # Constitutional, Criminal, Civil, Commercial, IP, etc.
    legal_issue = Column(Text, nullable=True)
    ratio_decidendi = Column(Text, nullable=False)
    full_text = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    
    # Cross-references
    statutes_cited = Column(JSON, default=list)  # ["Constitution of India", "Indian Penal Code, 1860", ...]
    sections_cited = Column(JSON, default=list)  # ["Article 21", "Article 14", "Section 302", ...]
    doctrines_applied = Column(JSON, default=list)  # ["Basic Structure", "Procedure Established by Law", ...]
    overruled_cases = Column(JSON, default=list)
    followed_cases = Column(JSON, default=list)
    
    status = Column(String(64), default="good_law", nullable=False, index=True)  # good_law, overruled, distinguished, clarified
    source_url = Column(Text, nullable=True)
    canonical_hash = Column(String(64), nullable=False, index=True)
    snapshot_version = Column(String(64), default="v2026.08", nullable=False)
    extra_metadata = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_judgments_court_year", "court", "decision_year"),
        Index("ix_judgments_subject_status", "subject_area", "status"),
    )

    def __repr__(self) -> str:
        return f"<CourtJudgment(citation='{self.citation}', title='{self.case_title[:35]}')>"
