"""Unified CLI Interface for Knowledge Base Cruvels Phase 1."""

from __future__ import annotations

from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from kb_cruvels.core.config import settings
from kb_cruvels.data.curated_seed import seed_phase1_curated_data
from kb_cruvels.database.repositories.judgment_repo import JudgmentRepository
from kb_cruvels.database.repositories.phase1_repos import (
    DoctrineRepository,
    ProcedureRepository,
    TemplateRepository,
)
from kb_cruvels.database.session import get_db_context
from kb_cruvels.ingestion.discover import discover_available_files
from kb_cruvels.ingestion.orchestrator import IngestionOrchestrator
from kb_cruvels.services.provision_service import ProvisionService
from kb_cruvels.services.search_service import SearchService
from kb_cruvels.sources.open_india_law.manifest import (
    save_source_manifest,
)
from kb_cruvels.verification.source_reconciliation import reconcile_corpus_counts
from kb_cruvels.verification.synthetic_content import audit_synthetic_content
from kb_cruvels.verification.text_integrity import audit_text_integrity

app = typer.Typer(
    name="kb-cruvels",
    help="Knowledge Base Cruvels - Standalone Indian Legal Knowledge Platform CLI",
    add_completion=False,
)
console = Console()

dataset_app = typer.Typer(help="Inspect and generate dataset source manifests")
db_app = typer.Typer(help="Database operations and migrations")
ingest_app = typer.Typer(help="Ingest and process Indian legislation")
audit_app = typer.Typer(help="Audit corpus integrity and source reconciliation")
search_cli_app = typer.Typer(help="Exact resolution and full-text search")
judgments_app = typer.Typer(help="Search and view landmark judgments")
doctrines_app = typer.Typer(help="Search and view legal doctrines & principles")
definitions_app = typer.Typer(help="Search structured legal definitions")
procedures_app = typer.Typer(help="View step-by-step legal procedures")
forms_app = typer.Typer(help="View and export court forms & templates")
api_app = typer.Typer(help="API server operations")

app.add_typer(dataset_app, name="dataset")
app.add_typer(db_app, name="db")
app.add_typer(ingest_app, name="ingest")
app.add_typer(audit_app, name="audit")
app.add_typer(search_cli_app, name="search")
app.add_typer(judgments_app, name="judgments")
app.add_typer(doctrines_app, name="doctrines")
app.add_typer(definitions_app, name="definitions")
app.add_typer(procedures_app, name="procedures")
app.add_typer(forms_app, name="forms")
app.add_typer(api_app, name="api")


# --- DATASET COMMANDS ---
@dataset_app.command("inspect")
def inspect_dataset():
    """Inspect local dataset files vs upstream manifest."""
    files = discover_available_files()
    table = Table(title=f"Open India Law Snapshot {settings.UPSTREAM_SNAPSHOT} - Discovered Partitions")
    table.add_column("Filename", style="cyan")
    table.add_column("Jurisdiction", style="green")
    table.add_column("State/UT", style="blue")
    table.add_column("Expected Rows", justify="right")
    table.add_column("Exp. Size (MB)", justify="right")
    table.add_column("Local Status", style="bold")

    for f in files:
        status_style = "[green]Downloaded[/green]" if f["local_exists"] else "[red]Missing[/red]"
        table.add_row(
            f["filename"],
            f["jurisdiction"],
            f["state_or_ut"] or "Central",
            f"{f['expected_rows']:,}",
            f"{f['expected_size_mb']}",
            status_style,
        )
    console.print(table)


@dataset_app.command("manifest")
def generate_manifest(output: Path = Path("data/manifests/source_manifest.json")):
    """Regenerate source manifest JSON."""
    save_source_manifest(output_path=output)
    console.print(f"[green]Manifest generated successfully at:[/green] {output}")


