"""Knowledge Base Cruvels API route module exports."""

from kb_cruvels.api.routes.health import router as health_router
from kb_cruvels.api.routes.instruments import router as instruments_router
from kb_cruvels.api.routes.judgments import router as judgments_router
from kb_cruvels.api.routes.metadata import router as metadata_router
from kb_cruvels.api.routes.phase1_routes import (
    cross_references_router,
    definitions_router,
    doctrines_router,
    forms_router,
    notifications_router,
    procedures_router,
    templates_router,
)
from kb_cruvels.api.routes.provisions import router as provisions_router
from kb_cruvels.api.routes.search import router as search_router

__all__ = [
    "cross_references_router",
    "definitions_router",
    "doctrines_router",
    "forms_router",
    "health_router",
    "instruments_router",
    "judgments_router",
    "metadata_router",
    "notifications_router",
    "procedures_router",
    "provisions_router",
    "search_router",
    "templates_router",
]
