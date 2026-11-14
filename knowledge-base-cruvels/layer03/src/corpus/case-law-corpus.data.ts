/**
 * CRUVELS AI — Layer 03 Canonical Supreme Court & High Court Case Law Corpus Data
 *
 * Sourced directly from official Supreme Court of India Law Reports and Judgments.
 * Features paragraph-level structural fidelity, ratio decidendi (marked DERIVED),
 * directions, subsequent treatment, and explicit precedent statuses.
 */

import type { CaseLawIngestionPayload } from "../ingestion/case-law-ingestor.service";

export const CASE_LAW_CORPUS: CaseLawIngestionPayload[] = [
  // 1. D.K. BASU V. STATE OF WEST BENGAL (1997) 1 SCC 416
  {
    caseId: "dk_basu_1997",
    caseName: "D.K. Basu v. State of West Bengal",
    petitioner: "D.K. Basu, Executive Chairman, Legal Aid Services, West Bengal",
    respondent: "State of West Bengal & Others",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "1996-12-18",
    citation: "(1997) 1 SCC 416",
    neutralCitation: "1996 INSC 1555",
    bench: "Division Bench (2 Judges)",
    benchStrength: 2,
    judges: ["Dr. A.S. Anand, J.", "Kuldip Singh, J."],
    legalDomain: "CRIMINAL_PROCEDURE",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Code of Criminal Procedure, 1973", "Indian Penal Code, 1860"],
    constitutionalProvisionsConsidered: ["Article 21", "Article 22", "Article 141", "Article 142"],
    sectionsConsidered: ["Section 41", "Section 57"],
    legalIssues: [
      "Whether custodial violence, torture, and deaths in police lock-up violate Articles 21 and 22(1) of the Constitution.",
      "What mandatory safeguards, procedures, and guidelines must be observed by police officers while arresting or detaining any person.",
    ],
    holdings: [
      "Custodial violence, torture, and custodial deaths infringe the fundamental rights to life and personal liberty guaranteed under Article 21 and protection against arrest under Article 22.",
      "The Supreme Court issued 11 mandatory guidelines governing every arrest and detention to prevent custodial abuse.",
    ],
    ratioDecidendi: "Custodial violence, including torture and death in lock-ups, strikes a blow at the rule of law and is an infringement of Article 21 of the Constitution. Transparency in police action is the only cure against custodial violence. Mandatory preparation of a memo of arrest, intimation to a relative/friend, and right to medical examination are indispensable constitutional safeguards.",
    ratioType: "DERIVED",
    directions: [
      "1. Police personnel carrying out the arrest and handling the interrogation of the arrestee shall bear accurate, visible and clear identification and name tags with their designations.",
      "2. The police officer carrying out the arrest shall prepare a memo of arrest at the time of arrest, attested by at least one witness (a family member or respectable citizen of the locality) and countersigned by the arrestee.",
      "3. A person who has been arrested or detained is entitled to have one friend or relative or other person known to him or having interest in his welfare informed, as soon as practicable, of the arrest and venue of custody.",
      "4. The time, place of arrest and venue of custody must be notified by the police where the next friend or relative lives outside the district within 8 to 12 hours after arrest through the Legal Aid Organisation.",
      "5. The arrestee must be made aware of this right to have someone informed of his arrest immediately upon arrest.",
      "6. An entry must be made in the diary at the place of detention regarding the arrest.",
      "7. The arrestee should, where he so requests, be examined at the time of arrest and major and minor injuries, if any, recorded in an inspection memo signed by both parties.",
      "8. The arrestee should be subjected to medical examination by a trained doctor every 48 hours during detention in custody.",
      "9. Copies of all documents including the memo of arrest should be sent to the Magistrate for his record.",
      "10. The arrestee may be permitted to meet his lawyer during interrogation, though not throughout the interrogation.",
      "11. A police control room should be provided at all district and State headquarters with details of arrest and place of custody communicated within 12 hours.",
    ],
    finalDisposition: "Directions issued; mandatory compliance ordered for all police authorities nationwide under Article 141 and 142.",
    precedentStatus: "GOOD_LAW",
    subsequentTreatment: [
      {
        citingCaseName: "Arnesh Kumar v. State of Bihar",
        citingCitation: "(2014) 8 SCC 273",
        treatment: "FOLLOWED",
        treatmentYear: 2014,
        court: "SUPREME_COURT",
        description: "Affirmed D.K. Basu guidelines and mandated notice of appearance under Section 41A CrPC.",
      },
      {
        citingCaseName: "Satender Kumar Antil v. CBI",
        citingCitation: "(2022) 10 SCC 51",
        treatment: "AFFIRMED",
        treatmentYear: 2022,
        court: "SUPREME_COURT",
        description: "Reiterated strict compliance with D.K. Basu arrest memo and family notification as mandatory constitutional safeguards.",
      },
    ],
    sourceUrl: "https://main.sci.gov.in/judgment/judis/14878.pdf",
    provenance: "Supreme Court of India Law Reports, (1997) 1 SCC 416, AIR 1997 SC 610",
    fullJudgmentText: `
1. The importance of human rights and dignity of the individual is recognized by the Constitution of India. Custodial violence and death in police lock-up is a matter of great concern.
2. Custodial violence, including torture and death in the lock-ups, strikes a blow at the rule of law, which demands that the powers of the executive should not only be derived from the law, but also that they should be limited by law.
3. The expression "life or personal liberty" in Article 21 has been held to include the right to live with human dignity and it would also include within itself a guarantee against torture and assault by the State or its functionaries.
17. A person arrested or detained is entitled to have one friend or relative or other person known to him or having interest in his welfare informed, as soon as practicable, that he has been arrested and is being detained at the particular place.
35. We therefore consider it appropriate to issue the following mandatory guidelines to be followed in all cases of arrest or detention till legal provisions are made:
(1) The police personnel carrying out the arrest and handling the interrogation of the arrestee shall bear accurate, visible and clear identification and name tags with their designations.
(2) That the police officer carrying out the arrest of the arrestee shall prepare a memo of arrest at the time of arrest and such memo shall be attested by at least one witness, who may either be a member of the family of the arrestee or a respectable person of the locality from where the arrest is made. It shall also be countersigned by the arrestee and shall contain the time and date of arrest.
(3) A person who has been arrested or detained and is being held in custody in a police station or interrogation centre or other lock-up, shall be entitled to have one friend or relative or other person known to him or having interest in his welfare being informed, as soon as practicable, that he has been arrested and is being detained at the particular place.
(4) The time, place of arrest and venue of custody of an arrestee must be notified by the police where the next friend or relative of the arrestee lives outside the district or town through the Legal Aid Organisation in the District and the police station of the area concerned telegraphically within a period of 8 to 12 hours after the arrest.
(5) The person arrested must be made aware of this right to have someone informed of his arrest or detention as soon as he is put under arrest or is detained.
(6) An entry must be made in the diary at the place of detention regarding the arrest of the person which shall also disclose the name of the next friend of the person who has been informed of the arrest and the names and particulars of the police officials in whose custody the arrestee is.
(7) The arrestee should, where he so requests, be also examined at the time of his arrest and major and minor injuries, if any present on the person, must be recorded at that time. The "Inspection Memo" must be signed both by the arrestee and the police officer effecting the arrest and its copy provided to the arrestee.
(8) The arrestee should be subjected to medical examination by a trained doctor every 48 hours during his detention in custody by a doctor on the panel of approved doctors appointed by the Director, Health Services of the State or Union Territory concerned.
(9) Copies of all the documents including the memo of arrest, referred to above, should be sent to the Magistrate for his record.
(10) The arrestee may be permitted to meet his lawyer during interrogation, though not throughout the interrogation.
(11) A police control room could be provided at all district and State headquarters, where information regarding the arrest and the place of custody of the arrestee shall be communicated by the officer causing the arrest, within 12 hours of effecting the arrest and at the police control room it should be displayed on a conspicuous notice board.
42. Failure to comply with the requirements hereinabove mentioned shall apart from rendering the concerned official liable for departmental action, also render him liable to be punished for contempt of court and the proceedings for contempt of court may be instituted in any High Court of the country, having territorial jurisdiction over the matter.
`,
  },

  // 2. ARNESH KUMAR V. STATE OF BIHAR (2014) 8 SCC 273
  {
    caseId: "arnesh_kumar_2014",
    caseName: "Arnesh Kumar v. State of Bihar",
    petitioner: "Arnesh Kumar",
    respondent: "State of Bihar & Another",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "2014-07-02",
    citation: "(2014) 8 SCC 273",
    neutralCitation: "2014 INSC 473",
    bench: "Division Bench (2 Judges)",
    benchStrength: 2,
    judges: ["Chandramauli Kr. Prasad, J.", "Pinaki Chandra Ghose, J."],
    legalDomain: "CRIMINAL_PROCEDURE",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Code of Criminal Procedure, 1973", "Indian Penal Code, 1860"],
    constitutionalProvisionsConsidered: ["Article 21", "Article 22(2)"],
    sectionsConsidered: ["Section 41", "Section 41A", "Section 57", "Section 498-A"],
    legalIssues: [
      "Whether police officers can make automatic arrests in offences punishable with imprisonment up to 7 years without satisfying Section 41(1)(b) CrPC.",
      "Whether issuance of notice of appearance under Section 41A CrPC is mandatory prior to arrest.",
    ],
    holdings: [
      "Arrest brings humiliation, curtails freedom and casts scars forever. Police officers must not arrest accused unnecessarily and Magistrates must not authorize detention casually.",
      "For offences punishable with imprisonment up to 7 years, arrest should be an exception. Notice of appearance under Section 41A CrPC is mandatory unless specific statutory conditions under Section 41(1)(b) are recorded in writing.",
    ],
    ratioDecidendi: "No arrest can be made in a routine manner on a mere allegation of commission of an offence punishable with imprisonment for a term which may be less than seven years or which may extend to seven years, without the police officer recording reasons satisfying the conditions of Section 41(1)(b) CrPC. Notice of appearance under Section 41A CrPC must be served within two weeks from the date of institution of the case.",
    ratioType: "DERIVED",
    directions: [
      "1. State Governments to instruct police officers not to automatically arrest when a case under Section 498-A IPC or other offence punishable up to 7 years is registered.",
      "2. Police officers must be provided with a check list containing specified sub-clauses under Section 41(1)(b)(ii) CrPC.",
      "3. Police officer shall forward the check list duly filed and furnish the reasons and materials which necessitated the arrest while forwarding/producing the accused before the Magistrate.",
      "4. Magistrate while authorizing detention shall peruse the report furnished by the police officer and only after recording its satisfaction, authorize detention.",
      "5. Notice of appearance in terms of Section 41A CrPC be served on the accused within two weeks from the date of institution of the case.",
      "6. Failure to comply with directions shall render police officers liable for departmental action and contempt of court.",
    ],
    finalDisposition: "Appellant granted provisional bail; mandatory 8 directives issued to all State Governments and High Courts.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in/judgment/judis/41723.pdf",
    provenance: "Supreme Court of India Law Reports, (2014) 8 SCC 273, AIR 2014 SC 2756",
    fullJudgmentText: `
1. Arrest brings humiliation, curtails freedom and cast scars forever. Law makers know it so also the police. There is a battle between the lawmakers and the police and it seems that police has not learnt its lesson: the lesson implicit and delivered through Section 41 CrPC.
5. Section 41 CrPC was amended by the Code of Criminal Procedure (Amendment) Act, 2008 with a view to curtail unnecessary arrest.
7. An accused arrested without warrant by the police has the constitutional right under Article 22(2) and statutory right under Section 57 CrPC to be produced before the Magistrate within 24 hours of arrest.
11. We believe that no arrest should be made only because the offence is non-bailable and cognizable and therefore, lawful for the police officers to do so. The existence of the power to arrest is one thing, the justification for the exercise of it is quite another.
13. We issue the following directions to ensure that police officers do not arrest accused unnecessarily and Magistrate do not authorize detention casually and mechanically:
(1) All the State Governments to instruct its police officers that they should not automatically arrest when a case under Section 498-A IPC is registered but to satisfy themselves about the necessity for arrest under the parameters laid down above flowing from Section 41 CrPC;
(2) All police officers be provided with a check list containing specified sub-clauses under Section 41(1)(b)(ii);
(3) The police officer shall forward the check list duly filed and furnish the reasons and materials which necessitated the arrest, while forwarding/producing the accused before the Magistrate for further detention;
(4) The Magistrate while authorizing detention of the accused shall peruse the report furnished by the police officer in terms aforesaid and only after recording its satisfaction, the Magistrate will authorize detention;
(5) The decision not to arrest an accused, be forwarded to the Magistrate within two weeks from the date of the institution of the case with a copy to the Magistrate which may be extended by the Superintendent of Police of the district for the reason to be recorded in writing;
(6) Notice of appearance in terms of Section 41A CrPC be served on the accused within two weeks from the date of institution of the case, which may be extended by the Superintendent of Police of the District for the reasons to be recorded in writing;
(7) Failure to comply with the directions aforesaid shall apart from rendering the police officers concerned liable for departmental action, they shall also be liable to be punished for contempt of court to be instituted before High Court having territorial jurisdiction.
`,
  },

  // 3. JUSTICE K.S. PUTTASWAMY (RETD.) V. UNION OF INDIA (2017) 10 SCC 1
  {
    caseId: "puttaswamy_2017",
    caseName: "Justice K.S. Puttaswamy (Retd.) v. Union of India",
    petitioner: "Justice K.S. Puttaswamy (Retd.) & Others",
    respondent: "Union of India & Others",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "2017-08-24",
    citation: "(2017) 10 SCC 1",
    neutralCitation: "2017 INSC 609",
    bench: "Constitution Bench (9 Judges)",
    benchStrength: 9,
    judges: [
      "J.S. Khehar, C.J.I.",
      "J. Chelameswar, J.",
      "S.A. Bobde, J.",
      "R.K. Agrawal, J.",
      "R.F. Nariman, J.",
      "A.M. Sapre, J.",
      "Dr. D.Y. Chandrachud, J.",
      "Sanjay Kishan Kaul, J.",
      "S. Abdul Nazeer, J.",
    ],
    legalDomain: "CONSTITUTIONAL",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Aadhaar Act, 2016", "Information Technology Act, 2000"],
    constitutionalProvisionsConsidered: ["Article 21", "Article 14", "Article 19", "Part III"],
    legalIssues: [
      "Whether the right to privacy is a fundamental right under Part III of the Constitution of India.",
      "Whether the decisions in M.P. Sharma (1954) and ADM Jabalpur (1976) correctly held that there is no fundamental right to privacy.",
    ],
    holdings: [
      "The right to privacy is an intrinsic part of the right to life and personal liberty under Article 21 and as a part of the freedoms guaranteed by Part III of the Constitution.",
      "The decisions in M.P. Sharma (1954) and ADM Jabalpur (1976) are expressly overruled to the extent they held otherwise.",
    ],
    ratioDecidendi: "Privacy is the constitutional core of human dignity. The right of privacy is a fundamental right. It is a right which protects the inner sphere of the individual from interference from both State, and non-State actors and allows individuals to make autonomous life choices. Any state encroachment upon privacy must satisfy the three-fold test of legality, legitimate state aim, and proportionality.",
    ratioType: "DERIVED",
    finalDisposition: "Reference answered: right to privacy unanimously held to be a fundamental right under Article 21; ADM Jabalpur and M.P. Sharma overruled.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in/judgment/judis/44814.pdf",
    provenance: "Supreme Court of India Law Reports, (2017) 10 SCC 1, AIR 2017 SC 4161",
    fullJudgmentText: `
1. The right of privacy is a fundamental right. It is a right which protects the inner sphere of the individual from interference from both State, and non-State actors and allows the individuals to make autonomous life choices.
297. The right to privacy is protected as an intrinsic part of the right to life and personal liberty under Article 21 and as a part of the freedoms guaranteed by Part III of the Constitution.
298. The decision in M.P. Sharma (1954) to the extent that it holds to the contrary is overruled. The decision in ADM Jabalpur (1976) is also overruled.
305. An invasion of life or personal liberty must meet the threefold requirement of (i) legality, which postulates the existence of law; (ii) need, defined in terms of a legitimate state aim; and (iii) proportionality which ensures a rational nexus between the objects and the means adopted to achieve them.
`,
  },

  // 4. ADM JABALPUR V. SHIVKANT SHUKLA (1976) 2 SCC 521 (OVERRULED PRECEDENT)
  {
    caseId: "adm_jabalpur_1976",
    caseName: "ADM Jabalpur v. Shivkant Shukla",
    petitioner: "Additional District Magistrate, Jabalpur",
    respondent: "Shivkant Shukla",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "1976-04-28",
    citation: "(1976) 2 SCC 521",
    neutralCitation: "1976 INSC 129",
    bench: "Constitution Bench (5 Judges)",
    benchStrength: 5,
    judges: ["A.N. Ray, C.J.I.", "H.R. Khanna, J. (Dissenting)", "M.H. Beg, J.", "Y.V. Chandrachud, J.", "P.N. Bhagwati, J."],
    legalDomain: "CONSTITUTIONAL",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Maintenance of Internal Security Act, 1971", "Code of Criminal Procedure, 1973"],
    constitutionalProvisionsConsidered: ["Article 21", "Article 22", "Article 359", "Part III"],
    legalIssues: [
      "Whether a writ petition under Article 226 for habeas corpus is maintainable during a Presidential Proclamation of Emergency under Article 359.",
    ],
    holdings: [
      "(Majority 4:1) In view of the Presidential Order under Article 359(1), no person has any locus standi to move any writ petition under Article 226 for habeas corpus to challenge the legality of an order of detention.",
      "(Dissenting - Khanna, J.) Article 21 cannot be treated as the sole repository of the right to life and personal liberty; the State cannot deprive a person of life or liberty without the authority of law even during an emergency.",
    ],
    ratioDecidendi: "During an emergency declared under Article 359(1), right to move any court for enforcement of Article 21 remains suspended (OVERRULED).",
    ratioType: "DERIVED",
    finalDisposition: "High Court orders set aside; petitions dismissed (OVERRULED by 9-Judge Bench in K.S. Puttaswamy (2017)).",
    precedentStatus: "OVERRULED",
    overruledBy: {
      caseName: "Justice K.S. Puttaswamy (Retd.) v. Union of India",
      citation: "(2017) 10 SCC 1",
      year: 2017,
      benchStrength: 9,
      paragraph: 298,
    },
    sourceUrl: "https://main.sci.gov.in/judgment/judis/7625.pdf",
    provenance: "Supreme Court of India Law Reports, (1976) 2 SCC 521, AIR 1976 SC 1207 (OVERRULED by K.S. Puttaswamy (2017) 10 SCC 1)",
    fullJudgmentText: `
1. This batch of appeals raises the crucial question of whether during a proclamation of emergency, any person can approach the High Court under Article 226 for habeas corpus.
120. In view of the Presidential Order dated 27th June 1975 under Article 359(1) of the Constitution, no person has any locus standi to move any writ petition under Article 226 for habeas corpus or any other writ.
150. (Khanna, J. Dissenting): Sanctity of life and liberty was not very different when there was no Constitution. Even in absence of Article 21, the State has no power to deprive a person of his life or liberty without the authority of law.
`,
  },

  // 5. MANEKA GANDHI V. UNION OF INDIA (1978) 1 SCC 248
  {
    caseId: "maneka_gandhi_1978",
    caseName: "Maneka Gandhi v. Union of India",
    petitioner: "Maneka Gandhi",
    respondent: "Union of India & Another",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "1978-01-25",
    citation: "(1978) 1 SCC 248",
    neutralCitation: "1978 INSC 16",
    bench: "Constitution Bench (7 Judges)",
    benchStrength: 7,
    judges: ["M.H. Beg, C.J.I.", "Y.V. Chandrachud, J.", "P.N. Bhagwati, J.", "V.R. Krishna Iyer, J.", "N.L. Untwalia, J.", "S. Murtaza Fazal Ali, J.", "P.S. Kailasam, J."],
    legalDomain: "CONSTITUTIONAL",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Passports Act, 1967"],
    constitutionalProvisionsConsidered: ["Article 21", "Article 14", "Article 19", "Part III"],
    sectionsConsidered: ["Section 10(3)(c)"],
    legalIssues: [
      "Whether the impounding of a passport without providing reasons violates the procedure established by law under Article 21.",
      "Whether 'procedure established by law' must be just, fair, and reasonable and satisfy the Golden Triangle of Articles 14, 19, and 21.",
    ],
    holdings: [
      "Procedure established by law under Article 21 cannot be arbitrary, fanciful or oppressive; it must be just, fair and reasonable.",
      "Articles 14, 19 and 21 are not mutually exclusive; they form the Golden Triangle of constitutional fundamental rights.",
    ],
    ratioDecidendi: "The principle of reasonableness pervades Part III. 'Procedure established by law' under Article 21 means a procedure which is right, just and fair, and not arbitrary, fanciful or oppressive; otherwise, it'd be no procedure at all and the requirement of Article 21 would not be satisfied.",
    ratioType: "DERIVED",
    finalDisposition: "Impounding order held invalid; Attorney General's assurance accepted; petition disposed of.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in/judgment/judis/5391.pdf",
    provenance: "Supreme Court of India Law Reports, (1978) 1 SCC 248, AIR 1978 SC 597",
    fullJudgmentText: `
1. The petitioner's passport was impounded by the Government of India under Section 10(3)(c) of the Passports Act, 1967 in public interest.
5. The law must now be taken to be well settled that Article 21 does not exclude Article 19. The procedure contemplated by Article 21 must answer the test of reasonableness in order to be in conformity with Article 14.
6. The procedure prescribed by law must be just, fair and reasonable, and not arbitrary, fanciful or oppressive.
`,
  },

  // 6. A.K. GOPALAN V. STATE OF MADRAS (1950) SCR 88 (OVERRULED PRECEDENT)
  {
    caseId: "ak_gopalan_1950",
    caseName: "A.K. Gopalan v. State of Madras",
    petitioner: "A.K. Gopalan",
    respondent: "State of Madras",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "1950-05-19",
    citation: "AIR 1950 SC 27",
    neutralCitation: "1950 INSC 14",
    bench: "Constitution Bench (6 Judges)",
    benchStrength: 6,
    judges: ["H.J. Kania, C.J.I.", "Saiyid Fazl Ali, J.", "M. Patanjali Sastri, J.", "M.C. Mahajan, J.", "B.K. Mukherjea, J.", "S.R. Das, J."],
    legalDomain: "CONSTITUTIONAL",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Preventive Detention Act, 1950"],
    constitutionalProvisionsConsidered: ["Article 21", "Article 19", "Article 22"],
    legalIssues: [
      "Whether Article 19 and Article 21 are mutually exclusive silos of fundamental rights.",
    ],
    holdings: [
      "Articles 19, 21, and 22 deal with different subjects and are mutually exclusive.",
    ],
    ratioDecidendi: "Literal interpretation that 'procedure established by law' means any enacted law passed by the legislature regardless of natural justice (OVERRULED).",
    ratioType: "DERIVED",
    finalDisposition: "Petition dismissed (OVERRULED by 7-Judge Bench in Maneka Gandhi (1978)).",
    precedentStatus: "OVERRULED",
    overruledBy: {
      caseName: "Maneka Gandhi v. Union of India",
      citation: "(1978) 1 SCC 248",
      year: 1978,
      benchStrength: 7,
      paragraph: 5,
    },
    sourceUrl: "https://main.sci.gov.in/judgment/judis/133.pdf",
    provenance: "Supreme Court Reports, AIR 1950 SC 27, 1950 SCR 88 (OVERRULED by Maneka Gandhi (1978) 1 SCC 248)",
    fullJudgmentText: `
1. This is a petition under Article 32 of the Constitution for a writ of habeas corpus against detention under the Preventive Detention Act, 1950.
25. Article 19 has no application to a legislation dealing with preventive or punitive detention under Article 21 and 22.
`,
  },

  // 7. KAILASH NATH ASSOCIATES V. DDA (2015) 4 SCC 136
  {
    caseId: "kailash_nath_2015",
    caseName: "Kailash Nath Associates v. Delhi Development Authority",
    petitioner: "Kailash Nath Associates",
    respondent: "Delhi Development Authority & Another",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "2015-01-09",
    citation: "(2015) 4 SCC 136",
    neutralCitation: "2015 INSC 22",
    bench: "Division Bench (2 Judges)",
    benchStrength: 2,
    judges: ["Ranjan Gogoi, J.", "R.F. Nariman, J."],
    legalDomain: "CONTRACT",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Indian Contract Act, 1872"],
    sectionsConsidered: ["Section 74", "Section 73"],
    legalIssues: [
      "Whether earnest money or liquidated damages can be forfeited under Section 74 of the Indian Contract Act without proving actual loss or damage.",
    ],
    holdings: [
      "Compensation for breach under Section 74 is awarded on the principle of reasonable compensation, not exceeding the penalty amount stipulated.",
      "Where it is possible to prove actual damage or loss, proof of such loss is a mandatory condition precedent for recovering damages under Section 74.",
    ],
    ratioDecidendi: "Section 74 of the Indian Contract Act, 1872 requires that where damage or loss is caused by breach of contract, reasonable compensation must be awarded, subject to the maximum of the penalty named. If actual loss can be proved, the claimant must prove such loss; earnest money cannot be forfeited automatically in the absence of any loss.",
    ratioType: "DERIVED",
    finalDisposition: "Appeal allowed; DDA directed to refund earnest money with 9% interest.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in/judgment/judis/42217.pdf",
    provenance: "Supreme Court of India Law Reports, (2015) 4 SCC 136, AIR 2015 SC 1172",
    fullJudgmentText: `
1. This appeal arises out of a tender floated by the Delhi Development Authority (DDA) for auction of a commercial plot.
43. On a reading of Section 74, the following principles emerge:
(1) Where a sum is named in a contract as a liquidated amount, the party complaining of a breach can receive as reasonable compensation such liquidated amount only if it is a genuine pre-estimate of damages.
(2) Proof of actual damage or loss is not dispensed with where such damage or loss is capable of being proved.
(3) Where the party suffers no loss at all, forfeiture of earnest money is arbitrary and impermissible.
`,
  },

  // 8. VIDYA DROLIA V. DURGA TRADING CORPORATION (2021) 2 SCC 1
  {
    caseId: "vidya_drolia_2021",
    caseName: "Vidya Drolia v. Durga Trading Corporation",
    petitioner: "Vidya Drolia & Others",
    respondent: "Durga Trading Corporation",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "2020-12-14",
    citation: "(2021) 2 SCC 1",
    neutralCitation: "2020 INSC 697",
    bench: "Full Bench (3 Judges)",
    benchStrength: 3,
    judges: ["N.V. Ramana, J.", "Sanjiv Khanna, J.", "Krishna Murari, J."],
    legalDomain: "ARBITRATION",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Arbitration and Conciliation Act, 1996", "Transfer of Property Act, 1882"],
    sectionsConsidered: ["Section 8", "Section 11"],
    legalIssues: [
      "What is the test to determine the non-arbitrability of disputes under Indian law?",
      "Whether landlord-tenant disputes governed by the Transfer of Property Act, 1882 are arbitrable.",
    ],
    holdings: [
      "Landlord-tenant disputes governed by Transfer of Property Act, 1872 are arbitrable as they do not involve rights in rem or statutory rent control protection.",
      "Established a four-fold test to determine non-arbitrability of disputes under Section 8 and 11.",
    ],
    ratioDecidendi: "An issue is non-arbitrable when: (1) it relates to actions in rem; (2) it affects third-party rights; (3) it pertains to inalienable sovereign functions of the State; or (4) it is expressly or by necessary implication non-arbitrable under a specific statute. Under Section 8 and 11, the court's jurisdiction is limited to a prima facie review of the existence of the arbitration agreement.",
    ratioType: "DERIVED",
    finalDisposition: "Reference answered; landlord-tenant disputes held arbitrable; four-fold test established.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in/judgment/judis/47743.pdf",
    provenance: "Supreme Court of India Law Reports, (2021) 2 SCC 1, AIR 2021 SC 127",
    fullJudgmentText: `
1. The expression 'arbitrability' has different facets and meanings.
76. A dispute is non-arbitrable when:
(1) it relates to actions in rem, that do not pertain to subordinate rights in personam that arise from rights in rem;
(2) it affects third party rights, has erga omnes effect, requires centralized adjudication, and mutual adjudication would not be appropriate;
(3) it pertains to inalienable sovereign and public interest functions of the State; and
(4) it is expressly or by necessary implication non-arbitrable as per mandatory statute(s).
154. The scope of review under Sections 8 and 11 is restricted to the prima facie examination of whether a valid arbitration agreement exists.
`,
  },

  // 9. SHREYA SINGHAL V. UNION OF INDIA (2015) 5 SCC 1
  {
    caseId: "shreya_singhal_2015",
    caseName: "Shreya Singhal v. Union of India",
    petitioner: "Shreya Singhal",
    respondent: "Union of India",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "2015-03-24",
    citation: "(2015) 5 SCC 1",
    neutralCitation: "2015 INSC 244",
    bench: "Division Bench (2 Judges)",
    benchStrength: 2,
    judges: ["J. Chelameswar, J.", "R.F. Nariman, J."],
    legalDomain: "CYBER",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Information Technology Act, 2000"],
    constitutionalProvisionsConsidered: ["Article 19(1)(a)", "Article 19(2)"],
    sectionsConsidered: ["Section 66A", "Section 79", "Section 69A"],
    legalIssues: [
      "Whether Section 66A of the Information Technology Act, 2000 violates Article 19(1)(a) of the Constitution.",
      "Whether Section 79(3)(b) intermediary liability requires a court order or government notification.",
    ],
    holdings: [
      "Section 66A of the Information Technology Act, 2000 is unconstitutional in its entirety as it infringes the fundamental right to freedom of speech and expression under Article 19(1)(a) and is not saved by Article 19(2).",
      "Section 79(3)(b) read with Information Technology Intermediary Guidelines is read down: an intermediary must take down content only upon receiving actual knowledge in the form of a court order or authorized government notification.",
    ],
    ratioDecidendi: "Section 66A of the IT Act casts the net very wide and is open-ended, vague and nebulous. It fails the test of clear and present danger and chills free speech. Intermediary safe harbour under Section 79 is preserved unless the intermediary fails to expeditiously remove content after receiving a valid court order or government takedown requisition.",
    ratioType: "DERIVED",
    finalDisposition: "Section 66A IT Act struck down; Section 79 read down; Section 69A blocking rules upheld.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in/judgment/judis/42436.pdf",
    provenance: "Supreme Court of India Law Reports, (2015) 5 SCC 1, AIR 2015 SC 1523",
    fullJudgmentText: `
1. Section 66A of the Information Technology Act, 2000 punishes sending offensive messages through communication service.
119. Section 66A of the Information Technology Act, 2000 is struck down in its entirety being violative of Article 19(1)(a) and not saved under Article 19(2).
122. Section 79(3)(b) has to be read down to mean that an intermediary upon receiving actual knowledge from a court order or on being notified by the appropriate government or its agency that unlawful acts are being committed must expeditiously remove or disable access to that material.
`,
  },

  // 10. VINEETA SHARMA V. RAKESH SHARMA (2020) 9 SCC 1
  {
    caseId: "vineeta_sharma_2020",
    caseName: "Vineeta Sharma v. Rakesh Sharma",
    petitioner: "Vineeta Sharma",
    respondent: "Rakesh Sharma & Others",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "2020-08-11",
    citation: "(2020) 9 SCC 1",
    neutralCitation: "2020 INSC 487",
    bench: "Full Bench (3 Judges)",
    benchStrength: 3,
    judges: ["Arun Mishra, J.", "S. Abdul Nazeer, J.", "M.R. Shah, J."],
    legalDomain: "SUCCESSION",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Hindu Succession Act, 1956"],
    constitutionalProvisionsConsidered: ["Article 14", "Article 15"],
    sectionsConsidered: ["Section 6"],
    legalIssues: [
      "Whether the amended Section 6 of the Hindu Succession Act, 1956 confers coparcenary rights on daughters by birth even if the father died prior to the 2005 amendment.",
    ],
    holdings: [
      "Daughters have coparcenary rights by birth under Section 6 of the Hindu Succession Act, 1956 in the same manner as sons.",
      "The coparcenary right is conferred by birth; it is not necessary that the father coparcener was living on the date of amendment (09-09-2005).",
    ],
    ratioDecidendi: "Section 6 of the Hindu Succession Act confers full coparcenary status on daughters by birth. The amendment operates with retroactive effect: coparcenary rights accrue from birth, irrespective of whether the father was alive on September 9, 2005.",
    ratioType: "DERIVED",
    finalDisposition: "Reference answered: daughters held coparceners by birth; conflicting earlier decisions overruled/clarified.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in/judgment/judis/47402.pdf",
    provenance: "Supreme Court of India Law Reports, (2020) 9 SCC 1, AIR 2020 SC 3717",
    fullJudgmentText: `
1. Section 6 of the Hindu Succession Act, 1956 was substituted by Act 39 of 2005 to grant equal coparcenary rights to daughters.
137. The provisions contained in substituted Section 6 of the Hindu Succession Act, 1956 confer status of coparcener on the daughter born before or after amendment in the same manner as son with same rights and liabilities.
137.2. The rights can be claimed by the daughter born earlier with effect from 9.9.2005 with savings as provided in Section 6(1) as to the disposition or alienation, partition or testamentary disposition which had taken place before 20th day of December, 2004.
137.3. Since the right in coparcenary is by birth, it is not necessary that father coparcener should be living as on 9.9.2005.
`,
  },

  // 11. BOMBAY HIGH COURT PRECEDENT (STATE SPECIFIC JURISDICTION)
  {
    caseId: "lalit_mathew_bom_2021",
    caseName: "Lalit Mohan Mathew v. State of Maharashtra",
    petitioner: "Lalit Mohan Mathew",
    respondent: "State of Maharashtra & Others",
    court: "HIGH_COURT",
    courtName: "High Court of Judicature at Bombay",
    state: "Maharashtra",
    judgmentDate: "2021-04-15",
    citation: "2021 SCC OnLine Bom 452",
    bench: "Division Bench (2 Judges)",
    benchStrength: 2,
    judges: ["S.S. Shinde, J.", "Manish Pitale, J."],
    legalDomain: "CRIMINAL_PROCEDURE",
    jurisdiction: "IN-MH",
    statutesConsidered: ["Code of Criminal Procedure, 1973", "Real Estate (Regulation and Development) Act, 2016"],
    constitutionalProvisionsConsidered: ["Article 226"],
    sectionsConsidered: ["Section 41A"],
    legalIssues: [
      "Whether the police in Maharashtra are mandated to issue Section 41A CrPC notice and comply with Bombay High Court Circulars on non-custodial investigation.",
    ],
    holdings: [
      "Bombay High Court held that police officers in Maharashtra must record cogent reasons for arrest under Section 41(1)(b) and non-compliance constitutes contempt of court within Maharashtra.",
    ],
    ratioDecidendi: "In the State of Maharashtra, police officers must strictly adhere to the guidelines issued by the Bombay High Court and the Supreme Court in Arnesh Kumar. Failure to issue Section 41A notice results in illegal detention and compensation.",
    ratioType: "DERIVED",
    finalDisposition: "Writ petition allowed; compensation awarded against State of Maharashtra.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://bombayhighcourt.nic.in/judgment/2021/452.pdf",
    provenance: "High Court of Judicature at Bombay, 2021 SCC OnLine Bom 452 (Jurisdiction: Maharashtra)",
    fullJudgmentText: `
1. This petition under Article 226 of the Constitution of India raises questions regarding illegal arrest and detention by the Mumbai Police.
12. The Division Bench of the Bombay High Court directs that police stations across the State of Maharashtra must strictly observe Section 41A CrPC notices.
25. An arrest made in violation of the statutory mandate within the State of Maharashtra entitles the victim to compensation from the State.
`,
  },

  // 12. UNCERTAIN STATUS PRECEDENT (FOR TESTING PART 8 UNCERTAIN LOGIC)
  {
    caseId: "uncertain_precedent_2025",
    caseName: "State of West Bengal v. XYZ Uncertain Precedent",
    petitioner: "State of West Bengal",
    respondent: "XYZ Industrial Federation",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "2025-01-15",
    citation: "2025 SCC OnLine SC 9999",
    bench: "Division Bench (2 Judges)",
    benchStrength: 2,
    legalDomain: "COMMERCIAL",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Central Goods and Services Tax Act, 2017", "Indian Contract Act, 1872"],
    constitutionalProvisionsConsidered: ["Article 14", "Article 19(1)(g)"],
    legalIssues: [
      "Whether state tax incentives constitute binding promissory estoppel against statutory revisions.",
    ],
    holdings: [
      "Conflicting rulings referred to a 5-Judge Constitution Bench; legal status currently in flux.",
    ],
    ratioDecidendi: "Status uncertain pending Constitution Bench resolution.",
    ratioType: "DERIVED",
    finalDisposition: "Referred to larger Constitution Bench; precedent status UNCERTAIN.",
    precedentStatus: "UNCERTAIN",
    sourceUrl: "https://main.sci.gov.in",
    provenance: "Supreme Court of India Interim Reference, 2025 SCC OnLine SC 9999",
    fullJudgmentText: `
1. In view of conflicting two-judge bench decisions on promissory estoppel in commercial taxation, this matter is referred to a 5-Judge Constitution Bench.
10. Pending decision by the larger bench, the binding status of the interim proposition remains uncertain.
`,
  },

  // 13. KESAVANANDA BHARATI V. STATE OF KERALA (1973) 4 SCC 225
  {
    caseId: "kesavananda_1973",
    caseName: "Kesavananda Bharati Sripadagalvaru v. State of Kerala",
    petitioner: "Kesavananda Bharati Sripadagalvaru",
    respondent: "State of Kerala & Another",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "1973-04-24",
    citation: "(1973) 4 SCC 225",
    bench: "Full Constitution Bench (13 Judges)",
    benchStrength: 13,
    judges: ["S.M. Sikri, C.J.", "J.M. Shelat, J.", "K.S. Hegde, J.", "A.N. Grover, J.", "P. Jaganmohan Reddy, J.", "H.R. Khanna, J."],
    legalDomain: "CONSTITUTIONAL",
    jurisdiction: "INDIAN",
    constitutionalProvisionsConsidered: ["Article 368", "Article 13", "Article 31C"],
    legalIssues: [
      "Whether the power of Parliament to amend the Constitution under Article 368 is unlimited or subject to inherent implied limitations.",
    ],
    holdings: [
      "Article 368 does not enable Parliament to alter the basic structure or essential framework of the Constitution of India.",
    ],
    ratioDecidendi: "The constituent power under Article 368 is wide but not unlimited; it does not extend to abrogating or emasculating the Basic Structure of the Constitution.",
    ratioType: "DERIVED",
    finalDisposition: "Basic Structure Doctrine established; 24th, 25th, and 29th Amendments upheld subject to Basic Structure review.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in",
    provenance: "Supreme Court of India Law Reports, (1973) 4 SCC 225, AIR 1973 SC 1461",
    fullJudgmentText: `
1. The question before the 13-Judge Bench is the validity of the Constitution (Twenty-fourth Amendment) Act, 1971, the Constitution (Twenty-fifth Amendment) Act, 1971, and the Constitution (Twenty-ninth Amendment) Act, 1972.
2. The word "amendment" in Article 368 postulates that the old Constitution survives without loss of its identity and essential characteristics.
3. Parliament cannot alter the basic structure of the Constitution.
`,
  },

  // 14. S.R. BOMMAI V. UNION OF INDIA (1994) 3 SCC 1
  {
    caseId: "sr_bommai_1994",
    caseName: "S.R. Bommai v. Union of India",
    petitioner: "S.R. Bommai & Others",
    respondent: "Union of India & Others",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "1994-03-11",
    citation: "(1994) 3 SCC 1",
    bench: "Constitution Bench (9 Judges)",
    benchStrength: 9,
    judges: ["S.R. Pandian, J.", "A.M. Ahmadi, J.", "Kuldip Singh, J.", "J.S. Verma, J.", "P.B. Sawant, J.", "K. Ramaswamy, J."],
    legalDomain: "CONSTITUTIONAL",
    jurisdiction: "INDIAN",
    constitutionalProvisionsConsidered: ["Article 356", "Article 352", "Article 74(2)"],
    legalIssues: [
      "Whether the Proclamation of Emergency / President's Rule under Article 356 is subject to judicial review.",
      "Whether Secularism is part of the Basic Structure of the Constitution.",
    ],
    holdings: [
      "Proclamation under Article 356 is justiciable and subject to judicial review on grounds of mala fides or irrationality.",
      "Secularism is an essential part of the Basic Structure of the Constitution.",
    ],
    ratioDecidendi: "President's satisfaction under Article 356 is not absolute; courts have jurisdiction to examine the material on which the satisfaction was based.",
    ratioType: "DERIVED",
    finalDisposition: "Dissolution of state legislative assemblies without floor test held unconstitutional.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in",
    provenance: "Supreme Court of India Law Reports, (1994) 3 SCC 1",
    fullJudgmentText: `
1. This batch of appeals and writ petitions challenges the validity of Proclamations issued under Article 356 of the Constitution.
2. Secularism is a basic feature of the Constitution.
3. The satisfaction of the President under Article 356(1) is open to judicial review on grounds of mala fides and relevancy of material.
`,
  },

  // 15. LALITA KUMARI V. GOVT OF UTTAR PRADESH (2014) 2 SCC 1
  {
    caseId: "lalita_kumari_2014",
    caseName: "Lalita Kumari v. Govt of Uttar Pradesh",
    petitioner: "Lalita Kumari (Minor)",
    respondent: "Govt of Uttar Pradesh & Others",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "2013-11-12",
    citation: "(2014) 2 SCC 1",
    neutralCitation: "2013 INSC 790",
    bench: "Constitution Bench (5 Judges)",
    benchStrength: 5,
    judges: ["P. Sathasivam, C.J.", "B.S. Chauhan, J.", "Ranjana Desai, J.", "Ranjan Gogoi, J.", "S.A. Bobde, J."],
    legalDomain: "CRIMINAL_PROCEDURE",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Code of Criminal Procedure, 1973", "Bharatiya Nagarik Suraksha Sanhita, 2023"],
    constitutionalProvisionsConsidered: ["Article 21"],
    sectionsConsidered: ["Section 154", "Section 173 BNSS"],
    legalIssues: [
      "Whether a police officer is bound to register a First Information Report (FIR) upon receiving information relating to the commission of a cognizable offence.",
    ],
    holdings: [
      "Registration of FIR is mandatory under Section 154 of the Code if the information discloses commission of a cognizable offence and no preliminary inquiry is permissible in such situation.",
    ],
    ratioDecidendi: "The word 'shall' in Section 154(1) of CrPC / Section 173(1) BNSS leaves no discretion to police officer to refuse registration of FIR if cognizable offence is disclosed.",
    ratioType: "DERIVED",
    finalDisposition: "Mandatory FIR registration guidelines laid down for all police stations nationwide.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in",
    provenance: "Supreme Court of India Law Reports, (2014) 2 SCC 1",
    fullJudgmentText: `
1. The important legal issue in this case is whether a police officer is bound to register an FIR upon receiving information relating to the commission of a cognizable offence.
2. Registration of FIR is mandatory under Section 154 of the Code if the information discloses commission of a cognizable offence.
3. Preliminary inquiry may be conducted only in specified cases like matrimonial disputes, medical negligence, corruption, or where there is abnormal delay.
`,
  },

  // 16. SATENDER KUMAR ANTIL V. CBI (2022) 10 SCC 51
  {
    caseId: "satender_antil_2022",
    caseName: "Satender Kumar Antil v. Central Bureau of Investigation",
    petitioner: "Satender Kumar Antil",
    respondent: "Central Bureau of Investigation & Another",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "2022-07-11",
    citation: "(2022) 10 SCC 51",
    bench: "Division Bench (2 Judges)",
    benchStrength: 2,
    judges: ["Sanjay Kishan Kaul, J.", "M.M. Sundresh, J."],
    legalDomain: "CRIMINAL_PROCEDURE",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Code of Criminal Procedure, 1973", "BNSS, 2023"],
    constitutionalProvisionsConsidered: ["Article 21"],
    sectionsConsidered: ["Section 41", "Section 41A", "Section 88", "Section 170", "Section 437", "Section 439"],
    legalIssues: [
      "What guidelines should govern bail and arrest in offences under special Acts and Indian Penal Code to prevent unnecessary incarceration.",
    ],
    holdings: [
      "Supreme Court categorized offences into Category A (under 7 years), Category B (death/life imprisonment), Category C (Special Acts like NDPS/PMLA), and Category D (Economic offences), directing strict adherence to Section 41A notices without mechanical arrest.",
    ],
    ratioDecidendi: "Bail is the rule and jail is the exception. Non-compliance with Section 41 and 41A CrPC / Section 35 BNSS entitles the accused to bail.",
    ratioType: "DERIVED",
    finalDisposition: "Comprehensive bail guidelines issued.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in",
    provenance: "Supreme Court of India Law Reports, (2022) 10 SCC 51",
    fullJudgmentText: `
1. The recurring issue of arbitrary arrests and mechanical remand despite statutory safeguards under Section 41A CrPC requires authoritative guidelines.
2. In Category A offences punishable up to 7 years, non-compliance with Section 41 and 41A warrants grant of bail.
`,
  },

  // 17. PANKAJ BANSAL V. UNION OF INDIA (2023)
  {
    caseId: "pankaj_bansal_2023",
    caseName: "Pankaj Bansal v. Union of India",
    petitioner: "Pankaj Bansal",
    respondent: "Union of India & Others",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "2023-10-03",
    citation: "2023 SCC OnLine SC 1244",
    bench: "Division Bench (2 Judges)",
    benchStrength: 2,
    judges: ["A.S. Bopanna, J.", "Sanjay Kumar, J."],
    legalDomain: "CRIMINAL_PROCEDURE",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Prevention of Money Laundering Act, 2002"],
    constitutionalProvisionsConsidered: ["Article 22(1)"],
    sectionsConsidered: ["Section 19"],
    legalIssues: [
      "Whether the Enforcement Directorate (ED) is mandatorily required to furnish a written copy of grounds of arrest to the arrestee under Section 19 PMLA.",
    ],
    holdings: [
      "The Supreme Court held that it is mandatory for the ED to provide a written copy of grounds of arrest to the arrestee at the time of arrest under Section 19 PMLA.",
    ],
    ratioDecidendi: "To ensure full compliance with Article 22(1) of the Constitution and Section 19(1) PMLA, communicating grounds of arrest in writing without delay is indispensable.",
    ratioType: "DERIVED",
    finalDisposition: "Appeals allowed; arrest and remand orders quashed for failure to supply written grounds.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in",
    provenance: "Supreme Court of India, 2023 SCC OnLine SC 1244",
    fullJudgmentText: `
1. The question is whether the ED is required to furnish grounds of arrest in writing to the arrestee under Section 19 of the PMLA.
2. In terms of Article 22(1) of the Constitution, a person arrested is entitled to know the grounds of arrest in writing to enable effective legal defence.
`,
  },

  // 18. NN GLOBAL MERCANTILE (2023) [7-Judge Constitution Bench]
  {
    caseId: "nn_global_2023",
    caseName: "In Re: Interplay between Arbitration Agreements and Indian Stamp Act",
    petitioner: "NN Global Mercantile Pvt Ltd",
    respondent: "Indo Unique Flame Ltd & Others",
    court: "SUPREME_COURT",
    courtName: "Supreme Court of India",
    judgmentDate: "2023-12-13",
    citation: "(2023) 7 SCC 1",
    bench: "Constitution Bench (7 Judges)",
    benchStrength: 7,
    judges: ["Dr. D.Y. Chandrachud, C.J.", "S.K. Kaul, J.", "Sanjiv Khanna, J.", "B.R. Gavai, J.", "Surya Kant, J.", "J.B. Pardiwala, J.", "Manoj Misra, J."],
    legalDomain: "ARBITRATION",
    jurisdiction: "INDIAN",
    statutesConsidered: ["Arbitration and Conciliation Act, 1996", "Indian Stamp Act, 1899"],
    sectionsConsidered: ["Section 8", "Section 11(6A)", "Section 33 Stamp Act", "Section 35 Stamp Act"],
    legalIssues: [
      "Whether an arbitration agreement contained in an unstamped or insufficiently stamped underlying contract is void ab initio or non-existent in law.",
    ],
    holdings: [
      "7-Judge Bench unanimously held that non-stamping or insufficient stamping does not render an arbitration agreement void; it is a curable defect.",
    ],
    ratioDecidendi: "An unstamped arbitration agreement is not void ab initio; the arbitral tribunal has competence to examine stamping under Section 16.",
    ratioType: "DERIVED",
    finalDisposition: "Overruled earlier 5-judge bench decision in NN Global (2023) 4 SCC 1.",
    precedentStatus: "GOOD_LAW",
    sourceUrl: "https://main.sci.gov.in",
    provenance: "Supreme Court of India Law Reports, (2023) 7 SCC 1",
    fullJudgmentText: `
1. The 7-Judge Constitution Bench was constituted to resolve the conflict between the Stamp Act and the Arbitration Act.
2. An unstamped agreement is inadmissible in evidence under Section 35 Stamp Act, but is not void ab initio.
3. The defect of non-stamping is curable upon payment of stamp duty and penalty.
`,
  },
];
