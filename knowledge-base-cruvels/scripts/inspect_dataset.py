#!/usr/bin/env python3
"""Operational script to inspect the upstream dataset and local files."""

from rich.console import Console
from rich.table import Table

from kb_cruvels.ingestion.discover import discover_available_files

console = Console()


def main():
    files = discover_available_files()
    table = Table(title="Open India Law Dataset Partitions")
    table.add_column("Filename", style="cyan")
    table.add_column("Jurisdiction", style="green")
    table.add_column("Expected Rows", justify="right")
    table.add_column("Size (MB)", justify="right")
    table.add_column("Local Status", style="bold")

    for f in files:
        status_str = f"[green]Local ({f['local_size_mb']} MB)[/green]" if f["local_exists"] else "[yellow]Remote only[/yellow]"
        table.add_row(
            f["filename"],
            f["jurisdiction"],
            f"{f['expected_rows']:,}",
            str(f["expected_size_mb"]),
            status_str,
        )
    console.print(table)


if __name__ == "__main__":
    main()
