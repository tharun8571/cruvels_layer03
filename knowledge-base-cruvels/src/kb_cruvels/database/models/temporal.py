"""ProvisionVersion ORM table definition for historical statutory versions."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from kb_cruvels.database.models.base import Base


class ProvisionVersion(Base):
    """Stores historical or amended versions of a statutory provision."""

    __tablename__ = "provision_versions"

    id = Column(String(64), primary_key=True, index=True)
    provision_id = Column(String(64), ForeignKey("statutory_provisions.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, default=1, nullable=False)
    amendment_act_id = Column(String(255), nullable=True)
    amendment_title = Column(Text, nullable=True)
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    is_current = Column(Boolean, default=True, nullable=False)
    version_text = Column(Text, nullable=False)
    canonical_hash = Column(String(64), nullable=False)
    change_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    provision = relationship("StatutoryProvision", back_populates="versions")

    __table_args__ = (
        Index("ix_prov_versions_prov_num", "provision_id", "version_number"),
    )
