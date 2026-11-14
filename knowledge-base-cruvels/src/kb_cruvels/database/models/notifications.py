"""GovernmentNotification ORM table definition."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Index,
    String,
    Text,
)

from kb_cruvels.database.models.base import Base


class GovernmentNotification(Base):
    """Canonical model for official notifications, circulars, and regulatory directions."""

    __tablename__ = "government_notifications"

    id = Column(String(64), primary_key=True, index=True)
    notification_number = Column(String(255), nullable=False, index=True)
    issuing_authority = Column(String(128), nullable=False, index=True)  # RBI, SEBI, MCA, CERT_IN, CBIC, MEITY, MOEFCC
    title = Column(Text, nullable=False, index=True)
    subject = Column(String(255), nullable=True)
    issue_date = Column(Date, nullable=True, index=True)
    effective_date = Column(Date, nullable=True)
    notification_type = Column(String(64), default="circular", nullable=False, index=True)  # circular, master_direction, gazette_notification, guideline
    full_text = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    applicable_acts = Column(JSON, default=list)  # ["Reserve Bank of India Act, 1934", "Information Technology Act, 2000"]
    source_url = Column(Text, nullable=True)
    in_force = Column(Boolean, default=True, nullable=False, index=True)
    canonical_hash = Column(String(64), nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_notifications_authority_date", "issuing_authority", "issue_date"),
    )

    def __repr__(self) -> str:
        return f"<GovernmentNotification(num='{self.notification_number}', authority='{self.issuing_authority}')>"
