"""FastAPI routes for Landmark Judgments."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from kb_cruvels.api.dependencies import get_db
from kb_cruvels.api.schemas.judgments import (
    JudgmentDetailResponse,
    JudgmentResponse,
    JudgmentSearchResponse,
)
from kb_cruvels.database.repositories.judgment_repo import JudgmentRepository

router = APIRouter(prefix="/v1/judgments", tags=["Judgments"])


@router.get("", response_model=JudgmentSearchResponse)
def list_and_search_judgments(
    query: str | None = Query(None, description="Search query string"),
    subject: str | None = Query(None, description="Filter by subject area (Constitutional, Criminal, etc.)"),
    court: str | None = Query(None, description="Filter by Court (Supreme Court of India, etc.)"),
    status: str | None = Query(None, description="Filter by legal status (good_law, overruled)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> JudgmentSearchResponse:
    repo = JudgmentRepository(db)
    items, total = repo.search_judgments(
        query=query,
        subject_area=subject,
        court=court,
        status=status,
        limit=limit,
        offset=offset,
    )
    return JudgmentSearchResponse(
        items=[JudgmentResponse.model_validate(j) for j in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{judgment_id}", response_model=JudgmentDetailResponse)
def get_judgment_details(
    judgment_id: str,
    db: Session = Depends(get_db),
) -> JudgmentDetailResponse:
    repo = JudgmentRepository(db)
    judgment = repo.get_by_id(judgment_id)
    if not judgment:
        judgment = repo.get_by_citation(judgment_id)
    if not judgment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Judgment with ID or citation '{judgment_id}' not found.",
        )
    return JudgmentDetailResponse.model_validate(judgment)