# --- INGESTION COMMANDS ---
@ingest_app.command("run")
def run_ingestion(
    jurisdiction: str | None = typer.Option(None, "--jurisdiction", "-j", help="Filter: central, state, union_territory"),
    state_or_ut: str | None = typer.Option(None, "--state", "-s", help="Filter by specific state/UT slug"),
    batch_size: int = typer.Option(1000, "--batch-size", "-b", help="Batch size for DB commit"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Simulate without database writes"),
    limit: int = typer.Option(0, "--limit", "-l", help="Limit records to process for quick testing"),
):
    """Execute streaming ingestion of Indian primary legislation."""
    with get_db_context() as db:
        orchestrator = IngestionOrchestrator(db_session=db, batch_size=batch_size)
        results = orchestrator.run(
            jurisdiction=jurisdiction,
            state_or_ut=state_or_ut,
            dry_run=dry_run,
            limit_records=limit,
        )
        console.print("\n[bold green]=== INGESTION SUMMARY ===[/bold green]")
        console.print(f"Total Processed: {results['total_records_processed']:,}")
        console.print(f"Total Committed: {results['total_records_committed']:,}")
        console.print(f"Total Quarantined: {results['total_quarantined']:,}")
        console.print(f"Total Time: {results['total_time_seconds']}s")


@ingest_app.command("seed-phase1")
def seed_curated():
    """Seed all Phase 1 curated entities (Judgments, Doctrines, Definitions, Procedures, Forms, Templates, Notifications)."""
    with get_db_context() as db:
        counts = seed_phase1_curated_data(db)
        console.print("[bold green]Successfully seeded Phase 1 curated collections:[/bold green]")
        for k, v in counts.items():
            console.print(f"  • {k.capitalize()}: [cyan]{v}[/cyan]")


# --- AUDIT COMMANDS ---
@audit_app.command("integrity")
def audit_integrity():
    """Verify SHA-256 text checksum integrity and UTF-8 encoding."""
    with get_db_context() as db:
        report = audit_text_integrity(db)
        table = Table(title="Corpus SHA-256 Integrity Report")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="bold green")
        for k, v in report.items():
            table.add_row(k, str(v))
        console.print(table)


@audit_app.command("reconcile")
def audit_reconcile():
    """Reconcile database row counts against upstream parquet manifests."""
    with get_db_context() as db:
        report = reconcile_corpus_counts(db)
        table = Table(title="Source Reconciliation Report")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="bold")
        for k, v in report.items():
            table.add_row(k, str(v))
        console.print(table)


@audit_app.command("synthetic")
def audit_synthetic():
    """Scan database to verify zero synthetic, hallucinated, or placeholder content."""
    with get_db_context() as db:
        report = audit_synthetic_content(db)
        table = Table(title="Zero-Synthetic Text Compliance Audit")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="bold green" if report.get("is_100_percent_verbatim") else "bold red")
        for k, v in report.items():
            table.add_row(k, str(v))
        console.print(table)


# --- SEARCH COMMANDS ---
@search_cli_app.command("resolve")
def resolve_provision(
    act: str = typer.Option(..., "--act", "-a", help="Act title (e.g., 'Bharatiya Nagarik Suraksha Sanhita')"),
    section: str = typer.Option(..., "--section", "-s", help="Section number (e.g., '193')"),
    jurisdiction: str | None = typer.Option(None, "--jurisdiction", "-j"),
):
    """Exact statutory section resolution."""
    with get_db_context() as db:
        service = ProvisionService(db)
        try:
            prov = service.resolve_exact_provision(act, section, jurisdiction=jurisdiction)
            console.print(f"\n[bold green]Act:[/bold green] {prov.instrument.title}")
            console.print(f"[bold cyan]Section {prov.section_number_norm}:[/bold cyan] {prov.section_title or ''}")
            console.print(f"[bold yellow]Status:[/bold yellow] {prov.status} (In force: {prov.in_force})")
            console.print(f"[bold]Canonical SHA-256:[/bold] {prov.canonical_hash}")
            console.print(f"\n[bold white]Statutory Text:[/bold white]\n{prov.source_text}\n")
        except Exception as e:
            console.print(f"[bold red]Resolution Failed:[/bold red] {e}")


@search_cli_app.command("query")
def search_legislation(
    query: str = typer.Argument(..., help="Search query string"),
    jurisdiction: str | None = typer.Option(None, "--jurisdiction", "-j"),
    limit: int = typer.Option(10, "--limit", "-l"),
):
    """Full-text lexical search across all statutory provisions."""
    with get_db_context() as db:
        service = SearchService(db)
        items, total = service.search_provisions(query=query, jurisdiction=jurisdiction, limit=limit)
        console.print(f"[bold]Found {total} matches for query '{query}':[/bold]\n")
        for item in items:
            title = item.instrument.title if item.instrument else "Unknown Act"
            console.print(f"[bold green]{title}[/bold green] - [bold cyan]Section {item.section_number_norm}[/bold cyan]: {item.section_title or ''}")
            console.print(f"  {item.canonical_text[:200]}...\n")


