from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application Settings for Knowledge Base Cruvels."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://localhost:55440/kb_cruvels",
        description="Database connection URL for canonical storage",
    )
    DATABASE_POOL_SIZE: int = Field(default=10, description="Connection pool size")
    DATABASE_MAX_OVERFLOW: int = Field(default=20, description="Max overflow connections")
    DATABASE_ECHO: bool = Field(default=False, description="Echo SQL statements")

    # Storage Paths
    KB_DATA_ROOT: Path = Field(
        default=Path("./data"),
        description="Root directory for manifests, raw data, staging, and checkpoints",
    )

    # API Configuration
    API_HOST: str = Field(default="0.0.0.0", description="Host to bind API server")
    API_PORT: int = Field(default=8000, description="Port to bind API server")
    API_TITLE: str = Field(
        default="Knowledge Base Cruvels - Indian Legal Knowledge Platform",
        description="API title",
    )
    API_VERSION: str = Field(default="v1", description="API version identifier")
    API_PREFIX: str = Field(default="/v1", description="API route prefix")
    DEBUG: bool = Field(default=False, description="Debug mode")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")

    # Upstream Dataset Information
    UPSTREAM_HF_DATASET: str = Field(
        default="vaquill/open-india-law",
        description="HuggingFace dataset repository",
    )
    UPSTREAM_SNAPSHOT: str = Field(
        default="v2026.08",
        description="Upstream snapshot release tag",
    )
    UPSTREAM_COMMIT: str = Field(
        default="58ea6d8b6859f8039ee68dff5af636f787b02463",
        description="Upstream git commit hash",
    )
    HF_TOKEN: str | None = Field(
        default=None,
        description="Optional Hugging Face authentication token for gated downloads",
    )

    # Ingestion Controls
    INGESTION_BATCH_SIZE: int = Field(default=1000, description="Batch size for DB ingestion")
    MAX_WORKERS: int = Field(default=4, description="Max worker threads for downloads")
    VERIFY_HASHES: bool = Field(default=True, description="Strict SHA-256 hash recalculation")
    STRICT_VALIDATION: bool = Field(default=True, description="Quarantine non-conforming rows")

    @property
    def manifests_dir(self) -> Path:
        p = self.KB_DATA_ROOT / "manifests"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def raw_dir(self) -> Path:
        p = self.KB_DATA_ROOT / "raw" / "open-india-law" / self.UPSTREAM_SNAPSHOT
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def staging_dir(self) -> Path:
        p = self.KB_DATA_ROOT / "staging"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def quarantine_dir(self) -> Path:
        p = self.KB_DATA_ROOT / "quarantine"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def checkpoints_dir(self) -> Path:
        p = self.KB_DATA_ROOT / "checkpoints"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def exports_dir(self) -> Path:
        p = self.KB_DATA_ROOT / "exports"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def reports_dir(self) -> Path:
        p = self.KB_DATA_ROOT / "reports"
        p.mkdir(parents=True, exist_ok=True)
        return p


settings = Settings()
