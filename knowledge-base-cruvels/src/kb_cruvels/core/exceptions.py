"""Domain and application exceptions for Knowledge Base Cruvels."""

from typing import Any


class KBCruvelsException(Exception):
    """Base exception for all Knowledge Base Cruvels errors."""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class InstrumentNotFoundError(KBCruvelsException):
    """Raised when a requested legal instrument (Act) is not found."""


class ProvisionNotFoundError(KBCruvelsException):
    """Raised when an exact provision (Section/Article) cannot be resolved."""


class ValidationError(KBCruvelsException):
    """Raised when statutory data fails schema or integrity validation."""


class CheckpointError(KBCruvelsException):
    """Raised when checkpoint loading or saving fails."""


class SourceCorpusError(KBCruvelsException):
    """Raised when upstream source acquisition or parsing fails."""


class ContentIntegrityError(KBCruvelsException):
    """Raised when content hash mismatch or corrupted statutory text is detected."""
