"""Database engine configuration and connection management."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base

from kb_cruvels.core.config import settings

Base = declarative_base()


def get_db_engine(db_url: str | None = None) -> Engine:
    """Create a SQLAlchemy engine tailored for PostgreSQL or SQLite."""
    url = db_url or settings.DATABASE_URL

    if url.startswith("sqlite"):
        engine = create_engine(
            url,
            connect_args={"check_same_thread": False},
            echo=settings.DATABASE_ECHO,
        )
    else:
        # PostgreSQL with psycopg2
        engine = create_engine(
            url,
            pool_size=settings.DATABASE_POOL_SIZE,
            max_overflow=settings.DATABASE_MAX_OVERFLOW,
            pool_pre_ping=True,
            echo=settings.DATABASE_ECHO,
        )

    return engine


engine = get_db_engine()
