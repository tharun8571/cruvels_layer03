#!/usr/bin/env python3
"""
High-throughput parallel downloader and streaming ingester for Supreme Court Judgments.
Fetches in_supreme-court_judgments.parquet from HuggingFace and ingests into PostgreSQL.
"""

from __future__ import annotations

import hashlib
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timezone
from pathlib import Path

import pyarrow.parquet as pq
import requests
from sqlalchemy.dialects.postgresql import insert

# Ensure workspace src is on path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WORKSPACE_ROOT / "src"))

from kb_cruvels.core.config import settings
from kb_cruvels.database.models.judgments import CourtJudgment
from kb_cruvels.database.session import get_db_context

SC_FILE = "in_supreme-court_judgments.parquet"
TARGET_DIR = WORKSPACE_ROOT / "data" / "raw" / "open-india-law" / "v2026.08" / "judgments"
TARGET_PATH = TARGET_DIR / SC_FILE


def fast_download_sc_parquet(workers: int = 6, chunk_size_mb: int = 16):
    """Download Supreme Court judgments parquet via multi-threaded HTTP Range requests."""
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    if TARGET_PATH.exists() and TARGET_PATH.stat().st_size > 3_000_000_000:
        print(f"Supreme Court parquet already downloaded ({TARGET_PATH.stat().st_size / (1024*1024):.1f} MB). Skipping download.")
        return TARGET_PATH

    temp_path = TARGET_PATH.with_suffix(".tmp")
    url = f"https://huggingface.co/datasets/{settings.UPSTREAM_HF_DATASET}/resolve/main/{SC_FILE}"
    headers = {}
    token = settings.HF_TOKEN or os.environ.get("HF_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    print(f"\n[1/2] Connecting to HuggingFace for {SC_FILE}...")
    r0 = requests.get(url, headers=headers, allow_redirects=False, timeout=30)
    cdn_url = r0.headers.get("Location") or url

    r_head = requests.head(cdn_url, timeout=30)
    total_bytes = int(r_head.headers.get("Content-Length", 0))
    if total_bytes == 0:
        # Fallback to direct GET stream if CDN doesn't give length
        print("Falling back to standard stream...")
        from kb_cruvels.ingestion.download import download_source_file
        return download_source_file(url, TARGET_PATH)

    total_mb = total_bytes / (1024 * 1024)
    print(f"Total file size: {total_bytes:,} bytes ({total_mb:.1f} MB). Allocating disk space...")

    # Pre-allocate sparse/zeroed file
    with open(temp_path, "wb") as f:
        f.truncate(total_bytes)

    chunk_size = chunk_size_mb * 1024 * 1024
    chunks = []
    offset = 0
    idx = 0
    while offset < total_bytes:
        end = min(offset + chunk_size - 1, total_bytes - 1)
        chunks.append((offset, end, idx))
        offset = end + 1
        idx += 1

    print(f"Downloading {len(chunks)} chunks using {workers} parallel workers...")
    downloaded_bytes = 0
    t0 = time.time()
    last_print = time.time()

    def fetch_chunk(item):
        start, end, c_idx = item
        req_headers = {"Range": f"bytes={start}-{end}"}
        resp = requests.get(cdn_url, headers=req_headers, timeout=120)
        resp.raise_for_status()
        with open(temp_path, "r+b") as fp:
            fp.seek(start)
            fp.write(resp.content)
        return len(resp.content)

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(fetch_chunk, ch): ch for ch in chunks}
        for future in as_completed(futures):
            b = future.result()
            downloaded_bytes += b
            if time.time() - last_print >= 5:
                elapsed = time.time() - t0
                speed = (downloaded_bytes / (1024 * 1024)) / elapsed if elapsed > 0 else 0
                pct = (downloaded_bytes / total_bytes) * 100
                print(
                    f"  Downloaded {downloaded_bytes / (1024*1024):.1f} / {total_mb:.1f} MB "
                    f"({pct:.1f}%) @ {speed:.2f} MB/s...",
                    flush=True,
                )
                last_print = time.time()

    elapsed = time.time() - t0
    print(f"\nDownload complete in {elapsed:.1f}s! Renaming to target file...")
    temp_path.replace(TARGET_PATH)
    return TARGET_PATH


def parse_date(val: str | None) -> date | None:
    if not val:
        return None
    try:
        if "-" in val:
            parts = val.split("-")
            if len(parts) == 3 and len(parts[0]) == 4:
                return date(int(parts[0]), int(parts[1]), int(parts[2]))
        elif "/" in val:
            parts = val.split("/")
            if len(parts) == 3:
                return date(int(parts[2]), int(parts[1]), int(parts[0]))
    except Exception:
        pass
    return None


