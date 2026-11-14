"""Knowledge Base Cruvels API Schemas."""

from kb_cruvels.api.schemas.errors import ErrorDetail, ErrorResponse
from kb_cruvels.api.schemas.instruments import (
    InstrumentListResponse,
    InstrumentResponse,
    InstrumentSummary,
)
from kb_cruvels.api.schemas.metadata import CorpusStatsResponse, HealthResponse
from kb_cruvels.api.schemas.provisions import (
    ProvisionListResponse,
    ProvisionNodeResponse,
    ProvisionResponse,
    ProvisionSummary,
)
from kb_cruvels.api.schemas.search import SearchResponse, SearchResultItem

__all__ = [
    "CorpusStatsResponse",
    "ErrorDetail",
    "ErrorResponse",
    "HealthResponse",
    "InstrumentListResponse",
    "InstrumentResponse",
    "InstrumentSummary",
    "ProvisionListResponse",
    "ProvisionNodeResponse",
    "ProvisionResponse",
    "ProvisionSummary",
    "SearchResponse",
    "SearchResultItem",
]
