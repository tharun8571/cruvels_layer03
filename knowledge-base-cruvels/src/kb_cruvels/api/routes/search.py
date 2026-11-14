"""Full-text search API routes."""


from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from kb_cruvels.api.dependencies import get_db
from kb_cruvels.api.schemas.search import SearchResponse, SearchResultItem
from kb_cruvels.core.config import settings
from kb_cruvels.services.search_service import SearchService

router = APIRouter(prefix=settings.API_PREFIX, tags=["Search"])


@router.get("/search", response_model=SearchResponse)
def search_provisions(
    q: str = Query(..., min_length=2, description="Search terms or phrase"),
    jurisdiction: str | None = Query(default=None, description="Filter by 'central' or state/UT"),
    state_or_ut: str | None = Query(default=None, description="Specific State or UT"),
    act_title: str | None = Query(default=None, description="Filter within specific Act"),
    in_force_only: bool = Query(default=True, description="Only search currently in-force provisions"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> SearchResponse:
    """
    Search legal provisions across Indian statutory legislation.
    Supports jurisdictional filtering and full statutory text indexing.
    """
    service = SearchService(db)
    items, total = service.search_provisions(
        query=q,
        jurisdiction=jurisdiction,
        state_or_ut=state_or_ut,
        act_title=act_title,
        in_force_only=in_force_only,
        limit=limit,
        offset=offset,
    )

    results = []
    for prov in items:
        text_snippet = prov.canonical_text[:300] + ("..." if len(prov.canonical_text) > 300 else "")
        results.append(
            SearchResultItem(
                id=prov.id,
                instrument_id=prov.instrument_id,
                instrument_title=prov.instrument.title if prov.instrument else "Unknown",
                jurisdiction=prov.instrument.jurisdiction if prov.instrument else "central",
                state_or_ut=prov.instrument.state_or_ut if prov.instrument else None,
                section_number=prov.section_number,
                section_number_norm=prov.section_number_norm,
                section_title=prov.section_title,
                chapter=prov.chapter,
                canonical_text_snippet=text_snippet,
                source_text=prov.source_text,
                canonical_hash=prov.canonical_hash,
                in_force=prov.in_force,
                status=prov.status,
                source_url=prov.source_url,
            )
        )

    return SearchResponse(
        query=q,
        total_matches=total,
        limit=limit,
        offset=offset,
        results=results,
    )
