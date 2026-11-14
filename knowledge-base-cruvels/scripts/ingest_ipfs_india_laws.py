#!/usr/bin/env python3
"""CLI driver for ingesting endomorphosis/ipfs_india_laws into kb_cruvels PostgreSQL."""

from __future__ import annotations

import argparse
import logging
import sys
import time
import urllib.request
from pathlib import Path

import duckdb
from rich.console import Console
from rich.progress import BarColumn, Progress, SpinnerColumn, TextColumn, TimeRemainingColumn
from rich.table import Table

# Add src to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from kb_cruvels.database.session import SessionLocal
from kb_cruvels.sources.ipfs_india_laws.adapter import IpfsIndiaLawsAdapter
from kb_cruvels.sources.ipfs_india_laws.importer import IpfsIndiaLawsImporter

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest_ipfs")

console = Console()

HF_BASE_URL = "https://huggingface.co/datasets/endomorphosis/ipfs_india_laws/resolve/main/data"
DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "raw" / "ipfs-india-laws"


def download_file_if_missing(filename: str) -> Path:
    """Download a file from Hugging Face if not already present locally."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    local_path = DATA_DIR / filename
    if local_path.exists() and local_path.stat().st_size > 0:
        logger.info(f"Using cached file: {local_path} ({local_path.stat().st_size / 1024 / 1024:.2f} MB)")
        return local_path

    url = f"{HF_BASE_URL}/{filename}"
    logger.info(f"Downloading {filename} from {url}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req) as resp, open(local_path, "wb") as out_f:
        chunk_size = 1024 * 1024
        while chunk := resp.read(chunk_size):
            out_f.write(chunk)

    logger.info(f"Downloaded {filename} ({local_path.stat().st_size / 1024 / 1024:.2f} MB)")
    return local_path


def run_ingestion(
    act_filter: str | None = None,
    limit: int | None = None,
    dry_run: bool = False,
    batch_size: int = 500,
):
    """Execute deduplicating ingestion pipeline."""
    start_time = time.time()
    console.print("\n[bold cyan]Starting Ingestion from endomorphosis/ipfs_india_laws[/bold cyan]")

    laws_file = download_file_if_missing("laws.parquet")
    articles_file = download_file_if_missing("articles.parquet")

    con = duckdb.connect()

    # Query laws
    laws_query = f"SELECT * FROM '{laws_file}'"
    if act_filter:
        laws_query += f" WHERE lower(title) LIKE '%{act_filter.lower().strip()}%'"
    if limit:
        laws_query += f" LIMIT {limit}"

    console.print("[cyan]Indexing articles into memory for fast joins...[/cyan]")
    con.execute(f"CREATE TEMP TABLE articles AS SELECT * FROM '{articles_file}'")
    con.execute("CREATE INDEX idx_art_law ON articles(law_id)")

    laws_cursor = con.execute(laws_query)
    law_cols = [desc[0] for desc in con.description]
    laws = [dict(zip(law_cols, row)) for row in laws_cursor.fetchall()]

    console.print(f"[green]Found {len(laws)} legal instrument(s) matching criteria.[/green]")
    if not laws:
        return

    db = SessionLocal()
    adapter = IpfsIndiaLawsAdapter()
    importer = IpfsIndiaLawsImporter(db, adapter)

    metrics = {
        "laws_processed": 0,
        "instruments_reused": 0,
        "instruments_created": 0,
        "preambles_created": 0,
        "preambles_updated": 0,
        "preambles_skipped": 0,
        "provisions_skipped": 0,
        "provisions_updated": 0,
        "provisions_created": 0,
        "nodes_created": 0,
    }

    try:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeRemainingColumn(),
            console=console,
        ) as progress:
            task = progress.add_task("Ingesting Acts...", total=len(laws))

            for law_row in laws:
                law_id = law_row["id"]
                law_title = law_row.get("title", "Unknown")

                if not dry_run:
                    instrument, is_new = importer.match_or_create_instrument(law_row)
                    if is_new:
                        metrics["instruments_created"] += 1
                    else:
                        metrics["instruments_reused"] += 1
                    active_inst_id = instrument.id
                    existing_map = importer.get_existing_provisions_map(active_inst_id)

                    # Upsert Preamble from laws.parquet text & metadata
                    _, p_action, p_nodes = importer.upsert_preamble(
                        active_inst_id,
                        law_row,
                        existing_map=existing_map,
                    )
                    if p_action == "CREATED":
                        metrics["preambles_created"] += 1
                        metrics["provisions_created"] += 1
                    elif p_action == "UPDATED":
                        metrics["preambles_updated"] += 1
                        metrics["provisions_updated"] += 1
                    elif p_action == "SKIPPED":
                        metrics["preambles_skipped"] += 1
                    metrics["nodes_created"] += p_nodes
                else:
                    active_inst_id = "dry_run_id"
                    existing_map = None

                # Fetch articles for this law from indexed table
                art_query = f"SELECT * FROM articles WHERE law_id = '{law_id}' ORDER BY try_cast(article_number as int), article_number"
                art_cursor = con.execute(art_query)
                art_cols = [desc[0] for desc in con.description]
                articles = [dict(zip(art_cols, row)) for row in art_cursor.fetchall()]

                for art_row in articles:
                    if not dry_run:
                        _, action, node_count = importer.upsert_provision(active_inst_id, art_row, existing_map=existing_map)
                        if action == "SKIPPED":
                            metrics["provisions_skipped"] += 1
                        elif action == "UPDATED":
                            metrics["provisions_updated"] += 1
                        elif action == "CREATED":
                            metrics["provisions_created"] += 1
                        metrics["nodes_created"] += node_count

                if not dry_run and (metrics["laws_processed"] % 20 == 0):
                    db.commit()

                metrics["laws_processed"] += 1
                progress.update(task, advance=1, description=f"Ingesting: {law_title[:35]}...")

            if not dry_run:
                db.commit()

    except Exception as exc:
        if not dry_run:
            db.rollback()
        logger.error(f"Error during ingestion: {exc}", exc_info=True)
        raise
    finally:
        db.close()

    elapsed = time.time() - start_time
    table = Table(title="Ingestion & Deduplication Summary")
    table.add_column("Metric", style="cyan", no_wrap=True)
    table.add_column("Count", style="magenta")

    table.add_row("Total Acts Processed", str(metrics["laws_processed"]))
    table.add_row("Instruments Matched / Reused (No Duplicates)", str(metrics["instruments_reused"]))
    table.add_row("New Instruments Created", str(metrics["instruments_created"]))
    table.add_row("Preambles Created", str(metrics["preambles_created"]))
    table.add_row("Preambles Updated / Enriched", str(metrics["preambles_updated"]))
    table.add_row("Preambles Skipped (Already Identical)", str(metrics["preambles_skipped"]))
    table.add_row("Total Provisions Skipped (Already Identical)", str(metrics["provisions_skipped"]))
    table.add_row("Total Provisions Updated / Repaired in-place", str(metrics["provisions_updated"]))
    table.add_row("Total New Provisions Created", str(metrics["provisions_created"]))
    table.add_row("Structural AST Nodes Generated", str(metrics["nodes_created"]))
    table.add_row("Elapsed Time", f"{elapsed:.2f} seconds")

    console.print(table)
    console.print("[bold green]Ingestion completed with zero duplicate data![/bold green]\n")


def main():
    parser = argparse.ArgumentParser(description="Ingest IPFS India Laws into PostgreSQL with deduplication.")
    parser.add_argument("--act-filter", type=str, default=None, help="Filter by act title substring (e.g., 'securitisation')")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of acts to process")
    parser.add_argument("--dry-run", action="store_true", help="Perform dry run without committing")
    parser.add_argument("--batch-size", type=int, default=500, help="Commit batch size")
    args = parser.parse_args()

    run_ingestion(
        act_filter=args.act_filter,
        limit=args.limit,
        dry_run=args.dry_run,
        batch_size=args.batch_size,
    )


if __name__ == "__main__":
    main()
