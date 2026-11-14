"""Legal Instruments API routes."""


from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from kb_cruvels.api.dependencies import get_db
from kb_cruvels.api.schemas.instruments import (
    InstrumentListResponse,
    InstrumentResponse,
    InstrumentSummary,
)
from kb_cruvels.api.schemas.provisions import ProvisionListResponse, ProvisionSummary
from kb_cruvels.core.config import settings
from kb_cruvels.services.instrument_service import InstrumentService
from kb_cruvels.services.provision_service import ProvisionService

router = APIRouter(prefix=settings.API_PREFIX, tags=["Legal Instruments"])


@router.get("/instruments", response_model=InstrumentListResponse)
def list_instruments(
    jurisdiction: str | None = Query(default=None, description="Filter by 'central' or state/UT"),
    state_or_ut: str | None = Query(default=None, description="Specific State or UT name"),
    year: int | None = Query(default=None, description="Filter by enactment year"),
    query: str | None = Query(default=None, description="Filter by title keyword"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> InstrumentListResponse:
    """List legal instruments (Acts, Regulations) with optional jurisdictional filters and pagination."""
    service = InstrumentService(db)
    items, total = service.list_instruments(
        jurisdiction=jurisdiction,
        state_or_ut=state_or_ut,
        year=year,
        query=query,
        limit=limit,
        offset=offset,
    )
    return InstrumentListResponse(
        total=total,
        limit=limit,
        offset=offset,
        items=[InstrumentSummary.model_validate(item) for item in items],
    )


@router.get("/instruments/{instrument_id}", response_model=InstrumentResponse)
def get_instrument_by_id(
    instrument_id: str,
    db: Session = Depends(get_db),
) -> InstrumentResponse:
    """Retrieve full details of a specific legal instrument."""
    service = InstrumentService(db)
    inst = service.get_instrument_by_id(instrument_id)
    return InstrumentResponse.model_validate(inst)


@router.get("/instruments/{instrument_id}/provisions", response_model=ProvisionListResponse)
def list_instrument_provisions(
    instrument_id: str,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> ProvisionListResponse:
    """List all statutory sections belonging to a specific legal instrument."""
    # Verify instrument exists
    inst_service = InstrumentService(db)
    inst_service.get_instrument_by_id(instrument_id)

    prov_service = ProvisionService(db)
    items, total = prov_service.list_provisions_by_instrument(instrument_id, limit=limit, offset=offset)
    return ProvisionListResponse(
        total=total,
        limit=limit,
        offset=offset,
        items=[ProvisionSummary.model_validate(p) for p in items],
    )
