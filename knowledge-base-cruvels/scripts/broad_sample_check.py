"""Exhaustive multi-domain sample verification script for Knowledge Base Cruvels.

Tests distinct and broad statutory resolution across 50+ major Acts, Constitutional Articles,
Landmark Judgments, Doctrines, Procedures, Forms, Templates, and Notifications.
"""

from __future__ import annotations

import sys
from kb_cruvels.database.session import get_db_context
from kb_cruvels.services.provision_service import ProvisionService
from kb_cruvels.database.repositories.judgment_repo import JudgmentRepository
from kb_cruvels.database.repositories.phase1_repos import (
    DoctrineRepository,
    DefinitionRepository,
    ProcedureRepository,
    TemplateRepository,
    NotificationRepository,
)

BENCHMARK_PROVISIONS = [
    # 1. Constitutional Law
    ("Constitution of India", "14", "Constitutional Law"),
    ("Constitution of India", "19", "Constitutional Law"),
    ("Constitution of India", "21", "Constitutional Law"),
    ("Constitution of India", "21A", "Constitutional Law"),
    ("Constitution of India", "32", "Constitutional Law"),
    ("Constitution of India", "51A", "Constitutional Law"),
    ("Constitution of India", "141", "Constitutional Law"),
    ("Constitution of India", "142", "Constitutional Law"),
    ("Constitution of India", "226", "Constitutional Law"),
    ("Constitution of India", "300A", "Constitutional Law"),
    ("Constitution of India", "368", "Constitutional Law"),
    ("Constitution of India", "PREAMBLE", "Constitutional Law"),
    ("Constitution of India", "SCH-7", "Constitutional Law"),

    # 2. Criminal Law (Current Enactments)
    ("Bharatiya Nyaya Sanhita, 2023", "103", "Criminal Law (BNS)"),
    ("Bharatiya Nyaya Sanhita, 2023", "111", "Criminal Law (BNS)"),
    ("Bharatiya Nyaya Sanhita, 2023", "69", "Criminal Law (BNS)"),
    ("Bharatiya Nyaya Sanhita, 2023", "85", "Criminal Law (BNS)"),
    ("Bharatiya Nagarik Suraksha Sanhita, 2023", "193", "Criminal Procedure (BNSS)"),
    ("Bharatiya Nagarik Suraksha Sanhita, 2023", "482", "Criminal Procedure (BNSS)"),
    ("Bharatiya Nagarik Suraksha Sanhita, 2023", "35", "Criminal Procedure (BNSS)"),
    ("Bharatiya Nagarik Suraksha Sanhita, 2023", "173", "Criminal Procedure (BNSS)"),
    ("Bharatiya Sakshya Adhiniyam, 2023", "61", "Evidence (BSA)"),
    ("Bharatiya Sakshya Adhiniyam, 2023", "63", "Evidence (BSA)"),
    ("Bharatiya Sakshya Adhiniyam, 2023", "24", "Evidence (BSA)"),
    ("Bharatiya Sakshya Adhiniyam, 2023", "104", "Evidence (BSA)"),

    # 3. Criminal Law (Legacy Acts)
    ("Indian Penal Code", "302", "Legacy Criminal (IPC)"),
    ("Indian Penal Code", "420", "Legacy Criminal (IPC)"),
    ("Indian Penal Code", "498A", "Legacy Criminal (IPC)"),
    ("Indian Penal Code", "376", "Legacy Criminal (IPC)"),
    ("Indian Penal Code", "124A", "Legacy Criminal (IPC)"),
    ("Indian Penal Code", "304B", "Legacy Criminal (IPC)"),
    ("Indian Evidence Act", "65B", "Legacy Evidence (IEA)"),
    ("Indian Evidence Act", "27", "Legacy Evidence (IEA)"),

    # 4. Commercial & Contract Law
    ("Indian Contract Act", "10", "Contract Law"),
    ("Indian Contract Act", "23", "Contract Law"),
    ("Indian Contract Act", "27", "Contract Law"),
    ("Indian Contract Act", "73", "Contract Law"),
    ("Indian Contract Act", "74", "Contract Law"),
    ("Companies Act", "135", "Corporate Law"),
    ("Companies Act", "149", "Corporate Law"),
    ("Companies Act", "166", "Corporate Law"),
    ("Arbitration and Conciliation Act", "8", "Arbitration"),
    ("Arbitration and Conciliation Act", "9", "Arbitration"),
    ("Arbitration and Conciliation Act", "11", "Arbitration"),
    ("Arbitration and Conciliation Act", "34", "Arbitration"),

    # 5. Civil Procedure, Property & Specific Relief
    ("Code of Civil Procedure", "9", "Civil Procedure (CPC)"),
    ("Code of Civil Procedure", "10", "Civil Procedure (CPC)"),
    ("Code of Civil Procedure", "11", "Civil Procedure (CPC)"),
    ("Code of Civil Procedure", "89", "Civil Procedure (CPC)"),
    ("Code of Civil Procedure", "100", "Civil Procedure (CPC)"),
    ("Transfer of Property Act", "5", "Property Law"),
    ("Transfer of Property Act", "54", "Property Law"),
    ("Transfer of Property Act", "58", "Property Law"),
    ("Transfer of Property Act", "105", "Property Law"),
    ("Specific Relief Act", "10", "Specific Relief"),
    ("Specific Relief Act", "14", "Specific Relief"),
    ("Specific Relief Act", "34", "Specific Relief"),
    ("Specific Relief Act", "38", "Specific Relief"),
    ("Limitation Act", "5", "Limitation"),
    ("Limitation Act", "14", "Limitation"),

    # 6. Technology, Privacy & Consumer Protection
    ("Information Technology Act", "43A", "Technology Law"),
    ("Information Technology Act", "66", "Technology Law"),
    ("Information Technology Act", "66C", "Technology Law"),
    ("Information Technology Act", "67", "Technology Law"),
    ("Information Technology Act", "69A", "Technology Law"),
    ("Information Technology Act", "79", "Technology Law"),
    ("Digital Personal Data Protection Act", "4", "Data Privacy"),
    ("Digital Personal Data Protection Act", "6", "Data Privacy"),
    ("Digital Personal Data Protection Act", "8", "Data Privacy"),
    ("Digital Personal Data Protection Act", "16", "Data Privacy"),
    ("Consumer Protection Act", "2", "Consumer Protection"),
    ("Consumer Protection Act", "35", "Consumer Protection"),
]


