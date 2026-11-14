"""Knowledge Base Cruvels - Standalone Indian Legal Knowledge Platform API."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from kb_cruvels.api.routes import (
    cross_references_router,
    definitions_router,
    doctrines_router,
    forms_router,
    health_router,
    instruments_router,
    judgments_router,
    metadata_router,
    notifications_router,
    procedures_router,
    provisions_router,
    search_router,
    templates_router,
)
from kb_cruvels.api.schemas.errors import ErrorResponse
from kb_cruvels.core.config import settings
from kb_cruvels.core.exceptions import (
    InstrumentNotFoundError,
    KBCruvelsException,
    ProvisionNotFoundError,
    ValidationError,
)
from kb_cruvels.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.API_TITLE} {settings.API_VERSION} (Phase 1 Complete)...")
    yield
    logger.info(f"Shutting down {settings.API_TITLE}...")

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=(
        "Production-grade, standalone Indian Legal Knowledge Platform serving verbatim "
        "Central, State, and Union Territory statutory legislation, Landmark Judgments, "
        "Legal Doctrines, Definitions, Procedures, Forms, Templates, and Government Notifications."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Enable Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(health_router)
app.include_router(metadata_router)
app.include_router(instruments_router)
app.include_router(provisions_router)
app.include_router(search_router)

# Phase 1 Domain Routes
app.include_router(judgments_router)
app.include_router(doctrines_router)
app.include_router(definitions_router)
app.include_router(procedures_router)
app.include_router(forms_router)
app.include_router(templates_router)
app.include_router(notifications_router)
app.include_router(cross_references_router)


# Global Exception Handlers
@app.exception_handler(InstrumentNotFoundError)
async def handle_instrument_not_found(request: Request, exc: InstrumentNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=ErrorResponse(
            error="InstrumentNotFound",
            message=exc.message,
        ).model_dump(),
    )


@app.exception_handler(ProvisionNotFoundError)
async def handle_provision_not_found(request: Request, exc: ProvisionNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=ErrorResponse(
            error="ProvisionNotFound",
            message=exc.message,
        ).model_dump(),
    )


@app.exception_handler(ValidationError)
async def handle_validation_error(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="ValidationError",
            message=exc.message,
        ).model_dump(),
    )


@app.exception_handler(KBCruvelsException)
async def handle_kb_exception(request: Request, exc: KBCruvelsException):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="KBCruvelsError",
            message=exc.message,
        ).model_dump(),
    )