def sanitize_val(v):
    if isinstance(v, str):
        return v.replace("\x00", "")
    if isinstance(v, list):
        return [sanitize_val(x) for x in v]
    if isinstance(v, dict):
        return {k: sanitize_val(val) for k, val in v.items()}
    return v


def commit_judgment_batch(session, cases: list[dict]):
    """Bulk upsert a batch of court judgments into PostgreSQL."""
    if not cases:
        return
    for raw_cdata in cases:
        cdata = {k: sanitize_val(v) for k, v in raw_cdata.items()}
        stmt = insert(CourtJudgment).values(
            id=cdata["id"],
            case_title=cdata["case_title"],
            citation=cdata["citation"],
            alternate_citations=[],
            court=cdata["court"],
            court_type=cdata["court_type"],
            decision_date=cdata["decision_date"],
            decision_year=cdata["decision_year"],
            bench=cdata["bench"],
            coram_size=cdata["coram_size"],
            parties=cdata["parties"],
            subject_area=cdata.get("subject_area", "Constitutional / Statutory Law"),
            legal_issue=f"Adjudication before {cdata['court']}",
            ratio_decidendi=cdata["ratio_decidendi"],
            full_text=cdata["full_text"],
            summary=cdata["summary"],
            status="good_law",
            statutes_cited=[],
            sections_cited=[],
            doctrines_applied=[],
            overruled_cases=[],
            followed_cases=[],
            source_url=cdata.get("source_url"),
            canonical_hash=cdata["canonical_hash"],
            snapshot_version="v2026.08",
            extra_metadata=cdata.get("extra_metadata", {}),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        ).on_conflict_do_update(
            index_elements=["id"],
            set_={
                "case_title": cdata["case_title"],
                "citation": cdata["citation"],
                "court": cdata["court"],
                "decision_date": cdata["decision_date"],
                "decision_year": cdata["decision_year"],
                "full_text": cdata["full_text"],
                "canonical_hash": cdata["canonical_hash"],
                "updated_at": datetime.now(timezone.utc),
            },
        )
        session.execute(stmt)
    session.commit()


