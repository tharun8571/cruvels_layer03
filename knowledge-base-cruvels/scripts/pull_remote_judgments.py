"""Pull and ingest authentic court judgments from remote HuggingFace parquet files into Knowledge Base Cruvels."""

from __future__ import annotations

import hashlib
import json
import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path

import pyarrow.parquet as pq
from sqlalchemy.dialects.postgresql import insert

# Ensure src is on path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WORKSPACE_ROOT / "src"))

from kb_cruvels.core.config import settings
from kb_cruvels.core.logging import logger
from kb_cruvels.database.models.judgments import CourtJudgment
from kb_cruvels.database.session import get_db_context
from kb_cruvels.ingestion.download import download_source_file

# Targeted partitions
REMOTE_JUDGMENT_FILES = [
    "in_supreme-court_judgments.parquet",
]


def parse_date(val: str | None) -> date | None:
    if not val:
        return None
    try:
        # Standard formats in dataset: YYYY-MM-DD or DD/MM/YYYY
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


def commit_judgment_batch(session, cases: list[dict]):
    """Bulk upsert a batch of parsed court judgments into PostgreSQL."""
    if not cases:
        return
    for cdata in cases:
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


def ingest_judgment_parquet(file_path: Path, batch_commit_size: int = 500) -> int:
    """Stream and ingest judgments from parquet with bounded memory."""
    print(f"\n[Parquet Reader] Inspecting {file_path.name}...")
    parquet_file = pq.ParquetFile(file_path)
    total_rows = parquet_file.metadata.num_rows
    print(f"Total chunks in {file_path.name}: {total_rows:,}")

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
                    # Finalize previous case if present
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
                            print(f"  -> Committed {ingested_count:,} judgments ({total_chunks_processed:,} / {total_rows:,} chunks processed)...", flush=True)
                            cases_batch = []

                    # Start new case
                    title = pydict.get("title", [None])[i] or f"Judgment_{case_id}"
                    court = pydict.get("court", [None])[i] or "Supreme Court of India"
                    court_type = pydict.get("court_type", [None])[i] or "supreme_court"
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

                    key = f"{court}_{case_id}_{title[:40]}"
                    case_db_id = f"jdg_{hashlib.sha256(key.encode()).hexdigest()[:16]}"

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

    print(f"\nSuccessfully ingested {ingested_count:,} judgments from {file_path.name}.")
    return ingested_count


def pull_and_ingest_remote_judgments():
    base_dir = Path("data/raw/open-india-law/v2026.08/judgments")
    base_dir.mkdir(parents=True, exist_ok=True)

    total_ingested = 0
    for fname in REMOTE_JUDGMENT_FILES:
        target_path = base_dir / fname
        url = f"https://huggingface.co/datasets/vaquill/open-india-law/resolve/main/{fname}"

        if not target_path.exists():
            print(f"\n[1/2] Downloading {fname} from HuggingFace...")
            download_source_file(url, target_path)
        else:
            print(f"\n[1/2] {fname} already downloaded.")

        print(f"[2/2] Ingesting {fname} into database...")
        count = ingest_judgment_parquet(target_path)
        total_ingested += count

    print(f"\n=== COMPLETED REMOTE JUDGMENTS INGESTION: {total_ingested:,} TOTAL CASES INGESTED ===")


if __name__ == "__main__":
    pull_and_ingest_remote_judgments()
