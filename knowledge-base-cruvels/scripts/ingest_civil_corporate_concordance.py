#!/usr/bin/env python3
"""
Ingest Civil, Corporate & Consumer Law Concordance into Knowledge Base Cruvels:
1. Companies Act, 2013 <-> Companies Act, 1956 (MCA official concordance)
2. Consumer Protection Act, 2019 <-> Consumer Protection Act, 1986
3. Arbitration and Conciliation Act, 1996 <-> Arbitration Act, 1940

Populates `cross_reference_links` table with bidirectional links.
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
from kb_cruvels.database.session import SessionLocal

# =============================================================================
# 1. COMPANIES ACT 2013 <-> 1956 CONCORDANCE (MCA Official Mapping)
# =============================================================================
COMPANIES_ACT_MAPPINGS = [
    # General / Corporate Governance
    ("3", "12", "Formation of company / Mode of forming incorporated company"),
    ("4", "13", "Memorandum of association"),
    ("5", "26", "Articles of association"),
    ("7", "33", "Incorporation of company"),
    ("12", "146", "Registered office of company"),
    ("13", "17", "Alteration of memorandum"),
    ("14", "31", "Alteration of articles"),
    ("21", "54", "Authentication of documents, proceedings and contracts"),
    ("22", "48", "Execution of bills of exchange, etc."),
    # Prospectus and Capital
    ("23", "60", "Public offer and private placement"),
    ("26", "55", "Matters to be stated in prospectus"),
    ("34", "62", "Criminal liability for misstatements in prospectus"),
    ("35", "62", "Civil liability for misstatements in prospectus"),
    ("42", "67", "Offer or invitation for subscription of securities on private placement"),
    ("43", "86", "Kinds of share capital"),
    ("53", "79", "Prohibition on issue of shares at discount"),
    ("54", "79A", "Issue of sweat equity shares"),
    ("55", "80", "Issue and redemption of preference shares"),
    ("56", "108", "Transfer and transmission of securities"),
    ("62", "81", "Further issue of share capital / Rights issue"),
    ("66", "100", "Reduction of share capital"),
    ("68", "77A", "Power of company to purchase its own securities (Buy-back)"),
    ("71", "117", "Debentures"),
    # Deposits & Registration of Charges
    ("73", "58A", "Prohibition on acceptance of deposits from public"),
    ("77", "125", "Duty to register charges, etc."),
    ("82", "138", "Company to report satisfaction of charge"),
    # Management & Administration
    ("88", "150", "Register of members, etc."),
    ("92", "159", "Annual return"),
    ("96", "166", "Annual general meeting (AGM)"),
    ("100", "169", "Calling of extraordinary general meeting (EGM)"),
    ("101", "171", "Notice of meeting"),
    ("103", "174", "Quorum for meetings"),
    ("105", "176", "Proxies"),
    ("114", "189", "Ordinary and special resolutions"),
    ("117", "192", "Resolutions and agreements to be filed"),
    ("118", "193", "Minutes of proceedings of general meeting, meeting of Board"),
    # Accounts, Audit & CSR
    ("123", "205", "Declaration of dividend"),
    ("128", "209", "Books of account, etc., to be kept by company"),
    ("129", "210", "Financial statement / Balance sheet and profit and loss account"),
    ("134", "217", "Financial statement, Board's report, etc."),
    ("135", "None", "Corporate Social Responsibility (New Provision in 2013 Act)"),
    ("139", "224", "Appointment of auditors"),
    ("141", "226", "Eligibility, qualifications and disqualifications of auditors"),
    ("142", "224", "Remuneration of auditors"),
    ("143", "227", "Powers and duties of auditors and auditing standards"),
    ("148", "233B", "Central Government to specify audit of items of cost"),
    # Directors & Board
    ("149", "252", "Company to have Board of Directors / Minimum directors"),
    ("152", "255", "Appointment of directors"),
    ("161", "260", "Appointment of additional director, alternate director and nominee director"),
    ("164", "274", "Disqualifications for appointment of director"),
    ("165", "275", "Number of directorships"),
    ("166", "None", "Duties of directors (Codified in 2013 Act)"),
    ("167", "283", "Vacation of office of director"),
    ("168", "None", "Resignation of director"),
    ("169", "284", "Removal of directors"),
    ("173", "285", "Meetings of Board"),
    ("174", "287", "Quorum for meetings of Board"),
    ("177", "292A", "Audit Committee"),
    ("178", "None", "Nomination and Remuneration Committee and Stakeholders Relationship Committee"),
    ("179", "292", "Powers of Board"),
    ("180", "293", "Restrictions on powers of Board"),
    ("184", "299", "Disclosure of interest by director"),
    ("185", "295", "Loans to directors, etc."),
    ("186", "372A", "Loan and investment by company"),
    ("188", "297", "Related party transactions"),
    ("196", "269", "Appointment of managing director, whole-time director or manager"),
    ("197", "198", "Overall maximum managerial remuneration"),
    ("203", "383A", "Appointment of key managerial personnel (KMP)"),
    # Compromises, Arrangements & Amalgamations
    ("230", "391", "Power to compromise or make arrangements with creditors and members"),
    ("231", "392", "Power of Tribunal to enforce compromise or arrangement"),
    ("232", "394", "Merger and amalgamation of companies"),
    # Oppression & Mismanagement
    ("241", "397", "Application to Tribunal for relief in cases of oppression, etc."),
    ("242", "402", "Powers of Tribunal on application under section 241"),
    ("244", "399", "Right to apply under section 241"),
    ("245", "None", "Class action suits (New in 2013 Act)"),
    # Winding Up & NCLT
    ("271", "433", "Circumstances in which company may be wound up by Tribunal"),
    ("272", "439", "Petition for winding up"),
    ("408", "10FB", "Constitution of National Company Law Tribunal (NCLT)"),
    ("410", "10FR", "Constitution of Appellate Tribunal (NCLAT)"),
    ("447", "None", "Punishment for fraud (Severe statutory penalty introduced in 2013 Act)"),
]

# =============================================================================
# 2. CONSUMER PROTECTION ACT 2019 <-> 1986 CONCORDANCE
# =============================================================================
CONSUMER_PROTECTION_MAPPINGS = [
    ("2(7)", "2(1)(d)", "Definition of Consumer"),
    ("2(10)", "2(1)(f)", "Definition of Defect"),
    ("2(11)", "2(1)(g)", "Definition of Deficiency"),
    ("2(47)", "2(1)(r)", "Definition of Unfair Trade Practice"),
    ("2(46)", "None", "Unfair Contract (New concept under 2019 Act)"),
    ("2(16)", "None", "E-commerce & Electronic Service Provider"),
    ("10", "None", "Establishment of Central Consumer Protection Authority (CCPA)"),
    ("18", "None", "Powers and functions of CCPA to recall goods and order refunds"),
    ("28", "9(a)", "Establishment of District Consumer Disputes Redressal Commission"),
    ("34", "11", "Jurisdiction of District Commission (Pecuniary jurisdiction up to Rs 50 Lakh)"),
    ("35", "12", "Manner in which complaint shall be made"),
    ("36", "13", "Proceedings before District Commission"),
    ("38", "13", "Procedure on admission of complaint"),
    ("39", "14", "Findings of District Commission / Relief granted"),
    ("41", "15", "Appeal against order of District Commission to State Commission"),
    ("42", "9(b)", "Establishment of State Consumer Disputes Redressal Commission"),
    ("47", "17", "Jurisdiction of State Commission (Pecuniary jurisdiction Rs 50 Lakh to Rs 2 Crore)"),
    ("51", "19", "Appeal to National Commission against order of State Commission"),
    ("53", "9(c)", "Establishment of National Consumer Disputes Redressal Commission (NCDRC)"),
    ("58", "21", "Jurisdiction of National Commission (Exceeding Rs 2 Crore)"),
    ("67", "23", "Appeal to Supreme Court against order of National Commission"),
    ("71", "25", "Enforcement of orders of District, State or National Commission"),
    ("72", "27", "Penalty for non-compliance of order (Imprisonment up to 3 years)"),
    ("74", "None", "Establishment of Consumer Mediation Cell (New ADR framework)"),
    ("82", "None", "Application of Chapter VI on Product Liability (New in 2019 Act)"),
    ("84", "None", "Liability of product manufacturer"),
    ("85", "None", "Liability of product service provider"),
    ("86", "None", "Liability of product seller"),
]

# =============================================================================
# 3. ARBITRATION ACT 1996 <-> 1940 CONCORDANCE
# =============================================================================
ARBITRATION_MAPPINGS = [
    ("7", "2(a)", "Arbitration agreement (In writing, clause in contract or separate agreement)"),
    ("8", "34", "Power to refer parties to arbitration where there is an arbitration agreement"),
    ("9", "None", "Interim measures by Court before, during, or after arbitral proceedings"),
    ("11", "8", "Appointment of arbitrators by High Court / Supreme Court"),
    ("12", "None", "Grounds for challenge (Independence and impartiality / Fifth Schedule disclosure)"),
    ("16", "None", "Competence of arbitral tribunal to rule on its jurisdiction (Kompetenz-Kompetenz)"),
    ("17", "None", "Interim measures ordered by arbitral tribunal"),
    ("19", "None", "Determination of rules of procedure (Not bound by CPC 1908 or Evidence Act 1872)"),
    ("31", "14", "Form and contents of arbitral award"),
    ("34", "30", "Application for setting aside arbitral award (Grounds: public policy, patent illegality)"),
    ("36", "17", "Enforcement of arbitral award as a decree of the Court"),
    ("37", "39", "Appealable orders"),
]


def make_id(src_id: str, tgt_id: str, rel: str) -> str:
    seed = f"{src_id}:{rel}:{tgt_id}"
    return f"xref_{hashlib.sha256(seed.encode('utf-8')).hexdigest()[:16]}"


def ingest_civil_corporate_concordance():
    print("=" * 70)
    print("KNOWLEDGE BASE CRUVELS: CORPORATE & CIVIL CONCORDANCE INGESTION")
    print("1. Companies Act 2013 <-> 1956")
    print("2. Consumer Protection Act 2019 <-> 1986")
    print("3. Arbitration and Conciliation Act 1996 <-> 1940")
    print("=" * 70)

    links_to_upsert = []

    # 1. Companies Act
    for sec_2013, sec_1956, note in COMPANIES_ACT_MAPPINGS:
        src_id = f"CA2013_{sec_2013}"
        tgt_id = f"CA1956_{sec_1956}" if sec_1956 != "None" else "CA1956_NONE"

        # 2013 -> 1956
        fwd_item = {
            "id": make_id(src_id, tgt_id, "repeals_and_replaces"),
            "source_type": "statutory_provision",
            "source_id": src_id,
            "source_label": f"Section {sec_2013}, Companies Act, 2013 ({note})",
            "target_type": "statutory_provision",
            "target_id": tgt_id,
            "target_label": f"Section {sec_1956}, Companies Act, 1956 ({note})" if sec_1956 != "None" else "No direct equivalent in Companies Act, 1956",
            "relationship_type": "repeals_and_replaces",
            "confidence_score": 1.0,
            "description": f"Section {sec_2013} of the Companies Act, 2013 replaced legacy Section {sec_1956} of the Companies Act, 1956 ({note}).",
            "extra_metadata": {
                "source_act": "Companies Act, 2013",
                "source_section": sec_2013,
                "target_act": "Companies Act, 1956",
                "target_section": sec_1956,
                "subject": note,
            },
        }
        links_to_upsert.append(fwd_item)

        # 1956 -> 2013
        if sec_1956 != "None":
            rev_item = {
                "id": make_id(tgt_id, src_id, "corresponds_to"),
                "source_type": "statutory_provision",
                "source_id": tgt_id,
                "source_label": f"Section {sec_1956}, Companies Act, 1956 ({note})",
                "target_type": "statutory_provision",
                "target_id": src_id,
                "target_label": f"Section {sec_2013}, Companies Act, 2013 ({note})",
                "relationship_type": "corresponds_to",
                "confidence_score": 1.0,
                "description": f"Section {sec_1956} of the repealed Companies Act, 1956 corresponds to Section {sec_2013} of the Companies Act, 2013 ({note}).",
                "extra_metadata": {
                    "source_act": "Companies Act, 1956",
                    "source_section": sec_1956,
                    "target_act": "Companies Act, 2013",
                    "target_section": sec_2013,
                    "subject": note,
                },
            }
            links_to_upsert.append(rev_item)

    # 2. Consumer Protection Act
    for sec_2019, sec_1986, note in CONSUMER_PROTECTION_MAPPINGS:
        src_id = f"CPA2019_{sec_2019}"
        tgt_id = f"CPA1986_{sec_1986}" if sec_1986 != "None" else "CPA1986_NONE"

        fwd_item = {
            "id": make_id(src_id, tgt_id, "repeals_and_replaces"),
            "source_type": "statutory_provision",
            "source_id": src_id,
            "source_label": f"Section {sec_2019}, Consumer Protection Act, 2019 ({note})",
            "target_type": "statutory_provision",
            "target_id": tgt_id,
            "target_label": f"Section {sec_1986}, Consumer Protection Act, 1986 ({note})" if sec_1986 != "None" else "New Provision in 2019 Act",
            "relationship_type": "repeals_and_replaces",
            "confidence_score": 1.0,
            "description": f"Section {sec_2019} of the Consumer Protection Act, 2019 replaced Section {sec_1986} of the 1986 Act ({note}).",
            "extra_metadata": {
                "source_act": "Consumer Protection Act, 2019",
                "source_section": sec_2019,
                "target_act": "Consumer Protection Act, 1986",
                "target_section": sec_1986,
                "subject": note,
            },
        }
        links_to_upsert.append(fwd_item)

        if sec_1986 != "None":
            rev_item = {
                "id": make_id(tgt_id, src_id, "corresponds_to"),
                "source_type": "statutory_provision",
                "source_id": tgt_id,
                "source_label": f"Section {sec_1986}, Consumer Protection Act, 1986 ({note})",
                "target_type": "statutory_provision",
                "target_id": src_id,
                "target_label": f"Section {sec_2019}, Consumer Protection Act, 2019 ({note})",
                "relationship_type": "corresponds_to",
                "confidence_score": 1.0,
                "description": f"Section {sec_1986} of the repealed Consumer Protection Act, 1986 corresponds to Section {sec_2019} of the 2019 Act ({note}).",
                "extra_metadata": {
                    "source_act": "Consumer Protection Act, 1986",
                    "source_section": sec_1986,
                    "target_act": "Consumer Protection Act, 2019",
                    "target_section": sec_2019,
                    "subject": note,
                },
            }
            links_to_upsert.append(rev_item)

    # 3. Arbitration Act
    for sec_1996, sec_1940, note in ARBITRATION_MAPPINGS:
        src_id = f"ARB1996_{sec_1996}"
        tgt_id = f"ARB1940_{sec_1940}" if sec_1940 != "None" else "ARB1940_NONE"

        fwd_item = {
            "id": make_id(src_id, tgt_id, "repeals_and_replaces"),
            "source_type": "statutory_provision",
            "source_id": src_id,
            "source_label": f"Section {sec_1996}, Arbitration and Conciliation Act, 1996 ({note})",
            "target_type": "statutory_provision",
            "target_id": tgt_id,
            "target_label": f"Section {sec_1940}, Arbitration Act, 1940 ({note})" if sec_1940 != "None" else "New UNCITRAL provision in 1996 Act",
            "relationship_type": "repeals_and_replaces",
            "confidence_score": 1.0,
            "description": f"Section {sec_1996} of the Arbitration Act, 1996 replaced Section {sec_1940} of the 1940 Act ({note}).",
            "extra_metadata": {
                "source_act": "Arbitration and Conciliation Act, 1996",
                "source_section": sec_1996,
                "target_act": "Arbitration Act, 1940",
                "target_section": sec_1940,
                "subject": note,
            },
        }
        links_to_upsert.append(fwd_item)

        if sec_1940 != "None":
            rev_item = {
                "id": make_id(tgt_id, src_id, "corresponds_to"),
                "source_type": "statutory_provision",
                "source_id": tgt_id,
                "source_label": f"Section {sec_1940}, Arbitration Act, 1940 ({note})",
                "target_type": "statutory_provision",
                "target_id": src_id,
                "target_label": f"Section {sec_1996}, Arbitration and Conciliation Act, 1996 ({note})",
                "relationship_type": "corresponds_to",
                "confidence_score": 1.0,
                "description": f"Section {sec_1940} of the repealed 1940 Act corresponds to Section {sec_1996} of the 1996 Act ({note}).",
                "extra_metadata": {
                    "source_act": "Arbitration Act, 1940",
                    "source_section": sec_1940,
                    "target_act": "Arbitration and Conciliation Act, 1996",
                    "target_section": sec_1996,
                    "subject": note,
                },
            }
            links_to_upsert.append(rev_item)

    print(f"\nGenerated {len(links_to_upsert)} corporate & civil concordance links.")

    # Upsert into PostgreSQL
    with SessionLocal() as session:
        for item in links_to_upsert:
            existing = session.query(CrossReferenceLink).filter(CrossReferenceLink.id == item["id"]).first()
            if existing:
                existing.source_label = item["source_label"]
                existing.target_label = item["target_label"]
                existing.description = item["description"]
                existing.extra_metadata = item["extra_metadata"]
            else:
                new_obj = CrossReferenceLink(
                    id=item["id"],
                    source_type=item["source_type"],
                    source_id=item["source_id"],
                    source_label=item["source_label"],
                    target_type=item["target_type"],
                    target_id=item["target_id"],
                    target_label=item["target_label"],
                    relationship_type=item["relationship_type"],
                    confidence_score=item["confidence_score"],
                    description=item["description"],
                    extra_metadata=item["extra_metadata"],
                    created_at=datetime.now(timezone.utc),
                )
                session.add(new_obj)
        session.commit()
        total_links = session.query(CrossReferenceLink).count()
        print(f"SUCCESS: Total records in cross_reference_links table: {total_links:,}")


if __name__ == "__main__":
    ingest_civil_corporate_concordance()
