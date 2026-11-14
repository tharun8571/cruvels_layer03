#!/usr/bin/env python3
"""
Build and ingest the Precedent Overruling Graph (Good Law / Overruled) into Knowledge Base Cruvels.
Updates `court_judgments.status = 'overruled'` for overruled decisions and establishes
bidirectional `overrules` and `overruled_by` links in `cross_reference_links`.
"""

from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WORKSPACE_ROOT / "src"))

from kb_cruvels.database.models.cross_references import CrossReferenceLink
from kb_cruvels.database.models.judgments import CourtJudgment
from kb_cruvels.database.session import SessionLocal

# =============================================================================
# LANDMARK SUPREME COURT OVERRULING PRECEDENTS
# =============================================================================
LANDMARK_OVERRULINGS = [
    {
        "overruling_title_pattern": "%Puttaswamy%",
        "overruling_name": "Justice K.S. Puttaswamy (Retd.) v. Union of India (2017) 10 SCC 1 [9-Judge Bench]",
        "overruled_cases": [
            {
                "title_pattern": "%ADDITIONAL DISTRICT MAGISTRATE%SHUKLA%",
                "case_name": "ADM Jabalpur v. Shivkant Shukla [1976] Supp. 1 S.C.R. 172 (Habeas Corpus Case)",
                "reason": "Overruled explicitly. Held that the right to life and personal liberty under Article 21 is not a bounty of the State and cannot be suspended even during a Presidential proclamation of Emergency.",
            },
            {
                "title_pattern": "%M. P. SHARMA%SATISH CHANDRA%",
                "case_name": "M.P. Sharma v. Satish Chandra [1954] 1 S.C.R. 1077",
                "reason": "Overruled to the extent it held that there is no fundamental right to privacy under the Indian Constitution.",
            },
        ],
    },
    {
        "overruling_title_pattern": "%NAVTEJ SINGH JOHAR%",
        "overruling_name": "Navtej Singh Johar v. Union of India [2018] 7 S.C.R. 379 [5-Judge Bench]",
        "overruled_cases": [
            {
                "title_pattern": "%SURESH KUMAR KOUSHAL%NAZ FOUNDATION%",
                "case_name": "Suresh Kumar Koushal v. Naz Foundation [2013] 17 S.C.R. 116",
                "reason": "Overruled. Decriminalized consensual sexual acts between adults under Section 377 IPC, holding Section 377 violative of Articles 14, 15, 19, and 21.",
            },
        ],
    },
    {
        "overruling_title_pattern": "%Kesavananda Bharati%",
        "overruling_name": "Kesavananda Bharati v. State of Kerala (1973) 4 SCC 225 [13-Judge Bench]",
        "overruled_cases": [
            {
                "title_pattern": "%GOLAK NATH%PUNJAB%",
                "case_name": "I.C. Golak Nath v. State of Punjab [1967] 2 S.C.R. 762 [11-Judge Bench]",
                "reason": "Overruled. Held that Parliament has constituent power to amend any part of the Constitution under Article 368 including Fundamental Rights, subject to the Basic Structure Doctrine.",
            },
        ],
    },
    {
        "overruling_title_pattern": "%JOSEPH SHINE%UNION OF INDIA%",
        "overruling_name": "Joseph Shine v. Union of India [2023] 4 S.C.R. 585 / (2019) 3 SCC 39 [5-Judge Bench]",
        "overruled_cases": [
            {
                "title_pattern": "%SOWMITHRI VISHNU%",
                "case_name": "Sowmithri Vishnu v. Union of India [1985] Supp. 1 S.C.R. 741",
                "reason": "Overruled. Struck down Section 497 IPC (Adultery) as unconstitutional, arbitrary, and violative of Articles 14 and 21 for treating women as property of their husbands.",
            },
            {
                "title_pattern": "%V. REVATHI%UNION OF INDIA%",
                "case_name": "V. Revathi v. Union of India (1988) 2 SCC 72",
                "reason": "Overruled. Consequential overruling following the unconstitutionality of Section 497 IPC.",
            },
        ],
    },
    {
        "overruling_title_pattern": "%MANEKA GANDHI%",
        "overruling_name": "Maneka Gandhi v. Union of India (1978) 1 SCC 248 [7-Judge Bench]",
        "overruled_cases": [
            {
                "title_pattern": "%GOPALAN%MADRAS%",
                "case_name": "A.K. Gopalan v. State of Madras [1950] 1 S.C.R. 88 [6-Judge Bench]",
                "reason": "Overruled. Rejected the narrow 'silo' interpretation of fundamental rights; held that 'procedure established by law' under Article 21 must be just, fair, and reasonable, incorporating substantive due process and natural justice.",
            },
        ],
    },
    {
        "overruling_title_pattern": "%SHAYARA BANO%UNION OF INDIA%",
        "overruling_name": "Shayara Bano v. Union of India (2017) 9 SCC 1 [5-Judge Bench]",
        "overruled_cases": [
            {
                "title_pattern": "%STATE OF BOMBAY%NARASU APPA MALI%",
                "case_name": "State of Bombay v. Narasu Appa Mali AIR 1952 Bom 84 (partially narrowed)",
                "reason": "Held that Talaq-e-Biddat (instant triple talaq) is manifestly arbitrary and unconstitutional under Article 14.",
            },
        ],
    },
    {
        "overruling_title_pattern": "%VIDYA DROLIA%DURGA TRADING%",
        "overruling_name": "Vidya Drolia v. Durga Trading Corp. (2021) 2 SCC 1 [3-Judge Bench]",
        "overruled_cases": [
            {
                "title_pattern": "%HIMANGNI ENTERPRISES%KAMALJEET SINGH%",
                "case_name": "Himangni Enterprises v. Kamaljeet Singh Ahluwalia (2017) 10 SCC 706",
                "reason": "Overruled. Held that landlord-tenant disputes governed by the Transfer of Property Act, 1882 are arbitrable, provided they are not governed by special statutory rent control legislation.",
            },
        ],
    },
    {
        "overruling_title_pattern": "%N.N. GLOBAL%INDO UNIQUE%FLAME%",
        "overruling_name": "In Re Interplay Between Arbitration Agreements under the Arbitration Act and the Indian Stamp Act, 1899 (2023 INSC 1066) [7-Judge Curative Bench]",
        "overruled_cases": [
            {
                "title_pattern": "%SMS TEA ESTATES%",
                "case_name": "SMS Tea Estates (P) Ltd. v. Chandmari Tea Co. (P) Ltd. (2011) 14 SCC 66",
                "reason": "Overruled. Held that non-stamping or insufficient stamping of an underlying contract does not render the arbitration agreement void or non-existent at Section 8 / Section 11 stage.",
            },
        ],
    },
]


