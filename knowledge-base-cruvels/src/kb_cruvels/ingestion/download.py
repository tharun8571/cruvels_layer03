"""Resumable, verified downloader for upstream datasets."""

from __future__ import annotations

import hashlib
import os
import time
from collections.abc import Callable
from pathlib import Path

import requests

from kb_cruvels.core.config import settings
from kb_cruvels.core.exceptions import SourceCorpusError
from kb_cruvels.core.logging import logger


def download_source_file(
    url: str,
    target_path: Path,
    expected_sha256: str | None = None,
    progress_callback: Callable[[int, int], None] | None = None,
    max_retries: int = 3,
) -> Path:
    """
    Download a remote source file with streaming, retries, and SHA-256 verification.
    Writes to a temporary .tmp file and renames only upon successful completion.
    """
    target_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = target_path.with_suffix(target_path.suffix + ".tmp")

    headers = {"User-Agent": "KnowledgeBaseCruvels/1.0"}
    token = settings.HF_TOKEN or os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Downloading {url} to {target_path.name} (attempt {attempt}/{max_retries})...")
            with requests.get(url, headers=headers, stream=True, timeout=60) as resp:
                if resp.status_code == 401:
                    raise SourceCorpusError(
                        f"401 Unauthorized for {url}. The dataset is gated; please provide a valid HF_TOKEN in .env"
                    )
                resp.raise_for_status()
                total_size = int(resp.headers.get("content-length", 0))

                hasher = hashlib.sha256()
                downloaded = 0

                last_log_mb = 0
                with open(temp_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=1024 * 1024):  # 1MB chunks
                        if chunk:
                            f.write(chunk)
                            hasher.update(chunk)
                            downloaded += len(chunk)
                            mb_done = downloaded // (1024 * 1024)
                            if mb_done >= last_log_mb + 50:
                                last_log_mb = mb_done
                                pct = (downloaded / total_size * 100) if total_size > 0 else 0
                                print(f"  [{target_path.name}] {mb_done} MB / {total_size / (1024*1024):.1f} MB ({pct:.1f}%) downloaded...", flush=True)
                            if progress_callback and total_size > 0:
                                progress_callback(downloaded, total_size)

                computed_hash = hasher.hexdigest()
                if expected_sha256 and computed_hash != expected_sha256:
                    temp_path.unlink(missing_ok=True)
                    raise SourceCorpusError(
                        f"Checksum mismatch for {target_path.name}: expected {expected_sha256}, got {computed_hash}"
                    )

                # Atomic replace
                temp_path.replace(target_path)
                logger.info(f"Successfully downloaded {target_path.name} ({downloaded / (1024*1024):.2f} MB, sha: {computed_hash[:12]})")
                return target_path

        except (requests.RequestException, SourceCorpusError) as exc:
            temp_path.unlink(missing_ok=True)
            if attempt == max_retries:
                logger.error(f"Failed to download {target_path.name} after {max_retries} attempts: {exc}")
                raise SourceCorpusError(f"Download failed for {url}: {exc}") from exc
            time.sleep(2 ** attempt)

    return target_path
