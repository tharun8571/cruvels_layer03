"""Abstract Base Class for Source Adapters."""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Generator
from pathlib import Path
from typing import Any

from kb_cruvels.domain.instruments import LegalInstrumentDomain
from kb_cruvels.domain.provisions import StatutoryProvisionDomain


class BaseSourceAdapter(ABC):
    """Abstract interface for ingesting and adapting external legal datasets."""

    @abstractmethod
    def adapt_record(
        self, raw_row: dict[str, Any]
    ) -> tuple[LegalInstrumentDomain, StatutoryProvisionDomain]:
        """Convert a raw dictionary/row into canonical Instrument and Provision domain entities."""

    @abstractmethod
    def read_records(
        self, source_path: Path, batch_size: int = 1000
    ) -> Generator[list[dict[str, Any]], None, None]:
        """Stream raw records in memory-safe batches."""
