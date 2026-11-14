"""FastAPI routes for Phase 1 entities: Doctrines, Definitions, Procedures, Forms, Templates, Notifications, Cross-References."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from kb_cruvels.api.dependencies import get_db
from kb_cruvels.api.schemas.phase1 import (
    CrossReferenceResponse,
    DefinitionResponse,
    DoctrineResponse,
    FormResponse,
    NotificationResponse,
    ProcedureResponse,
    TemplateResponse,
)
from kb_cruvels.database.repositories.phase1_repos import (
    CrossReferenceRepository,
    DefinitionRepository,
    DoctrineRepository,
    NotificationRepository,
    ProcedureRepository,
    TemplateRepository,
)

doctrines_router = APIRouter(prefix="/v1/doctrines", tags=["Legal Doctrines & Principles"])
definitions_router = APIRouter(prefix="/v1/definitions", tags=["Legal Definitions"])
procedures_router = APIRouter(prefix="/v1/procedures", tags=["Legal Procedures"])
forms_router = APIRouter(prefix="/v1/forms", tags=["Legal Forms & Applications"])
templates_router = APIRouter(prefix="/v1/templates", tags=["Document & Contract Templates"])
notifications_router = APIRouter(prefix="/v1/notifications", tags=["Government Notifications"])
cross_references_router = APIRouter(prefix="/v1/cross-references", tags=["Citation & Cross-References"])


# --- DOCTRINES ---
@doctrines_router.get("", response_model=list[DoctrineResponse])
def list_doctrines(
    query: str | None = Query(None, description="Search term in doctrine name or explanation"),
    category: str | None = Query(None, description="Filter category"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[DoctrineResponse]:
    repo = DoctrineRepository(db)
    items, _ = repo.search(query=query, category=category, limit=limit)
    return [DoctrineResponse.model_validate(d) for d in items]


@doctrines_router.get("/{doctrine_id}", response_model=DoctrineResponse)
def get_doctrine_by_id(doctrine_id: str, db: Session = Depends(get_db)) -> DoctrineResponse:
    repo = DoctrineRepository(db)
    doc = repo.get_by_id(doctrine_id) or repo.get_by_name(doctrine_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Doctrine '{doctrine_id}' not found.")
    return DoctrineResponse.model_validate(doc)


# --- DEFINITIONS ---
@definitions_router.get("", response_model=list[DefinitionResponse])
def list_definitions(
    query: str | None = Query(None, description="Search term"),
    domain: str | None = Query(None, description="Legal domain filter"),
    act: str | None = Query(None, description="Source act title filter"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[DefinitionResponse]:
    repo = DefinitionRepository(db)
    items, _ = repo.search(query=query, domain=domain, act_title=act, limit=limit)
    return [DefinitionResponse.model_validate(d) for d in items]


@definitions_router.get("/{term}", response_model=list[DefinitionResponse])
def get_definitions_by_term(term: str, act: str | None = None, db: Session = Depends(get_db)) -> list[DefinitionResponse]:
    repo = DefinitionRepository(db)
    items = repo.get_by_term(term, act_title=act)
    if not items:
        # Fallback to id check
        single = repo.get_by_id(term)
        if single:
            return [DefinitionResponse.model_validate(single)]
        raise HTTPException(status_code=404, detail=f"Definition for term '{term}' not found.")
    return [DefinitionResponse.model_validate(d) for d in items]


# --- PROCEDURES ---
@procedures_router.get("", response_model=list[ProcedureResponse])
def list_procedures(
    category: str | None = Query(None, description="Category filter (civil, criminal, bail, writ, etc.)"),
    db: Session = Depends(get_db),
) -> list[ProcedureResponse]:
    repo = ProcedureRepository(db)
    items = repo.list_all(category=category)
    return [ProcedureResponse.model_validate(p) for p in items]


@procedures_router.get("/{procedure_id}", response_model=ProcedureResponse)
def get_procedure_by_id(procedure_id: str, db: Session = Depends(get_db)) -> ProcedureResponse:
    repo = ProcedureRepository(db)
    proc = repo.get_by_id(procedure_id) or repo.get_by_name(procedure_id)
    if not proc:
        raise HTTPException(status_code=404, detail=f"Procedure '{procedure_id}' not found.")
    return ProcedureResponse.model_validate(proc)


# --- FORMS ---
@forms_router.get("", response_model=list[FormResponse])
def list_forms(
    category: str | None = Query(None, description="Category filter (bail, writ, notice, etc.)"),
    db: Session = Depends(get_db),
) -> list[FormResponse]:
    repo = TemplateRepository(db)
    items = repo.list_forms(category=category)
    return [FormResponse.model_validate(f) for f in items]


@forms_router.get("/{form_id}", response_model=FormResponse)
def get_form_by_id(form_id: str, db: Session = Depends(get_db)) -> FormResponse:
    repo = TemplateRepository(db)
    f = repo.get_form_by_id(form_id)
    if not f:
        raise HTTPException(status_code=404, detail=f"Form '{form_id}' not found.")
    return FormResponse.model_validate(f)


# --- TEMPLATES ---
@templates_router.get("", response_model=list[TemplateResponse])
def list_templates(
    category: str | None = Query(None, description="Category filter (commercial, employment, etc.)"),
    db: Session = Depends(get_db),
) -> list[TemplateResponse]:
    repo = TemplateRepository(db)
    items = repo.list_templates(category=category)
    return [TemplateResponse.model_validate(t) for t in items]


@templates_router.get("/{template_id}", response_model=TemplateResponse)
def get_template_by_id(template_id: str, db: Session = Depends(get_db)) -> TemplateResponse:
    repo = TemplateRepository(db)
    t = repo.get_template_by_id(template_id)
    if not t:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found.")
    return TemplateResponse.model_validate(t)


# --- NOTIFICATIONS ---
@notifications_router.get("", response_model=list[NotificationResponse])
def list_notifications(
    authority: str | None = Query(None, description="Issuing authority (RBI, SEBI, CERT_IN, etc.)"),
    query: str | None = Query(None, description="Search keywords"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[NotificationResponse]:
    repo = NotificationRepository(db)
    items, _ = repo.search(authority=authority, query=query, limit=limit)
    return [NotificationResponse.model_validate(n) for n in items]


@notifications_router.get("/{notif_id}", response_model=NotificationResponse)
def get_notification_by_id(notif_id: str, db: Session = Depends(get_db)) -> NotificationResponse:
    repo = NotificationRepository(db)
    n = repo.get_by_id(notif_id)
    if not n:
        raise HTTPException(status_code=404, detail=f"Notification '{notif_id}' not found.")
    return NotificationResponse.model_validate(n)


# --- CROSS REFERENCES ---
@cross_references_router.get("", response_model=list[CrossReferenceResponse])
def search_cross_references(
    source_type: str | None = Query(None, description="Source entity type (judgment, provision, doctrine, etc.)"),
    source_id: str | None = Query(None, description="Source ID"),
    target_type: str | None = Query(None, description="Target entity type"),
    relationship_type: str | None = Query(None, description="Relationship type (interprets, establishes, etc.)"),
    db: Session = Depends(get_db),
) -> list[CrossReferenceResponse]:
    repo = CrossReferenceRepository(db)
    if source_type and source_id:
        items = repo.get_links_for_source(source_type, source_id)
    else:
        items = repo.search_links(source_type=source_type, target_type=target_type, rel_type=relationship_type)
    return [CrossReferenceResponse.model_validate(x) for x in items]
