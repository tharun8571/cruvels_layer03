#!/usr/bin/env python3
"""Operational script to build and save the canonical source manifest."""

from kb_cruvels.sources.open_india_law.manifest import save_source_manifest


def main():
    p = save_source_manifest()
    print(f"Generated source manifest at: {p}")


if __name__ == "__main__":
    main()
