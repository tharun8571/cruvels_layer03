"""Statutory Provisions and Exact Resolution API routes."""


from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from kb_cruvels.api.dependencies import get_db
from kb_cruvels.api.schemas.provisions import (
    ProvisionResponse,
)
from kb_cruvels.core.config import settings
from kb_cruvels.core.exceptions import ProvisionNotFoundError
from kb_cruvels.domain.temporal import ProvisionVersionDomain
from kb_cruvels.services.provision_service import ProvisionService
from kb_cruvels.services.temporal_service import TemporalService

router = APIRouter(prefix=settings.API_PREFIX, tags=["Statutory Provisions"])


@router.get("/provisions/resolve", response_model=ProvisionResponse)
def resolve_statutory_provision(
    act: str = Query(..., description="Act title, short title, or Act identifier (e.g. 'Bharatiya Nagarik Suraksha Sanhita, 2023')"),
    section: str = Query(..., description="Section number or identifier (e.g. '193', '53A', '72A')"),
    jurisdiction: str | None = Query(default=None, description="Optional jurisdiction filter: 'central' or state/UT"),
    state_or_ut: str | None = Query(default=None, description="Optional specific State or UT"),
    db: Session = Depends(get_db),
) -> ProvisionResponse:
    """
    Exact statutory resolution endpoint for high-precision legal questions.
    Returns the verbatim statutory source text and verified provenance metadata.
    """
    service = ProvisionService(db)
    prov = service.resolve_exact_provision(
        act_identifier=act,
        section_number=section,
        jurisdiction=jurisdiction,
        state_or_ut=state_or_ut,
    )
    return ProvisionResponse.model_validate(prov)


@router.get("/provisions/{provision_id}", response_model=ProvisionResponse)
def get_provision_by_id(
    provision_id: str,
    db: Session = Depends(get_db),
) -> ProvisionResponse:
    """Retrieve full details of a specific statutory provision by its primary key ID."""
    service = ProvisionService(db)
    prov = service.get_provision_by_id(provision_id)
    return ProvisionResponse.model_validate(prov)


@router.get("/provisions/{provision_id}/versions", response_model=list[ProvisionVersionDomain])
def get_provision_versions(
    provision_id: str,
    db: Session = Depends(get_db),
) -> list[ProvisionVersionDomain]:
    """Retrieve historical or amended versions and temporal lineage of a provision."""
    prov_service = ProvisionService(db)
    try:
        prov_service.get_provision_by_id(provision_id)
    except ProvisionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=exc.message)

    temp_service = TemporalService(db)
    versions = temp_service.get_versions_for_provision(provision_id)
    return [ProvisionVersionDomain.model_validate(v) for v in versions]
