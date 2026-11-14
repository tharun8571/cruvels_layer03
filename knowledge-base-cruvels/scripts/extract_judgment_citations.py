#!/usr/bin/env python3
"""
High-throughput Statutory Citation Extractor for Court Judgments.
Scans judgment full-texts in streaming batches, extracts cited statutory provisions,
updates `court_judgments.statutes_cited` and `court_judgments.sections_cited`,
and populates `cross_reference_links` with `cites` / `interprets` relationships.

Usage:
    .venv/bin/python scripts/extract_judgment_citations.py --limit 500 --batch-size 100
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WORKSPACE_ROOT / "src"))

from kb_cruvels.database.models.cross_references import CrossReferenceLink
from kb_cruvels.database.models.judgments import CourtJudgment
from kb_cruvels.database.session import SessionLocal

# Canonical Statutory Mapping Rules
ACT_REGEX_MAP = [
    # Constitution Articles
    (
        re.compile(r"\b(?:Article|Art\.?)\s*(?P<sec>\d+[A-Z]?)\b(?:\s*(?:of\s+(?:the\s+)?)?Constitution)?", re.IGNORECASE),
        "Constitution of India",
        "CONST",
    ),
    # IPC / BNS
    (
        re.compile(r"\b(?:Section|Sec\.?|s\.)\s*(?P<sec>\d+[A-Z]?)\s*(?:of\s+(?:the\s+)?)?(?:IPC|Indian\s+Penal\s+Code)\b", re.IGNORECASE),
        "Indian Penal Code, 1860",
        "IPC",
    ),
    (
        re.compile(r"\b(?:u/s|under\s+section)\s*(?P<sec>\d+[A-Z]?)\s*(?:IPC|Indian\s+Penal\s+Code)\b", re.IGNORECASE),
        "Indian Penal Code, 1860",
        "IPC",
    ),
    # CrPC / BNSS
    (
        re.compile(r"\b(?:Section|Sec\.?|s\.)\s*(?P<sec>\d+[A-Z]?)\s*(?:of\s+(?:the\s+)?)?(?:Cr\.?P\.?C\.?|Code\s+of\s+Criminal\s+Procedure)\b", re.IGNORECASE),
        "Code of Criminal Procedure, 1973",
        "CrPC",
    ),
    # CPC
    (
        re.compile(r"\b(?:Section|Sec\.?|s\.)\s*(?P<sec>\d+[A-Z]?)\s*(?:of\s+(?:the\s+)?)?(?:C\.?P\.?C\.?|Code\s+of\s+Civil\s+Procedure)\b", re.IGNORECASE),
        "Code of Civil Procedure, 1908",
        "CPC",
    ),
    # NI Act
    (
        re.compile(r"\b(?:Section|Sec\.?|s\.)\s*(?P<sec>\d+[A-Z]?)\s*(?:of\s+(?:the\s+)?)?(?:N\.?I\.?\s*Act|Negotiable\s+Instruments\s+Act)\b", re.IGNORECASE),
        "Negotiable Instruments Act, 1881",
        "NIA",
    ),
    # Evidence Act
    (
        re.compile(r"\b(?:Section|Sec\.?|s\.)\s*(?P<sec>\d+[A-Z]?)\s*(?:of\s+(?:the\s+)?)?(?:Evidence\s+Act|Indian\s+Evidence\s+Act)\b", re.IGNORECASE),
        "Indian Evidence Act, 1872",
        "IEA",
    ),
    # Arbitration Act
    (
        re.compile(r"\b(?:Section|Sec\.?|s\.)\s*(?P<sec>\d+[A-Z]?)\s*(?:of\s+(?:the\s+)?)?(?:Arbitration\s+Act|Arbitration\s+and\s+Conciliation\s+Act)\b", re.IGNORECASE),
        "Arbitration and Conciliation Act, 1996",
        "ARB",
    ),
    # Companies Act
    (
        re.compile(r"\b(?:Section|Sec\.?|s\.)\s*(?P<sec>\d+[A-Z]?)\s*(?:of\s+(?:the\s+)?)?Companies\s+Act\b", re.IGNORECASE),
        "Companies Act, 2013",
        "CA",
    ),
]


def make_id(src_id: str, tgt_id: str, rel: str) -> str:
    seed = f"{src_id}:{rel}:{tgt_id}"
    return f"xref_{hashlib.sha256(seed.encode('utf-8')).hexdigest()[:16]}"


def extract_citations(text: str) -> dict[str, set[str]]:
    """Extract cited statutes and section numbers from judgment text."""
    if not text or len(text) < 50:
        return {}

    # Sample first 40,000 chars where citations, facts, and legal questions are stated
    sample_text = text[:40000]
    extracted: dict[str, set[str]] = {}

    for pattern, act_title, act_code in ACT_REGEX_MAP:
        for match in pattern.finditer(sample_text):
            sec = match.group("sec").upper()
            # Basic sanity filter on section numbers (must be reasonable length)
            if len(sec) <= 5 and int(re.sub(r"[A-Z]", "", sec) or 0) <= 650:
                if act_title not in extracted:
                    extracted[act_title] = set()
                extracted[act_title].add(sec)

    return extracted


def run_extraction(limit: int = 500, batch_size: int = 100):
    print("=" * 70)
    print("KNOWLEDGE BASE CRUVELS: CASE LAW CITATION EXTRACTOR")
    print(f"Scanning up to {limit:,} judgments in batches of {batch_size}...")
    print("=" * 70)

    total_scanned = 0
    total_updated = 0
    total_links_created = 0

    with SessionLocal() as session:
        # Fetch judgments in batches
        offset = 0
        while total_scanned < limit:
            fetch_size = min(batch_size, limit - total_scanned)
            judgments = (
                session.query(CourtJudgment)
                .order_by(CourtJudgment.decision_year.desc().nullslast())
                .offset(offset)
                .limit(fetch_size)
                .all()
            )
            if not judgments:
                break

            new_links = []
            for jdg in judgments:
                total_scanned += 1
                citations = extract_citations(jdg.full_text)

                if citations:
                    acts_list = sorted(list(citations.keys()))
                    sections_list = []
                    for act_name, sec_set in citations.items():
                        for s in sorted(list(sec_set)):
                            sections_list.append(f"{act_name} Section {s}" if "Constitution" not in act_name else f"Article {s}")

                    # Update judgment metadata
                    jdg.statutes_cited = acts_list
                    jdg.sections_cited = sections_list
                    total_updated += 1

                    # Generate cross-reference links
                    for act_name, sec_set in citations.items():
                        for s in sec_set:
                            target_id = f"sec_{hashlib.sha256(f'{act_name}_{s}'.encode()).hexdigest()[:12]}"
                            link_id = make_id(jdg.id, target_id, "interprets")

                            link = CrossReferenceLink(
                                id=link_id,
                                source_type="judgment",
                                source_id=jdg.id,
                                source_label=jdg.case_title,
                                target_type="statutory_provision",
                                target_id=target_id,
                                target_label=f"Section {s}, {act_name}" if "Constitution" not in act_name else f"Article {s}, {act_name}",
                                relationship_type="interprets",
                                confidence_score=0.95,
                                description=f"{jdg.case_title} ({jdg.decision_year or 'SC'}) interprets/cites Section {s} of {act_name}.",
                                extra_metadata={
                                    "judgment_id": jdg.id,
                                    "court": jdg.court,
                                    "act": act_name,
                                    "section": s,
                                    "decision_year": jdg.decision_year,
                                },
                                created_at=datetime.now(timezone.utc),
                            )
                            new_links.append(link)

            # Commit batch
            for lk in new_links:
                session.merge(lk)
            session.commit()
            total_links_created += len(new_links)
            offset += len(judgments)

            print(f"  [Progress] Scanned {total_scanned:,}/{limit:,} judgments | {total_updated:,} citations resolved | {total_links_created:,} links committed...")

    print("\n" + "=" * 70)
    print("EXTRACTION COMPLETE:")
    print(f"  • Judgments Scanned      : {total_scanned:,}")
    print(f"  • Judgments Updated      : {total_updated:,}")
    print(f"  • Cross-References Added : {total_links_created:,}")
    with SessionLocal() as session:
        final_total = session.query(CrossReferenceLink).count()
        print(f"  • Total DB Links Now     : {final_total:,}")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract citations from judgments")
    parser.add_argument("--limit", type=int, default=500, help="Number of judgments to scan")
    parser.add_argument("--batch-size", type=int, default=100, help="Batch commit size")
    args = parser.parse_args()

    run_extraction(limit=args.limit, batch_size=args.batch_size)