def stream_ingest_sc_judgments(file_path: Path, batch_commit_size: int = 500) -> int:
    """Stream and ingest Supreme Court judgments with low memory footprint."""
    print(f"\n[2/2] Streaming and ingesting Supreme Court Judgments into PostgreSQL...")
    parquet_file = pq.ParquetFile(file_path)
    total_rows = parquet_file.metadata.num_rows
    print(f"Total chunks in file: {total_rows:,}")

    ingested_count = 0
    total_chunks_processed = 0

    current_case_id: str | None = None
    current_case_meta: dict | None = None
    current_chunks: list[tuple[int, str]] = []
    cases_batch: list[dict] = []

    with get_db_context() as session:
        for batch in parquet_file.iter_batches(batch_size=5000):
            pydict = batch.to_pydict()
            num_rows = batch.num_rows
            total_chunks_processed += num_rows

            for i in range(num_rows):
                case_id = (
                    pydict.get("case_id", [None])[i]
                    or pydict.get("case_number", [None])[i]
                    or f"case_{total_chunks_processed - num_rows + i}"
                )
                chunk_index = pydict.get("chunk_index", [0])[i] or 0
                chunk_text = pydict.get("text", [""])[i] or pydict.get("text_original", [""])[i] or ""

                if case_id != current_case_id:
                    # Finalize previous case
                    if current_case_id and current_case_meta:
                        current_chunks.sort(key=lambda x: x[0])
                        full_text = "\n\n".join(c[1] for c in current_chunks if c[1])
                        canon_hash = hashlib.sha256(full_text.encode("utf-8")).hexdigest()
                        ratio_excerpt = full_text[:600].replace("\n", " ") + "..." if full_text else "Judgment text."
                        summary_text = (
                            f"Judgment delivered by {current_case_meta['court']}. "
                            f"Disposition: {current_case_meta.get('disposition') or 'Disposed'}."
                        )

                        case_record = {
                            "id": current_case_meta["id"],
                            "case_title": current_case_meta["title"],
                            "citation": current_case_meta["citation"],
                            "court": current_case_meta["court"],
                            "court_type": current_case_meta["court_type"],
                            "decision_date": current_case_meta["decision_date"],
                            "decision_year": current_case_meta["decision_year"],
                            "bench": current_case_meta["bench"],
                            "coram_size": current_case_meta["coram_size"],
                            "parties": current_case_meta["parties"],
                            "subject_area": "Constitutional / Statutory Law",
                            "ratio_decidendi": ratio_excerpt,
                            "full_text": full_text,
                            "summary": summary_text,
                            "source_url": current_case_meta.get("source_url"),
                            "canonical_hash": canon_hash,
                            "extra_metadata": {"disposition": current_case_meta.get("disposition")},
                        }
                        cases_batch.append(case_record)

                        if len(cases_batch) >= batch_commit_size:
                            commit_judgment_batch(session, cases_batch)
                            ingested_count += len(cases_batch)
                            pct_chunks = (total_chunks_processed / total_rows) * 100
                            print(
                                f"  -> Committed {ingested_count:,} Supreme Court cases "
                                f"({total_chunks_processed:,} / {total_rows:,} chunks, {pct_chunks:.1f}%)...",
                                flush=True,
                            )
                            cases_batch = []

                    # Start new case
                    title = pydict.get("title", [None])[i] or f"Judgment_{case_id}"
                    court = pydict.get("court", [None])[i] or "Supreme Court of India"
                    court_type = "supreme_court"
                    bench = pydict.get("bench", [None])[i]
                    judges = pydict.get("judges", [[]])[i] or []
                    if isinstance(judges, str):
                        judges = [judges]
                    elif hasattr(judges, "tolist"):
                        judges = judges.tolist()

                    petitioner = pydict.get("petitioner", [None])[i]
                    respondent = pydict.get("respondent", [None])[i]
                    citation = pydict.get("citation", [None])[i] or f"{court} ({pydict.get('year', [None])[i]})"
                    dec_date = parse_date(pydict.get("decision_date", [None])[i])
                    year_val = pydict.get("year", [None])[i]
                    if not year_val and dec_date:
                        year_val = dec_date.year

                    disposition = pydict.get("disposition", [None])[i]
                    source_url = pydict.get("source_url", [None])[i]

                    key = f"SC_{case_id}_{title[:40]}"
                    case_db_id = f"jdg_sc_{hashlib.sha256(key.encode()).hexdigest()[:14]}"

                    current_case_id = case_id
                    current_case_meta = {
                        "id": case_db_id,
                        "title": title,
                        "citation": citation,
                        "court": court,
                        "court_type": court_type,
                        "decision_date": dec_date,
                        "decision_year": int(year_val) if year_val else (dec_date.year if dec_date else None),
                        "bench": judges if judges else ([bench] if bench else []),
                        "coram_size": len(judges) if judges else (1 if bench else 1),
                        "parties": {
                            "petitioner": petitioner or "Petitioner",
                            "respondent": respondent or "Respondent",
                        },
                        "disposition": disposition,
                        "source_url": source_url,
                    }
                    current_chunks = [(chunk_index, chunk_text)]
                else:
                    current_chunks.append((chunk_index, chunk_text))

        # Final flush
        if current_case_id and current_case_meta:
            current_chunks.sort(key=lambda x: x[0])
            full_text = "\n\n".join(c[1] for c in current_chunks if c[1])
            canon_hash = hashlib.sha256(full_text.encode("utf-8")).hexdigest()
            ratio_excerpt = full_text[:600].replace("\n", " ") + "..." if full_text else "Judgment text."
            summary_text = (
                f"Judgment delivered by {current_case_meta['court']}. "
                f"Disposition: {current_case_meta.get('disposition') or 'Disposed'}."
            )
            case_record = {
                "id": current_case_meta["id"],
                "case_title": current_case_meta["title"],
                "citation": current_case_meta["citation"],
                "court": current_case_meta["court"],
                "court_type": current_case_meta["court_type"],
                "decision_date": current_case_meta["decision_date"],
                "decision_year": current_case_meta["decision_year"],
                "bench": current_case_meta["bench"],
                "coram_size": current_case_meta["coram_size"],
                "parties": current_case_meta["parties"],
                "subject_area": "Constitutional / Statutory Law",
                "ratio_decidendi": ratio_excerpt,
                "full_text": full_text,
                "summary": summary_text,
                "source_url": current_case_meta.get("source_url"),
                "canonical_hash": canon_hash,
                "extra_metadata": {"disposition": current_case_meta.get("disposition")},
            }
            cases_batch.append(case_record)

        if cases_batch:
            commit_judgment_batch(session, cases_batch)
            ingested_count += len(cases_batch)

    print(f"\nSuccessfully ingested {ingested_count:,} Supreme Court judgments!")
    return ingested_count


def main():
    print("=" * 70)
    print("KNOWLEDGE BASE CRUVELS: SUPREME COURT JUDGMENTS PIPELINE")
    print("=" * 70)
    parquet_path = fast_download_sc_parquet(workers=6, chunk_size_mb=16)
    count = stream_ingest_sc_judgments(parquet_path, batch_commit_size=500)
    print("\n" + "=" * 70)
    print(f"PIPELINE COMPLETE: {count:,} Supreme Court Judgments committed to Knowledge Base.")
    print("=" * 70)


if __name__ == "__main__":
    main()
