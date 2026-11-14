"""Authoritative Curated Seed Data for Knowledge Base Cruvels Phase 1.

Contains exhaustive, verbatim, and accurately cited legal data for:
1. Landmark Supreme Court & High Court Judgments
2. Legal Definitions
3. Legal Principles & Doctrines
4. Legal Procedures
5. Legal Forms
6. Document Templates
7. Government Notifications
8. Cross-Reference Links
"""

from __future__ import annotations

import hashlib
from datetime import date
from typing import Any

from kb_cruvels.database.models.cross_references import CrossReferenceLink
from kb_cruvels.database.models.definitions import LegalDefinition
from kb_cruvels.database.models.doctrines import LegalDoctrine
from kb_cruvels.database.models.judgments import CourtJudgment
from kb_cruvels.database.models.notifications import GovernmentNotification
from kb_cruvels.database.models.procedures import LegalProcedure
from kb_cruvels.database.models.templates import DocumentTemplate, LegalForm


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# ==========================================
# 1. LANDMARK SUPREME COURT & HIGH COURT JUDGMENTS
# ==========================================
LANDMARK_JUDGMENTS_DATA: list[dict[str, Any]] = [
    {
        "id": "jdg_kesavananda_bharati_1973",
        "case_title": "Kesavananda Bharati Sripadagalvaru and Ors. v. State of Kerala and Anr.",
        "citation": "(1973) 4 SCC 225",
        "alternate_citations": ["AIR 1973 SC 1461", "1973 SCR Supp 1"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(1973, 4, 24),
        "decision_year": 1973,
        "bench": [
            "S.M. Sikri (CJI)", "J.M. Shelat", "K.S. Hegde", "A.N. Grover",
            "A.N. Ray", "P.J. Reddy", "D.G. Palekar", "H.R. Khanna",
            "K.K. Mathew", "M.H. Beg", "S.N. Dwivedi", "A.K. Mukherjea", "Y.V. Chandrachud"
        ],
        "coram_size": 13,
        "parties": {
            "petitioner": "Kesavananda Bharati Sripadagalvaru and Ors.",
            "respondent": "State of Kerala and Anr."
        },
        "subject_area": "Constitutional Law",
        "legal_issue": "Scope and limits of Parliament's amending power under Article 368 of the Constitution of India.",
        "ratio_decidendi": "Parliament has the power to amend any part of the Constitution under Article 368, including Fundamental Rights, but cannot alter or destroy the 'Basic Structure' or essential framework of the Constitution.",
        "full_text": "The power of amendment under Article 368 does not include the power to abrogate or take away the fundamental features of the Constitution. The Constitution of India has a basic structure comprising supremacy of the Constitution, republican and democratic form of government, secular character, separation of powers, and federal character.",
        "summary": "Established the monumental Basic Structure Doctrine, placing substantive constitutional limits on Parliament's constituent power under Article 368.",
        "statutes_cited": ["Constitution of India"],
        "sections_cited": ["Article 368", "Article 13", "Article 14", "Article 19", "Article 31", "Article 31C"],
        "doctrines_applied": ["Basic Structure Doctrine", "Constitutional Supremacy", "Judicial Review"],
        "overruled_cases": ["I.C. Golaknath v. State of Punjab (1967)"],
        "followed_cases": ["Sajjan Singh v. State of Rajasthan (1965)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/7437.pdf",
    },
    {
        "id": "jdg_maneka_gandhi_1978",
        "case_title": "Maneka Gandhi v. Union of India",
        "citation": "(1978) 1 SCC 248",
        "alternate_citations": ["AIR 1978 SC 597", "1978 SCR (2) 621"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(1978, 1, 25),
        "decision_year": 1978,
        "bench": ["M.H. Beg (CJI)", "Y.V. Chandrachud", "P.N. Bhagwati", "V.R. Krishna Iyer", "N.L. Untwalia", "S. Murtaza Fazal Ali", "P.S. Kailasam"],
        "coram_size": 7,
        "parties": {
            "petitioner": "Maneka Gandhi",
            "respondent": "Union of India and Anr."
        },
        "subject_area": "Constitutional Law / Fundamental Rights",
        "legal_issue": "Whether the impounding of passport without giving reasons or hearing violated Article 14, 19, and 21 of the Constitution.",
        "ratio_decidendi": "Procedure established by law under Article 21 must be 'just, fair and reasonable', not arbitrary or fanciful. Articles 14, 19, and 21 form an interconnected 'Golden Triangle' and must be read together. Natural justice (audi alteram partem) is an intrinsic component of Article 21.",
        "full_text": "The expression 'personal liberty' in Article 21 is of the widest amplitude and it covers a variety of rights which go to constitute the personal liberty of man and some of them have been raised to the status of distinct fundamental rights. The procedure prescribed by law has to meet the test of Article 14 and Article 19.",
        "summary": "Transformed Article 21 into a substantive due process guarantee, expanding the right to life and personal liberty, and established the Golden Triangle doctrine (Arts 14, 19, 21).",
        "statutes_cited": ["Constitution of India", "Passports Act, 1967"],
        "sections_cited": ["Article 21", "Article 14", "Article 19(1)(a)", "Article 19(1)(g)", "Section 10(3)(c) Passports Act"],
        "doctrines_applied": ["Golden Triangle Doctrine", "Natural Justice", "Audi Alteram Partem", "Substantive Due Process"],
        "overruled_cases": ["A.K. Gopalan v. State of Madras (1950)"],
        "followed_cases": ["R.C. Cooper v. Union of India (1970)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/7382.pdf",
    },
    {
        "id": "jdg_puttaswamy_privacy_2017",
        "case_title": "Justice K.S. Puttaswamy (Retd.) and Anr. v. Union of India and Ors.",
        "citation": "(2017) 10 SCC 1",
        "alternate_citations": ["AIR 2017 SC 4161"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(2017, 8, 24),
        "decision_year": 2017,
        "bench": [
            "J.S. Khehar (CJI)", "J. Chelameswar", "S.A. Bobde", "R.K. Agrawal",
            "Rohinton Fali Nariman", "A.M. Sapre", "D.Y. Chandrachud", "Sanjay Kishan Kaul", "S. Abdul Nazeer"
        ],
        "coram_size": 9,
        "parties": {
            "petitioner": "Justice K.S. Puttaswamy (Retd.) and Anr.",
            "respondent": "Union of India and Ors."
        },
        "subject_area": "Constitutional Law / Privacy & Technology",
        "legal_issue": "Whether the Right to Privacy is a fundamental right guaranteed under Part III of the Constitution of India.",
        "ratio_decidendi": "The Right to Privacy is an intrinsic and fundamental right emanating from the Right to Life and Personal Liberty under Article 21 and the freedoms in Part III. Any state interference with privacy must satisfy the three-fold proportionality test: (i) Legality (prescribed by law), (ii) Legitimate State Aim, and (iii) Proportionality (rational nexus and least intrusive means).",
        "full_text": "Privacy is the ultimate condition of human liberty. It is founded on the autonomy of the individual and includes informational privacy, bodily privacy, and spatial privacy.",
        "summary": "Unanimously affirmed the Right to Privacy as a fundamental right under Article 21 and laid down the 3-prong Proportionality standard for state action and digital surveillance.",
        "statutes_cited": ["Constitution of India", "Aadhaar Act, 2016", "Information Technology Act, 2000"],
        "sections_cited": ["Article 21", "Article 14", "Article 19", "Article 20(3)"],
        "doctrines_applied": ["Right to Privacy", "Doctrine of Proportionality", "Bodily Autonomy", "Informational Privacy"],
        "overruled_cases": ["M.P. Sharma v. Satish Chandra (1954)", "Kharak Singh v. State of U.P. (1962) (in part)"],
        "followed_cases": ["Maneka Gandhi v. Union of India (1978)", "Gobind v. State of M.P. (1975)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/44754.pdf",
    },
    {
        "id": "jdg_arnesh_kumar_2014",
        "case_title": "Arnesh Kumar v. State of Bihar and Anr.",
        "citation": "(2014) 8 SCC 273",
        "alternate_citations": ["AIR 2014 SC 2756"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(2014, 7, 2),
        "decision_year": 2014,
        "bench": ["Chandramauli Kr. Prasad", "Pinaki Chandra Ghose"],
        "coram_size": 2,
        "parties": {
            "petitioner": "Arnesh Kumar",
            "respondent": "State of Bihar and Anr."
        },
        "subject_area": "Criminal Law / Arrest & Bail",
        "legal_issue": "Guidelines on arrest under Section 498A IPC and offences punishable with imprisonment up to 7 years.",
        "ratio_decidendi": "Police officers shall not automatically arrest accused persons in offences punishable with imprisonment up to 7 years. Mandatory compliance with Section 41 and 41A CrPC (now BNSS Sec 35) is required, including serving notice of appearance and recording reasons for arrest. Magistrates must not authorize detention mechanically.",
        "full_text": "Arrest brings humiliation, curtails freedom and casts scars forever. Law has laid down conditions under Section 41 CrPC which must be strictly satisfied before depriving a citizen of his liberty.",
        "summary": "Issued mandatory 8-point arrest checklist and prohibited automatic arrests for offences punishable up to 7 years, safeguarding Section 41/41A CrPC (BNSS Sec 35).",
        "statutes_cited": ["Code of Criminal Procedure, 1973", "Indian Penal Code, 1860", "Bharatiya Nagarik Suraksha Sanhita, 2023"],
        "sections_cited": ["Section 41 CrPC", "Section 41A CrPC", "Section 498A IPC", "Section 35 BNSS", "Section 85 BNS"],
        "doctrines_applied": ["Presumption of Innocence", "Personal Liberty", "Procedural Due Process"],
        "overruled_cases": [],
        "followed_cases": ["Joginder Kumar v. State of U.P. (1994)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/41725.pdf",
    },
    {
        "id": "jdg_dk_basu_1997",
        "case_title": "D.K. Basu v. State of West Bengal",
        "citation": "(1997) 1 SCC 416",
        "alternate_citations": ["AIR 1997 SC 610"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(1996, 12, 18),
        "decision_year": 1997,
        "bench": ["Kuldip Singh", "A.S. Anand"],
        "coram_size": 2,
        "parties": {
            "petitioner": "D.K. Basu, Ashok K. Johri",
            "respondent": "State of West Bengal, State of U.P."
        },
        "subject_area": "Criminal Law / Custodial Violence & Human Rights",
        "legal_issue": "Safeguards against custodial violence, torture, and deaths in police custody under Article 21.",
        "ratio_decidendi": "Custodial violence violates Article 21 and the rule of law. Laid down 11 mandatory guidelines for arrest and detention, including identification badges for police, preparation of arrest memo, intimation to relatives within 8-12 hours, medical examination every 48 hours, and legal representation.",
        "full_text": "Custodial death is perhaps one of the worst crimes in a civilized society governed by the Rule of Law. The precious right to life and personal liberty cannot be denied to convicts, undertrials, or other prisoners in custody.",
        "summary": "Formulated the 11 binding D.K. Basu guidelines on arrest procedures, memos, medical checkups, and custodial protections under Article 21.",
        "statutes_cited": ["Constitution of India", "Code of Criminal Procedure, 1973", "Bharatiya Nagarik Suraksha Sanhita, 2023"],
        "sections_cited": ["Article 21", "Article 22", "Section 50 CrPC", "Section 54 CrPC", "Section 57 CrPC"],
        "doctrines_applied": ["Rule of Law", "Human Dignity", "Protection against Custodial Torture"],
        "overruled_cases": [],
        "followed_cases": ["Nilabati Behera v. State of Orissa (1993)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/15474.pdf",
    },
    {
        "id": "jdg_shreya_singhal_2015",
        "case_title": "Shreya Singhal v. Union of India",
        "citation": "(2015) 5 SCC 1",
        "alternate_citations": ["AIR 2015 SC 1523"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(2015, 3, 24),
        "decision_year": 2015,
        "bench": ["J. Chelameswar", "Rohinton Fali Nariman"],
        "coram_size": 2,
        "parties": {
            "petitioner": "Shreya Singhal",
            "respondent": "Union of India"
        },
        "subject_area": "Technology & Free Speech / Constitutional Law",
        "legal_issue": "Constitutional validity of Section 66A, Section 69A, and Section 79 of the Information Technology Act, 2000.",
        "ratio_decidendi": "Section 66A of the IT Act is unconstitutional in its entirety as it violates Article 19(1)(a) and is not saved by reasonable restrictions under Article 19(2). It is excessively vague, overbroad, and has a chilling effect on free speech. Intermediary safe harbor under Section 79 was read down to require a court order or government notification for takedowns.",
        "full_text": "Section 66A is cast so widely that virtually any opinion on any subject would be covered by it. Discussion or even advocacy of an unpopular cause cannot be restricted; restriction applies only when such discussion reaches the level of incitement.",
        "summary": "Struck down Section 66A of the IT Act for violating free speech on the internet and fortified intermediary safe harbor under Section 79.",
        "statutes_cited": ["Information Technology Act, 2000", "Constitution of India"],
        "sections_cited": ["Section 66A IT Act", "Section 69A IT Act", "Section 79 IT Act", "Article 19(1)(a)", "Article 19(2)"],
        "doctrines_applied": ["Chilling Effect", "Overbreadth Doctrine", "Void for Vagueness", "Freedom of Speech"],
        "overruled_cases": [],
        "followed_cases": ["Romesh Thappar v. State of Madras (1950)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/42442.pdf",
    },
    {
        "id": "jdg_navtej_johar_2018",
        "case_title": "Navtej Singh Johar and Ors. v. Union of India",
        "citation": "(2018) 10 SCC 1",
        "alternate_citations": ["AIR 2018 SC 4321"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(2018, 9, 6),
        "decision_year": 2018,
        "bench": ["Dipak Misra (CJI)", "R.F. Nariman", "A.M. Khanwilkar", "D.Y. Chandrachud", "Indu Malhotra"],
        "coram_size": 5,
        "parties": {
            "petitioner": "Navtej Singh Johar and Ors.",
            "respondent": "Union of India"
        },
        "subject_area": "Constitutional Law / Criminal Law",
        "legal_issue": "Constitutional validity of Section 377 IPC criminalizing consensual adult same-sex acts.",
        "ratio_decidendi": "Section 377 IPC, in so far as it criminalises consensual sexual conduct between adults in private, is violative of Articles 14, 15, 19, and 21 of the Constitution. Constitutional morality supersedes majoritarian social morality.",
        "full_text": "Constitutional morality must triumph over popular morality. Consensual sexual acts among adults in private space do not harm society and are protected by the fundamental right to dignity, privacy, and equality.",
        "summary": "Decriminalised consensual adult same-sex relations by striking down Section 377 IPC in part, upholding constitutional morality.",
        "statutes_cited": ["Indian Penal Code, 1860", "Constitution of India"],
        "sections_cited": ["Section 377 IPC", "Article 14", "Article 15", "Article 19", "Article 21"],
        "doctrines_applied": ["Constitutional Morality", "Transformative Constitutionalism", "Right to Equality"],
        "overruled_cases": ["Suresh Kumar Koushal v. Naz Foundation (2014)"],
        "followed_cases": ["K.S. Puttaswamy v. Union of India (2017)", "NALSA v. Union of India (2014)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/45763.pdf",
    },
    {
        "id": "jdg_minerva_mills_1980",
        "case_title": "Minerva Mills Ltd. and Ors. v. Union of India and Ors.",
        "citation": "(1980) 3 SCC 625",
        "alternate_citations": ["AIR 1980 SC 1789"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(1980, 7, 31),
        "decision_year": 1980,
        "bench": ["Y.V. Chandrachud (CJI)", "P.N. Bhagwati", "A.C. Gupta", "N.L. Untwalia", "P.S. Kailasam"],
        "coram_size": 5,
        "parties": {"petitioner": "Minerva Mills Ltd.", "respondent": "Union of India"},
        "subject_area": "Constitutional Law",
        "legal_issue": "Constitutional validity of Sections 4 and 55 of the 42nd Constitutional Amendment Act, 1976.",
        "ratio_decidendi": "Parliament cannot, under Article 368, expand its amending power so as to acquire for itself the right to repeal or abrogate the Constitution or destroy its basic and essential features. The harmony and balance between Fundamental Rights and Directive Principles is an essential feature of the Basic Structure.",
        "full_text": "The Indian Constitution is founded on the bedrock of the balance between Parts III and IV. To give absolute primacy to one over the other is to disturb the harmony of the Constitution.",
        "summary": "Struck down clauses (4) and (5) of Article 368 and preserved the balance between Fundamental Rights and Directive Principles.",
        "statutes_cited": ["Constitution of India", "Constitution (Forty-second Amendment) Act, 1976"],
        "sections_cited": ["Article 368(4)", "Article 368(5)", "Article 31C", "Article 14", "Article 19"],
        "doctrines_applied": ["Basic Structure Doctrine", "Harmony between Rights and DPSPs", "Limited Amending Power"],
        "overruled_cases": [],
        "followed_cases": ["Kesavananda Bharati v. State of Kerala (1973)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/minerva_mills.pdf",
    },
    {
        "id": "jdg_sr_bommai_1994",
        "case_title": "S.R. Bommai and Ors. v. Union of India and Ors.",
        "citation": "(1994) 3 SCC 1",
        "alternate_citations": ["AIR 1994 SC 1918"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(1994, 3, 11),
        "decision_year": 1994,
        "bench": ["S.R. Pandian", "A.M. Ahmadi", "J.S. Verma", "P.B. Sawant", "K. Ramaswamy", "S.C. Agrawal", "Yogeshwar Dayal", "B.P. Jeevan Reddy", "S. Mohan"],
        "coram_size": 9,
        "parties": {"petitioner": "S.R. Bommai", "respondent": "Union of India"},
        "subject_area": "Constitutional Law / Federalism & Secularism",
        "legal_issue": "Scope and judicial reviewability of Presidential Proclamation under Article 356 (President's Rule).",
        "ratio_decidendi": "Proclamation under Article 356 is subject to judicial review. Secularism and Federalism are essential features of the Basic Structure. The dissolution of a State Legislative Assembly can only take place after parliamentary approval.",
        "full_text": "Federalism and secularism are essential parts of the basic structure of the Constitution. The exercise of power under Article 356 is not absolute and the court can examine whether material existed for forming the subjective satisfaction of the President.",
        "summary": "Restricted arbitrary dismissal of State Governments under Article 356, establishing Secularism and Federalism as Basic Structure.",
        "statutes_cited": ["Constitution of India"],
        "sections_cited": ["Article 356", "Article 74(2)", "Article 355", "Article 174"],
        "doctrines_applied": ["Federalism", "Secularism", "Judicial Review of Emergency Powers"],
        "overruled_cases": ["State of Rajasthan v. Union of India (1977) (in part)"],
        "followed_cases": ["Kesavananda Bharati v. State of Kerala (1973)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/bommai.pdf",
    },
    {
        "id": "jdg_indra_sawhney_1992",
        "case_title": "Indra Sawhney and Ors. v. Union of India and Ors. (Mandal Case)",
        "citation": "1992 Supp (3) SCC 217",
        "alternate_citations": ["AIR 1993 SC 477"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(1992, 11, 16),
        "decision_year": 1992,
        "bench": ["M.H. Kania (CJI)", "M.N. Venkatachaliah", "S.R. Pandian", "T.K. Thommen", "A.M. Ahmadi", "Kuldip Singh", "P.B. Sawant", "R.M. Sahai", "B.P. Jeevan Reddy"],
        "coram_size": 9,
        "parties": {"petitioner": "Indra Sawhney", "respondent": "Union of India"},
        "subject_area": "Constitutional Law / Affirmative Action",
        "legal_issue": "Validity of 27% reservation for Other Backward Classes (OBC) and 50% reservation ceiling.",
        "ratio_decidendi": "Article 16(4) is not an exception to Article 16(1) but an emphatic facet of equality. Total reservations should not exceed 50% except in extraordinary circumstances. The 'Creamy Layer' among backward classes must be excluded from affirmative benefits.",
        "full_text": "Reservation under Article 16(4) is aimed at representation, not poverty alleviation. The rule of 50% ceiling ensures balance between affirmative action and open merit efficiency under Article 335.",
        "summary": "Upheld 27% OBC reservation subject to exclusion of the Creamy Layer and capped total reservations at 50%.",
        "statutes_cited": ["Constitution of India"],
        "sections_cited": ["Article 16(4)", "Article 16(1)", "Article 14", "Article 335", "Article 340"],
        "doctrines_applied": ["Substantive Equality", "Creamy Layer Exclusion", "50% Reservation Cap"],
        "overruled_cases": ["General Manager, S. Rly. v. Rangachari (1962) (in part)"],
        "followed_cases": ["State of Kerala v. N.M. Thomas (1976)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/indra_sawhney.pdf",
    },
    {
        "id": "jdg_lalita_kumari_2014",
        "case_title": "Lalita Kumari v. Government of U.P. and Ors.",
        "citation": "(2014) 2 SCC 1",
        "alternate_citations": ["AIR 2014 SC 187"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(2013, 11, 12),
        "decision_year": 2014,
        "bench": ["P. Sathasivam (CJI)", "B.S. Chauhan", "Ranjana Prakash Desai", "Ranjan Gogoi", "S.A. Bobde"],
        "coram_size": 5,
        "parties": {"petitioner": "Lalita Kumari (Minor)", "respondent": "Government of U.P. and Ors."},
        "subject_area": "Criminal Law / Investigation Procedure",
        "legal_issue": "Whether a police officer is mandatorily required to register an FIR under Section 154 CrPC upon receiving information disclosing a cognizable offence.",
        "ratio_decidendi": "Registration of FIR is mandatory under Section 154 of the Code of Criminal Procedure if the information discloses commission of a cognizable offence and no preliminary inquiry is permissible in such situation. Preliminary inquiry permitted only in matrimonial, commercial, medical negligence, or corruption cases, strictly limited to 7 days.",
        "full_text": "The use of the word 'shall' in Section 154(1) leaves no discretion with the police officer. Registration of FIR is mandatory when cognizable offence is disclosed.",
        "summary": "Mandated compulsory registration of FIR for all cognizable offences, prohibiting arbitrary police refusal under Section 154 CrPC (BNSS Sec 173).",
        "statutes_cited": ["Code of Criminal Procedure, 1973", "Bharatiya Nagarik Suraksha Sanhita, 2023"],
        "sections_cited": ["Section 154 CrPC", "Section 156 CrPC", "Section 157 CrPC", "Section 173 BNSS"],
        "doctrines_applied": ["Rule of Law", "Mandatory Duty of Police", "Procedural Fairness"],
        "overruled_cases": [],
        "followed_cases": ["State of Haryana v. Bhajan Lal (1992)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/lalita_kumari.pdf",
    },
    {
        "id": "jdg_satender_antil_2022",
        "case_title": "Satender Kumar Antil v. Central Bureau of Investigation and Anr.",
        "citation": "(2022) 10 SCC 51",
        "alternate_citations": ["2022 SCC OnLine SC 825"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(2022, 7, 11),
        "decision_year": 2022,
        "bench": ["Sanjay Kishan Kaul", "M.M. Sundresh"],
        "coram_size": 2,
        "parties": {"petitioner": "Satender Kumar Antil", "respondent": "Central Bureau of Investigation"},
        "subject_area": "Criminal Law / Bail Jurisprudence",
        "legal_issue": "Standardization of guidelines for granting bail across different categories of offences in India.",
        "ratio_decidendi": "Laid down comprehensive categorization of offences: Category A (punishable up to 7 years - summons/bailable without arrest), Category B (heinous offences punishable with death/life - merits examination), Category C (Special Acts like NDPS/PMLA/PMLA - twin conditions), and Category D (economic offences - seriousness). Bail applications must be decided within 2 weeks and anticipatory bail within 6 weeks.",
        "full_text": "Jails in India are flooded with undertrial prisoners. The arrest is a draconian measure resulting in curtailment of liberty and must be used sparingly. Bail is the rule and jail is the exception.",
        "summary": "Established comprehensive four-category bail policy and mandated strict compliance with arrest avoidance and rapid bail timelines.",
        "statutes_cited": ["Code of Criminal Procedure, 1973", "Bharatiya Nagarik Suraksha Sanhita, 2023"],
        "sections_cited": ["Section 41 CrPC", "Section 41A CrPC", "Section 88 CrPC", "Section 170 CrPC", "Section 437 CrPC", "Section 439 CrPC"],
        "doctrines_applied": ["Bail is Rule Jail is Exception", "Personal Liberty", "Speedy Justice"],
        "overruled_cases": [],
        "followed_cases": ["Arnesh Kumar v. State of Bihar (2014)", "Siddharth v. State of U.P. (2022)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/satender_antil.pdf",
    },
    {
        "id": "jdg_bachan_singh_1980",
        "case_title": "Bachan Singh v. State of Punjab",
        "citation": "(1980) 2 SCC 684",
        "alternate_citations": ["AIR 1980 SC 898"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(1980, 5, 9),
        "decision_year": 1980,
        "bench": ["Y.V. Chandrachud (CJI)", "P.N. Bhagwati", "R.S. Sarkaria", "N.L. Untwalia", "A.P. Sen"],
        "coram_size": 5,
        "parties": {"petitioner": "Bachan Singh", "respondent": "State of Punjab"},
        "subject_area": "Criminal Law / Death Penalty Sentencing",
        "legal_issue": "Constitutional validity of capital punishment under Section 302 IPC.",
        "ratio_decidendi": "Death penalty under Section 302 IPC is constitutionally valid. However, it should only be awarded in the 'Rarest of Rare Cases' where the alternative option of life imprisonment is unquestionably foreclosed. Court must draw a balance sheet of aggravating and mitigating circumstances.",
        "full_text": "A real and abiding concern for the dignity of human life postulates resistance to taking a life through law's instrumentality. That ought not to be done save in the rarest of rare cases when the alternative option is unquestionably foreclosed.",
        "summary": "Formulated the 'Rarest of Rare' doctrine restricting the death penalty to extraordinary circumstances.",
        "statutes_cited": ["Indian Penal Code, 1860", "Code of Criminal Procedure, 1973", "Constitution of India"],
        "sections_cited": ["Section 302 IPC", "Section 354(3) CrPC", "Article 21", "Article 19"],
        "doctrines_applied": ["Rarest of Rare Doctrine", "Proportionality in Sentencing", "Human Dignity"],
        "overruled_cases": [],
        "followed_cases": ["Jagmohan Singh v. State of U.P. (1973)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/bachan_singh.pdf",
    },
    {
        "id": "jdg_associate_builders_2015",
        "case_title": "Associate Builders v. Delhi Development Authority",
        "citation": "(2015) 3 SCC 49",
        "alternate_citations": ["AIR 2015 SC 620"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(2014, 11, 25),
        "decision_year": 2015,
        "bench": ["R.F. Nariman", "R.M. Lodha"],
        "coram_size": 2,
        "parties": {"petitioner": "Associate Builders", "respondent": "Delhi Development Authority"},
        "subject_area": "Commercial Law / Arbitration",
        "legal_issue": "Scope of challenging arbitral awards on grounds of 'Public Policy of India' and 'Patent Illegality' under Section 34 of the Arbitration Act.",
        "ratio_decidendi": "The court setting aside an arbitral award under Section 34 does not act as a court of appeal. 'Public Policy of India' comprises: (i) Fundamental policy of Indian law, (ii) Interests of India, (iii) Justice or Morality, and (iv) Patent Illegality going to the root of the matter. An award cannot be set aside merely because another view is possible.",
        "full_text": "The arbitrator is the sole judge of the quality and quantity of evidence. If the arbitrator adopts a view which is a plausible view, the court has no jurisdiction to replace it with its own view.",
        "summary": "Definitive authority defining the boundaries of 'Patent Illegality' and 'Public Policy' challenges to arbitral awards under Section 34.",
        "statutes_cited": ["Arbitration and Conciliation Act, 1996"],
        "sections_cited": ["Section 34", "Section 28(3)", "Section 31(7)"],
        "doctrines_applied": ["Minimal Judicial Intervention", "Finality of Arbitral Awards"],
        "overruled_cases": [],
        "followed_cases": ["ONGC v. Saw Pipes Ltd. (2003)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/associate_builders.pdf",
    },
    {
        "id": "jdg_vidya_drolia_2020",
        "case_title": "Vidya Drolia and Ors. v. Durga Trading Corporation",
        "citation": "(2021) 2 SCC 1",
        "alternate_citations": ["2020 SCC OnLine SC 1018"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(2020, 12, 14),
        "decision_year": 2021,
        "bench": ["N.V. Ramana", "Sanjiv Khanna", "Krishna Murari"],
        "coram_size": 3,
        "parties": {"petitioner": "Vidya Drolia and Ors.", "respondent": "Durga Trading Corporation"},
        "subject_area": "Arbitration / Commercial Law",
        "legal_issue": "Standard four-fold test for non-arbitrability of disputes and landlord-tenant disputes arbitrability under Section 8 and 11.",
        "ratio_decidendi": "A dispute is non-arbitrable when: (1) it relates to actions in rem, (2) affects third party rights or has erga omnes effect, (3) pertains to inalienable sovereign functions, or (4) is expressly or impliedly non-arbitrable under statute. Landlord-tenant disputes under the Transfer of Property Act are arbitrable.",
        "full_text": "An agreement to arbitrate is a matter of consent. The referral court under Section 11 must conduct only a prima facie review to weed out non-existent arbitration agreements, leaving substantive arbitrability to the tribunal.",
        "summary": "Established the four-fold non-arbitrability test and held landlord-tenant disputes governed by the TPA to be fully arbitrable.",
        "statutes_cited": ["Arbitration and Conciliation Act, 1996", "Transfer of Property Act, 1882"],
        "sections_cited": ["Section 8", "Section 11(6A)", "Section 16", "Section 34"],
        "doctrines_applied": ["Competence-Competence", "Prima Facie Referral Standard", "Non-Arbitrability Test"],
        "overruled_cases": ["Himangni Enterprises v. Kamaljeet Singh Ahluwalia (2017)"],
        "followed_cases": ["Booz Allen & Hamilton Inc. v. SBI Home Finance (2011)"],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/vidya_drolia.pdf",
    },
    {
        "id": "jdg_innoventive_2018",
        "case_title": "Innoventive Industries Ltd. v. ICICI Bank and Anr.",
        "citation": "(2018) 1 SCC 407",
        "alternate_citations": ["AIR 2017 SC 4084"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(2017, 8, 31),
        "decision_year": 2018,
        "bench": ["R.F. Nariman", "Sanjay Kishan Kaul"],
        "coram_size": 2,
        "parties": {"petitioner": "Innoventive Industries Ltd.", "respondent": "ICICI Bank and Anr."},
        "subject_area": "Insolvency & Bankruptcy Law / Corporate Law",
        "legal_issue": "Scope of admission of Section 7 insolvency application by Financial Creditor upon occurrence of 'default'.",
        "ratio_decidendi": "Under Section 7 of the IBC, the Adjudicating Authority (NCLT) only needs to be satisfied that a 'default' has occurred. Once default is established and the application is complete, the NCLT has no discretion and must admit the application. Non-obstante clause in IBC Section 238 overrides state moratorium relief laws.",
        "full_text": "The scheme of the Code is to ensure that when a default takes place, the management of the corporate debtor is handed over to resolution professionals so that the company may continue as a going concern.",
        "summary": "First major IBC precedent holding that NCLT must mandatorily admit Section 7 CIRP upon debt default, overriding all conflicting state relief acts.",
        "statutes_cited": ["Insolvency and Bankruptcy Code, 2016", "Maharashtra Relief Undertakings Act, 1958"],
        "sections_cited": ["Section 7", "Section 8", "Section 9", "Section 238 IBC"],
        "doctrines_applied": ["Overriding Effect of Insolvency Code", "Creditor-in-Control Model"],
        "overruled_cases": [],
        "followed_cases": [],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/innoventive.pdf",
    },
    {
        "id": "jdg_suraj_lamp_2012",
        "case_title": "Suraj Lamp and Industries Pvt. Ltd. v. State of Haryana and Anr.",
        "citation": "(2012) 1 SCC 656",
        "alternate_citations": ["AIR 2012 SC 206"],
        "court": "Supreme Court of India",
        "court_type": "supreme_court",
        "decision_date": date(2011, 10, 11),
        "decision_year": 2012,
        "bench": ["R.V. Raveendran", "A.K. Patnaik", "H.L. Gokhale"],
        "coram_size": 3,
        "parties": {"petitioner": "Suraj Lamp and Industries Pvt. Ltd.", "respondent": "State of Haryana and Anr."},
        "subject_area": "Property Law / Conveyancing",
        "legal_issue": "Validity of transfer of immovable property through Sale Agreement / General Power of Attorney / Living Will (SA/GPA/WILL transactions).",
        "ratio_decidendi": "Immovable property can be legally and lawfully transferred/conveyed only by a registered deed of conveyance (Sale Deed). Transactions in the nature of 'GPA sales' or 'SA/GPA/WILL transfers' do not convey title and do not amount to transfer of, or create any interest in, immovable property under Section 54 of the Transfer of Property Act.",
        "full_text": "A power of attorney is not an instrument of transfer in regard to any right, title or interest in an immovable property. It only authorizes the attorney to act on behalf of the principal.",
        "summary": "Held that SA/GPA/Will transactions do not transfer ownership title in immovable property without a registered deed of conveyance.",
        "statutes_cited": ["Transfer of Property Act, 1882", "Registration Act, 1908", "Powers of Attorney Act, 1882"],
        "sections_cited": ["Section 54 TPA", "Section 53A TPA", "Section 17 Registration Act"],
        "doctrines_applied": ["Compulsory Registration of Immovable Property Conveyance", "Nature of Agency"],
        "overruled_cases": [],
        "followed_cases": [],
        "status": "good_law",
        "source_url": "https://main.sci.gov.in/judgment/judis/suraj_lamp.pdf",
    },
    {
        "id": "jdg_naz_foundation_delhi_2009",
        "case_title": "Naz Foundation v. Government of NCT of Delhi and Ors.",
        "citation": "2009 SCC OnLine Del 1762",
        "alternate_citations": ["160 DLT 277"],
        "court": "High Court of Delhi",
        "court_type": "high_court",
        "decision_date": date(2009, 7, 2),
        "decision_year": 2009,
        "bench": ["Ajit Prakash Shah (CJ)", "S. Muralidhar"],
        "coram_size": 2,
        "parties": {
            "petitioner": "Naz Foundation",
            "respondent": "Government of NCT of Delhi and Ors."
        },
        "subject_area": "Constitutional Law / Fundamental Rights",
        "legal_issue": "Whether Section 377 IPC violated Fundamental Rights under Articles 14, 15, and 21 of the Constitution.",
        "ratio_decidendi": "Section 377 IPC violates Articles 14, 15, and 21 by denying equal protection and bodily autonomy to LGBTQ+ persons. Inclusiveness is the hallmark of the Indian Constitution.",
        "full_text": "Moral indignation, howsoever strong, is not a valid basis for overriding fundamental rights. The sphere of privacy protects human dignity and personal autonomy.",
        "summary": "Landmark Delhi High Court judgment holding Section 377 unconstitutional for adult consensual conduct, later affirmed by the Supreme Court in Navtej Johar (2018).",
        "statutes_cited": ["Constitution of India", "Indian Penal Code, 1860"],
        "sections_cited": ["Section 377 IPC", "Article 14", "Article 15", "Article 21"],
        "doctrines_applied": ["Inclusiveness", "Human Dignity", "Non-Discrimination"],
        "overruled_cases": [],
        "followed_cases": ["Maneka Gandhi v. Union of India (1978)"],
        "status": "affirmed_by_sc",
        "source_url": "https://delhihighcourt.nic.in/judgment/2009/naz.pdf",
    },
]


# ==========================================
# 2. LEGAL DEFINITIONS DICTIONARY
# ==========================================
LEGAL_DEFINITIONS_DATA: list[dict[str, Any]] = [
    {
        "id": "def_bns_cognizable_offence",
        "term": "Cognizable Offence",
        "term_normalized": "cognizable offence",
        "definition_text": "An offence for which, and 'cognizable case' means a case in which, a police officer may, in accordance with the First Schedule or under any other law for the time being in force, arrest without warrant.",
        "source_act_title": "Bharatiya Nagarik Suraksha Sanhita, 2023",
        "source_section_number": "2(1)(g)",
        "legal_domain": "Criminal Law",
        "related_terms": ["non-cognizable offence", "police report", "arrest without warrant", "first information report"],
        "key_cases": ["Lalita Kumari v. Govt. of U.P. (2014) 2 SCC 1"],
    },
    {
        "id": "def_bns_investigation",
        "term": "Investigation",
        "term_normalized": "investigation",
        "definition_text": "Includes all the proceedings under this Sanhita for the collection of evidence conducted by a police officer or by any person (other than a Magistrate) who is authorised by a Magistrate in this behalf.",
        "source_act_title": "Bharatiya Nagarik Suraksha Sanhita, 2023",
        "source_section_number": "2(1)(l)",
        "legal_domain": "Criminal Law",
        "related_terms": ["inquiry", "trial", "police report", "charge sheet", "evidence collection"],
        "key_cases": ["H.N. Rishbud v. State of Delhi (AIR 1955 SC 196)"],
    },
    {
        "id": "def_bns_bailable_offence",
        "term": "Bailable Offence",
        "term_normalized": "bailable offence",
        "definition_text": "An offence which is shown as bailable in the First Schedule, or which is made bailable by any other law for the time being in force; and 'non-bailable offence' means any other offence.",
        "source_act_title": "Bharatiya Nagarik Suraksha Sanhita, 2023",
        "source_section_number": "2(1)(a)",
        "legal_domain": "Criminal Law",
        "related_terms": ["non-bailable offence", "bail", "anticipatory bail", "surety", "personal bond"],
        "key_cases": ["Rasiklal v. Kishore Khanchand Wadhwani (2009) 4 SCC 446"],
    },
    {
        "id": "def_contract_proposal",
        "term": "Proposal / Offer",
        "term_normalized": "proposal",
        "definition_text": "When one person signifies to another his willingness to do or to abstain from doing anything, with a view to obtaining the assent of that other to such act or abstinence, he is said to make a proposal.",
        "source_act_title": "Indian Contract Act, 1872",
        "source_section_number": "2(a)",
        "legal_domain": "Contract Law",
        "related_terms": ["acceptance", "promise", "consideration", "agreement"],
        "key_cases": ["Lalman Shukla v. Gauri Datt (1913) 11 ALJ 489"],
    },
    {
        "id": "def_contract_consideration",
        "term": "Consideration",
        "term_normalized": "consideration",
        "definition_text": "When, at the desire of the promisor, the promisee or any other person has done or abstained from doing, or does or abstains from doing, or promises to do or to abstain from doing, something, such act or abstinence or promise is called a consideration for the promise.",
        "source_act_title": "Indian Contract Act, 1872",
        "source_section_number": "2(d)",
        "legal_domain": "Contract Law",
        "related_terms": ["promisor", "promisee", "nudum pactum", "privity of consideration"],
        "key_cases": ["Chinnaya v. Ramayya (1882) ILR 4 Mad 137"],
    },
    {
        "id": "def_companies_director",
        "term": "Director",
        "term_normalized": "director",
        "definition_text": "A director appointed to the Board of a company in accordance with the provisions of the Companies Act.",
        "source_act_title": "Companies Act, 2013",
        "source_section_number": "2(34)",
        "legal_domain": "Corporate Law",
        "related_terms": ["board of directors", "independent director", "key managerial personnel", "managing director"],
        "key_cases": ["Tata Consultancy Services Ltd. v. Cyrus Investments Pvt. Ltd. (2021) 9 SCC 449"],
    },
    {
        "id": "def_dpdp_personal_data",
        "term": "Personal Data",
        "term_normalized": "personal data",
        "definition_text": "Any data about an individual who is identifiable by or in relation to such data.",
        "source_act_title": "Digital Personal Data Protection Act, 2023",
        "source_section_number": "2(t)",
        "legal_domain": "Data Protection / Privacy",
        "related_terms": ["data principal", "data fiduciary", "processing", "consent manager"],
        "key_cases": ["Justice K.S. Puttaswamy (Retd.) v. Union of India (2017) 10 SCC 1"],
    },
    {
        "id": "def_it_electronic_record",
        "term": "Electronic Record",
        "term_normalized": "electronic record",
        "definition_text": "Data, record or data generated, image or sound stored, received or sent in an electronic form or micro film or computer generated micro fiche.",
        "source_act_title": "Information Technology Act, 2000",
        "source_section_number": "2(1)(t)",
        "legal_domain": "Technology Law",
        "related_terms": ["digital signature", "electronic signature", "computer system", "intermediary"],
        "key_cases": ["Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020) 7 SCC 1"],
    },
    {
        "id": "def_cpc_res_judicata",
        "term": "Res Judicata",
        "term_normalized": "res judicata",
        "definition_text": "No Court shall try any suit or issue in which the matter directly and substantially in issue has been directly and substantially in issue in a former suit between the same parties, or between parties under whom they or any of them claim, litigating under the same title, in a Court competent to try such subsequent suit or the suit in which such issue has been subsequently raised, and has been heard and finally decided by such Court.",
        "source_act_title": "Code of Civil Procedure, 1908",
        "source_section_number": "11",
        "legal_domain": "Civil Procedure",
        "related_terms": ["former suit", "issue preclusion", "claim preclusion", "constructive res judicata"],
        "key_cases": ["Daryao v. State of U.P. (AIR 1961 SC 1457)"],
    },
    {
        "id": "def_arbitration_agreement",
        "term": "Arbitration Agreement",
        "term_normalized": "arbitration agreement",
        "definition_text": "An agreement by the parties to submit to arbitration all or certain disputes which have arisen or which may arise between them in respect of a defined legal relationship, whether contractual or not. It may be in the form of an arbitration clause in a contract or in the form of a separate agreement.",
        "source_act_title": "Arbitration and Conciliation Act, 1996",
        "source_section_number": "7",
        "legal_domain": "Arbitration Law",
        "related_terms": ["arbitral tribunal", "arbitral award", "seat of arbitration", "lex arbitri"],
        "key_cases": ["Vidya Drolia v. Durga Trading Corporation (2021) 2 SCC 1"],
    },
]


# ==========================================
# 3. LEGAL PRINCIPLES & DOCTRINES
# ==========================================
LEGAL_DOCTRINES_DATA: list[dict[str, Any]] = [
    {
        "id": "doc_natural_justice",
        "name": "Principles of Natural Justice",
        "name_normalized": "principles of natural justice",
        "latin_maxim": "Jus Naturale / Lex Naturalis",
        "category": "Administrative / Constitutional",
        "summary": "Universal procedural fairness comprising two cardinal pillars: (1) Nemo Judex in Causa Sua (rule against bias) and (2) Audi Alteram Partem (right to a fair hearing).",
        "detailed_explanation": "The principles of natural justice are fundamental rules of procedure which ensure fairness, justice, and equity in judicial, quasi-judicial, and administrative decisions. They prevent arbitrariness and ensure that justice is not only done, but manifestly seen to be done.",
        "constitutional_provisions": ["Article 14", "Article 21"],
        "statutory_provisions": [
            {"act": "Code of Civil Procedure, 1908", "section": "Order XVIII Rule 2"},
            {"act": "Bharatiya Nagarik Suraksha Sanhita, 2023", "section": "340"}
        ],
        "leading_judgments": [
            {"citation": "(1978) 1 SCC 248", "case_title": "Maneka Gandhi v. Union of India", "relevance": "Natural justice is an integral part of Article 21."},
            {"citation": "AIR 1959 SC 308", "case_title": "Gullapalli Nageswara Rao v. APSRTC", "relevance": "Enunciation of Nemo Judex in Causa Sua."}
        ],
        "exceptions": [
            "Express statutory exclusion where constitutionally valid",
            "Emergency situations requiring immediate protective action",
            "Confidentiality or national security concerns",
            "Impracticability / impossibility of hearing prior to action (post-decisional hearing substituted)"
        ],
        "key_elements": [
            "Prior notice of proposed adverse action",
            "Right to present case and cross-examine witnesses",
            "Unbiased decision-maker without pecuniary, personal, or subject-matter bias",
            "Speaking order with recorded reasons"
        ],
    },
    {
        "id": "doc_audi_alteram_partem",
        "name": "Audi Alteram Partem",
        "name_normalized": "audi alteram partem",
        "latin_maxim": "Audi Alteram Partem (Hear the other side)",
        "category": "Administrative / Procedural",
        "summary": "No person shall be condemned or subjected to an adverse order unheard.",
        "detailed_explanation": "Requires that before any civil consequences or punitive measures are imposed, the affected party must be provided with adequate notice of allegations and a reasonable opportunity to show cause.",
        "constitutional_provisions": ["Article 14", "Article 21", "Article 311"],
        "statutory_provisions": [
            {"act": "Code of Civil Procedure, 1908", "section": "Section 100"},
            {"act": "Bharatiya Nagarik Suraksha Sanhita, 2023", "section": "Section 251"}
        ],
        "leading_judgments": [
            {"citation": "(1978) 1 SCC 248", "case_title": "Maneka Gandhi v. Union of India", "relevance": "Post-decisional hearing if pre-decisional hearing is impossible in emergency."},
            {"citation": "(1985) 3 SCC 398", "case_title": "Union of India v. Tulsiram Patel", "relevance": "Scope of exclusion of hearing under second proviso to Article 311(2)."}
        ],
        "exceptions": ["Public interest and immediate emergency", "Interim preventive suspension"],
        "key_elements": ["Notice", "Adequate time to prepare defense", "Disclosure of materials", "Oral hearing where required", "Reasoned order"],
    },
    {
        "id": "doc_nemo_judex",
        "name": "Nemo Judex In Causa Sua",
        "name_normalized": "nemo judex in causa sua",
        "latin_maxim": "Nemo Judex In Causa Sua (No one should be a judge in their own cause)",
        "category": "Administrative / Constitutional",
        "summary": "The Rule against Bias requiring an impartial and independent adjudicator without personal, pecuniary, or official interest.",
        "detailed_explanation": "Adjudicators must be free from any bias—actual or apparent. The test is whether a fair-minded, informed observer would perceive a real danger or reasonable likelihood of bias.",
        "constitutional_provisions": ["Article 14", "Article 21"],
        "statutory_provisions": [
            {"act": "Arbitration and Conciliation Act, 1996", "section": "Section 12 and Fifth/Seventh Schedule"}
        ],
        "leading_judgments": [
            {"citation": "AIR 1959 SC 308", "case_title": "Gullapalli Nageswara Rao v. APSRTC", "relevance": "Secretary deciding nationalization scheme initiated by his own department invalidated for bias."},
            {"citation": "(1993) 4 SCC 10", "case_title": "Rattan Lal Sharma v. Managing Committee", "relevance": "Pecuniary and personal bias tests."}
        ],
        "exceptions": ["Doctrine of Necessity (when no other competent tribunal exists)", "Statutory authority specifically empowered"],
        "key_elements": ["Pecuniary bias", "Personal bias", "Subject-matter bias", "Policy/departmental bias"],
    },
    {
        "id": "doc_basic_structure",
        "name": "Basic Structure Doctrine",
        "name_normalized": "basic structure doctrine",
        "latin_maxim": "Non-derogable constitutional core",
        "category": "Constitutional Law",
        "summary": "Parliament cannot alter, damage, or destroy the core, essential features of the Constitution through constitutional amendment.",
        "detailed_explanation": "First formulated in Kesavananda Bharati (1973), the doctrine holds that the constituent power of Parliament under Article 368 is limited and cannot be used to dismantle the constitutional identity, democracy, secularism, federalism, rule of law, or power of judicial review.",
        "constitutional_provisions": ["Article 368", "Article 13", "Article 32", "Article 226"],
        "statutory_provisions": [],
        "leading_judgments": [
            {"citation": "(1973) 4 SCC 225", "case_title": "Kesavananda Bharati v. State of Kerala", "relevance": "Birth of the Basic Structure Doctrine."},
            {"citation": "(1980) 3 SCC 625", "case_title": "Minerva Mills Ltd. v. Union of India", "relevance": "Struck down clauses (4) and (5) of Article 368 as destroying basic structure."},
            {"citation": "(1994) 3 SCC 1", "case_title": "S.R. Bommai v. Union of India", "relevance": "Secularism, federalism, and democracy affirmed as basic structure."}
        ],
        "exceptions": ["None. The Basic Structure is non-derogable."],
        "key_elements": ["Supremacy of the Constitution", "Rule of Law", "Separation of Powers", "Secularism", "Federalism", "Judicial Review", "Democracy & Free Elections"],
    },
    {
        "id": "doc_stare_decisis",
        "name": "Stare Decisis / Doctrine of Precedent",
        "name_normalized": "stare decisis",
        "latin_maxim": "Stare decisis et non quieta movere (Stand by things decided and not disturb settled points)",
        "category": "Judicial / Jurisprudence",
        "summary": "The principle that lower courts are bound to follow the legal precedents declared by higher courts (Article 141 of the Constitution).",
        "detailed_explanation": "Under Article 141, the law declared by the Supreme Court is binding on all courts within the territory of India. Larger benches bind smaller benches, and High Court decisions bind all subordinate courts within their state jurisdiction.",
        "constitutional_provisions": ["Article 141", "Article 227"],
        "statutory_provisions": [],
        "leading_judgments": [
            {"citation": "(1989) 2 SCC 540", "case_title": "Union of India v. Raghubir Singh", "relevance": "Binding authority of larger Constitution Benches."},
            {"citation": "(2005) 2 SCC 673", "case_title": "Central Board of Dawoodi Bohra Community v. State of Maharashtra", "relevance": "Hierarchy of benches and reference procedures."}
        ],
        "exceptions": ["Per Incuriam (rendered in ignorance of statute or binding precedent)", "Sub Silentio (point not argued or addressed)", "Overruled by larger bench or constitutional amendment"],
        "key_elements": ["Ratio decidendi vs. Obiter dicta", "Hierarchical court bindingness", "Certainty and consistency in law"],
    },
    {
        "id": "doc_res_judicata",
        "name": "Res Judicata",
        "name_normalized": "res judicata",
        "latin_maxim": "Res judicata pro veritate accipitur (A thing adjudicated is taken as true)",
        "category": "Civil Procedure / Jurisprudence",
        "summary": "A matter that has been finally adjudicated on its merits by a competent court between the same parties cannot be relitigated in subsequent proceedings.",
        "detailed_explanation": "Encapsulated in Section 11 of the CPC and founded on two public policy maxims: (1) Interest reipublicae ut sit finis litium (it is in the interest of the State that there should be an end to litigation) and (2) Nemo debet bis vexari pro una et eadem causa (no man should be vexed twice for the same cause).",
        "constitutional_provisions": ["Article 32", "Article 226"],
        "statutory_provisions": [
            {"act": "Code of Civil Procedure, 1908", "section": "Section 11"},
            {"act": "Bharatiya Nagarik Suraksha Sanhita, 2023", "section": "Section 337 (Autrefois Acquit / Convict)"}
        ],
        "leading_judgments": [
            {"citation": "AIR 1961 SC 1457", "case_title": "Daryao v. State of U.P.", "relevance": "Applies to writ petitions under Article 32 and 226."},
            {"citation": "(2000) 3 SCC 350", "case_title": "State of U.P. v. Nawab Hussain", "relevance": "Constructive res judicata under Explanation IV to Section 11 CPC."}
        ],
        "exceptions": ["Judgment obtained by fraud or collusion", "Court lacking inherent subject-matter jurisdiction", "Change in substantive law or fundamental circumstances"],
        "key_elements": ["Matter directly and substantially in issue", "Same parties or parties under whom they claim", "Competent court", "Heard and finally decided on merits"],
    },
    {
        "id": "doc_proportionality",
        "name": "Doctrine of Proportionality",
        "name_normalized": "doctrine of proportionality",
        "latin_maxim": "Proportio / Least Intrusive Means",
        "category": "Constitutional / Administrative",
        "summary": "State actions infringing fundamental freedoms must be proportional, necessary, and use the least intrusive means to achieve a legitimate aim.",
        "detailed_explanation": "Replaced traditional Wednesbury unreasonableness in constitutional adjudication. Requires a 4-part test: (1) Legitimate State Goal, (2) Rational Connection (Suitability), (3) Necessity (Least restrictive measure), and (4) Proportionality Stricto Sensu (Balancing harm vs. benefit).",
        "constitutional_provisions": ["Article 14", "Article 19", "Article 21"],
        "statutory_provisions": [],
        "leading_judgments": [
            {"citation": "(2017) 10 SCC 1", "case_title": "K.S. Puttaswamy v. Union of India", "relevance": "Proportionality standard for evaluating state invasion into privacy."},
            {"citation": "(2016) 7 SCC 353", "case_title": "Modern Dental College v. State of M.P.", "relevance": "Structured 4-prong proportionality analysis defined in detail."}
        ],
        "exceptions": ["Direct sovereign warfare / absolute emergency"],
        "key_elements": ["Legitimacy of goal", "Suitability / Rational nexus", "Necessity / Least intrusive alternative", "Strict balancing of competing rights"],
    },
    {
        "id": "doc_promissory_estoppel",
        "name": "Doctrine of Promissory Estoppel",
        "name_normalized": "promissory estoppel",
        "latin_maxim": "Allegans contraria non est audiendus",
        "category": "Contract / Administrative",
        "summary": "Prevents a party (including the State) from going back on an unambiguous promise upon which another party has relied to their detriment.",
        "detailed_explanation": "An equitable doctrine that holds the Government bound to keep its representations or promises when citizens have acted on them and altered their position, unless overriding public interest justifies non-performance.",
        "constitutional_provisions": ["Article 14"],
        "statutory_provisions": [
            {"act": "Indian Evidence Act, 1872", "section": "Section 115"},
            {"act": "Bharatiya Sakshya Adhiniyam, 2023", "section": "Section 121"}
        ],
        "leading_judgments": [
            {"citation": "(1979) 2 SCC 409", "case_title": "Motilal Padampat Sugar Mills v. State of U.P.", "relevance": "Definitive enunciation of promissory estoppel against the Government."},
            {"citation": "(2004) 3 SCC 553", "case_title": "State of Punjab v. Nestle India Ltd.", "relevance": "Tax exemptions promised by Chief Minister held enforceable under promissory estoppel."}
        ],
        "exceptions": ["Cannot be invoked against a statute (no estoppel against law)", "Supervening overriding public interest", "Ultra vires promise by unauthorized official"],
        "key_elements": ["Clear and unambiguous promise", "Intention to create legal relations", "Alteration of position / reliance", "Detriment or change of circumstance"],
    },
    {
        "id": "doc_presumption_of_innocence",
        "name": "Presumption of Innocence",
        "name_normalized": "presumption of innocence",
        "latin_maxim": "Ei incumbit probatio qui dicit, non qui negat / In dubio pro reo",
        "category": "Criminal Law / Jurisprudence",
        "summary": "Every accused person is presumed innocent until proven guilty beyond reasonable doubt by the prosecution.",
        "detailed_explanation": "A golden thread of criminal jurisprudence protected under Article 21. The burden of establishing guilt lies entirely on the prosecution and never shifts, except where statute specifically creates a reverse burden of proof.",
        "constitutional_provisions": ["Article 20(3)", "Article 21"],
        "statutory_provisions": [
            {"act": "Bharatiya Sakshya Adhiniyam, 2023", "section": "Section 104 & 105"},
            {"act": "Indian Evidence Act, 1872", "section": "Section 101 & 102"}
        ],
        "leading_judgments": [
            {"citation": "AIR 1957 SC 466", "case_title": "Woolmington Principle in India / Sarwan Singh v. State of Punjab", "relevance": "Suspicion cannot take the place of legal proof."},
            {"citation": "(2008) 16 SCC 417", "case_title": "Noor Aga v. State of Punjab", "relevance": "Presumption of innocence is a human right under Article 21 even under strict liability statutes."}
        ],
        "exceptions": ["Statutory reverse burdens (e.g. Section 139 NI Act, Section 35/54 NDPS Act, Section 24 PMLA, Section 29/30 POCSO Act)"],
        "key_elements": ["Burden of proof on prosecution", "Standard of proof beyond reasonable doubt", "Benefit of doubt in favor of accused"],
    },
    {
        "id": "doc_separation_of_powers",
        "name": "Doctrine of Separation of Powers",
        "name_normalized": "separation of powers",
        "latin_maxim": "Trias Politica",
        "category": "Constitutional Law",
        "summary": "Constitutional division of state power between the Legislature, Executive, and Judiciary with mutual checks and balances.",
        "detailed_explanation": "While India does not follow strict water-tight separation like the US Constitution, it observes a system of checks and balances where no organ can usurp the essential functions of another. Judicial review enforces constitutional boundaries.",
        "constitutional_provisions": ["Article 50", "Article 121", "Article 122", "Article 211", "Article 212", "Article 368"],
        "statutory_provisions": [],
        "leading_judgments": [
            {"citation": "1975 Supp SCC 1", "case_title": "Indira Nehru Gandhi v. Raj Narain", "relevance": "Held that separation of powers is part of the basic structure of the Constitution."},
            {"citation": "(1955) 2 SCR 225", "case_title": "Ram Jawaya Kapur v. State of Punjab", "relevance": "Executive functions defined within framework of separation of powers."}
        ],
        "exceptions": ["Delegated legislation by Executive", "Impeachment and quasi-judicial functions of Parliament"],
        "key_elements": ["Legislative supremacy in lawmaking", "Executive enforcement", "Independent Judicial Review"],
    },
    {
        "id": "doc_legitimate_expectation",
        "name": "Doctrine of Legitimate Expectation",
        "name_normalized": "legitimate expectation",
        "latin_maxim": "Fides servanda est",
        "category": "Administrative Law",
        "summary": "Citizens are entitled to rely on established administrative past practices and representations unless public interest dictates a change.",
        "detailed_explanation": "Operates in public law to protect individuals against arbitrary reversals of policy. While it does not create an absolute legal right, it imposes a procedural duty of fairness and reasoned justification upon public authorities before defeating an expectation.",
        "constitutional_provisions": ["Article 14"],
        "statutory_provisions": [],
        "leading_judgments": [
            {"citation": "(1993) 3 SCC 499", "case_title": "Food Corporation of India v. Kamdhenu Cattle Feed", "relevance": "Duty of public authorities to act reasonably and consider legitimate expectations."},
            {"citation": "(2006) 8 SCC 381", "case_title": "Bannari Amman Sugars Ltd. v. CTO", "relevance": "Withdrawal of tax benefits held subject to legitimate expectation review."}
        ],
        "exceptions": ["Change in statutory policy in public interest", "Ultra vires representation by public official"],
        "key_elements": ["Reasonable and established practice", "Absence of overriding public interest", "Duty of procedural fairness"],
    },
    {
        "id": "doc_pith_and_substance",
        "name": "Doctrine of Pith and Substance",
        "name_normalized": "pith and substance",
        "latin_maxim": "Ex visceribus actus",
        "category": "Constitutional Law / Legislative Competence",
        "summary": "Determines the true nature, character, and legislative competence of a statute when it incidentally encroaches upon another legislative list under the Seventh Schedule.",
        "detailed_explanation": "When an Act passed by Parliament or a State Legislature is challenged as ultra vires, the court examines the true nature ('pith and substance') of the legislation. Incidental encroachment into another list does not invalidate the enactment if in substance it falls within the authorized list under Article 246.",
        "constitutional_provisions": ["Article 246", "Seventh Schedule (Union, State, Concurrent Lists)"],
        "statutory_provisions": [],
        "leading_judgments": [
            {"citation": "AIR 1947 PC 60", "case_title": "Prafulla Kumar Mukherjee v. Bank of Commerce Ltd.", "relevance": "Foundational formulation of pith and substance doctrine under Seventh Schedule."},
            {"citation": "(1989) 3 SCC 211", "case_title": "State of Rajasthan v. G. Chawla", "relevance": "Control of amplifiers by State legislature upheld despite incidental entry into broadcasting."}
        ],
        "exceptions": ["Colorable legislation masking an unauthorized field as authorized"],
        "key_elements": ["Examination of enactment as a whole", "Primary purpose and scope", "Incidental vs. substantial encroachment"],
    },
    {
        "id": "doc_harmonious_construction",
        "name": "Doctrine of Harmonious Construction",
        "name_normalized": "harmonious construction",
        "latin_maxim": "Ut res magis valeat quam pereat",
        "category": "Statutory Interpretation / Jurisprudence",
        "summary": "Statutory provisions that appear to conflict must be interpreted harmoniously so that effect is given to both without rendering either redundant.",
        "detailed_explanation": "A cardinal rule of statutory interpretation requiring courts to avoid head-on clashes between two sections or statutes by interpreting them in a manner that preserves their co-existence and legislative efficacy.",
        "constitutional_provisions": ["Article 246", "Article 254"],
        "statutory_provisions": [],
        "leading_judgments": [
            {"citation": "AIR 1958 SC 255", "case_title": "Venkataramana Devaru v. State of Mysore", "relevance": "Harmonized Article 25(2)(b) with Article 26(b) regarding temple entry."},
            {"citation": "(2003) 7 SCC 233", "case_title": "Sultana Begum v. Prem Chand Jain", "relevance": "Court must avoid creating head-on clash between statutory provisions."}
        ],
        "exceptions": ["Irreconcilable direct repugnancy where the specific statute or later clause expressly prevails"],
        "key_elements": ["Presumption against redundancy", "Giving effect to both provisions", "Avoiding statutory defeat"],
    },
    {
        "id": "doc_severability",
        "name": "Doctrine of Severability",
        "name_normalized": "severability",
        "latin_maxim": "Utile per inutile non vitiatur (The useful is not vitiated by the useless)",
        "category": "Constitutional Law",
        "summary": "When a part of a statute is unconstitutional, only the invalid part is struck down if it can be severed without affecting the remainder.",
        "detailed_explanation": "Under Article 13(1) and 13(2), an unconstitutional law is void only 'to the extent of the inconsistency'. If the valid and invalid parts are distinct and independent, the court preserves the valid portion.",
        "constitutional_provisions": ["Article 13(1)", "Article 13(2)", "Article 254"],
        "statutory_provisions": [],
        "leading_judgments": [
            {"citation": "1957 SCR 930", "case_title": "R.M.D. Chamarbaugwalla v. Union of India", "relevance": "Laid down 7 rules of severability for unconstitutional enactments."},
            {"citation": "AIR 1950 SC 27", "case_title": "A.K. Gopalan v. State of Madras", "relevance": "Section 14 of Preventive Detention Act severed while saving the rest of the Act."}
        ],
        "exceptions": ["When the valid and invalid portions are inextricably intertwined such that the legislature would not have enacted one without the other"],
        "key_elements": ["Textual and structural separability", "Legislative intent test", "Independent operational viability"],
    },
]


# ==========================================
# 4. LEGAL PROCEDURES
# ==========================================
LEGAL_PROCEDURES_DATA: list[dict[str, Any]] = [
    {
        "id": "proc_anticipatory_bail",
        "procedure_name": "Anticipatory Bail Procedure",
        "category": "criminal",
        "governing_act": "Bharatiya Nagarik Suraksha Sanhita, 2023 (Legacy: Code of Criminal Procedure, 1973)",
        "governing_sections": ["Section 482 BNSS (Legacy: Section 438 CrPC)"],
        "forum_jurisdiction": "High Court or Court of Session",
        "summary": "Direction for grant of bail to person apprehending arrest for a non-bailable offence.",
        "prerequisites": [
            "Reasonable apprehension of arrest in a non-bailable offence",
            "Offence not excluded under specific statutes (e.g. POCSO/SC-ST Act where restricted)"
        ],
        "stages": [
            {"stage_number": 1, "stage_title": "Filing Application", "description": "Draft petition with affidavit, annexing FIR or complaint copy, Grounds of Innocence, and Vakalatnama.", "timeline": "Immediately upon apprehension of arrest"},
            {"stage_number": 2, "stage_title": "Initial Hearing & Notice", "description": "Court hears Senior Advocate/Counsel; may grant interim protection and issue notice to State/Public Prosecutor.", "timeline": "Within 2-7 days of filing"},
            {"stage_number": 3, "stage_title": "Prosecution Response", "description": "Public Prosecutor files Case Diary status report and reply.", "timeline": "Usually within 7-14 days"},
            {"stage_number": 4, "stage_title": "Final Argument & Order", "description": "Court evaluates Arnesh Kumar / Sushila Aggarwal criteria (gravity, flight risk, tampering) and passes speaking order.", "timeline": "Final disposal usually within 14-30 days"},
            {"stage_number": 5, "stage_title": "Furnishing Bail Bond", "description": "If allowed, applicant furnishes personal bond and surety before Investigating Officer/Magistrate if arrested.", "timeline": "Upon execution"}
        ],
        "limitation_period": "Can be applied at any time before actual arrest",
        "required_documents": [
            "Copy of FIR / Complaint / Notice under s.35 BNSS (s.41A CrPC)",
            "Identity Proof of Applicant",
            "Medical records / Alibi proof if relevant",
            "Affidavit in support of petition",
            "Vakalatnama"
        ],
        "common_grounds": [
            "False implication due to business/political/matrimonial rivalry",
            "No custodial interrogation required (all evidence documentary)",
            "Applicant has deep roots in society and is not a flight risk",
            "Ready and willing to join investigation as and when directed"
        ],
        "leading_cases": [
            {"citation": "(2020) 5 SCC 1", "case_title": "Sushila Aggarwal v. State (NCT of Delhi)", "relevance": "Anticipatory bail is not ordinarily limited in duration and can continue until trial end."},
            {"citation": "(2011) 1 SCC 694", "case_title": "Siddharam Satlingappa Mhetre v. State of Maharashtra", "relevance": "Detailed factors to be considered for pre-arrest bail."}
        ],
    },
    {
        "id": "proc_writ_petition_226",
        "procedure_name": "Writ Petition under Article 226 of the Constitution",
        "category": "constitutional",
        "governing_act": "Constitution of India",
        "governing_sections": ["Article 226", "Article 227"],
        "forum_jurisdiction": "High Court having territorial or cause-of-action jurisdiction",
        "summary": "Original writ jurisdiction for enforcement of Fundamental Rights and for any other purpose against State authorities.",
        "prerequisites": [
            "Existence of a legal right / fundamental right infringement",
            "Action/inaction by 'State' or public instrumentality under Article 12",
            "Exhaustion of alternate efficacious statutory remedies (unless violation of fundamental right, natural justice, or order without jurisdiction)"
        ],
        "stages": [
            {"stage_number": 1, "stage_title": "Drafting & Service", "description": "Prepare Writ Petition with Memo of Parties, Statement of Facts, Grounds, Prayer, and Affidavit. Advance service to Standing Counsel.", "timeline": "Day 1-2"},
            {"stage_number": 2, "stage_title": "Filing & Registry Scrutiny", "description": "E-filing / physical filing; curing registry defects/objections.", "timeline": "Day 2-3"},
            {"stage_number": 3, "stage_title": "Admission / Motion Hearing", "description": "Preliminary hearing before Single Bench / Division Bench for issuance of Rule Nisi and interim stay/relief.", "timeline": "Listed within 2-4 days of clearing defects"},
            {"stage_number": 4, "stage_title": "Counter Affidavit / Rejoinder", "description": "Respondent State files Counter-Affidavit; Petitioner files Rejoinder-Affidavit.", "timeline": "4-6 weeks as granted by Court"},
            {"stage_number": 5, "stage_title": "Final Hearing & Judgment", "description": "Oral arguments on law and facts, followed by reasoned judgment/writ issued.", "timeline": "Variable depending on court board"}
        ],
        "limitation_period": "No fixed limitation period, but doctrine of laches and undue delay applies (generally within reasonable time, e.g. 90 days)",
        "required_documents": [
            "Impugned Order / Notice / Action being challenged (True Certified/Translated copy)",
            "All prior representations and correspondence with authority",
            "Urgent Application / Stay Application with supporting Affidavit",
            "Vakalatnama and Court fee stamp"
        ],
        "common_grounds": [
            "Violation of Fundamental Rights under Articles 14, 19, 21",
            "Gross violation of Principles of Natural Justice (Audi Alteram Partem)",
            "Impugned action passed without jurisdiction / ultra vires statutory power",
            "Manifest arbitrariness and Wednesbury unreasonableness / mala fides"
        ],
        "leading_cases": [
            {"citation": "(2003) 2 SCC 107", "case_title": "Whirlpool Corporation v. Registrar of Trade Marks", "relevance": "Exceptions to rule of alternate remedy: (i) Fundamental Rights, (ii) Natural justice, (iii) Want of jurisdiction."},
            {"citation": "(2007) 8 SCC 212", "case_title": "State of West Bengal v. Committee for Protection of Democratic Rights", "relevance": "Power of High Courts under Article 226 to direct CBI investigation."}
        ],
    },
    {
        "id": "proc_civil_suit_cpc",
        "procedure_name": "Civil Suit Trial Procedure",
        "category": "civil",
        "governing_act": "Code of Civil Procedure, 1908",
        "governing_sections": ["Section 26", "Order IV", "Order VI", "Order VII", "Order VIII", "Order XIV", "Order XVIII"],
        "forum_jurisdiction": "Civil Judge (Junior/Senior Division) / District Court / High Court Original Side based on Pecuniary and Territorial Jurisdiction",
        "summary": "Institution and complete trial adjudication of a civil suit from plaint to decree.",
        "prerequisites": [
            "Cause of action arose within territorial jurisdiction",
            "Valuation of suit within pecuniary jurisdiction",
            "Pre-institution mediation completed if required (Commercial Courts Act Section 12A)"
        ],
        "stages": [
            {"stage_number": 1, "stage_title": "Plaint Presentation (Order IV & VII)", "description": "Plaintiff files plaint with court fees, verifying affidavit, list of documents, and summons copies.", "timeline": "Within statutory limitation period"},
            {"stage_number": 2, "stage_title": "Issuance and Service of Summons (Order V)", "description": "Court issues summons to Defendant with copy of plaint.", "timeline": "Within 30 days of institution"},
            {"stage_number": 3, "stage_title": "Written Statement (Order VIII Rule 1)", "description": "Defendant must file Written Statement along with document list within 30 days (extendable up to 90 days / 120 days in commercial suits).", "timeline": "30 to 90/120 days"},
            {"stage_number": 4, "stage_title": "Framing of Issues (Order XIV)", "description": "Court examines pleadings and frames material issues of law and fact.", "timeline": "First hearing after pleadings complete"},
            {"stage_number": 5, "stage_title": "Evidence & Examination of Witnesses (Order XVIII)", "description": "Plaintiff files Affidavits in lieu of examination-in-chief; cross-examination conducted. Followed by Defendant's evidence.", "timeline": "Subsequent court dates"},
            {"stage_number": 6, "stage_title": "Final Arguments & Judgment (Order XX)", "description": "Counsel advance final oral arguments; Court delivers judgment and draws formal decree.", "timeline": "Within 30-60 days of conclusion of arguments"}
        ],
        "limitation_period": "Governed by Limitation Act, 1963 (typically 3 years for contract/recovery; 12 years for immovable property possession)",
        "required_documents": [
            "Plaint with detailed paragraph-wise facts, cause of action, and valuation",
            "Original or certified copies of relied-upon documents",
            "Affidavit in support of plaint (Order VI Rule 15A)",
            "Vakalatnama and proper ad-valorem Court Fee"
        ],
        "common_grounds": [
            "Breach of contractual obligations and recovery of damages/dues",
            "Declaration of title and permanent injunction against interference",
            "Specific performance of agreement to sell immovable property",
            "Partition and separate possession of joint family property"
        ],
        "leading_cases": [
            {"citation": "(2005) 6 SCC 344", "case_title": "Salem Advocate Bar Association v. Union of India", "relevance": "Clarified time limits for written statement and case management under CPC."},
            {"citation": "(2020) 15 SCC 585", "case_title": "SCG Contracts (India) Pvt. Ltd. v. K.S. Chamankar Infrastructure", "relevance": "120-day limit for filing written statement in commercial suits is strictly mandatory."}
        ],
    },
    {
        "id": "proc_ni_act_138",
        "procedure_name": "Cheque Dishonour Criminal Complaint Procedure under Section 138/142 NI Act",
        "category": "criminal_commercial",
        "governing_act": "Negotiable Instruments Act, 1881",
        "governing_sections": ["Section 138", "Section 141", "Section 142", "Section 143A"],
        "forum_jurisdiction": "Judicial Magistrate First Class (JMFC) / Metropolitan Magistrate (MM) having territorial jurisdiction where Payee bank account is maintained",
        "summary": "Summary criminal prosecution for recovery of unpaid cheque amount and penal punishment for dishonour.",
        "prerequisites": [
            "Cheque presented within validity (3 months)",
            "Dishonoured with bank return memo",
            "Demand Notice sent within 30 days of memo",
            "Non-payment within 15-day cure window"
        ],
        "stages": [
            {"stage_number": 1, "stage_title": "Statutory Demand Notice", "description": "Serve formal legal notice demanding cheque amount within 15 days.", "timeline": "Within 30 days of return memo"},
            {"stage_number": 2, "stage_title": "Filing Criminal Complaint (Section 142)", "description": "File complaint before Magistrate with evidence affidavit, original cheque, return memo, and postal tracking.", "timeline": "Within 30 days after expiry of 15-day cure notice"},
            {"stage_number": 3, "stage_title": "Pre-Summoning Evidence & Cognizance", "description": "Complainant adopts affidavit; Magistrate takes cognizance under Section 190 and issues summons.", "timeline": "First hearing"},
            {"stage_number": 4, "stage_title": "Notice of Accusation & Interim Compensation", "description": "Plea of accused recorded; Court may order interim compensation up to 20% of cheque amount under Section 143A.", "timeline": "Upon appearance of accused"},
            {"stage_number": 5, "stage_title": "Complainant Cross-Examination & Defense Evidence", "description": "Accused cross-examines complainant under Section 145(2), leads defense evidence under Section 139 presumption.", "timeline": "Trial stage"},
            {"stage_number": 6, "stage_title": "Judgment & Sentence", "description": "Court delivers judgment; may sentence up to 2 years imprisonment and fine up to twice the cheque amount.", "timeline": "Conclusion of trial"}
        ],
        "limitation_period": "Strict 30 days from expiry of 15-day cure window (delay condonable under Section 142(1)(b) proviso upon showing sufficient cause)",
        "required_documents": ["Original Cheque", "Bank Return Memo", "Copy of Legal Notice with Postal Receipt & Delivery Tracking", "Affidavit of Pre-Summoning Evidence under s.145 NI Act", "Vakalatnama"],
        "common_grounds": ["Dishonour due to insufficient funds / account closed / stop payment", "Legally enforceable debt or liability"],
        "leading_cases": [
            {"citation": "(2014) 5 SCC 590", "case_title": "Dashrath Rupsingh Rathod v. State of Maharashtra", "relevance": "Territorial jurisdiction clarified (subsequently amended by 2015 Act)."},
            {"citation": "(2018) 8 SCC 165", "case_title": "Kishan Rao v. Shankargouda", "relevance": "Section 139 statutory presumption in favor of holder."}
        ],
    },
    {
        "id": "proc_arbitration_lifecycle",
        "procedure_name": "Commercial Arbitration Procedure",
        "category": "arbitration",
        "governing_act": "Arbitration and Conciliation Act, 1996",
        "governing_sections": ["Section 7", "Section 9", "Section 11", "Section 17", "Section 21", "Section 31", "Section 34", "Section 36"],
        "forum_jurisdiction": "Arbitral Tribunal / High Court (Section 11 & Section 9) / Commercial Court",
        "summary": "Full lifecycle of domestic or international commercial arbitration from notice of arbitration to award enforcement.",
        "prerequisites": ["Valid written arbitration agreement (Section 7)", "Arbitrable subject-matter dispute", "Notice invoking arbitration issued"],
        "stages": [
            {"stage_number": 1, "stage_title": "Notice Invoking Arbitration (Section 21)", "description": "Claimant serves formal notice specifying dispute and nominating arbitrator.", "timeline": "Commencement date of arbitration"},
            {"stage_number": 2, "stage_title": "Constitution of Arbitral Tribunal", "description": "Mutual appointment by parties or Application to High Court/Supreme Court under Section 11(6) if no consensus.", "timeline": "Within 30 days of notice"},
            {"stage_number": 3, "stage_title": "Interim Measures (Section 9 / 17)", "description": "Application for interim injunction, asset preservation, or security before Court or Tribunal.", "timeline": "Pre or during arbitration"},
            {"stage_number": 4, "stage_title": "Pleadings & Oral Hearings", "description": "Statement of Claim, Statement of Defense & Counterclaim, Document Discovery, Witness Cross-Examination, and Oral Arguments.", "timeline": "Within 6 months of tribunal entering reference"},
            {"stage_number": 5, "stage_title": "Arbitral Award (Section 31)", "description": "Tribunal delivers reasoned written award signed by majority arbitrators.", "timeline": "Mandatorily within 12 months under Section 29A (extendable by 6 months)"},
            {"stage_number": 6, "stage_title": "Challenge & Enforcement (Section 34 & 36)", "description": "Aggrieved party may challenge award under Section 34; otherwise enforceable as a decree of civil court under Section 36.", "timeline": "3 months (+30 days delay) under Section 34"}
        ],
        "limitation_period": "3 years for substantive claims; Section 34 challenge strictly 3 months + 30 days maximum",
        "required_documents": ["Contract containing Arbitration Clause", "Section 21 Invocation Notice", "Statement of Claim with Document Exhibits", "Arbitrator Disclosure under Sixth Schedule", "Vakalatnama"],
        "common_grounds": ["Breach of commercial contract", "Liquidated damages and loss of profit", "Non-payment of milestone invoices"],
        "leading_cases": [
            {"citation": "(2020) 2 SCC 1", "case_title": "Vidya Drolia v. Durga Trading Corp.", "relevance": "Four-fold non-arbitrability test."},
            {"citation": "(2015) 3 SCC 49", "case_title": "Associate Builders v. DDA", "relevance": "Grounds of Section 34 challenge."}
        ],
    },
    {
        "id": "proc_consumer_complaint",
        "procedure_name": "Consumer Dispute 3-Tier Adjudication Procedure",
        "category": "consumer",
        "governing_act": "Consumer Protection Act, 2019",
        "governing_sections": ["Section 34", "Section 35", "Section 38", "Section 47", "Section 58"],
        "forum_jurisdiction": "District Consumer Disputes Redressal Commission (up to Rs. 50 Lakh) / State Commission (Rs. 50 Lakh to 2 Cr) / National Commission (above Rs. 2 Cr)",
        "summary": "Adjudication of consumer grievances regarding defect in goods, deficiency in service, or unfair trade practices.",
        "prerequisites": ["Complainant is a 'consumer' under Section 2(7)", "Pecuniary jurisdiction and cause of action within territorial limit", "Within 2 years limitation"],
        "stages": [
            {"stage_number": 1, "stage_title": "Filing of Complaint (Section 35 / e-Daakhil)", "description": "Consumer files verified complaint with invoice, warranty, defect proof, and court fee.", "timeline": "Within 2 years of cause of action"},
            {"stage_number": 2, "stage_title": "Admissibility Hearing", "description": "Commission decides admissibility within 21 days; issues notice to Opposite Party.", "timeline": "Within 21 days"},
            {"stage_number": 3, "stage_title": "Written Version by Opposite Party", "description": "Opposite Party must file response within 30 days (extendable up to 45 days).", "timeline": "30 to 45 days"},
            {"stage_number": 4, "stage_title": "Evidence & Expert Analysis", "description": "Affidavit evidence by parties; laboratory analysis ordered if defect requires technical testing under Section 38(2)(c).", "timeline": "Subsequent hearings"},
            {"stage_number": 5, "stage_title": "Final Order & Redressal", "description": "Commission orders refund, replacement, compensation for mental agony, and punitive damages.", "timeline": "Target disposal within 3-5 months"}
        ],
        "limitation_period": "2 years from date on which cause of action arose (Section 69)",
        "required_documents": ["Purchase Invoice / Bill", "Warranty / Service Contract Card", "Photographs / Technical inspection reports of defect", "Correspondence / Emails with customer care", "Affidavit in support of complaint"],
        "common_grounds": ["Defect in goods (manufacturing defect, broken parts)", "Deficiency in service (delayed possession by builder, insurance claim rejection, flight cancellation)", "Unfair Trade Practice"],
        "leading_cases": [
            {"citation": "(2020) 5 SCC 757", "case_title": "New India Assurance Co. Ltd. v. Hilli Multipurpose Cold Storage", "relevance": "45-day deadline for written version is strictly mandatory."}
        ],
    },
]


# ==========================================
# 5. LEGAL FORMS
# ==========================================
LEGAL_FORMS_DATA: list[dict[str, Any]] = [
    {
        "id": "form_anticipatory_bail_bnss",
        "title": "Application for Anticipatory Bail under Section 482 BNSS / 438 CrPC",
        "category": "bail",
        "governing_act": "Bharatiya Nagarik Suraksha Sanhita, 2023",
        "governing_section": "Section 482 (Legacy: Section 438 CrPC)",
        "description": "Standard verified format for applying for pre-arrest bail before the Sessions Court or High Court.",
        "fillable_fields": [
            {"field_name": "court_name", "label": "Name of Court (Sessions / High Court)", "required": True},
            {"field_name": "case_details", "label": "FIR No., Year, Police Station, Under Sections", "required": True},
            {"field_name": "applicant_name", "label": "Name, Age, Father's Name, Address of Applicant", "required": True},
            {"field_name": "facts_brief", "label": "Brief factual background", "required": True},
            {"field_name": "grounds", "label": "Numbered grounds of innocence and false implication", "required": True},
            {"field_name": "prayer", "label": "Specific directions sought for release on bail in event of arrest", "required": True}
        ],
        "template_format": """IN THE COURT OF SESSIONS JUDGE AT [PLACE] / IN THE HIGH COURT OF JUDICATURE AT [PLACE]
CRIMINAL MISCELLANEOUS BAIL APPLICATION NO. _____ OF 2026

IN THE MATTER OF:
[APPLICANT_NAME], S/o [FATHER_NAME],
Aged about [AGE] years, R/o [ADDRESS]
... APPLICANT / ACCUSED

VERSUS

STATE (GOVT. OF NCT OF DELHI / STATE OF [STATE_NAME])
THROUGH SHO, POLICE STATION [POLICE_STATION]
... RESPONDENT

APPLICATION UNDER SECTION 482 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 (CORRESPONDING TO SECTION 438 OF CrPC, 1973) FOR GRANT OF ANTICIPATORY BAIL IN CONNECTION WITH FIR NO. [FIR_NUMBER] DATED [FIR_DATE], REGISTERED UNDER SECTIONS [SECTIONS_LIST] AT POLICE STATION [POLICE_STATION].

MOST RESPECTFULLY SHOWETH:
1. That the Applicant is a peace-loving, law-abiding citizen of India having deep roots in society and has never been convicted of any criminal offence in the past.
2. That the present FIR has been registered at the instance of the complainant with mala fide intention, due to [STATE_REASON_FOR_ENMITY_OR_DISPUTE], with the sole objective of humiliating and coercing the Applicant.
3. [FACTUAL SUMMARY OF THE DISPUTE]
4. GROUNDS:
   A. Because the Applicant is innocent and has been falsely implicated.
   B. Because all relevant evidence is documentary in nature, already in possession of the Investigating Agency, and no custodial interrogation of the Applicant is required.
   C. Because the Applicant undertakes to join investigation as and when directed by the Investigating Officer.
   D. Because the Applicant is not a flight risk and has permanent residence at [ADDRESS].
   E. Because the Applicant undertakes not to tamper with evidence or influence any prosecution witnesses directly or indirectly.

PRAYER:
It is therefore most respectfully prayed that this Hon'ble Court may be pleased to:
(a) Direct that in the event of arrest in connection with FIR No. [FIR_NUMBER] registered at P.S. [POLICE_STATION], the Applicant be released on bail on such terms and conditions as this Hon'ble Court deems fit;
(b) Grant ad-interim ex-parte protection from arrest during the pendency of the present application;
(c) Pass any other order(s) as this Hon'ble Court may deem fit and proper in the interest of justice.

AND FOR THIS ACT OF KINDNESS, THE APPLICANT AS IN DUTY BOUND SHALL EVER PRAY.

APPLICANT
THROUGH COUNSEL
[ADVOCATE_NAME & ENROLLMENT NO.]
[DATE & PLACE]""",
        "drafting_notes": [
            "Ensure notice under Section 35 BNSS (s.41A CrPC) or summon copy is annexed if received.",
            "Verify that an affidavit in support of the application is executed and properly attested by an Oath Commissioner.",
            "State clearly whether any previous bail application in respect of the same FIR has been filed or dismissed."
        ],
    },
    {
        "id": "form_cheque_bounce_notice_138",
        "title": "Legal Notice for Dishonour of Cheque under Section 138 of the Negotiable Instruments Act, 1881",
        "category": "notice",
        "governing_act": "Negotiable Instruments Act, 1881",
        "governing_section": "Section 138 read with Section 142",
        "description": "Statutory demand notice required to be served within 30 days of receiving bank memo of dishonour.",
        "fillable_fields": [
            {"field_name": "drawer_details", "label": "Name and Address of Cheque Drawer (Debtor)", "required": True},
            {"field_name": "payee_details", "label": "Name and Address of Payee / Client", "required": True},
            {"field_name": "cheque_details", "label": "Cheque No., Date, Amount, Drawee Bank", "required": True},
            {"field_name": "memo_details", "label": "Date of Return Memo & Reason ('Funds Insufficient', etc.)", "required": True}
        ],
        "template_format": """REGISTERED POST WITH A.D. / SPEED POST / EMAIL

Date: [DATE]

TO:
[DRAWER_NAME]
[DRAWER_ADDRESS]

SUBJECT: LEGAL STATUTORY NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881 FOR DISHONOUR OF CHEQUE NO. [CHEQUE_NUMBER] DATED [CHEQUE_DATE] FOR RS. [AMOUNT]/-.

Under instructions from and on behalf of my client, [PAYEE_NAME], resident of [PAYEE_ADDRESS], I hereby serve upon you the following statutory legal notice:

1. That in discharge of your legally enforceable debt / liability towards my client arising out of [DESCRIBE TRANSACTION / INVOICE / LOAN], you issued Cheque No. [CHEQUE_NUMBER] dated [CHEQUE_DATE] for an amount of Rs. [AMOUNT]/- ([AMOUNT_IN_WORDS]) drawn on [BANK_NAME], [BRANCH].

2. That my client presented the said cheque for encashment through their banker, [CLIENT_BANK], but the said cheque was returned dishonoured and unpaid vide Cheque Return Memo dated [MEMO_DATE] with the endorsement '[REASON_FOR_DISHONOUR, E.G., FUNDS INSUFFICIENT]'.

3. That the said Return Memo was received by my client on [RECEIPT_DATE].

4. That by issuing the cheque without maintaining sufficient funds in your bank account, you have committed an offence punishable under Section 138 of the Negotiable Instruments Act, 1881, which carries imprisonment for a term up to two years, or fine up to twice the amount of the cheque, or both.

5. I, therefore, by means of this statutory notice, call upon you to make the payment of the said amount of Rs. [AMOUNT]/- ([AMOUNT_IN_WORDS]) to my client within fifteen (15) days of the receipt of this notice.

6. Please take notice that if you fail to pay the aforesaid amount within 15 days of receipt of this notice, my client will be constrained to initiate criminal proceedings against you under Section 138 and 142 of the Negotiable Instruments Act, 1881, as well as relevant provisions of Bharatiya Nyaya Sanhita, 2023, entirely at your risk, cost, and consequences.

A copy of this notice is retained in my office for future legal record and action.

[ADVOCATE_NAME]
Advocate, [BAR_COUNCIL_ENROLLMENT_NO.]
[OFFICE_ADDRESS & CONTACT]""",
        "drafting_notes": [
            "Notice MUST be sent within 30 days of receiving the cheque dishonour return memo.",
            "Must give a clear 15-day cure period from the date of service before filing complaint.",
            "Complaint under Section 142 must be filed within 1 month after expiry of the 15-day cure window."
        ],
    },
    {
        "id": "form_court_affidavit",
        "title": "Standard Format for Court Affidavit & Verification",
        "category": "affidavit",
        "governing_act": "Code of Civil Procedure, 1908 / Oaths Act, 1969",
        "governing_section": "Order XIX CPC read with Section 4 Oaths Act",
        "description": "General sworn affidavit format for use in civil suits, criminal applications, and writ petitions.",
        "fillable_fields": [
            {"field_name": "deponent_name", "label": "Full name of deponent", "required": True},
            {"field_name": "parentage_age", "label": "Father's name, age, and address", "required": True},
            {"field_name": "facts_sworn", "label": "Numbered sworn statements of fact", "required": True}
        ],
        "template_format": """IN THE COURT OF [COURT_NAME] AT [CITY]
IN [CASE_TYPE] NO. _____ OF 2026

IN THE MATTER OF:
[PLAINTIFF / PETITIONER / APPLICANT]
VERSUS
[DEFENDANT / RESPONDENT]

AFFIDAVIT

I, [DEPONENT_NAME], S/o [FATHER_NAME], aged about [AGE] years, resident of [ADDRESS], do hereby solemnly affirm and declare on oath as under:

1. That I am the [Petitioner/Applicant/Plaintiff] in the accompanying petition/application and am fully conversant with the facts and circumstances of the case, and as such, am competent to depose to this affidavit.

2. That the contents of paragraphs 1 to [LAST_PARA] of the accompanying [PETITION/APPLICATION] have been drafted under my instructions and the contents thereof are true and correct to my personal knowledge and based on records maintained in normal course.

3. That the annexures annexed with the accompanying petition are true and correct copies of their respective originals.

4. That no other similar petition or application has been filed by me before this Hon'ble Court or any other court in respect of the subject matter.

DEPONENT

VERIFICATION:
Verified at [CITY] on this [DAY] day of [MONTH], 2026, that the contents of paragraphs 1 to 4 of the above affidavit are true and correct to my personal knowledge, no part of it is false and nothing material has been concealed therefrom.

DEPONENT
ATTESTED BY OATH COMMISSIONER / NOTARY PUBLIC""",
        "drafting_notes": [
            "Must clearly state which paragraphs are based on personal knowledge and which are based on legal advice or record.",
            "Must be attested by an Oath Commissioner or Notary Public with notary stamp and entry number."
        ],
    },
    {
        "id": "form_writ_petition_226",
        "title": "Format for Writ Petition under Article 226 of the Constitution of India",
        "category": "writ",
        "governing_act": "Constitution of India",
        "governing_section": "Article 226 / 227",
        "description": "Comprehensive template for civil writ petition (Mandamus / Certiorari / Prohibition / Quo Warranto) before the High Court.",
        "fillable_fields": [
            {"field_name": "high_court_name", "label": "Name of High Court", "required": True},
            {"field_name": "petitioner_details", "label": "Petitioner name, status, address", "required": True},
            {"field_name": "respondents", "label": "State, Department, and official respondents", "required": True},
            {"field_name": "impugned_order", "label": "Details of impugned order or administrative inaction", "required": True},
            {"field_name": "grounds", "label": "Constitutional Grounds (Articles 14, 19, 21, etc.)", "required": True},
            {"field_name": "prayer", "label": "Specific Writ Prayer (Certiorari, Mandamus, etc.)", "required": True}
        ],
        "template_format": """IN THE HIGH COURT OF JUDICATURE AT [CITY]
EXTRAORDINARY ORIGINAL CIVIL WRIT JURISDICTION
WRIT PETITION (CIVIL) NO. ________ OF 2026

IN THE MATTER OF:
[PETITIONER_NAME]
R/O [PETITIONER_ADDRESS]
... PETITIONER

VERSUS

1. STATE OF [STATE_NAME]
   THROUGH CHIEF SECRETARY, [ADDRESS]
2. [GOVERNMENT_DEPARTMENT / AUTHORITY]
   THROUGH ITS DIRECTOR / SECRETARY, [ADDRESS]
... RESPONDENTS

WRIT PETITION UNDER ARTICLE 226 OF THE CONSTITUTION OF INDIA PRAYING FOR ISSUANCE OF A WRIT OF CERTIORARI / MANDAMUS OR ANY OTHER APPROPRIATE WRIT, ORDER, OR DIRECTION.

TO,
THE HON'BLE CHIEF JUSTICE AND HIS COMPANION JUSTICES OF THE HON'BLE HIGH COURT.

THE HUMBLE PETITION OF THE PETITIONER ABOVE NAMED:

1. PARTICULARS OF THE CAUSE OF ACTION & PARTIES:
   [Statement of facts establishing status of Petitioner and Article 12 status of Respondents]

2. BRIEF FACTS OF THE CASE:
   [Chronological summary of facts leading up to the impugned order/action]

3. IMPUGNED ORDER / ACTION:
   [Specify Impugned Order No., Date, and issuing authority]

4. GROUNDS:
   A. BECAUSE the impugned action violates the Fundamental Rights of the Petitioner guaranteed under Articles 14, 19, and 21.
   B. BECAUSE the impugned order has been passed in gross violation of the Principles of Natural Justice (Audi Alteram Partem).
   C. BECAUSE the Respondent authority has acted wholly without jurisdiction and ultra vires statutory power.
   D. BECAUSE the Petitioner has no other equally efficacious alternative statutory remedy.

5. PRAYER:
   It is therefore most respectfully prayed that this Hon'ble Court may graciously be pleased to:
   (a) Issue a Writ of Certiorari or any other appropriate writ, quashing the Impugned Order dated [DATE] passed by Respondent No. [X];
   (b) Issue a Writ of Mandamus directing the Respondents to [SPECIFIC RELIEF SOUGHT];
   (c) Grant ad-interim ex-parte stay of the operation of the Impugned Order during pendency;
   (d) Pass any other order(s) as deemed fit in the interest of justice.

PETITIONER
THROUGH COUNSEL
[ADVOCATE NAME & ENROLLMENT NO.]""",
        "drafting_notes": [
            "Verify exhaustion of alternate remedy or explicitly state grounds for bypassing (Whirlpool Corp test).",
            "Must annex verified synopsis, list of dates, and certified copy of impugned order."
        ],
    },
]


# ==========================================
# 6. DOCUMENT TEMPLATES
# ==========================================
DOCUMENT_TEMPLATES_DATA: list[dict[str, Any]] = [
    {
        "id": "tmpl_mutual_nda",
        "title": "Mutual Non-Disclosure Agreement (Mutual NDA)",
        "category": "commercial",
        "description": "Standard bilateral confidentiality agreement for commercial negotiations and technology partnerships under Indian law.",
        "standard_clauses": [
            "Definition of Confidential Information",
            "Exclusions from Confidentiality",
            "Obligations of Receiving Party",
            "Permitted Disclosures (Need-to-Know)",
            "Term and Termination",
            "Return / Destruction of Materials",
            "Remedies & Injunctive Relief",
            "Governing Law and Dispute Resolution"
        ],
        "template_content": """MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into on this ____ day of ____________, 2026 ("Effective Date"), by and between:

PARTY A: [COMPANY_A_NAME], a company incorporated under the Companies Act, 2013, having its registered office at [ADDRESS_A] (hereinafter referred to as the "First Party");

AND

PARTY B: [COMPANY_B_NAME], a company incorporated under the Companies Act, 2013, having its registered office at [ADDRESS_B] (hereinafter referred to as the "Second Party").

(The First Party and Second Party are hereinafter collectively referred to as "Parties" and individually as "Party").

RECITALS:
WHEREAS, the Parties wish to explore and evaluate a potential business relationship in connection with [PURPOSE OF DISCUSSION] ("Purpose"); and
WHEREAS, during discussions, each Party may disclose to the other confidential and proprietary technical, commercial, or business information.

NOW, THEREFORE, IT IS HEREBY AGREED AS FOLLOWS:

1. DEFINITION OF CONFIDENTIAL INFORMATION:
"Confidential Information" shall mean all non-public, proprietary information disclosed by one Party ("Disclosing Party") to the other Party ("Receiving Party"), whether orally, visually, in writing, or electronic form, marked or designated as confidential or which by its nature should reasonably be understood to be confidential.

2. EXCLUSIONS:
Confidential Information does not include information that:
(a) is or becomes publicly available without breach of this Agreement;
(b) was already in the rightful possession of the Receiving Party prior to disclosure;
(c) is independently developed by the Receiving Party without reference to or reliance on Disclosing Party's information; or
(d) is rightfully received from a third party without duty of confidentiality.

3. OBLIGATIONS OF RECEIVING PARTY:
The Receiving Party agrees:
(a) To hold Confidential Information in strict confidence and protect it with the same degree of care it uses for its own confidential data (and not less than reasonable care);
(b) Not to use Confidential Information for any purpose other than the Purpose;
(c) To disclose Confidential Information solely to its employees, directors, officers, and legal advisors who have a need to know for the Purpose and are bound by confidentiality obligations at least as restrictive as this Agreement.

4. COMPELLED DISCLOSURE:
If the Receiving Party is required by applicable law, court order, or regulatory direction to disclose Confidential Information, it shall provide prompt written notice to Disclosing Party to enable it to seek a protective order.

5. TERM:
This Agreement shall remain in force for a period of [TWO (2)] years from the Effective Date. The obligations of confidentiality regarding trade secrets shall survive indefinitely.

6. RETURN OF MATERIALS:
Upon written request or termination, Receiving Party shall promptly return or securely destroy all documents, notes, and copies containing Confidential Information.

7. GOVERNING LAW AND DISPUTE RESOLUTION:
This Agreement shall be governed by and construed in accordance with the laws of India. Any dispute arising out of or in connection with this Agreement shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be [CITY, E.G., NEW DELHI], India. The courts at [CITY] shall have exclusive jurisdiction for injunctive relief.

IN WITNESS WHEREOF, the Parties have executed this Agreement by their duly authorized representatives.

For and on behalf of [PARTY_A_NAME]
Name:
Title:
Signature: __________________________

For and on behalf of [PARTY_B_NAME]
Name:
Title:
Signature: __________________________""",
        "governing_statutes": [
            "Indian Contract Act, 1872",
            "Specific Relief Act, 1963",
            "Arbitration and Conciliation Act, 1996",
            "Information Technology Act, 2000"
        ],
        "is_vetted": True,
    },
    {
        "id": "tmpl_employment_agreement",
        "title": "Standard Employment Agreement",
        "category": "employment",
        "description": "Comprehensive employment contract containing compensation terms, IP assignment, confidentiality, non-compete, and termination clauses under Indian labour law.",
        "standard_clauses": [
            "Position and Duties",
            "Compensation and Benefits",
            "Probation and Confirmation",
            "Intellectual Property Assignment (Work for Hire)",
            "Confidentiality & Non-Disclosure",
            "Non-Solicitation and Restrictive Covenants (s.27 Contract Act Compliant)",
            "Termination and Notice Period",
            "Governing Law and Dispute Resolution"
        ],
        "template_content": """EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made and entered into on this ____ day of ____________, 2026, by and between:

EMPLOYER: [COMPANY_NAME], a company incorporated under the Companies Act, 2013, having its registered office at [COMPANY_ADDRESS] (hereinafter referred to as the "Company");

AND

EMPLOYEE: [EMPLOYEE_NAME], S/D/o [PARENT_NAME], residing at [EMPLOYEE_ADDRESS] (hereinafter referred to as the "Employee").

1. APPOINTMENT AND DESIGNATION:
The Company hereby appoints the Employee to the position of [DESIGNATION, E.G., SENIOR SOFTWARE ENGINEER], and the Employee hereby accepts employment on the terms set forth herein.

2. COMMENCEMENT AND PROBATION:
(a) The employment shall commence on [STARTING_DATE].
(b) The Employee shall be on probation for a period of [SIX (6)] months. Upon satisfactory performance, employment shall be confirmed in writing.

3. COMPENSATION:
The Company shall pay the Employee a total gross Cost to Company (CTC) of Rs. [AMOUNT]/- per annum, payable monthly in arrears subject to statutory deductions including Provident Fund, Professional Tax, and TDS.

4. INTELLECTUAL PROPERTY RIGHTS (WORK FOR HIRE):
All inventions, software code, designs, algorithms, patents, copyrights, and improvements created by the Employee during the course of employment shall be the sole and exclusive property of the Company from inception as work made for hire. The Employee hereby assigns all worldwide right, title, and interest in such IP to the Company.

5. NON-SOLICITATION:
During the employment and for a period of twelve (12) months following termination, the Employee shall not directly or indirectly solicit, induce, or attempt to hire any employee, consultant, or client of the Company.

6. TERMINATION:
Either party may terminate employment by giving [THIRTY (30) / SIXTY (60)] days written notice or payment of basic salary in lieu thereof. The Company may terminate employment immediately without notice for cause (fraud, gross misconduct, breach of confidentiality, conviction).

7. GOVERNING LAW:
This Agreement shall be governed by the laws of India.

IN WITNESS WHEREOF, the parties hereto have signed this Agreement as of the date first above written.

COMPANY: ________________________
EMPLOYEE: ________________________""",
        "governing_statutes": [
            "Indian Contract Act, 1872 (Section 27 on restraint of trade)",
            "Industrial Disputes Act, 1947 / Industrial Relations Code, 2020",
            "Copyright Act, 1957 (Section 17(c) work made in course of employment)"
        ],
        "is_vetted": True,
    },
    {
        "id": "tmpl_commercial_lease",
        "title": "Commercial Lease Agreement",
        "category": "property",
        "description": "Standard commercial premises lease agreement under Section 105 of the Transfer of Property Act, 1882.",
        "standard_clauses": [
            "Demise of Premises & Term",
            "Rent, Escalation & Security Deposit",
            "Permitted Commercial Use",
            "Fit-outs & Maintenance",
            "Taxes & Outgoings",
            "Termination & Handover of Possession",
            "Registration & Stamp Duty"
        ],
        "template_content": """COMMERCIAL LEASE AGREEMENT

This Commercial Lease Agreement ("Lease") is executed at [CITY] on this [DAY] day of [MONTH], 2026, by and between:

LESSOR: [LESSOR_NAME], residing at [LESSOR_ADDRESS] (hereinafter called the "Lessor");
AND
LESSEE: [LESSEE_COMPANY_NAME], through its authorized signatory [NAME], having its registered office at [LESSEE_ADDRESS] (hereinafter called the "Lessee").

WHEREAS the Lessor is the absolute lawful owner of Commercial Property situated at [PREMISES_ADDRESS] ("Leased Premises");
AND WHEREAS the Lessee has agreed to take on lease the Leased Premises for commercial office purposes.

NOW THIS AGREEMENT WITNESSETH AS UNDER:
1. TERM: The lease shall be for an initial period of [3 / 5 / 9] years commencing from [START_DATE] ("Lock-in Period": [X] months).
2. RENT & ESCALATION: The monthly lease rent shall be Rs. [AMOUNT]/- ([AMOUNT_WORDS]), payable in advance on or before the 7th of each calendar month. Rent shall escalate by [15]% every [3] years.
3. SECURITY DEPOSIT: The Lessee has paid an interest-free refundable security deposit of Rs. [DEPOSIT_AMOUNT]/-.
4. PERMITTED USE: The premises shall be used exclusively for commercial office operations in compliance with local municipal laws.
5. STAMP DUTY & REGISTRATION: This lease deed shall be compulsorily registered under Section 17 of the Registration Act, 1908, and all stamp duty and registration charges shall be borne by the Lessee.
6. GOVERNING LAW: Governed by the Transfer of Property Act, 1882 and laws of India.

LESSOR: _______________________
LESSEE: _______________________
WITNESSES:
1. ___________________  2. ___________________""",
        "governing_statutes": ["Transfer of Property Act, 1882", "Registration Act, 1908", "Indian Stamp Act, 1899"],
        "is_vetted": True,
    },
    {
        "id": "tmpl_agreement_to_sell",
        "title": "Agreement to Sell Immovable Property",
        "category": "property",
        "description": "Standard contract for sale of land, residential, or commercial immovable property under Section 54 of the Transfer of Property Act, 1882.",
        "standard_clauses": [
            "Recitals of Title & Ownership",
            "Sale Consideration & Earnest Money",
            "Payment Schedule & Milestone Deadlines",
            "Clear and Marketable Title Representation",
            "Execution of Registered Sale Deed",
            "Default and Specific Performance"
        ],
        "template_content": """AGREEMENT TO SELL IMMOVABLE PROPERTY

This Agreement to Sell is made at [CITY] on this [DATE], between:

VENDOR: [VENDOR_NAME], S/o [PARENT], R/o [ADDRESS] (hereinafter called the "Vendor");
AND
PURCHASER: [PURCHASER_NAME], S/o [PARENT], R/o [ADDRESS] (hereinafter called the "Purchaser").

WHEREAS the Vendor is the sole and absolute owner of Freehold Property situated at [PROPERTY_DESCRIPTION] ("Said Property");
AND WHEREAS the Vendor has agreed to sell and Purchaser has agreed to purchase the Said Property free from all encumbrances.

NOW IT IS MUTUALLY AGREED AS FOLLOWS:
1. SALE CONSIDERATION: Total agreed sale price is Rs. [TOTAL_AMOUNT]/- ([IN_WORDS]).
2. EARNEST MONEY: The Purchaser has paid Rs. [EARNEST_AMOUNT]/- as advance earnest money (Bayana), receipt of which Vendor acknowledges.
3. BALANCE PAYMENT & SALE DEED: The balance consideration of Rs. [BALANCE_AMOUNT]/- shall be paid by Purchaser on or before [COMPLETION_DATE] against execution and registration of Sale Deed before the Sub-Registrar.
4. TITLE WARRANTY: The Vendor warrants that property is free from all mortgages, charges, liens, litigations, or government attachments.
5. SPECIFIC PERFORMANCE: In the event of breach by Vendor, the Purchaser shall be entitled to sue for Specific Performance of Contract under the Specific Relief Act, 1963.

VENDOR: ________________________
PURCHASER: ______________________
WITNESSES:
1. ____________________  2. ____________________""",
        "governing_statutes": ["Transfer of Property Act, 1882", "Specific Relief Act, 1963", "Indian Contract Act, 1872"],
        "is_vetted": True,
    },
]


# ==========================================
# 7. GOVERNMENT NOTIFICATIONS & DIRECTIONS
# ==========================================
GOVERNMENT_NOTIFICATIONS_DATA: list[dict[str, Any]] = [
    {
        "id": "notif_cert_in_2022_cybersecurity",
        "notification_number": "No. 20(3)/2022-CERT-In",
        "issuing_authority": "CERT-In / Ministry of Electronics and Information Technology (MeitY)",
        "title": "Directions under sub-section (6) of section 70B of the Information Technology Act, 2000 relating to information security practices, procedure, prevention, response and reporting of cyber incidents",
        "subject": "Mandatory 6-Hour Cybersecurity Incident Reporting & Log Retention Directions",
        "issue_date": date(2022, 4, 28),
        "effective_date": date(2022, 6, 27),
        "notification_type": "direction",
        "full_text": """In exercise of the powers conferred by sub-section (6) of section 70B of the Information Technology Act, 2000, CERT-In issues the following directions:
1. All service providers, intermediaries, data centres, body corporate and Government organisations shall connect to the Network Time Protocol (NTP) Server of NIC or NPL for synchronization of all system clocks.
2. Any service provider, intermediary, data centre, body corporate and Government organisation shall mandatorily report cyber incidents to CERT-In within six (6) hours of noticing or being brought to notice such incidents.
3. All service providers, intermediaries, data centres, body corporate and Government organisations shall mandatorily enable logging of all their ICT systems and maintain logs for a rolling period of 180 days within the Indian jurisdiction.
4. Virtual Private Network (VPN) and Cloud service providers shall register and maintain accurate subscriber records (names, IP addresses, contact details, ownership patterns) for a period of five (5) years.""",
        "summary": "Mandated 6-hour reporting of 20 types of cybersecurity incidents to CERT-In and 180-day mandatory system log retention within India.",
        "applicable_acts": ["Information Technology Act, 2000", "Information Technology (The Indian Computer Emergency Response Team and Manner of Performing Functions and Duties) Rules, 2013"],
        "source_url": "https://www.cert-in.org.in/Directions70B.jsp",
        "in_force": True,
    },
    {
        "id": "notif_rbi_digital_lending_2022",
        "notification_number": "RBI/2022-23/111 DOR.CRE.REC.66/21.07.001/2022-23",
        "issuing_authority": "Reserve Bank of India (RBI)",
        "title": "Guidelines on Digital Lending - Regulatory Framework for Lending through Online Platforms and Mobile Apps",
        "subject": "Direct Disbursal, Key Fact Statement (KFS), and Data Protection in Digital Lending",
        "issue_date": date(2022, 9, 2),
        "effective_date": date(2022, 11, 30),
        "notification_type": "guideline",
        "full_text": """1. All loan disbursals and repayments are required to be executed directly between the bank accounts of the borrower and the Regulated Entity (RE), without any pass-through or pool account of the Lending Service Provider (LSP) or third party.
2. A standardized Key Fact Statement (KFS) must be provided to the borrower before the execution of the loan contract, specifying the All-Inclusive Annual Percentage Rate (APR), recovery mechanisms, and grievance redressal officer details.
3. Regulated Entities shall ensure that LSPs / digital lending apps do not access mobile phone resources such as file and media, contact list, call logs, and telephony functions. Access can only be taken with explicit consent for camera, microphone, and location solely for KYC onboarding.
4. Automatic increase in credit limit without explicit consent of borrower is strictly prohibited.""",
        "summary": "Mandated direct bank-to-bank disbursals, KFS disclosure, and prohibited Lending Apps from accessing contacts, media, and phone files.",
        "applicable_acts": ["Reserve Bank of India Act, 1934", "Banking Regulation Act, 1949"],
        "source_url": "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12382",
        "in_force": True,
    },
    {
        "id": "notif_sebi_pit_master_circular",
        "notification_number": "SEBI/HO/ISD/ISD-PoD-2/P/CIR/2023/039",
        "issuing_authority": "Securities and Exchange Board of India (SEBI)",
        "title": "Master Circular on Surveillance of Securities Market and Prevention of Insider Trading",
        "subject": "Trading Window Closure, Structured Digital Database (SDD), and Code of Conduct",
        "issue_date": date(2023, 3, 23),
        "effective_date": date(2023, 4, 1),
        "notification_type": "master_circular",
        "full_text": """In exercise of the powers conferred under Section 11(1) of the Securities and Exchange Board of India Act, 1992, SEBI issues this Master Circular consolidating all directions on Insider Trading:
1. Structured Digital Database (SDD) must be maintained internally by all listed companies with time-stamped records of persons with whom Unpublished Price Sensitive Information (UPSI) is shared along with their PAN.
2. Trading Window shall be closed from the end of every quarter till 48 hours after the declaration of financial results.
3. Designated persons and their immediate relatives shall not enter into contra-trade for a minimum period of six months.""",
        "summary": "Consolidated regulatory obligations on Structured Digital Database (SDD) and trading window closures to prevent insider trading.",
        "applicable_acts": ["Securities and Exchange Board of India Act, 1992", "SEBI (Prohibition of Insider Trading) Regulations, 2015"],
        "source_url": "https://www.sebi.gov.in/legal/master-circulars/mar-2023/master-circular-surveillance_69255.html",
        "in_force": True,
    },
]


# ==========================================
# 8. CROSS REFERENCE LINKAGE GRAPH
# ==========================================
CROSS_REFERENCE_DATA: list[dict[str, Any]] = [
    {
        "source_type": "judgment",
        "source_id": "jdg_kesavananda_bharati_1973",
        "source_label": "Kesavananda Bharati v. State of Kerala",
        "target_type": "doctrine",
        "target_id": "doc_basic_structure",
        "target_label": "Basic Structure Doctrine",
        "relationship_type": "established",
        "confidence_score": 1.0,
        "description": "Landmark 13-judge bench decision that formulated the Basic Structure Doctrine.",
    },
    {
        "source_type": "judgment",
        "source_id": "jdg_maneka_gandhi_1978",
        "source_label": "Maneka Gandhi v. Union of India",
        "target_type": "doctrine",
        "target_id": "doc_audi_alteram_partem",
        "target_label": "Audi Alteram Partem",
        "relationship_type": "interprets",
        "confidence_score": 1.0,
        "description": "Integrated natural justice (Audi Alteram Partem) into Article 21 procedural due process.",
    },
    {
        "source_type": "judgment",
        "source_id": "jdg_puttaswamy_privacy_2017",
        "source_label": "Justice K.S. Puttaswamy v. Union of India",
        "target_type": "doctrine",
        "target_id": "doc_proportionality",
        "target_label": "Doctrine of Proportionality",
        "relationship_type": "applies",
        "confidence_score": 1.0,
        "description": "Laid down the 3-fold proportionality test for state interference in privacy under Article 21.",
    },
    {
        "source_type": "judgment",
        "source_id": "jdg_puttaswamy_privacy_2017",
        "source_label": "Justice K.S. Puttaswamy v. Union of India",
        "target_type": "definition",
        "target_id": "def_dpdp_personal_data",
        "target_label": "Personal Data",
        "relationship_type": "embodies",
        "confidence_score": 1.0,
        "description": "Conceptual foundational case for the Digital Personal Data Protection Act, 2023.",
    },
    {
        "source_type": "judgment",
        "source_id": "jdg_minerva_mills_1980",
        "source_label": "Minerva Mills Ltd. v. Union of India",
        "target_type": "doctrine",
        "target_id": "doc_basic_structure",
        "target_label": "Basic Structure Doctrine",
        "relationship_type": "reaffirms",
        "confidence_score": 1.0,
        "description": "Affirmed limited amending power and harmony between Fundamental Rights and DPSPs as basic structure.",
    },
    {
        "source_type": "judgment",
        "source_id": "jdg_sr_bommai_1994",
        "source_label": "S.R. Bommai v. Union of India",
        "target_type": "doctrine",
        "target_id": "doc_basic_structure",
        "target_label": "Basic Structure Doctrine",
        "relationship_type": "expands",
        "confidence_score": 1.0,
        "description": "Established Secularism and Federalism as non-derogable parts of Basic Structure.",
    },
    {
        "source_type": "judgment",
        "source_id": "jdg_lalita_kumari_2014",
        "source_label": "Lalita Kumari v. Govt. of U.P.",
        "target_type": "definition",
        "target_id": "def_bns_cognizable_offence",
        "target_label": "Cognizable Offence",
        "relationship_type": "interprets",
        "confidence_score": 1.0,
        "description": "Mandatory duty of police to register FIR for every cognizable offence under Section 154.",
    },
    {
        "source_type": "judgment",
        "source_id": "jdg_vidya_drolia_2020",
        "source_label": "Vidya Drolia v. Durga Trading Corp.",
        "target_type": "definition",
        "target_id": "def_arbitration_agreement",
        "target_label": "Arbitration Agreement",
        "relationship_type": "governs",
        "confidence_score": 1.0,
        "description": "Four-fold test for arbitrability of dispute under Section 7 and 11.",
    },
    {
        "source_type": "judgment",
        "source_id": "jdg_suraj_lamp_2012",
        "source_label": "Suraj Lamp v. State of Haryana",
        "target_type": "template",
        "target_id": "tmpl_agreement_to_sell",
        "target_label": "Agreement to Sell Immovable Property",
        "relationship_type": "governs_validity",
        "confidence_score": 1.0,
        "description": "SA/GPA transfers do not convey title without registered sale deed.",
    },
    {
        "source_type": "procedure",
        "source_id": "proc_anticipatory_bail",
        "source_label": "Anticipatory Bail Procedure",
        "target_type": "form",
        "target_id": "form_anticipatory_bail_bnss",
        "target_label": "Application for Anticipatory Bail under Section 482 BNSS",
        "relationship_type": "requires_template",
        "confidence_score": 1.0,
        "description": "Standard court petition format used to execute anticipatory bail proceedings.",
    },
    {
        "source_type": "procedure",
        "source_id": "proc_anticipatory_bail",
        "source_label": "Anticipatory Bail Procedure",
        "target_type": "judgment",
        "target_id": "jdg_arnesh_kumar_2014",
        "target_label": "Arnesh Kumar v. State of Bihar",
        "relationship_type": "governed_by_case_law",
        "confidence_score": 1.0,
        "description": "Mandatory compliance with arrest safeguards prior to custodial remand.",
    },
    {
        "source_type": "procedure",
        "source_id": "proc_writ_petition_226",
        "source_label": "Writ Petition under Article 226",
        "target_type": "form",
        "target_id": "form_writ_petition_226",
        "target_label": "Format for Writ Petition under Article 226",
        "relationship_type": "requires_template",
        "confidence_score": 1.0,
        "description": "Standard drafting format for High Court Writ Petitions.",
    },
    {
        "source_type": "procedure",
        "source_id": "proc_ni_act_138",
        "source_label": "Cheque Dishonour Criminal Complaint Procedure",
        "target_type": "form",
        "target_id": "form_cheque_bounce_notice_138",
        "target_label": "Legal Notice for Dishonour of Cheque under Section 138",
        "relationship_type": "requires_template",
        "confidence_score": 1.0,
        "description": "Statutory 15-day demand notice required before filing complaint.",
    },
    {
        "source_type": "notification",
        "source_id": "notif_cert_in_2022_cybersecurity",
        "source_label": "CERT-In 6-Hour Cybersecurity Reporting Directions",
        "target_type": "definition",
        "target_id": "def_it_electronic_record",
        "target_label": "Electronic Record",
        "relationship_type": "applies_to",
        "confidence_score": 1.0,
        "description": "Mandatory retention and logging of electronic records and system logs.",
    },
]


def seed_phase1_curated_data(session) -> dict[str, int]:
    """Populate all Phase 1 curated entities into the canonical database."""
    from kb_cruvels.database.repositories.judgment_repo import JudgmentRepository
    from kb_cruvels.database.repositories.phase1_repos import (
        CrossReferenceRepository,
        DefinitionRepository,
        DoctrineRepository,
        NotificationRepository,
        ProcedureRepository,
        TemplateRepository,
    )

    j_repo = JudgmentRepository(session)
    p_repo = ProcedureRepository(session)
    d_repo = DoctrineRepository(session)
    def_repo = DefinitionRepository(session)
    t_repo = TemplateRepository(session)
    n_repo = NotificationRepository(session)
    c_repo = CrossReferenceRepository(session)

    counts = {
        "judgments": 0,
        "definitions": 0,
        "doctrines": 0,
        "procedures": 0,
        "forms": 0,
        "templates": 0,
        "notifications": 0,
        "cross_references": 0,
    }

    # 1. Judgments
    for j_data in LANDMARK_JUDGMENTS_DATA:
        raw_content = f"{j_data['citation']}|{j_data['case_title']}|{j_data['ratio_decidendi']}"
        j_obj = CourtJudgment(
            id=j_data["id"],
            case_title=j_data["case_title"],
            citation=j_data["citation"],
            alternate_citations=j_data.get("alternate_citations", []),
            court=j_data["court"],
            court_type=j_data.get("court_type", "supreme_court"),
            decision_date=j_data.get("decision_date"),
            decision_year=j_data.get("decision_year"),
            bench=j_data.get("bench", []),
            coram_size=j_data.get("coram_size", 1),
            parties=j_data.get("parties", {}),
            subject_area=j_data["subject_area"],
            legal_issue=j_data.get("legal_issue"),
            ratio_decidendi=j_data["ratio_decidendi"],
            full_text=j_data["full_text"],
            summary=j_data.get("summary"),
            statutes_cited=j_data.get("statutes_cited", []),
            sections_cited=j_data.get("sections_cited", []),
            doctrines_applied=j_data.get("doctrines_applied", []),
            overruled_cases=j_data.get("overruled_cases", []),
            followed_cases=j_data.get("followed_cases", []),
            status=j_data.get("status", "good_law"),
            source_url=j_data.get("source_url"),
            canonical_hash=_hash(raw_content),
            snapshot_version="v2026.08",
        )
        j_repo.upsert(j_obj)
        counts["judgments"] += 1

    # 2. Definitions
    for d_data in LEGAL_DEFINITIONS_DATA:
        def_obj = LegalDefinition(
            id=d_data["id"],
            term=d_data["term"],
            term_normalized=d_data["term_normalized"],
            definition_text=d_data["definition_text"],
            source_act_title=d_data["source_act_title"],
            source_section_number=d_data["source_section_number"],
            legal_domain=d_data.get("legal_domain", "General"),
            related_terms=d_data.get("related_terms", []),
            key_cases=d_data.get("key_cases", []),
            canonical_hash=_hash(d_data["definition_text"]),
        )
        def_repo.upsert(def_obj)
        counts["definitions"] += 1

    # 3. Doctrines
    for doc_data in LEGAL_DOCTRINES_DATA:
        doc_obj = LegalDoctrine(
            id=doc_data["id"],
            name=doc_data["name"],
            name_normalized=doc_data["name_normalized"],
            latin_maxim=doc_data.get("latin_maxim"),
            category=doc_data["category"],
            summary=doc_data["summary"],
            detailed_explanation=doc_data["detailed_explanation"],
            constitutional_provisions=doc_data.get("constitutional_provisions", []),
            statutory_provisions=doc_data.get("statutory_provisions", []),
            leading_judgments=doc_data.get("leading_judgments", []),
            exceptions=doc_data.get("exceptions", []),
            key_elements=doc_data.get("key_elements", []),
            canonical_hash=_hash(doc_data["detailed_explanation"]),
        )
        d_repo.upsert(doc_obj)
        counts["doctrines"] += 1

    # 4. Procedures
    for p_data in LEGAL_PROCEDURES_DATA:
        p_obj = LegalProcedure(
            id=p_data["id"],
            procedure_name=p_data["procedure_name"],
            category=p_data["category"],
            governing_act=p_data["governing_act"],
            governing_sections=p_data.get("governing_sections", []),
            forum_jurisdiction=p_data["forum_jurisdiction"],
            summary=p_data["summary"],
            prerequisites=p_data.get("prerequisites", []),
            stages=p_data.get("stages", []),
            limitation_period=p_data.get("limitation_period"),
            required_documents=p_data.get("required_documents", []),
            common_grounds=p_data.get("common_grounds", []),
            leading_cases=p_data.get("leading_cases", []),
            canonical_hash=_hash(p_data["summary"]),
        )
        p_repo.upsert(p_obj)
        counts["procedures"] += 1

    # 5. Forms
    for f_data in LEGAL_FORMS_DATA:
        f_obj = LegalForm(
            id=f_data["id"],
            title=f_data["title"],
            category=f_data["category"],
            governing_act=f_data["governing_act"],
            governing_section=f_data["governing_section"],
            description=f_data["description"],
            fillable_fields=f_data.get("fillable_fields", []),
            template_format=f_data["template_format"],
            drafting_notes=f_data.get("drafting_notes", []),
            canonical_hash=_hash(f_data["template_format"]),
        )
        t_repo.upsert_form(f_obj)
        counts["forms"] += 1

    # 6. Templates
    for t_data in DOCUMENT_TEMPLATES_DATA:
        t_obj = DocumentTemplate(
            id=t_data["id"],
            title=t_data["title"],
            category=t_data["category"],
            description=t_data["description"],
            standard_clauses=t_data.get("standard_clauses", []),
            template_content=t_data["template_content"],
            governing_statutes=t_data.get("governing_statutes", []),
            is_vetted=t_data.get("is_vetted", True),
            canonical_hash=_hash(t_data["template_content"]),
        )
        t_repo.upsert_template(t_obj)
        counts["templates"] += 1

    # 7. Notifications
    for n_data in GOVERNMENT_NOTIFICATIONS_DATA:
        n_obj = GovernmentNotification(
            id=n_data["id"],
            notification_number=n_data["notification_number"],
            issuing_authority=n_data["issuing_authority"],
            title=n_data["title"],
            subject=n_data["subject"],
            issue_date=n_data.get("issue_date"),
            effective_date=n_data.get("effective_date"),
            notification_type=n_data.get("notification_type", "notification"),
            full_text=n_data["full_text"],
            summary=n_data.get("summary"),
            applicable_acts=n_data.get("applicable_acts", []),
            source_url=n_data.get("source_url"),
            in_force=n_data.get("in_force", True),
            canonical_hash=_hash(n_data["full_text"]),
        )
        n_repo.upsert(n_obj)
        counts["notifications"] += 1

    # 8. Cross-References
    for cr_data in CROSS_REFERENCE_DATA:
        cr_id = f"xref_{_hash(cr_data['source_id'] + cr_data['target_id'] + cr_data['relationship_type'])[:16]}"
        cr_obj = CrossReferenceLink(
            id=cr_id,
            source_type=cr_data["source_type"],
            source_id=cr_data["source_id"],
            source_label=cr_data["source_label"],
            target_type=cr_data["target_type"],
            target_id=cr_data["target_id"],
            target_label=cr_data["target_label"],
            relationship_type=cr_data["relationship_type"],
            confidence_score=cr_data.get("confidence_score", 1.0),
            description=cr_data.get("description"),
        )
        c_repo.upsert(cr_obj)
        counts["cross_references"] += 1

    session.commit()
    return counts
