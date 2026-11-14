"""Discovery utilities for local and remote dataset partitions."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from kb_cruvels.core.config import settings
from kb_cruvels.sources.open_india_law.manifest import (
    build_manifest_data,
)


def discover_available_files(raw_dir: Path | None = None) -> list[dict[str, Any]]:
    """
    Compare local files present in raw_dir against the upstream manifest.
    Returns status of each file (downloaded, missing, size, expected rows).
    """
    base_dir = raw_dir or settings.raw_dir
    manifest = build_manifest_data(settings.UPSTREAM_SNAPSHOT)

    discovered = []
    for item in manifest["legislation_files"]:
        filename = item["filename"]
        local_path = base_dir / filename
        exists = local_path.exists()
        local_size_bytes = local_path.stat().st_size if exists else 0
        local_size_mb = round(local_size_bytes / (1024 * 1024), 2)

        discovered.append({
            "filename": filename,
            "jurisdiction": item["jurisdiction"],
            "state_or_ut": item["state_or_ut"],
            "expected_rows": item["expected_rows"],
            "expected_size_mb": item["size_mb"],
            "local_exists": exists,
            "local_path": str(local_path) if exists else None,
            "local_size_mb": local_size_mb,
            "download_url": item["download_url"],
        })

    return discovered