def make_id(src_id: str, tgt_id: str, rel: str) -> str:
    seed = f"{src_id}:{rel}:{tgt_id}"
    return f"xref_{hashlib.sha256(seed.encode('utf-8')).hexdigest()[:16]}"


def build_precedent_graph():
    print("=" * 70)
    print("KNOWLEDGE BASE CRUVELS: PRECEDENT OVERRULING GRAPH INGESTION")
    print("Establishing 'Good Law' vs 'Overruled' relationships in PostgreSQL")
    print("=" * 70)

    links_created = 0
    cases_updated = 0

    with SessionLocal() as session:
        for item in LANDMARK_OVERRULINGS:
            # 1. Locate overruling judgment
            overruling_obj = (
                session.query(CourtJudgment)
                .filter(CourtJudgment.case_title.ilike(item["overruling_title_pattern"]))
                .first()
            )

            overruling_id = overruling_obj.id if overruling_obj else f"jdg_bench_{hashlib.sha256(item['overruling_name'].encode()).hexdigest()[:12]}"
            overruling_label = overruling_obj.case_title if overruling_obj else item["overruling_name"]

            print(f"\n[Overruling Decision] {overruling_label[:60]}... (ID: {overruling_id})")

            for target in item["overruled_cases"]:
                # 2. Locate target overruled judgment in DB
                overruled_obj = (
                    session.query(CourtJudgment)
                    .filter(CourtJudgment.case_title.ilike(target["title_pattern"]))
                    .first()
                )

                if overruled_obj:
                    overruled_id = overruled_obj.id
                    overruled_label = overruled_obj.case_title
                    # Mark status as overruled!
                    overruled_obj.status = "overruled"
                    session.add(overruled_obj)
                    cases_updated += 1
                    print(f"  ❌ FOUND & MARKED OVERRULED: {overruled_label[:50]}... (ID: {overruled_id})")
                else:
                    overruled_id = f"jdg_overruled_{hashlib.sha256(target['case_name'].encode()).hexdigest()[:12]}"
                    overruled_label = target["case_name"]
                    print(f"  ⚠️  Target not in DB, creating graph node: {overruled_label[:50]}...")

                # 3. Create Bidirectional Links in cross_reference_links
                # Link 1: Overruling -> Overruled (overrules)
                fwd_id = make_id(overruling_id, overruled_id, "overrules")
                fwd_link = CrossReferenceLink(
                    id=fwd_id,
                    source_type="judgment",
                    source_id=overruling_id,
                    source_label=overruling_label,
                    target_type="judgment",
                    target_id=overruled_id,
                    target_label=overruled_label,
                    relationship_type="overrules",
                    confidence_score=1.0,
                    description=target["reason"],
                    extra_metadata={
                        "overruling_case": overruling_label,
                        "overruled_case": overruled_label,
                        "reason": target["reason"],
                        "status": "overruled",
                    },
                    created_at=datetime.now(timezone.utc),
                )
                session.merge(fwd_link)
                links_created += 1

                # Link 2: Overruled -> Overruling (overruled_by)
                rev_id = make_id(overruled_id, overruling_id, "overruled_by")
                rev_link = CrossReferenceLink(
                    id=rev_id,
                    source_type="judgment",
                    source_id=overruled_id,
                    source_label=overruled_label,
                    target_type="judgment",
                    target_id=overruling_id,
                    target_label=overruling_label,
                    relationship_type="overruled_by",
                    confidence_score=1.0,
                    description=f"This decision was expressly overruled by {overruling_label}. Reason: {target['reason']}",
                    extra_metadata={
                        "overruling_case": overruling_label,
                        "overruled_case": overruled_label,
                        "reason": target["reason"],
                        "status": "not_good_law",
                    },
                    created_at=datetime.now(timezone.utc),
                )
                session.merge(rev_link)
                links_created += 1

        session.commit()
        print("\n" + "=" * 70)
        print(f"PRECEDENT GRAPH COMMITTED: {links_created} links created, {cases_updated} judgments marked 'overruled' in DB.")
        total_links = session.query(CrossReferenceLink).count()
        print(f"Total records in cross_reference_links table: {total_links:,}")
        print("=" * 70)


if __name__ == "__main__":
    build_precedent_graph()