# --- JUDGMENTS COMMANDS ---
@judgments_app.command("list")
def list_judgments(
    subject: str | None = typer.Option(None, "--subject", "-s"),
    limit: int = typer.Option(10, "--limit", "-l"),
):
    """List landmark judgments."""
    with get_db_context() as db:
        repo = JudgmentRepository(db)
        items, total = repo.search_judgments(subject_area=subject, limit=limit)
        table = Table(title=f"Landmark Judgments ({total} total)")
        table.add_column("Citation", style="cyan")
        table.add_column("Case Title", style="bold green")
        table.add_column("Court", style="yellow")
        table.add_column("Year", justify="right")
        table.add_column("Subject Area", style="blue")
        for j in items:
            table.add_row(j.citation, j.case_title, j.court, str(j.decision_year or "N/A"), j.subject_area)
        console.print(table)


@judgments_app.command("view")
def view_judgment(citation: str = typer.Argument(..., help="Citation or ID")):
    """View details and ratio decidendi of a landmark judgment."""
    with get_db_context() as db:
        repo = JudgmentRepository(db)
        j = repo.get_by_citation(citation) or repo.get_by_id(citation)
        if not j:
            console.print(f"[bold red]Judgment '{citation}' not found.[/bold red]")
            return
        console.print(f"\n[bold green]Case Title:[/bold green] {j.case_title}")
        console.print(f"[bold cyan]Citation:[/bold cyan] {j.citation} ({j.decision_year})")
        console.print(f"[bold yellow]Court / Bench:[/bold yellow] {j.court} (Coram: {j.coram_size} Judges)")
        console.print(f"[bold]Subject Area:[/bold] {j.subject_area}")
        console.print(f"[bold]Statutes Cited:[/bold] {', '.join(j.statutes_cited)}")
        console.print(f"\n[bold white]Ratio Decidendi:[/bold white]\n{j.ratio_decidendi}\n")


# --- DOCTRINES COMMANDS ---
@doctrines_app.command("list")
def list_doctrines():
    """List all legal doctrines and principles."""
    with get_db_context() as db:
        repo = DoctrineRepository(db)
        items, total = repo.search(limit=50)
        table = Table(title=f"Legal Principles & Doctrines ({total} total)")
        table.add_column("Doctrine Name", style="bold green")
        table.add_column("Latin Maxim", style="cyan")
        table.add_column("Category", style="yellow")
        table.add_column("Summary", style="white")
        for d in items:
            table.add_row(d.name, d.latin_maxim or "-", d.category, d.summary[:80] + "...")
        console.print(table)


# --- PROCEDURES COMMANDS ---
@procedures_app.command("list")
def list_procedures():
    """List step-by-step legal procedures."""
    with get_db_context() as db:
        repo = ProcedureRepository(db)
        items = repo.list_all()
        table = Table(title="Legal Procedures & Workflows")
        table.add_column("Procedure", style="bold green")
        table.add_column("Category", style="yellow")
        table.add_column("Governing Act", style="cyan")
        table.add_column("Forum / Jurisdiction", style="white")
        for p in items:
            table.add_row(p.procedure_name, p.category, p.governing_act, p.forum_jurisdiction)
        console.print(table)


# --- FORMS COMMANDS ---
@forms_app.command("list")
def list_forms():
    """List legal forms and document templates."""
    with get_db_context() as db:
        repo = TemplateRepository(db)
        forms = repo.list_forms()
        templates = repo.list_templates()
        table = Table(title="Legal Forms & Contract Templates")
        table.add_column("Type", style="bold magenta")
        table.add_column("Title", style="bold green")
        table.add_column("Category", style="yellow")
        for f in forms:
            table.add_row("Court Form", f.title, f.category)
        for t in templates:
            table.add_row("Agreement Template", t.title, t.category)
        console.print(table)


# --- API COMMANDS ---
@api_app.command("serve")
def serve_api(
    host: str = typer.Option("0.0.0.0", "--host", "-h"),
    port: int = typer.Option(8000, "--port", "-p"),
    reload: bool = typer.Option(False, "--reload", "-r"),
):
    """Start the FastAPI retrieval server."""
    import uvicorn
    uvicorn.run("kb_cruvels.main:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    app()
