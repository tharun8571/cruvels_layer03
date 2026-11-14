"""CrossReferenceLink ORM table definition for establishing graph relationships."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    Index,
    String,
    Text,
)

from kb_cruvels.database.models.base import Base


class CrossReferenceLink(Base):
    """
    Bidirectional citation and cross-reference link establishing semantic and statutory relationships.
    Examples:
      - Act/Section -> Landmark Judgment (interprets / applies)
      - Judgment -> Judgment (overrules / follows / affirms)
      - Act/Section -> Legal Doctrine (embodies / derived_from)
      - Act/Section -> Legal Definition (defines)
      - Procedure -> Form / Template (requires / utilizes)
      - Notification -> Act / Section (issued_under)
    """

    __tablename__ = "cross_reference_links"

    id = Column(String(64), primary_key=True, index=True)
    source_type = Column(String(64), nullable=False, index=True)  # act, provision, judgment, doctrine, definition, procedure, form, template, notification
    source_id = Column(String(64), nullable=False, index=True)
    source_label = Column(String(255), nullable=True)

    target_type = Column(String(64), nullable=False, index=True)  # act, provision, judgment, doctrine, definition, procedure, form, template, notification
    target_id = Column(String(64), nullable=False, index=True)
    target_label = Column(String(255), nullable=True)

    relationship_type = Column(String(64), nullable=False, index=True)  # cites, interprets, applies, overrules, follows, defines, governs, requires
    confidence_score = Column(Float, default=1.0, nullable=False)
    description = Column(Text, nullable=True)
    extra_metadata = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_crossref_source", "source_type", "source_id"),
        Index("ix_crossref_target", "target_type", "target_id"),
        Index("ix_crossref_rel", "relationship_type"),
    )

    def __repr__(self) -> str:
        return f"<CrossReferenceLink({self.source_type}:{self.source_id} -> {self.relationship_type} -> {self.target_type}:{self.target_id})>"