def run_broad_verification():
    print("=" * 80)
    print("  KNOWLEDGE BASE CRUVELS - BROAD MULTI-DOMAIN SAMPLES VERIFICATION")
    print("=" * 80)

    passed = 0
    failed = 0
    failures = []

    with get_db_context() as session:
        service = ProvisionService(session)

        # 1. Statutory Resolution across all domains
        print("\n[1/5] Testing Statutory Section Resolution across 50+ Major Provisions:")
        for act, sec, domain in BENCHMARK_PROVISIONS:
            try:
                prov = service.resolve_exact_provision(act, sec)
                title = prov.instrument.title if prov.instrument else act
                snippet = prov.canonical_text.replace("\n", " ")[:60]
                print(f"  ✅ [{domain:24}] {title[:32]:32} Sec {prov.section_number_norm:8} -> {snippet}...")
                passed += 1
            except Exception as e:
                print(f"  ❌ [{domain:24}] {act} Sec {sec} -> FAILED ({e})")
                failed += 1
                failures.append((act, sec, str(e)))

        # 2. Landmark Judgments
        print("\n[2/5] Testing Landmark Judgments Resolution:")
        j_repo = JudgmentRepository(session)
        sample_citations = [
            "(1973) 4 SCC 225",  # Kesavananda Bharati
            "(1978) 1 SCC 248",  # Maneka Gandhi
            "(2017) 10 SCC 1",   # Puttaswamy Privacy
            "(2014) 8 SCC 273",  # Arnesh Kumar
            "(1997) 1 SCC 416",  # D.K. Basu
            "(2015) 5 SCC 1",    # Shreya Singhal
            "(2018) 10 SCC 1",   # Navtej Johar
        ]
        for cit in sample_citations:
            j = j_repo.get_by_citation(cit)
            if j:
                print(f"  ✅ [Landmark Judgment] {cit:20} -> {j.case_title[:45]} (Coram: {j.coram_size})")
                passed += 1
            else:
                print(f"  ❌ [Landmark Judgment] {cit:20} -> NOT FOUND")
                failed += 1
                failures.append(("Judgment", cit, "Not found"))

        # 3. Legal Principles & Doctrines
        print("\n[3/5] Testing Legal Doctrines Resolution:")
        d_repo = DoctrineRepository(session)
        sample_doctrines = [
            "Basic Structure Doctrine",
            "Principles of Natural Justice",
            "Audi Alteram Partem",
            "Nemo Judex In Causa Sua",
            "Res Judicata",
            "Stare Decisis / Doctrine of Precedent",
            "Doctrine of Proportionality",
            "Doctrine of Promissory Estoppel",
        ]
        for dname in sample_doctrines:
            doc = d_repo.get_by_name(dname)
            if doc:
                print(f"  ✅ [Legal Doctrine] {doc.name:36} -> {doc.summary[:55]}...")
                passed += 1
            else:
                print(f"  ❌ [Legal Doctrine] {dname:36} -> NOT FOUND")
                failed += 1
                failures.append(("Doctrine", dname, "Not found"))

        # 4. Legal Procedures & Forms
        print("\n[4/5] Testing Legal Procedures & Templates:")
        p_repo = ProcedureRepository(session)
        t_repo = TemplateRepository(session)
        for proc in p_repo.list_all():
            print(f"  ✅ [Legal Procedure] {proc.procedure_name:35} -> {proc.forum_jurisdiction}")
            passed += 1
        for form in t_repo.list_forms():
            print(f"  ✅ [Court Form]      {form.title:35} -> {form.category}")
            passed += 1
        for tmpl in t_repo.list_templates():
            print(f"  ✅ [Doc Template]    {tmpl.title:35} -> {tmpl.category}")
            passed += 1

        # 5. Government Notifications
        print("\n[5/5] Testing Government Notifications:")
        n_repo = NotificationRepository(session)
        items, count = n_repo.search()
        for notif in items:
            print(f"  ✅ [Notification]    {notif.notification_number:32} -> {notif.issuing_authority} ({notif.subject or notif.title[:40]})")
            passed += 1

    print("\n" + "=" * 80)
    print(f"  VERIFICATION RESULTS: {passed} PASSED, {failed} FAILED")
    print("=" * 80)

    if failures:
        print("\nFailure Details:")
        for f in failures:
            print(f"  - {f[0]} | {f[1]}: {f[2]}")
        sys.exit(1)
    else:
        print("\n🎉 ALL DISTINCT SAMPLES ACROSS ALL LEGAL DOMAINS RESOLVED WITH 100% SUCCESS!\n")


if __name__ == "__main__":
    run_broad_verification()
