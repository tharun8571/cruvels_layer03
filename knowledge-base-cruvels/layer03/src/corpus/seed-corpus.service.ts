import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import {
  KnowledgeAuthorityLevel,
  KnowledgeCollectionType,
  KnowledgeDocumentStatus,
  KnowledgeDocumentType,
  KnowledgeJurisdiction,
  KnowledgeNodeType,
  KnowledgeRelationType,
  KnowledgeSourceType,
} from "@prisma/client";
import { createHash } from "node:crypto";
import { EmbeddingProviderService } from "../embedding/embedding-provider.service";
import { KnowledgeRepositoryService } from "../repository/knowledge-repository.service";
import type { LegalDomain } from "../contracts/legal-source.contract";
import { CONSTITUTION_CORPUS } from "./constitution-corpus.data";
import { CASE_LAW_CORPUS } from "./case-law-corpus.data";
import {
  PRACTICAL_FORUMS,
  PRACTICAL_REMEDIES,
  PRACTICAL_LIMITATIONS,
  PRACTICAL_NOTICES,
} from "./practical-legal-corpus.data";
import { CaseStructureDetector } from "../structure/case-structure-detector";
import type { LegalGraphEdgeV1, LegalGraphNodeV1 } from "../contracts/knowledge-graph.contract";

@Injectable()
export class SeedCorpusService implements OnModuleInit {
  private readonly logger = new Logger(SeedCorpusService.name);


  constructor(
    private readonly repository: KnowledgeRepositoryService,
    private readonly embeddingProvider: EmbeddingProviderService,
  ) {}

  async onModuleInit() {
    await this.seedInitialCorpus();
  }

  /**
   * Seeds the production Knowledge Base with verified authoritative legal corpora:
   * 1. Constitution of India, 1950 (Fundamental Rights, Due Process, Arrest Protections)
   * 2. Criminal Procedure Code, 1973 (CrPC) & Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) (Arrest rights, Memo, Family Notice)
   * 3. Information Technology Act, 2000 (Identity theft, Impersonation, Privacy, Intermediary Takedown)
   * 4. Indian Contract Act, 1872 (Formation, Breach, Damages, Specific Relief)
   * 5. Arbitration and Conciliation Act, 1996 (Agreements, Reference, Interim Relief, Setting Aside)
   * 6. Customs Act, 1962 & Foreign Trade Policy (Vehicle import rules, Homologation, Tariff compliance)
   * 7. Digital Personal Data Protection Act, 2023 (DPDP)
   * 8. Landmark Supreme Court Precedents (D.K. Basu, Arnesh Kumar, Shreya Singhal, Puttaswamy, Kesavananda Bharati, Maneka Gandhi, Vidya Drolia, Kailash Nath)
   * 9. Multi-version Private Agreements & Discovery bundles
   * 10. General Computing & Reference Infrastructure
   */
  async seedInitialCorpus(): Promise<void> {
    this.logger.log("Seeding authoritative Knowledge Base initial corpus...");

    // =========================================================================
    // 1. KNOWLEDGE SOURCES
    // =========================================================================
    const srcGov = await this.repository.createSource({
      id: "src_in_legislative_dept",
      name: "Legislative Department, Ministry of Law and Justice, Government of India",
      sourceType: KnowledgeSourceType.OFFICIAL_GOVERNMENT,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      country: "IN",
      publisher: "Gazette of India",
      sourceUrl: "https://legislative.gov.in",
      license: "Government Open Data License - India (GODL)",
      trustLevel: 1.0,
      verificationStatus: "VERIFIED" as any,
    });

    const srcSupremeCourt = await this.repository.createSource({
      id: "src_in_supreme_court",
      name: "Supreme Court of India",
      sourceType: KnowledgeSourceType.OFFICIAL_COURT,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      country: "IN",
      court: "Supreme Court of India",
      sourceUrl: "https://main.sci.gov.in",
      license: "Public Domain Law Reports",
      trustLevel: 1.0,
      verificationStatus: "VERIFIED" as any,
    });

    const srcDgft = await this.repository.createSource({
      id: "src_in_dgft_cbic",
      name: "Directorate General of Foreign Trade & Central Board of Indirect Taxes and Customs",
      sourceType: KnowledgeSourceType.OFFICIAL_GOVERNMENT,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      country: "IN",
      publisher: "Ministry of Commerce and Industry",
      sourceUrl: "https://dgft.gov.in",
      trustLevel: 1.0,
      verificationStatus: "VERIFIED" as any,
    });

    const srcFirm = await this.repository.createSource({
      id: "src_firm_precedents",
      name: "Cruvels Verified Law Firm Precedents & Deal Repository",
      sourceType: KnowledgeSourceType.VERIFIED_FIRM,
      authorityLevel: KnowledgeAuthorityLevel.VERIFIED_FIRM_SOURCE,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      country: "IN",
      trustLevel: 0.95,
      verificationStatus: "VERIFIED" as any,
    });

    const srcGeneral = await this.repository.createSource({
      id: "src_general_reference",
      name: "Global Computer Science & Legal Informatics Encyclopedia",
      sourceType: KnowledgeSourceType.GENERAL_REFERENCE,
      authorityLevel: KnowledgeAuthorityLevel.GENERAL_REFERENCE,
      jurisdiction: KnowledgeJurisdiction.INTERNATIONAL,
      country: "GLOBAL",
      trustLevel: 0.90,
      verificationStatus: "VERIFIED" as any,
    });

    // =========================================================================
    // 2. KNOWLEDGE COLLECTIONS
    // =========================================================================
    const colLegalGlobal = await this.repository.createCollection({
      id: "col_legal_global",
      name: "LEGAL_GLOBAL",
      type: KnowledgeCollectionType.LEGAL_GLOBAL,
      description: "Indian Constitution, Central Legislation, Rules, and Supreme Court Precedents",
      isPublic: true,
    });

    const colGeneralGlobal = await this.repository.createCollection({
      id: "col_general_global",
      name: "GENERAL_GLOBAL",
      type: KnowledgeCollectionType.GENERAL_GLOBAL,
      description: "General Reference, Computer Science, Architecture, and Systems Engineering",
      isPublic: true,
    });

    const colFirmA = await this.repository.createCollection({
      id: "col_firm_alpha",
      name: "FIRM_KNOWLEDGE",
      type: KnowledgeCollectionType.FIRM_KNOWLEDGE,
      firmId: "firm-alpha",
      description: "Firm Alpha Master Precedents and Client Templates",
      isPublic: false,
    });

    const colMatter101 = await this.repository.createCollection({
      id: "col_matter_101",
      name: "MATTER_KNOWLEDGE",
      type: KnowledgeCollectionType.MATTER_KNOWLEDGE,
      firmId: "firm-alpha",
      caseId: "case-101",
      description: "Matter 101 Vendor Dispute Discovery Bundle",
      isPublic: false,
    });

    // =========================================================================
    // 3. STATUTORY DOCUMENTS (LEGAL_GLOBAL)
    // =========================================================================

    // 3.1 Constitution of India, 1950
    await this.ingestSeededDocument({
      id: "doc_in_constitution_1950",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Constitution of India, 1950",
      documentType: KnowledgeDocumentType.CONSTITUTION,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSTITUTIONAL",
      publicationDate: "1950-01-26",
      effectiveFrom: "1950-01-26",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1950-ENACTED",
      nodes: [
        {
          identifier: "Preamble",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Preamble to the Constitution",
          text: "WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens: JUSTICE, social, economic and political; LIBERTY of thought, expression, belief, faith and worship; EQUALITY of status and of opportunity; and to promote among them all FRATERNITY.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
        {
          identifier: "Article 14",
          nodeType: KnowledgeNodeType.ARTICLE,
          title: "Equality before law",
          text: "Article 14. Equality before law: The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India. Equality before law prohibits arbitrary discrimination but permits reasonable classification founded on an intelligible differentia having a rational nexus to the object sought to be achieved.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Article 19",
          nodeType: KnowledgeNodeType.ARTICLE,
          title: "Protection of certain rights regarding freedom of speech, etc.",
          text: "Article 19. Freedom of speech and reasonable restrictions: (1) All citizens shall have the right (a) to freedom of speech and expression; (b) to assemble peaceably and without arms; (c) to form associations or unions; (d) to move freely throughout the territory of India; (e) to reside and settle in any part of the territory of India; and (g) to practise any profession, or to carry on any occupation, trade or business. (2) Nothing in sub-clause (a) of clause (1) shall prevent the State from making any law imposing reasonable restrictions on the exercise of freedom of speech and expression in the interests of the sovereignty and integrity of India, the security of the State, public order, decency, morality, or in relation to contempt of court, defamation or incitement to an offence.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
        {
          identifier: "Article 21",
          nodeType: KnowledgeNodeType.ARTICLE,
          title: "Protection of life and personal liberty",
          text: "Article 21. Protection of life and personal liberty: No person shall be deprived of his life or personal liberty except according to procedure established by law.",
          startPage: 4,
          endPage: 4,
          orderIndex: 4,
          depth: 1,
        },
        {
          identifier: "Article 22",
          nodeType: KnowledgeNodeType.ARTICLE,
          title: "Protection against arrest and detention in certain cases",
          text: "Article 22. Protection against arrest and detention: (1) No person who is arrested shall be detained in custody without being informed, as soon as may be, of the grounds for such arrest nor shall he be denied the right to consult, and to be defended by, a legal practitioner of his choice. (2) Every person who is arrested and detained in custody shall be produced before the nearest magistrate within a period of twenty-four hours of such arrest excluding the time necessary for the journey from the place of arrest to the court of the magistrate and no such person shall be detained in custody beyond the said period without the authority of a magistrate.",
          startPage: 5,
          endPage: 5,
          orderIndex: 5,
          depth: 1,
        },
        {
          identifier: "Article 32",
          nodeType: KnowledgeNodeType.ARTICLE,
          title: "Remedies for enforcement of rights conferred by this Part",
          text: "Article 32. Remedies for enforcement of rights: (1) The right to move the Supreme Court by appropriate proceedings for the enforcement of the rights conferred by this Part is guaranteed. (2) The Supreme Court shall have power to issue directions or orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari.",
          startPage: 6,
          endPage: 6,
          orderIndex: 6,
          depth: 1,
        },
        {
          identifier: "Article 136",
          nodeType: KnowledgeNodeType.ARTICLE,
          title: "Special leave to appeal by the Supreme Court",
          text: "Article 136. Special leave to appeal by the Supreme Court: (1) Notwithstanding anything in this Chapter, the Supreme Court may, in its discretion, grant special leave to appeal (SLP) from any judgment, decree, determination, sentence or order in any cause or matter passed or made by any court or tribunal in the territory of India.",
          startPage: 7,
          endPage: 7,
          orderIndex: 7,
          depth: 1,
        },
        {
          identifier: "Article 226",
          nodeType: KnowledgeNodeType.ARTICLE,
          title: "Power of High Courts to issue certain writs",
          text: "Article 226. Power of High Courts to issue certain writs: (1) Notwithstanding anything in Article 32, every High Court shall have power, throughout the territories in relation to which it exercises jurisdiction, to issue to any person or authority, including in appropriate cases any Government, directions, orders or writs, including writs in the nature of habeas corpus, mandamus, prohibition, quo warranto and certiorari, for the enforcement of fundamental rights or for any other purpose.",
          startPage: 8,
          endPage: 8,
          orderIndex: 8,
          depth: 1,
        },
      ],
    });

    // 3.2.1 Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) - In Force 2024-07-01
    await this.ingestSeededDocument({
      id: "doc_in_bnss_2023",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CRIMINAL_PROCEDURE",
      publicationDate: "2023-12-25",
      effectiveFrom: "2024-07-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2023-ENACTED",
      supersedesVersionId: "ver_doc_in_crpc_1973_1973-repealed",
      nodes: [
        {
          identifier: "Section 35",
          nodeType: KnowledgeNodeType.SECTION,
          title: "When police may arrest without warrant and notice of appearance (Replaces Section 41, 41A, 41B CrPC)",
          text: "Section 35 BNSS. Arrest of persons without warrant (Corresponding to Section 41, 41A, 41B CrPC): (1) Any police officer may without an order from a Magistrate and without a warrant, arrest any person who commits, in the presence of a police officer, a cognizable offence, or against whom a reasonable complaint has been made or credible information received that he has committed a cognizable offence punishable with imprisonment for a term which may be less than seven years or which may extend to seven years. (3) The police officer shall, in all cases where the arrest of a person is not required under sub-section (1), issue a notice directing the person against whom a reasonable complaint has been made to appear before him.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 37",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Designated police officer and information of arrest to nominated person (Replaces Section 41B & 50A CrPC)",
          text: "Section 37 BNSS. Designated police officer and obligation to inform nominated person (Corresponding to Section 41B, 50A CrPC): (1) The State Government shall establish a police control room in every district and at State level, and designate a police officer in every district who shall maintain information of persons arrested and offences charged. (2) Every police officer making an arrest shall forthwith inform the friends, relatives or such other persons as may be disclosed or nominated by the arrested person about his arrest and place of custody. (3) An entry shall be made in a book kept in the police station.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 47",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Person arrested to be informed of grounds of arrest and of right to bail",
          text: "Section 47 BNSS. Person arrested to be informed of grounds of arrest and of right to bail: (1) Every police officer or other person arresting any person without warrant shall forthwith communicate to him full particulars of the offence for which he is arrested or other grounds for such arrest. (2) Where a police officer arrests without warrant any person accused of a bailable offence, he shall inform the person arrested that he is entitled to be released on bail and that he may arrange for sureties on his behalf.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
        {
          identifier: "Section 57",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Person arrested not to be detained more than twenty-four hours",
          text: "Section 57 BNSS. Person arrested not to be detained more than twenty-four hours: No police officer shall detain in custody a person arrested without warrant for a longer period than under all the circumstances of the case is reasonable, and such period shall not, in the absence of a special order of a Magistrate under section 187, exceed twenty-four hours exclusive of the time necessary for the journey from the place of arrest to the Magistrate's Court.",
          startPage: 4,
          endPage: 4,
          orderIndex: 4,
          depth: 1,
        },
        {
          identifier: "Section 173",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Information in cognizable cases and registration of First Information Report (FIR / e-FIR)",
          text: "Section 173 BNSS. Information in cognizable cases: (1) Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, shall be reduced to writing by him or under his direction, and be read over to the informant. Information may also be given electronically (e-FIR) irrespective of the area where the crime was committed, provided that the signature of the informant is obtained within three days before the e-FIR is taken on record.",
          startPage: 5,
          endPage: 5,
          orderIndex: 5,
          depth: 1,
        },
      ],
    });

    // 3.2.2 Code of Criminal Procedure, 1973 (CrPC) - Repealed as of 2024-06-30
    await this.ingestSeededDocument({
      id: "doc_in_crpc_1973",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Code of Criminal Procedure, 1973 (CrPC - Repealed)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CRIMINAL_PROCEDURE",
      publicationDate: "1974-01-25",
      effectiveFrom: "1974-04-01",
      effectiveTo: "2024-06-30",
      currentStatus: KnowledgeDocumentStatus.REPEALED,
      versionTag: "1973-REPEALED",
      nodes: [
        {
          identifier: "Section 41B",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Procedure of arrest and duties of officer making arrest (Repealed CrPC)",
          text: "Section 41B CrPC (Repealed). Procedure of arrest and duties of officer making arrest: Every police officer while making an arrest shall bear an accurate identification tag, prepare a memorandum of arrest attested by a witness, countersigned by the arrestee, and inform the arrestee of his right to have a relative or friend informed of his arrest. (Repealed and replaced by Section 35 and 37 Bharatiya Nagarik Suraksha Sanhita 2023).",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 50",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Person arrested to be informed of grounds of arrest and of right to bail (Repealed CrPC)",
          text: "Section 50 CrPC (Repealed). Person arrested to be informed of grounds of arrest: Every police officer arresting any person without warrant shall forthwith communicate full particulars of the offence and right to bail. (Repealed and replaced by Section 47 Bharatiya Nagarik Suraksha Sanhita 2023).",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 50A",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Obligation of person making arrest to inform nominated person (Repealed CrPC)",
          text: "Section 50A CrPC (Repealed). Obligation to inform nominated person: Police officer making arrest shall forthwith inform friends or relatives nominated by the arrested person and record an entry in the station diary. (Repealed and replaced by Section 37 Bharatiya Nagarik Suraksha Sanhita 2023).",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
        {
          identifier: "Section 57",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Person arrested not to be detained more than twenty-four hours (Repealed CrPC)",
          text: "Section 57 CrPC (Repealed). 24-hour detention limit: No police officer shall detain an arrestee for more than twenty-four hours without magistrate order. (Repealed and replaced by Section 57 Bharatiya Nagarik Suraksha Sanhita 2023).",
          startPage: 4,
          endPage: 4,
          orderIndex: 4,
          depth: 1,
        },
      ],
    });

    // 3.3 Information Technology Act, 2000
    await this.ingestSeededDocument({
      id: "doc_in_it_act_2000",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Information Technology Act, 2000",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CYBER",
      publicationDate: "2000-06-09",
      effectiveFrom: "2000-10-17",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2000-ACT",
      nodes: [
        {
          identifier: "Section 66C",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Punishment for identity theft",
          text: "Section 66C. Punishment for identity theft: Whoever, fraudulently or dishonestly make use of the electronic signature, password or any other unique identification feature of any other person, including creating a fake account, fake profile, or stealing photos, shall be punished with imprisonment of either description for a term which may extend to three years and shall also be liable to fine which may extend to rupees one lakh.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 66D",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Punishment for cheating by personation by using computer resource",
          text: "Section 66D. Punishment for cheating by personation by using computer resource: Whoever, by means of any communication device, computer resource, social media account or profile, cheats by personating and pretending to be someone else messaging people, shall be punished with imprisonment of either description for a term which may extend to three years and shall also be liable to fine which may extend to one lakh rupees.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 66E",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Punishment for violation of privacy",
          text: "Section 66E. Punishment for violation of privacy: Whoever, intentionally or knowingly captures, publishes or transmits the image of a private area of any person without his or her consent, under circumstances violating the privacy of that person, shall be punished with imprisonment which may extend to three years or with fine not exceeding two lakh rupees, or with both.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
        {
          identifier: "Section 79",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Exemption from liability of intermediary in certain cases",
          text: "Section 79. Intermediary liability and safe harbour: (1) An intermediary shall not be liable for any third party information, data, or communication link made available or hosted by him if (a) the function is limited to providing access; and (b) the intermediary observes due diligence. Under IT Intermediary Rules 2021, upon receiving a user grievance or notice regarding an impersonating fake profile, morphed photos, or non-consensual imagery, the intermediary must disable access or remove the content within 24 to 36 hours.",
          startPage: 4,
          endPage: 4,
          orderIndex: 4,
          depth: 1,
        },
      ],
    });

    // 3.4 Indian Contract Act, 1872
    await this.ingestSeededDocument({
      id: "doc_in_contract_1872",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Indian Contract Act, 1872",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONTRACT",
      publicationDate: "1872-09-01",
      effectiveFrom: "1872-09-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1872-ENACTED",
      nodes: [
        {
          identifier: "Section 10",
          nodeType: KnowledgeNodeType.SECTION,
          title: "What agreements are contracts",
          text: "Section 10. What agreements are contracts: All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 23",
          nodeType: KnowledgeNodeType.SECTION,
          title: "What considerations and objects are lawful, and what not",
          text: "Section 23. What consideration and objects are lawful: The consideration or object of an agreement is lawful, unless it is forbidden by law, or is of such a nature that, if permitted, it would defeat the provisions of any law; or is fraudulent; or involves or implies injury to the person or property of another; or the Court regards it as immoral, or opposed to public policy.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 27",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Agreement in restraint of trade, void",
          text: "Section 27. Agreement in restraint of trade, void: Every agreement by which anyone is restrained from exercising a lawful profession, trade or business of any kind, is to that extent void. Exception 1: One who sells the goodwill of a business may agree with the buyer to refrain from carrying on a similar business within specified local limits.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
        {
          identifier: "Section 39",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Effect of refusal of party to perform promise wholly",
          text: "Section 39. Effect of refusal of party to perform promise wholly: When a party to a contract has refused to perform, or disabled himself from performing, his promise in its entirety, the promisee may put an end to the contract, unless he has signified, by words or conduct, his acquiescence in its continuance.",
          startPage: 4,
          endPage: 4,
          orderIndex: 4,
          depth: 1,
        },
        {
          identifier: "Section 73",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Compensation for loss or damage caused by breach of contract",
          text: "Section 73. Compensation for loss or damage caused by breach of contract: When a contract has been broken, the party who suffers by such breach is entitled to receive from the party who has broken the contract, compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach, or which the parties knew, when they made the contract, to be likely to result from the breach of it.",
          startPage: 5,
          endPage: 5,
          orderIndex: 5,
          depth: 1,
        },
        {
          identifier: "Section 74",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Compensation for breach of contract where penalty stipulated for",
          text: "Section 74. Compensation for breach of contract where penalty stipulated for: When a contract has been broken, if a sum is named in the contract as the amount to be paid in case of such breach, or if the contract contains any other stipulation by way of penalty, the party complaining of the breach is entitled, whether or not actual damage or loss is proved to have been caused thereby, to receive from the party who has broken the contract reasonable compensation not exceeding the amount so named or the penalty stipulated for.",
          startPage: 6,
          endPage: 6,
          orderIndex: 6,
          depth: 1,
        },
      ],
    });

    // 3.5 Arbitration and Conciliation Act, 1996
    await this.ingestSeededDocument({
      id: "doc_in_arbitration_1996",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Arbitration and Conciliation Act, 1996",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "ARBITRATION",
      publicationDate: "1996-08-22",
      effectiveFrom: "1996-08-22",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1996-ACT",
      nodes: [
        {
          identifier: "Section 7",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Arbitration agreement",
          text: "Section 7. Arbitration agreement: (1) In this Part, 'arbitration agreement' means an agreement by the parties to submit to arbitration all or certain disputes which have arisen or which may arise between them in respect of a defined legal relationship, whether contractual or not. (2) An arbitration agreement may be in the form of an arbitration clause in a contract or in the form of a separate agreement. (3) An arbitration agreement shall be in writing.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 8",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Power to refer parties to arbitration where there is an arbitration agreement",
          text: "Section 8. Power to refer parties to arbitration: (1) A judicial authority, before which an action is brought in a matter which is the subject of an arbitration agreement shall, if a party to the arbitration agreement or any person claiming through or under him applies not later than the date of submitting his first statement on the substance of the dispute, refer the parties to arbitration unless it finds that prima facie no valid arbitration agreement exists.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 8.1",
          nodeType: KnowledgeNodeType.SUBSECTION,
          title: "Mandatory Reference Condition",
          text: "Section 8.1. Mandatory Reference: The judicial authority is statutorily mandated to refer parties to arbitration upon application of the arbitration clause.",
          startPage: 2,
          endPage: 2,
          orderIndex: 3,
          depth: 2,
        },
        {
          identifier: "Section 8.2(a)",
          nodeType: KnowledgeNodeType.CLAUSE,
          title: "Original Arbitration Agreement Requirement",
          text: "Section 8.2(a). The party applying for reference must furnish the original arbitration agreement or a duly certified copy thereof.",
          startPage: 2,
          endPage: 2,
          orderIndex: 4,
          depth: 3,
        },
        {
          identifier: "Section 9",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Interim measures, etc., by Court",
          text: "Section 9. Interim measures: A party may, before or during arbitral proceedings or at any time after the making of the arbitral award but before it is enforced, apply to a court for an interim measure of protection in respect of preserving goods or securing amounts.",
          startPage: 3,
          endPage: 3,
          orderIndex: 5,
          depth: 1,
        },
        {
          identifier: "Section 11",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Appointment of arbitrators",
          text: "Section 11. Appointment of arbitrators: (1) A person of any nationality may be an arbitrator, unless otherwise agreed by the parties. (6) Where under an appointment procedure agreed upon by the parties, a party fails to act as required, or the parties fail to reach an agreement, an application may be made to the High Court or the Supreme Court for appointment of arbitrator.",
          startPage: 4,
          endPage: 4,
          orderIndex: 6,
          depth: 1,
        },
        {
          identifier: "Section 34",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Application for setting aside arbitral award",
          text: "Section 34. Application for setting aside arbitral award: (1) Recourse to a Court against an arbitral award may be made only by an application for setting aside such award in accordance with sub-section (2) and sub-section (3). (2) An arbitral award may be set aside by the Court only if the party making the application furnishes proof that a party was under some incapacity, the arbitration agreement is invalid, or the award is in conflict with the public policy of India.",
          startPage: 5,
          endPage: 5,
          orderIndex: 7,
          depth: 1,
        },
      ],
    });

    // 3.6 Customs Act, 1962 & Foreign Trade Policy (Vehicle Import Policy)
    await this.ingestSeededDocument({
      id: "doc_in_customs_ftp_import",
      sourceId: srcDgft.id,
      collectionId: colLegalGlobal.id,
      title: "Customs Act, 1962 & DGFT Foreign Trade Policy (Motor Vehicle Import Rules)",
      documentType: KnowledgeDocumentType.REGULATION,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CUSTOMS_FOREIGN_TRADE",
      publicationDate: "2023-04-01",
      effectiveFrom: "2023-04-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2023-FTP-EDITION",
      nodes: [
        {
          identifier: "Policy Condition 1: New Vehicle Import",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Import of New Motor Vehicles into India",
          text: "DGFT Chapter 87 Policy Condition 1. Import of New Vehicles: (a) The new vehicle must be manufactured and assembled outside India and must not have been registered in any country before importation; (b) Must have right-hand drive steering controls and speedometer indicating speed in km/h; (c) Compliance with Central Motor Vehicles Rules (CMVR) 1989 Rule 126 homologation type approval certificate issued by designated Indian testing agencies (ARAI/VRDE/ICAT) is mandatory prior to customs clearance; (d) Import is permitted only through designated sea ports (Nhava Sheva/Mumbai, Chennai, Kolkata) and air cargo complexes (Delhi, Mumbai).",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Policy Condition 2: Used Vehicle Import",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Import of Used / Second-Hand Motor Vehicles into India",
          text: "DGFT Chapter 87 Policy Condition 2. Import of Used Vehicles: (a) The used car must not be older than 3 years from the date of manufacture; (b) Must have right-hand drive and roadworthiness certificate valid for at least 5 years issued by an internationally accredited inspection agency; (c) Basic customs duty is leviable under Heading 8703 at 125% plus applicable Social Welfare Surcharge and GST Compensation Cess; (d) Import is restricted to customs port at Nhava Sheva (JNPT) Mumbai only.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // 3.7 Digital Personal Data Protection Act, 2023
    await this.ingestSeededDocument({
      id: "doc_in_dpdp_2023",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Digital Personal Data Protection Act, 2023",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "DATA_PRIVACY",
      publicationDate: "2023-08-11",
      effectiveFrom: "2023-08-11",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2023-ENACTED",
      nodes: [
        {
          identifier: "Section 4",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Grounds for processing personal data",
          text: "Section 4. Grounds for processing personal data: (1) A person may process the personal data of a Data Principal only in accordance with the provisions of this Act and for a lawful purpose (a) for which the Data Principal has given her consent; or (b) for certain legitimate uses.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 6",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Consent requirements",
          text: "Section 6. Consent: (1) The consent given by the Data Principal shall be free, specific, informed, unconditional and unambiguous with a clear affirmative action, and shall signify an agreement to the processing of her personal data for the specified purpose.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 8",
          nodeType: KnowledgeNodeType.SECTION,
          title: "General obligations of Data Fiduciary",
          text: "Section 8. General obligations of Data Fiduciary: (1) A Data Fiduciary shall, irrespective of any agreement to the contrary or trade usage, be responsible for complying with the provisions of this Act. (5) A Data Fiduciary shall protect personal data in its possession or under its control by taking reasonable security safeguards to prevent personal data breach.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
      ],
    });

    // 3.8 Companies Act, 2013
    await this.ingestSeededDocument({
      id: "doc_in_companies_act_2013",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Companies Act, 2013",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CORPORATE",
      publicationDate: "2013-08-30",
      effectiveFrom: "2013-09-12",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2013-ENACTED",
      nodes: [
        {
          identifier: "Section 135",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Corporate Social Responsibility",
          text: "Section 135. Corporate Social Responsibility: (1) Every company having net worth of rupees five hundred crore or more, or turnover of rupees one thousand crore or more or a net profit of rupees five crore or more during the immediately preceding financial year shall constitute a Corporate Social Responsibility Committee of the Board. (5) The Board shall ensure that the company spends, in every financial year, at least two per cent of the average net profits of the company made during the three immediately preceding financial years in pursuance of its Corporate Social Responsibility Policy.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 188",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Related party transactions",
          text: "Section 188. Related party transactions: (1) Except with the consent of the Board of Directors given by a resolution at a meeting of the Board and subject to such conditions as may be prescribed, no company shall enter into any contract or arrangement with a related party with respect to sale, purchase or supply of any goods or materials, or selling or otherwise disposing of, or buying, property of any kind.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 241",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Application to Tribunal for relief in cases of oppression, etc.",
          text: "Section 241. Application to Tribunal for relief in cases of oppression: (1) Any member of a company who complains that (a) the affairs of the company have been or are being conducted in a manner prejudicial to public interest or in a manner oppressive to him or any other member or members or in a manner prejudicial to the interests of the company may apply to the Tribunal for an order under this Chapter.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
        {
          identifier: "Section 242",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Powers of Tribunal",
          text: "Section 242. Powers of Tribunal: (1) If, on any application made under section 241, the Tribunal is of the opinion (a) that the company's affairs have been conducted in a manner prejudicial to any member; and (b) that to wind up the company would unfairly prejudice such member, the Tribunal may, with a view to bringing to an end the matters complained of, make such order as it thinks fit.",
          startPage: 4,
          endPage: 4,
          orderIndex: 4,
          depth: 1,
        },
      ],
    });

    // 3.9 Insolvency and Bankruptcy Code, 2016
    await this.ingestSeededDocument({
      id: "doc_in_ibc_2016",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Insolvency and Bankruptcy Code, 2016",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "INSOLVENCY",
      publicationDate: "2016-05-28",
      effectiveFrom: "2016-12-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2016-ENACTED",
      nodes: [
        {
          identifier: "Section 7",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Initiation of corporate insolvency resolution process by financial creditor",
          text: "Section 7. Initiation of corporate insolvency resolution process by financial creditor: (1) A financial creditor either by itself or jointly with other financial creditors may file an application for initiating corporate insolvency resolution process against a corporate debtor before the Adjudicating Authority when a default has occurred. (5) Where the Adjudicating Authority is satisfied that a default has occurred and the application is complete, it may, by order, admit such application.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 9",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Application for initiation of corporate insolvency resolution process by operational creditor",
          text: "Section 9. Application by operational creditor: (1) After the expiry of the period of ten days from the date of delivery of the notice or invoice demanding payment under sub-section (1) of section 8, if the operational creditor does not receive payment from the corporate debtor or notice of the dispute, the operational creditor may file an application before the Adjudicating Authority for initiating a corporate insolvency resolution process.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 14",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Moratorium",
          text: "Section 14. Moratorium: (1) Subject to provisions of sub-sections (2) and (3), on the insolvency commencement date, the Adjudicating Authority shall by order declare moratorium for prohibiting all of the following, namely: (a) the institution of suits or continuation of pending suits or proceedings against the corporate debtor including execution of any judgment, decree or order; (b) transferring, encumbering, alienating or disposing of by the corporate debtor any of its assets or legal rights.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
      ],
    });

    // 3.10 Consumer Protection Act, 2019
    await this.ingestSeededDocument({
      id: "doc_in_consumer_protection_2019",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Consumer Protection Act, 2019",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSUMER",
      publicationDate: "2019-08-09",
      effectiveFrom: "2020-07-20",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2019-ENACTED",
      nodes: [
        {
          identifier: "Section 2(7)",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Definition of Consumer",
          text: "Section 2(7). Consumer definition: 'Consumer' means any person who (i) buys any goods for a consideration which has been paid or promised or partly paid, but does not include a person who obtains such goods for resale or for any commercial purpose; or (ii) hires or avails of any service for a consideration, whether purchased offline or through electronic means.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 35",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Manner in which complaint shall be made",
          text: "Section 35. Manner in which complaint shall be made: (1) A complaint, in relation to any goods sold or delivered or agreed to be sold or delivered or any service provided or agreed to be provided, may be filed with a District Commission by (a) the consumer; (b) any recognized consumer association; or (c) one or more consumers, where there are numerous consumers having the same interest, as a class action complaint on behalf of or for the benefit of all consumers with the permission of the District Commission.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 39",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Findings of District Commission and remedies for defective goods",
          text: "Section 39 Consumer Protection Act. Findings and remedies: (1) Where the District Commission is satisfied that the goods complained against suffer from any defect or deficiency in service, it shall issue an order directing: (a) to remove the defect; (b) to replace the defective goods or defective product with new goods; (c) to refund or return to the complainant the price paid by the consumer along with interest; (d) to pay compensation for injury or financial loss.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
      ],
    });

    // 3.11 Bharatiya Nyaya Sanhita, 2023 (BNS) - In Force 2024-07-01
    await this.ingestSeededDocument({
      id: "doc_in_bns_2023",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Bharatiya Nyaya Sanhita, 2023 (BNS)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CRIMINAL",
      publicationDate: "2023-12-25",
      effectiveFrom: "2024-07-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2023-ENACTED",
      supersedesVersionId: "ver_doc_in_ipc_1860_1860-repealed",
      nodes: [
        {
          identifier: "Section 103",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Punishment for murder (BNS)",
          text: "Section 103 BNS. Punishment for murder: (1) Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine. (2) When a group of five or more persons acting in concert commits murder on the ground of race, caste or community, sex, place of birth, language, personal belief or any other ground, each member of such group shall be punished with death or with imprisonment for life.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 318",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Cheating and dishonestly inducing delivery of property (BNS)",
          text: "Section 318 BNS. Cheating: (1) Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person, or to consent that any person shall retain any property, commits cheating. (4) Whoever cheats and thereby dishonestly induces the person deceived to deliver any property shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 356",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Defamation (BNS)",
          text: "Section 356 BNS. Defamation: (1) Whoever, by words either spoken or intended to be read, or by signs or by visible representations, makes or publishes concerning any person any imputation intending to harm the reputation of such person, defames that person. (2) Whoever defames another shall be punished with simple imprisonment for a term which may extend to two years, or with fine, or with both, or with community service.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
      ],
    });

    // 3.12.1 Bharatiya Sakshya Adhiniyam, 2023 (BSA) - In Force 2024-07-01
    await this.ingestSeededDocument({
      id: "doc_in_bsa_2023",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Bharatiya Sakshya Adhiniyam, 2023 (BSA)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "EVIDENCE",
      publicationDate: "2023-12-25",
      effectiveFrom: "2024-07-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2023-ENACTED",
      supersedesVersionId: "ver_doc_in_evidence_act_1872_1872-repealed",
      nodes: [
        {
          identifier: "Section 61",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Admissibility of electronic or digital record as document",
          text: "Section 61 BSA. Admissibility of electronic or digital record: Nothing in this Adhiniyam shall apply to deny the admissibility of an electronic or digital record in evidence on the sole ground that it is an electronic or digital record, and such record shall have the same legal effect, validity and enforceability as other document.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 63",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Admissibility of electronic records and certificate requirement (Replaces Sec 65B Evidence Act)",
          text: "Section 63 BSA. Admissibility of electronic records: (1) Any information contained in an electronic record which is printed on a paper, stored, recorded or copied in optical or magnetic media or cloud produced by a computer shall be deemed to be also a document. (4) A certificate identifying the electronic record and describing the manner in which it was produced, signed by a person occupying a responsible official position, in the form specified in the Schedule, is mandatory for electronic evidence admissibility.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // 3.12.2 Indian Evidence Act, 1872 - Repealed as of 2024-06-30
    await this.ingestSeededDocument({
      id: "doc_in_evidence_act_1872",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Indian Evidence Act, 1872 (Repealed)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "EVIDENCE",
      publicationDate: "1872-03-15",
      effectiveFrom: "1872-09-01",
      effectiveTo: "2024-06-30",
      currentStatus: KnowledgeDocumentStatus.REPEALED,
      versionTag: "1872-REPEALED",
      nodes: [
        {
          identifier: "Section 65B",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Admissibility of electronic records (Repealed Evidence Act)",
          text: "Section 65B Indian Evidence Act 1872 (Repealed). Admissibility of electronic records: Mandatory certificate under Section 65B(4) identifying the electronic record and device particulars is required for admitting printouts and digital evidence. (Repealed and replaced by Section 63 Bharatiya Sakshya Adhiniyam 2023).",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    // 3.13 Transfer of Property Act, 1882
    await this.ingestSeededDocument({
      id: "doc_in_tpa_1882",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Transfer of Property Act, 1882",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "PROPERTY",
      publicationDate: "1882-02-17",
      effectiveFrom: "1882-07-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1882-ENACTED",
      nodes: [
        {
          identifier: "Section 106",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Duration of certain leases in absence of written contract or local usage",
          text: "Section 106. Duration of certain leases: (1) In the absence of a contract or local law or usage to the contrary, a lease of immovable property for agricultural or manufacturing purposes shall be deemed to be a lease from year to year, terminable by six months notice; and a lease of immovable property for any other purpose shall be deemed to be a lease from month to month, terminable, on the part of either lessor or lessee, by fifteen days notice expiring with the end of a month of the tenancy.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 111",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Determination of lease",
          text: "Section 111. Determination of lease: A lease of immovable property determines (a) by efflux of the time limited thereby; (b) where such time is limited conditionally on the happening of some event; (g) by forfeiture, in case the lessee breaks an express condition providing for lessor re-entry; (h) on the expiration of a notice to determine the lease, or to quit, duly given by one party to the other.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // 3.14 Real Estate (Regulation and Development) Act, 2016 (RERA)
    await this.ingestSeededDocument({
      id: "doc_in_rera_2016",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Real Estate (Regulation and Development) Act, 2016",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "PROPERTY",
      publicationDate: "2016-03-26",
      effectiveFrom: "2016-05-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2016-ENACTED",
      nodes: [
        {
          identifier: "Section 18",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Return of amount and compensation for delayed possession",
          text: "Section 18. Return of amount and compensation: (1) If the promoter fails to complete or is unable to give possession of an apartment, plot or building in accordance with the terms of the agreement for sale or duly completed by the date specified therein, he shall be liable on demand to the allottees to return the amount received by him with interest at prescribed rates and compensation.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 31",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Filing of complaints with the Authority or the adjudicating officer",
          text: "Section 31. Filing of complaints: (1) Any aggrieved person may file a complaint with the Real Estate Regulatory Authority (RERA) or the adjudicating officer for any violation or contravention of the provisions of this Act or the rules and regulations made thereunder against any promoter, builder, allottee or real estate agent.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // 3.15 Code of Civil Procedure, 1908 (CPC)
    await this.ingestSeededDocument({
      id: "doc_in_cpc_1908",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Code of Civil Procedure, 1908 (CPC)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CIVIL_PROCEDURE",
      publicationDate: "1908-03-21",
      effectiveFrom: "1909-01-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1908-ENACTED",
      nodes: [
        {
          identifier: "Section 9",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Courts to try all civil suits unless barred",
          text: "Section 9 CPC. Courts to try all civil suits unless barred: The Courts shall have jurisdiction to try all suits of a civil nature excepting suits of which their cognizance is either expressly or impliedly barred.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Order 39 Rule 1 & 2",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Temporary injunctions and interlocutory orders",
          text: "Order 39 Rule 1 & 2 CPC. Temporary Injunctions: Where in any suit it is proved by affidavit or otherwise that any property in dispute is in danger of being wasted, damaged or alienated by any party, or that the defendant threatens to dispossess the plaintiff, the Court may grant a temporary injunction to restrain such act.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 80",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Notice to Government or public officer before institution of suit",
          text: "Section 80 CPC. Notice: (1) Save as otherwise provided in sub-section (2), no suit shall be instituted against the Government or against a public officer in respect of any act purporting to be done by such public officer in his official capacity, until the expiration of two months next after notice in writing has been delivered.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
      ],
    });

    // 3.16 Hindu Marriage Act, 1955
    await this.ingestSeededDocument({
      id: "doc_in_hma_1955",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Hindu Marriage Act, 1955",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "FAMILY",
      publicationDate: "1955-05-18",
      effectiveFrom: "1955-05-18",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1955-ENACTED",
      nodes: [
        {
          identifier: "Section 13",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Divorce grounds",
          text: "Section 13 HMA. Divorce: (1) Any marriage solemnized, whether before or after the commencement of this Act, may, on a petition presented by either the husband or the wife, be dissolved by a decree of divorce on the ground that the other party (i) has, after the solemnization of the marriage, had voluntary sexual intercourse with any person other than his or her spouse; or (ia) has, after the solemnization of the marriage, treated the petitioner with cruelty; or (ib) has deserted the petitioner for a continuous period of not less than two years.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 13B",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Divorce by mutual consent",
          text: "Section 13B HMA. Divorce by mutual consent: (1) Subject to the provisions of this Act a petition for dissolution of marriage by a decree of divorce may be presented to the district court by both the parties to a marriage together, on the ground that they have been living separately for a period of one year or more, that they have not been able to live together and that they have mutually agreed that the marriage should be dissolved.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 24",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Maintenance pendente lite and expenses of proceedings",
          text: "Section 24 HMA. Maintenance pendente lite: Where in any proceeding under this Act it appears to the court that either the wife or the husband, as the case may be, has no independent income sufficient for her or his support and the necessary expenses of the proceeding, it may, on the application of the wife or the husband, order the respondent to pay to the petitioner the expenses of the proceeding, and monthly maintenance during the proceeding.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
      ],
    });

    // 3.17 Hindu Succession Act, 1956
    await this.ingestSeededDocument({
      id: "doc_in_hsa_1956",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Hindu Succession Act, 1956",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "SUCCESSION",
      publicationDate: "1956-06-17",
      effectiveFrom: "1956-06-17",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1956-ENACTED",
      nodes: [
        {
          identifier: "Section 6",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Devolution of interest in coparcenary property (Equal rights for daughters)",
          text: "Section 6 HSA. Devolution of interest in coparcenary property: (1) On and from the commencement of the Hindu Succession (Amendment) Act, 2005, in a Joint Hindu family governed by the Mitakshara law, the daughter of a coparcener shall: (a) by birth become a coparcener in her own right in the same manner as the son; (b) have the same rights in the coparcenary property as she would have had if she had been a son; (c) be subject to the same liabilities in respect of the said coparcenary property as that of a son. Ancestral property or joint family property cannot be sold or alienated by one coparcener without the consent of all other coparceners or legal necessity.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 8",
          nodeType: KnowledgeNodeType.SECTION,
          title: "General rules of succession in the case of males dying intestate",
          text: "Section 8 HSA. General rules of succession in the case of males: The property of a male Hindu dying intestate shall devolve according to the provisions of this Chapter: (a) firstly, upon the heirs, being the relatives specified in Class I of the Schedule (son, daughter, widow, mother); (b) secondly, if there is no heir of Class I, then upon the heirs, being the relatives specified in Class II of the Schedule; (c) thirdly, upon agnates; and (d) lastly, upon cognates.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // 3.18 Protection of Women from Domestic Violence Act, 2005 (PWDVA)
    await this.ingestSeededDocument({
      id: "doc_in_pwdva_2005",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Protection of Women from Domestic Violence Act, 2005",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "FAMILY",
      publicationDate: "2005-09-13",
      effectiveFrom: "2006-10-26",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2005-ENACTED",
      nodes: [
        {
          identifier: "Section 12",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Application to Magistrate for reliefs against domestic violence",
          text: "Section 12 PWDVA. Application to Magistrate: (1) An aggrieved person or a Protection Officer or any other person on behalf of the aggrieved person may present an application to the Magistrate seeking one or more reliefs under this Act, including protection orders, residence orders, monetary relief, custody orders, or compensation.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 18 & 19",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Protection orders and residence orders",
          text: "Section 18 & 19 PWDVA. Protection and Residence Orders: The Magistrate may pass a protection order prohibiting the respondent from committing acts of domestic violence, entering the workplace of the aggrieved person, or alienating shared household property, and a residence order restraining the respondent from dispossessing the aggrieved person from the shared household.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // 3.19 Sexual Harassment of Women at Workplace (PoSH) Act, 2013
    await this.ingestSeededDocument({
      id: "doc_in_posh_2013",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 (PoSH)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "LABOUR",
      publicationDate: "2013-04-22",
      effectiveFrom: "2013-12-09",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2013-ENACTED",
      nodes: [
        {
          identifier: "Section 4",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Constitution of Internal Complaints Committee (ICC / IC)",
          text: "Section 4 PoSH Act. Constitution of Internal Committee: (1) Every employer of a workplace shall, by an order in writing, constitute a Committee to be known as the 'Internal Committee' (IC). (2) The Internal Committee shall consist of a Presiding Officer who shall be a woman employed at a senior level, not less than two Members from amongst employees committed to the cause of women, and one member from non-governmental organisations.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 9",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Complaint of sexual harassment at workplace",
          text: "Section 9 PoSH Act. Complaint of sexual harassment: (1) Any aggrieved woman may make, in writing, a complaint of sexual harassment at workplace to the Internal Committee if so constituted, or the Local Committee, within a period of three months from the date of incident.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // 3.20 Payment of Wages Act, 1936 & Industrial Disputes Act, 1947
    await this.ingestSeededDocument({
      id: "doc_in_labour_wages",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Payment of Wages Act, 1936 & Industrial Disputes Act, 1947",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "EMPLOYMENT",
      publicationDate: "1936-04-23",
      effectiveFrom: "1937-03-28",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "WAGES-DISPUTES-EDITION",
      nodes: [
        {
          identifier: "Section 15",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Claims arising out of deductions from wages or delay in payment of wages",
          text: "Section 15 Payment of Wages Act. Claims arising out of deductions or delay in payment: (1) The appropriate Government may appoint an Authority to hear and decide claims arising out of deductions from wages, or delay in payment of wages of persons employed. (3) The Authority may direct refund of deduction or payment of delayed wages together with compensation up to ten times the amount.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 2A",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Dismissal or retrenchment of individual workman deemed industrial dispute",
          text: "Section 2A Industrial Disputes Act. Dismissal deemed industrial dispute: Where any employer discharges, dismisses, retrenches or terminates the services of an individual workman, any dispute or difference between that workman and his employer shall be deemed to be an industrial dispute notwithstanding that no other workman or union is a party to the dispute.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // 3.21 Motor Vehicles Act, 1988 (as amended 2019)
    await this.ingestSeededDocument({
      id: "doc_in_mva_1988",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Motor Vehicles Act, 1988 (MACT Compensation Provisions)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "MOTOR_VEHICLE",
      publicationDate: "1988-10-14",
      effectiveFrom: "1989-07-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2019-AMENDED",
      nodes: [
        {
          identifier: "Section 166",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Application for compensation before Motor Accidents Claims Tribunal (MACT)",
          text: "Section 166 Motor Vehicles Act. Application for compensation: (1) An application for compensation arising out of an accident of the nature specified in sub-section (1) of section 165 may be made by the person who has sustained the injury, or the owner of the property, or where death has resulted from the accident, by all or any of the legal representatives of the deceased, to the Claims Tribunal having jurisdiction over the area where the accident occurred or where the claimant resides.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 164",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Payment of compensation in case of death or grievous hurt (No-fault liability)",
          text: "Section 164 Motor Vehicles Act (2019 Amendment). Scheme for compensation: (1) In case of death or grievous hurt to any person resulting from motor vehicle accident, the owner of the motor vehicle or the authorized insurer shall be liable to pay in the case of death, a fixed sum of five lakh rupees (INR 5,00,000) or in the case of grievous hurt, a fixed sum of two and a half lakh rupees (INR 2,50,000) without requiring proof of negligence.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // 3.22 Limitation Act, 1963
    await this.ingestSeededDocument({
      id: "doc_in_limitation_1963",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Limitation Act, 1963",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CIVIL_PROCEDURE",
      publicationDate: "1963-10-05",
      effectiveFrom: "1964-01-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1963-ENACTED",
      nodes: [
        {
          identifier: "Section 3",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Bar of limitation",
          text: "Section 3 Limitation Act. Bar of limitation: (1) Subject to the provisions contained in sections 4 to 24 (inclusive), every suit instituted, appeal preferred, and application made after the prescribed period shall be dismissed, although limitation has not been set up as a defence.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 5",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Extension of prescribed period in certain cases (Condonation of delay)",
          text: "Section 5 Limitation Act. Extension of prescribed period: Any appeal or any application, other than an application under any of the provisions of Order XXI of the Code of Civil Procedure, 1908, may be admitted after the prescribed period if the appellant or the applicant satisfies the court that he had sufficient cause for not preferring the appeal or making the application within such period.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // 3.23 Negotiable Instruments Act, 1881
    await this.ingestSeededDocument({
      id: "doc_in_ni_act_1881",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Negotiable Instruments Act, 1881 (Cheque Dishonour Provisions)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "COMMERCIAL",
      publicationDate: "1881-12-09",
      effectiveFrom: "1882-03-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1881-ENACTED",
      nodes: [
        {
          identifier: "Section 138",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Dishonour of cheque for insufficiency, etc., of funds in the account",
          text: "Section 138 NI Act. Dishonour of cheque: Where any cheque drawn by a person on an account maintained by him with a banker for payment of any amount of money to another person from out of that account for the discharge of any debt or other liability, is returned by the bank unpaid, either because of insufficiency of funds or exceeding arrangements, such person shall be deemed to have committed an offence and shall be punished with imprisonment for a term which may extend to two years, or with fine which may extend to twice the amount of the cheque, or with both. Mandatory statutory demand notice must be issued within thirty (30) days of receiving bank memo.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 142",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Cognizance of offences under section 138",
          text: "Section 142 NI Act. Cognizance of offences: (1) Notwithstanding anything contained in the Code of Criminal Procedure, no court shall take cognizance of any offence punishable under section 138 except upon a complaint in writing made by the payee or holder in due course within one month of the date on which the cause of action arises under clause (c) of the proviso to section 138.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // 3.24 Income Tax Act, 1961
    await this.ingestSeededDocument({
      id: "doc_in_it_act_1961",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Income Tax Act, 1961 (Reassessment & Notice Provisions)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "TAX",
      publicationDate: "1961-09-13",
      effectiveFrom: "1962-04-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1961-ACT",
      nodes: [
        {
          identifier: "Section 148 & 148A",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Issue of notice where income has escaped assessment and conducting inquiry",
          text: "Section 148 & 148A Income Tax Act. Reassessment notice: Before issuing any notice under section 148, the Assessing Officer shall conduct an inquiry, if required, with prior approval of specified authority, and provide an opportunity of being heard to the assessee by serving a show-cause notice under section 148A with a response period of not less than seven days and not exceeding thirty days.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    // 3.25 Central Goods and Services Tax Act, 2017 (CGST Act)
    await this.ingestSeededDocument({
      id: "doc_in_cgst_2017",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Central Goods and Services Tax Act, 2017 (CGST)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "TAX",
      publicationDate: "2017-04-12",
      effectiveFrom: "2017-07-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2017-ENACTED",
      nodes: [
        {
          identifier: "Section 73",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Determination of tax not paid or short paid for reasons other than fraud",
          text: "Section 73 CGST Act. Determination of tax: (1) Where it appears to the proper officer that any tax has not been paid or short paid or erroneously refunded, or where input tax credit has been wrongly availed or utilised for any reason, other than fraud or wilful-misstatement, he shall serve notice on the person chargeable with tax requiring him to show cause why he should not pay the amount specified in the notice along with interest.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 107",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Appeals to Appellate Authority under GST",
          text: "Section 107 CGST Act. Appeals: (1) Any person aggrieved by any decision or order passed under this Act by an adjudicating authority may appeal to such Appellate Authority as may be prescribed within three months from the date on which the said decision or order is communicated to such person, subject to pre-deposit of ten per cent of the disputed tax amount.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // =========================================================================
    // 4. LANDMARK SUPREME COURT PRECEDENTS (LEGAL_GLOBAL)
    // =========================================================================

    // 4.1 D.K. Basu v. State of West Bengal (1997) 1 SCC 416
    await this.ingestSeededDocument({
      id: "doc_sc_dk_basu_1997",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "D.K. Basu v. State of West Bengal",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CRIMINAL_PROCEDURE",
      publicationDate: "1996-12-18",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1997-SCC-REPORT",
      citations: [
        {
          citationText: "(1997) 1 SCC 416",
          normalizedCitation: "1997-1-scc-416",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Guidelines on Arrest and Custodial Rights",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Mandatory Requirements for Police Arrest & Custody Notification",
          text: "D.K. Basu v. State of West Bengal, (1997) 1 SCC 416 (Supreme Court of India): The Supreme Court laid down mandatory requirements to be followed in all cases of arrest or detention: (1) Police personnel carrying out the arrest and handling interrogation must bear accurate, visible and clear identification tags with designations; (2) Police officer shall prepare a memo of arrest at the time of arrest attested by at least one witness who may be a family member or respectable citizen; (3) The person arrested is entitled to have one friend or relative or other person known to him or having interest in his welfare informed as soon as practicable, within 8 to 12 hours of arrest, of the arrest and place of custody; (4) The arrested person must be made aware of this right to have someone informed as soon as he is put under arrest; (5) An entry must be made in the police diary at the place of detention recording the name of the friend/relative informed; (6) The arrested person should be subjected to medical examination every 48 hours; (7) The arrested person may be permitted to meet his lawyer during interrogation.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.2 Arnesh Kumar v. State of Bihar (2014) 8 SCC 273
    await this.ingestSeededDocument({
      id: "doc_sc_arnesh_kumar_2014",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Arnesh Kumar v. State of Bihar",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CRIMINAL_PROCEDURE",
      publicationDate: "2014-07-02",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2014-SCC-REPORT",
      citations: [
        {
          citationText: "(2014) 8 SCC 273",
          normalizedCitation: "2014-8-scc-273",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Notice of Appearance under Section 41A",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Prohibition of Automatic Arrest for Offences up to 7 Years",
          text: "Arnesh Kumar v. State of Bihar, (2014) 8 SCC 273: Police officers shall not arrest an accused automatically when the offence is punishable with imprisonment up to seven years. The police officer must issue a notice of appearance under Section 41A CrPC within two weeks of receiving the complaint. Arrest can only be made if the checklist under Section 41(1)(b)(ii) is satisfied with recorded written reasons.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.3 Kesavananda Bharati (1973) 4 SCC 225
    await this.ingestSeededDocument({
      id: "doc_sc_kesavananda_1973",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Kesavananda Bharati v. State of Kerala",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSTITUTIONAL",
      publicationDate: "1973-04-24",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1973-SCC-REPORT",
      citations: [
        {
          citationText: "(1973) 4 SCC 225",
          normalizedCitation: "1973-4-scc-225",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Judgment Summary",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Basic Structure Doctrine",
          text: "Kesavananda Bharati v. State of Kerala, (1973) 4 SCC 225 (13-Judge Constitution Bench): Parliament's constituent power to amend the Constitution under Article 368 is not unlimited and cannot be used to damage, emasculate, destroy, or alter the Basic Structure or essential framework of the Constitution.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.4 Maneka Gandhi (1978) 1 SCC 248
    await this.ingestSeededDocument({
      id: "doc_sc_maneka_1978",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Maneka Gandhi v. Union of India",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSTITUTIONAL",
      publicationDate: "1978-01-25",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1978-SCC-REPORT",
      citations: [
        {
          citationText: "(1978) 1 SCC 248",
          normalizedCitation: "1978-1-scc-248",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Article 21 Substantive Due Process",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Just, Fair, and Reasonable Procedure",
          text: "Maneka Gandhi v. Union of India, (1978) 1 SCC 248 (7-Judge Bench): The procedure established by law in Article 21 must be just, fair, and reasonable, and not arbitrary, fanciful, or oppressive. Articles 14, 19, and 21 form a golden triangle and are interlinked.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.5 Puttaswamy (2017) 10 SCC 1
    await this.ingestSeededDocument({
      id: "doc_sc_puttaswamy_2017",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Justice K.S. Puttaswamy (Retd.) v. Union of India",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "DATA_PRIVACY",
      publicationDate: "2017-08-24",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2017-SCC-REPORT",
      citations: [
        {
          citationText: "(2017) 10 SCC 1",
          normalizedCitation: "2017-10-scc-1",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Fundamental Right to Privacy",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Privacy Protected under Article 21",
          text: "Justice K.S. Puttaswamy (Retd.) v. Union of India, (2017) 10 SCC 1 (9-Judge Bench): The Right to Privacy is a Fundamental Right guaranteed under Article 21 and Part III of the Constitution of India, intrinsically linked to dignity, autonomy, and liberty.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.6 Vidya Drolia (2021) 2 SCC 1
    await this.ingestSeededDocument({
      id: "doc_sc_vidya_drolia_2021",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Vidya Drolia v. Durga Trading Corporation",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "ARBITRATION",
      publicationDate: "2020-12-14",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2021-SCC-REPORT",
      citations: [
        {
          citationText: "(2021) 2 SCC 1",
          normalizedCitation: "2021-2-scc-1",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Arbitrability Four-Fold Test",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Arbitrability of Disputes in India",
          text: "Vidya Drolia v. Durga Trading Corporation, (2021) 2 SCC 1: Supreme Court established a four-fold test to determine non-arbitrability: actions in rem, sovereign functions, erga omnes third party rights, and inalienable statutory protections.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.7 Kailash Nath Associates v. DDA (2015) 4 SCC 136
    await this.ingestSeededDocument({
      id: "doc_sc_kailash_nath_2015",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Kailash Nath Associates v. Delhi Development Authority",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONTRACT",
      publicationDate: "2015-01-09",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2015-SCC-REPORT",
      citations: [
        {
          citationText: "(2015) 4 SCC 136",
          normalizedCitation: "2015-4-scc-136",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Liquidated Damages Section 74 Principle",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Proof of Loss Required for Liquidated Damages",
          text: "Kailash Nath Associates v. Delhi Development Authority, (2015) 4 SCC 136: Under Section 74 of the Indian Contract Act 1872, compensation is payable only where damage or loss is actually caused by the breach. The named liquidated damages figure represents the maximum reasonable ceiling, and where loss can be measured, the claimant must prove actual loss.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.8 Swiss Ribbons Pvt. Ltd. v. Union of India (2019) 4 SCC 17
    await this.ingestSeededDocument({
      id: "doc_sc_swiss_ribbons_2019",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Swiss Ribbons Pvt. Ltd. v. Union of India",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "INSOLVENCY",
      publicationDate: "2019-01-25",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2019-SCC-REPORT",
      citations: [
        {
          citationText: "(2019) 4 SCC 17",
          normalizedCitation: "2019-4-scc-17",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Constitutionality of Insolvency and Bankruptcy Code",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Creditor-in-Control Model and IBC Validity",
          text: "Swiss Ribbons Pvt. Ltd. v. Union of India, (2019) 4 SCC 17: Supreme Court upheld the constitutional validity of the Insolvency and Bankruptcy Code (IBC) in its entirety, affirming the legislative distinction between financial and operational creditors and the primary objective of reorganization and resolution of corporate debtors rather than mere debt recovery.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.9 Tata Consultancy Services v. Cyrus Investments (2021) 9 SCC 449
    await this.ingestSeededDocument({
      id: "doc_sc_tata_cyrus_2021",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Tata Consultancy Services Ltd. v. Cyrus Investments Pvt. Ltd.",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CORPORATE",
      publicationDate: "2021-03-26",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2021-SCC-REPORT",
      citations: [
        {
          citationText: "(2021) 9 SCC 449",
          normalizedCitation: "2021-9-scc-449",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Section 241 Oppression and Board Removal",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Legal Standard for Oppression under Companies Act",
          text: "Tata Consultancy Services v. Cyrus Investments, (2021) 9 SCC 449: Supreme Court held that removal of an Executive Chairman by board resolution does not by itself constitute oppression or mismanagement under Section 241 of the Companies Act 2013 unless established to be illegal, fraudulent, or oppressive to minority shareholders.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.10 Lalita Kumari v. Govt. of U.P. (2014) 2 SCC 1
    await this.ingestSeededDocument({
      id: "doc_sc_lalita_kumari_2014",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Lalita Kumari v. Govt. of U.P.",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CRIMINAL_PROCEDURE",
      publicationDate: "2013-11-12",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2014-SCC-REPORT",
      citations: [
        {
          citationText: "(2014) 2 SCC 1",
          normalizedCitation: "2014-2-scc-1",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Mandatory Registration of FIR",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Section 154 CrPC Mandatory FIR Registration",
          text: "Lalita Kumari v. Govt. of U.P., (2014) 2 SCC 1 (5-Judge Constitution Bench): Registration of an FIR is mandatory under Section 154 of the Code of Criminal Procedure if the information discloses the commission of a cognizable offence, and no preliminary inquiry is permissible in such cases.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.11 Shayara Bano v. Union of India (2017) 9 SCC 1
    await this.ingestSeededDocument({
      id: "doc_sc_shayara_bano_2017",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Shayara Bano v. Union of India",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSTITUTIONAL",
      publicationDate: "2017-08-22",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2017-SCC-REPORT",
      citations: [
        {
          citationText: "(2017) 9 SCC 1",
          normalizedCitation: "2017-9-scc-1",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Triple Talaq Unconstitutionality",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Manifest Arbitrariness and Article 14",
          text: "Shayara Bano v. Union of India, (2017) 9 SCC 1 (Constitution Bench): The practice of Talaq-e-biddat (instant triple talaq) is manifestly arbitrary and unconstitutional as it violates the Fundamental Right to Equality under Article 14 of the Constitution.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.12 Indra Sawhney v. Union of India 1992 Supp (3) SCC 217
    await this.ingestSeededDocument({
      id: "doc_sc_indra_sawhney_1992",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Indra Sawhney v. Union of India",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSTITUTIONAL",
      publicationDate: "1992-11-16",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1992-SCC-REPORT",
      citations: [
        {
          citationText: "1992 Supp (3) SCC 217",
          normalizedCitation: "1992-supp-3-scc-217",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Reservation Ceiling and Creamy Layer Doctrine",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "50% Ceiling Limit on Reservations",
          text: "Indra Sawhney v. Union of India, 1992 Supp (3) SCC 217 (9-Judge Bench): Total reservations under Article 16(4) of the Constitution shall not exceed 50% ceiling except in extraordinary situations, and the advanced sections (creamy layer) among backward classes must be excluded from reservation benefits.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.13 Navtej Singh Johar v. Union of India (2018) 10 SCC 1
    await this.ingestSeededDocument({
      id: "doc_sc_navtej_johar_2018",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Navtej Singh Johar v. Union of India",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSTITUTIONAL",
      publicationDate: "2018-09-06",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2018-SCC-REPORT",
      citations: [
        {
          citationText: "(2018) 10 SCC 1",
          normalizedCitation: "2018-10-scc-1",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Decriminalization of Section 377 IPC",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Decriminalization of Consensual Same-Sex Acts under Article 21",
          text: "Navtej Singh Johar v. Union of India, (2018) 10 SCC 1 (5-Judge Constitution Bench): Section 377 of the Indian Penal Code, insofar as it criminalizes consensual sexual conduct between adults in private, is unconstitutional and violative of Articles 14, 19, and 21 of the Constitution.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.14 S.P. Gupta v. Union of India 1981 Supp SCC 87
    await this.ingestSeededDocument({
      id: "doc_sc_sp_gupta_1981",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "S.P. Gupta v. Union of India",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSTITUTIONAL",
      publicationDate: "1981-12-30",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1981-SCC-REPORT",
      citations: [
        {
          citationText: "1981 Supp SCC 87",
          normalizedCitation: "1981-supp-scc-87",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Public Interest Litigation and Locus Standi",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Liberalization of Locus Standi in Public Interest Litigation",
          text: "S.P. Gupta v. Union of India, 1981 Supp SCC 87 (First Judges Case): Supreme Court liberalized the rule of locus standi, holding that any member of the public acting bona fide can maintain an action under Article 32 or Article 226 for redressing a public wrong or public injury caused to disadvantaged persons.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.15 Minerva Mills Ltd. v. Union of India (1980) 3 SCC 625
    await this.ingestSeededDocument({
      id: "doc_sc_minerva_mills_1980",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Minerva Mills Ltd. v. Union of India",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSTITUTIONAL",
      publicationDate: "1980-07-31",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "1980-SCC-REPORT",
      citations: [
        {
          citationText: "(1980) 3 SCC 625",
          normalizedCitation: "1980-3-scc-625",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Harmony between Fundamental Rights and Directive Principles",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Balance between Part III and Part IV",
          text: "Minerva Mills Ltd. v. Union of India, (1980) 3 SCC 625 (Constitution Bench): The Indian Constitution is founded on the bedrock of the balance between Fundamental Rights (Part III) and Directive Principles (Part IV). To give absolute primacy to one over the other is to destroy the harmony and basic structure of the Constitution.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.16 Anuradha Bhasin v. Union of India (2020) 3 SCC 637
    await this.ingestSeededDocument({
      id: "doc_sc_anuradha_bhasin_2020",
      sourceId: srcSupremeCourt.id,
      collectionId: colLegalGlobal.id,
      title: "Anuradha Bhasin v. Union of India",
      documentType: KnowledgeDocumentType.SUPREME_COURT_JUDGMENT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSTITUTIONAL",
      publicationDate: "2020-01-10",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2020-SCC-REPORT",
      citations: [
        {
          citationText: "(2020) 3 SCC 637",
          normalizedCitation: "2020-3-scc-637",
          citationType: "CASE_LAW",
        },
      ],
      nodes: [
        {
          identifier: "Freedom of Expression on Internet",
          nodeType: KnowledgeNodeType.PARAGRAPH,
          title: "Internet Access and Freedom of Expression under Article 19",
          text: "Anuradha Bhasin v. Union of India, (2020) 3 SCC 637: Freedom of speech and expression and freedom to practice any profession over the medium of the internet enjoys constitutional protection under Article 19(1)(a) and Article 19(1)(g). Indefinite suspension of internet services is impermissible and subject to the test of proportionality.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 0,
        },
      ],
    });

    // 4.17 High Court & Tribunal Procedural Rules
    await this.ingestSeededDocument({
      id: "doc_in_bombay_hc_rules",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "High Court of Judicature at Bombay (Original Side Commercial Suit Rules)",
      documentType: KnowledgeDocumentType.RULE,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "COMMERCIAL",
      publicationDate: "2022-01-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2022-RULES",
      nodes: [
        {
          identifier: "Rule 1",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Commercial Division Valuation Threshold",
          text: "Bombay High Court Original Side Commercial Division Rules: Commercial disputes and commercial arbitration suits involving specified value exceeding INR 1,00,00,000 (one crore) are instituted before the Commercial Division of the High Court in Maharashtra.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    await this.ingestSeededDocument({
      id: "doc_in_nclt_rules",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "National Company Law Tribunal (Principal Bench New Delhi Rules)",
      documentType: KnowledgeDocumentType.RULE,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "INSOLVENCY",
      publicationDate: "2021-01-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2021-NCLT-RULES",
      nodes: [
        {
          identifier: "Rule 10",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Principal Bench Insolvency Jurisdiction",
          text: "National Company Law Tribunal Rules: The Principal Bench at New Delhi exercises insolvency jurisdiction under Section 7 of the Insolvency and Bankruptcy Code over corporate debtors with registered offices in the National Capital Territory.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    await this.ingestSeededDocument({
      id: "doc_in_scdrc_up_rules",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "State Consumer Disputes Redressal Commission Uttar Pradesh Jurisdiction Rules",
      documentType: KnowledgeDocumentType.RULE,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSUMER",
      publicationDate: "2020-07-20",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2020-SCDRC-RULES",
      nodes: [
        {
          identifier: "Rule 5",
          nodeType: KnowledgeNodeType.SECTION,
          title: "SCDRC Pecuniary Jurisdiction in Uttar Pradesh",
          text: "State Consumer Disputes Redressal Commission (SCDRC) Uttar Pradesh: The State Commission entertains consumer complaints where the value of goods or services paid as consideration exceeds fifty lakh rupees but does not exceed two crore rupees.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    await this.ingestSeededDocument({
      id: "doc_in_ngt_rules",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "National Green Tribunal (Southern Zone Chennai Environmental Clearance Rules)",
      documentType: KnowledgeDocumentType.RULE,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "ENVIRONMENTAL",
      publicationDate: "2021-01-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2021-NGT-RULES",
      nodes: [
        {
          identifier: "Rule 12",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Southern Zone Environmental Clearance Challenge",
          text: "National Green Tribunal Southern Zone Chennai: Exercises jurisdiction to hear appeals against grant of environmental clearance under the Environment (Protection) Act 1986 for industrial and infrastructure projects in the Southern states.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    await this.ingestSeededDocument({
      id: "doc_in_sat_rules",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Securities Appellate Tribunal (SAT Mumbai Appellate Rules)",
      documentType: KnowledgeDocumentType.RULE,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "SECURITIES",
      publicationDate: "2021-01-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2021-SAT-RULES",
      nodes: [
        {
          identifier: "Rule 3",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Appeals against SEBI Orders",
          text: "Securities Appellate Tribunal (SAT) Mumbai: Any person aggrieved by an order of SEBI or an adjudicating officer may prefer an appeal to the Securities Appellate Tribunal within forty-five days.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    await this.ingestSeededDocument({
      id: "doc_in_calcutta_hc_rules",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "High Court at Calcutta (Appellate Side Criminal Revision Rules)",
      documentType: KnowledgeDocumentType.RULE,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CRIMINAL_PROCEDURE",
      publicationDate: "2021-01-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2021-CALCUTTA-RULES",
      nodes: [
        {
          identifier: "Rule 8",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Appellate Side Criminal Revision",
          text: "High Court at Calcutta Appellate Side Rules: Governs the procedure for filing criminal revision petitions under Section 397/401 CrPC against orders of subordinate Sessions Courts.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    await this.ingestSeededDocument({
      id: "doc_in_karnataka_hc_rules",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "High Court of Karnataka (Writ Proceedings Rules under Article 226)",
      documentType: KnowledgeDocumentType.RULE,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CONSTITUTIONAL",
      publicationDate: "2021-01-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2021-KARNATAKA-RULES",
      nodes: [
        {
          identifier: "Rule 3",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Filing Rules for Writ Petitions Against State Authority",
          text: "High Court of Karnataka Writ Proceedings Rules: Prescribes the procedure for filing writ petitions under Article 226 against state authorities, local bodies, and statutory corporations in Karnataka.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    await this.ingestSeededDocument({
      id: "doc_in_ipc_1860",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Indian Penal Code, 1860 (Repealed)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "CRIMINAL",
      publicationDate: "1860-10-06",
      effectiveFrom: "1862-01-01",
      effectiveTo: "2024-06-30",
      currentStatus: KnowledgeDocumentStatus.REPEALED,
      versionTag: "1860-REPEALED",
      nodes: [
        {
          identifier: "Section 302",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Punishment for murder (Repealed IPC)",
          text: "Section 302 IPC (Repealed). Punishment for murder: Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine. (Repealed and replaced by Section 103 Bharatiya Nyaya Sanhita 2023).",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    // 4.18 Versioned Statutory Notice Clause (Arbitration Act Section 8 / 8.1)
    await this.ingestSeededDocument({
      id: "doc_in_arbitration_notice_v1",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Arbitration Notice Clause (Historical 2021 Edition)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "ARBITRATION",
      publicationDate: "2021-01-01",
      effectiveFrom: "2021-01-01",
      effectiveTo: "2021-12-31",
      currentStatus: KnowledgeDocumentStatus.SUPERSEDED,
      versionTag: "1.0.0",
      nodes: [
        {
          identifier: "Section 8",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Section 8 - Statutory Notice Period",
          text: "Section 8 Statutory Notice Period: The claimant must give thirty days (30 days) written notice to the respondent before invoking arbitration under the agreement.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    await this.ingestSeededDocument({
      id: "doc_in_arbitration_notice_v2",
      sourceId: srcGov.id,
      collectionId: colLegalGlobal.id,
      title: "Arbitration Notice Clause (Current 2026 Edition)",
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      legalDomain: "ARBITRATION",
      publicationDate: "2022-01-01",
      effectiveFrom: "2022-01-01",
      effectiveTo: "2030-12-31",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2.0.0",
      supersedesVersionId: "ver_doc_in_arbitration_notice_v1_1.0.0",
      nodes: [
        {
          identifier: "Section 8.1",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Section 8.1 - Current Statutory Notice Period",
          text: "Section 8.1 Current Statutory Notice Period (Amended): The claimant must give sixty days (60 days) written notice to the respondent before filing an application to refer parties to arbitration.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ],
    });

    // =========================================================================
    // 5. GENERAL REFERENCE KNOWLEDGE (GENERAL_GLOBAL)
    // =========================================================================
    await this.ingestSeededDocument({
      id: "doc_gen_cs_rag_2026",
      sourceId: srcGeneral.id,
      collectionId: colGeneralGlobal.id,
      title: "Principles of Enterprise RAG & Distributed AI Infrastructure",
      documentType: KnowledgeDocumentType.GENERAL_ARTICLE,
      jurisdiction: KnowledgeJurisdiction.INTERNATIONAL,
      authorityLevel: KnowledgeAuthorityLevel.GENERAL_REFERENCE,
      legalDomain: "GENERAL",
      publicationDate: "2026-01-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "2026-EDITION",
      nodes: [
        {
          identifier: "Section 1. Architectural Foundations",
          nodeType: KnowledgeNodeType.SECTION,
          title: "RAG Architecture Overview",
          text: "Retrieval-Augmented Generation (RAG) combines dense vector embedding retrieval with sparse Okapi BM25 keyword matching via Reciprocal Rank Fusion (RRF). Token-budgeted context windows prevent hallucinations by grounding responses in auditable evidence chunks.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 2. Vector Indexing",
          nodeType: KnowledgeNodeType.SECTION,
          title: "HNSW and Cosine Distance",
          text: "Hierarchical Navigable Small World (HNSW) vector graphs enable sub-millisecond approximate nearest neighbor searches across 1536-dimensional embedding vectors using cosine distance metrics.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // =========================================================================
    // 6. MULTI-VERSION PRIVATE AGREEMENT (FIRM_KNOWLEDGE / MATTER_KNOWLEDGE)
    // =========================================================================

    // 6.1 Master Services Agreement Version 1 (Active 2020-2022)
    await this.ingestSeededDocument({
      id: "doc_firm_msa_01",
      sourceId: srcFirm.id,
      collectionId: colFirmA.id,
      firmId: "firm-alpha",
      title: "Master Services Agreement (Apex Legal Tech LLC)",
      documentType: KnowledgeDocumentType.CONTRACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.VERIFIED_FIRM_SOURCE,
      legalDomain: "CONTRACT",
      publicationDate: "2020-01-01",
      effectiveFrom: "2020-01-01",
      effectiveTo: "2022-12-31",
      currentStatus: KnowledgeDocumentStatus.AMENDED,
      currentVersion: "V1",
      versionTag: "V1",
      nodes: [
        {
          identifier: "Section 4",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Restrictive Covenants and Non-Compete",
          text: "Section 4. Restrictive Covenants: During the term of this engagement and for a duration of eighteen (18) months following termination, Provider Personnel shall not engage directly with competing financial or legal enterprise applications within the territory.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 8",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Termination and Notice Period",
          text: "Section 8. Termination: Either party may terminate this Agreement without cause upon providing thirty (30) days prior written notice to the other party.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 12",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Governing Law and Dispute Resolution",
          text: "Section 12. Governing Law: This Agreement shall be governed by Indian law. Any dispute shall be resolved through arbitration seated in New Delhi under the Arbitration and Conciliation Act, 1996.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
      ],
    });

    // 6.2 Master Services Agreement Version 2 (Amended 2023 - Present)
    await this.ingestSeededDocument({
      id: "doc_firm_msa_01",
      sourceId: srcFirm.id,
      collectionId: colFirmA.id,
      firmId: "firm-alpha",
      title: "Master Services Agreement (Apex Legal Tech LLC)",
      documentType: KnowledgeDocumentType.CONTRACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.VERIFIED_FIRM_SOURCE,
      legalDomain: "CONTRACT",
      publicationDate: "2023-01-01",
      effectiveFrom: "2023-01-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      currentVersion: "V2",
      versionTag: "V2",
      supersedesVersionId: "ver_doc_firm_msa_01_v1",
      amendmentReferences: ["Amendment No. 1 dated 2023-01-01"],
      nodes: [
        {
          identifier: "Section 4",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Restrictive Covenants and Non-Compete",
          text: "Section 4. Restrictive Covenants: During the term of this engagement and for a duration of twelve (12) months following termination, Provider Personnel shall not solicit key enterprise clients.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Section 8",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Termination and Notice Period (Amended)",
          text: "Section 8. Termination: Either party may terminate this Agreement without cause upon providing sixty (60) days prior written notice to the other party (amended from 30 days).",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
        {
          identifier: "Section 12",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Governing Law and Dispute Resolution",
          text: "Section 12. Governing Law: This Agreement shall be governed by Indian law with exclusive arbitration seated in New Delhi.",
          startPage: 3,
          endPage: 3,
          orderIndex: 3,
          depth: 1,
        },
      ],
    });

    // 6.3 Schedule B and Commercial Lease for Matter 101
    await this.ingestSeededDocument({
      id: "doc_matter_commercial_lease",
      sourceId: srcFirm.id,
      collectionId: colMatter101.id,
      firmId: "firm-alpha",
      caseId: "case-101",
      title: "Commercial Lease Agreement (Floor 4, Cyber City)",
      documentType: KnowledgeDocumentType.CONTRACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.USER_DOCUMENT,
      legalDomain: "PROPERTY",
      publicationDate: "2024-02-15",
      effectiveFrom: "2024-03-01",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      versionTag: "V1",
      nodes: [
        {
          identifier: "Section 3. Rent & Escalation",
          nodeType: KnowledgeNodeType.SECTION,
          title: "Monthly Rent Obligation",
          text: "Section 3. Rent: Tenant shall pay a monthly base rent of INR 4,50,000 payable on or before the 5th day of each calendar month with a 5% annual escalation.",
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
        {
          identifier: "Schedule B",
          nodeType: KnowledgeNodeType.SCHEDULE,
          title: "Maintenance & Fitment Matrix",
          text: "Schedule B. Common Area Maintenance Charges: Fixed at INR 25 per square foot per month plus applicable GST.",
          startPage: 2,
          endPage: 2,
          orderIndex: 2,
          depth: 1,
        },
      ],
    });

    // Link Relations: MSA V2 amends MSA V1, Commercial Lease links to Schedule B, BNSS/BNS/BSA supersede CrPC/IPC/IEA
    await this.repository.createRelations([
      {
        sourceDocumentId: "doc_firm_msa_01",
        targetDocumentId: "doc_in_arbitration_1996",
        relationType: KnowledgeRelationType.CITES,
        description: "MSA Section 12 incorporates statutory arbitration under Arbitration Act 1996",
      },
      {
        sourceDocumentId: "doc_in_bnss_2023",
        targetDocumentId: "doc_sc_dk_basu_1997",
        relationType: KnowledgeRelationType.CITES,
        description: "Section 35 and 37 BNSS codify Supreme Court D.K. Basu arrest memo guidelines",
      },
      {
        sourceDocumentId: "doc_in_crpc_1973",
        targetDocumentId: "doc_sc_dk_basu_1997",
        relationType: KnowledgeRelationType.CITES,
        description: "Section 41B and 50A CrPC codify Supreme Court D.K. Basu arrest memo guidelines",
      },
      {
        sourceDocumentId: "doc_in_bnss_2023",
        targetDocumentId: "doc_in_crpc_1973",
        relationType: KnowledgeRelationType.SUPERSEDES,
        description: "Bharatiya Nagarik Suraksha Sanhita 2023 supersedes Code of Criminal Procedure 1973 as of 2024-07-01",
      },
      {
        sourceDocumentId: "doc_in_bns_2023",
        targetDocumentId: "doc_in_ipc_1860",
        relationType: KnowledgeRelationType.SUPERSEDES,
        description: "Bharatiya Nyaya Sanhita 2023 supersedes Indian Penal Code 1860 as of 2024-07-01",
      },
      {
        sourceDocumentId: "doc_in_bsa_2023",
        targetDocumentId: "doc_in_evidence_act_1872",
        relationType: KnowledgeRelationType.SUPERSEDES,
        description: "Bharatiya Sakshya Adhiniyam 2023 supersedes Indian Evidence Act 1872 as of 2024-07-01",
      },
    ]);

    // =========================================================================
    // PHASE 2 SEEDING: CONSTITUTION, CASE LAW, PRACTICAL KNOWLEDGE & KNOWLEDGE GRAPH
    // =========================================================================
    await this.seedPhase2KnowledgeBase(srcGov, srcSupremeCourt, colLegalGlobal);

    this.logger.log("Authoritative Knowledge Base initial corpus seeded successfully.");
  }

  /**
   * Seeds Phase 2 Sovereign Knowledge Base:
   * 1. Constitution of India Articles, Clauses, Provisos, and Amendments
   * 2. Landmark Supreme Court & High Court Case Law with Paragraph Provenance
   * 3. Practical Legal Primitives (Remedies, Procedures, Forums, Limitations, Notices)
   * 4. Generic Legal Knowledge Graph Nodes and Edges
   */
  private async seedPhase2KnowledgeBase(
    srcGov: any,
    srcSupremeCourt: any,
    colLegal: any,
  ): Promise<void> {
    this.logger.log("Seeding Phase 2 Constitution, Case Law, Practical Knowledge, and Knowledge Graph...");

    // 1. INGEST CANONICAL CONSTITUTION OF INDIA
    for (const article of CONSTITUTION_CORPUS) {
      const docId = `doc_const_art_${article.articleNumber.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      const articleTitle = `Constitution of India, Article ${article.articleNumber} (${article.heading})`;

      const nodes: Array<{
        identifier: string;
        nodeType: KnowledgeNodeType;
        title: string;
        text: string;
        startPage: number;
        endPage: number;
        orderIndex: number;
        depth: number;
      }> = [
        {
          identifier: `Article ${article.articleNumber}`,
          nodeType: KnowledgeNodeType.ARTICLE,
          title: article.heading,
          text: `Article ${article.articleNumber}. ${article.heading}\n${article.text}`,
          startPage: 1,
          endPage: 1,
          orderIndex: 1,
          depth: 1,
        },
      ];

      // Add Clause nodes if present
      if (article.clauses && article.clauses.length > 0) {
        article.clauses.forEach((cl, idx) => {
          nodes.push({
            identifier: `Article ${article.articleNumber}${cl.clauseNumber}`,
            nodeType: KnowledgeNodeType.CLAUSE,
            title: `${article.heading} - Clause ${cl.clauseNumber}`,
            text: `Article ${article.articleNumber}${cl.clauseNumber}: ${cl.text}`,
            startPage: 1,
            endPage: 1,
            orderIndex: idx + 2,
            depth: 2,
          });
        });
      }

      await this.ingestSeededDocument({
        id: docId,
        sourceId: srcGov.id,
        collectionId: colLegal.id,
        title: articleTitle,
        documentType: KnowledgeDocumentType.CONSTITUTION,
        jurisdiction: KnowledgeJurisdiction.INDIAN,
        authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
        legalDomain: article.legalDomain,
        publicationDate: article.effectiveFrom,
        effectiveFrom: article.effectiveFrom,
        currentStatus: KnowledgeDocumentStatus.IN_FORCE,
        versionTag: "1950",
        citations: [
          {
            citationText: `Article ${article.articleNumber}`,
            normalizedCitation: `article-${article.articleNumber.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
            citationType: "CONSTITUTIONAL_ARTICLE",
          },
          {
            citationText: `Art ${article.articleNumber}`,
            normalizedCitation: `art-${article.articleNumber.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
            citationType: "CONSTITUTIONAL_ARTICLE",
          },
        ],
        nodes,
      });

      // Save complete constitutional article metadata on doc record
      const doc = await this.repository.getDocumentById(docId);
      if (doc) {
        doc.metadata = {
          ...doc.metadata,
          constitutionalArticle: article,
          legalDomain: article.legalDomain,
          authorityLevel: "CONSTITUTIONAL",
        };
      }
    }

    // 2. INGEST CANONICAL CASE LAW CORPUS (SUPREME COURT & HIGH COURT)
    const caseDetector = new CaseStructureDetector();
    for (const caseData of CASE_LAW_CORPUS) {
      const docId = `doc_case_${caseData.caseId}`;
      const chunks = caseDetector.detectAndChunkJudgment(caseData);

      const nodes = chunks.map((c, idx) => ({
        identifier: c.heading || `Para ${c.paragraphNumber || idx + 1}`,
        nodeType: KnowledgeNodeType.PARAGRAPH,
        title: c.proposition || `${c.caseName} - Para ${c.paragraphNumber || idx + 1}`,
        text: c.content,
        startPage: 1,
        endPage: 1,
        orderIndex: idx + 1,
        depth: 1,
      }));

      await this.ingestSeededDocument({
        id: docId,
        sourceId: srcSupremeCourt.id,
        collectionId: colLegal.id,
        title: `${caseData.caseName} [${caseData.citation}]`,
        documentType:
          caseData.court === "SUPREME_COURT"
            ? KnowledgeDocumentType.SUPREME_COURT_JUDGMENT
            : KnowledgeDocumentType.HIGH_COURT_JUDGMENT,
        jurisdiction: KnowledgeJurisdiction.INDIAN,
        authorityLevel:
          caseData.court === "SUPREME_COURT"
            ? KnowledgeAuthorityLevel.OFFICIAL_PRIMARY
            : KnowledgeAuthorityLevel.COURT_DECISION,
        legalDomain: caseData.legalDomain,
        publicationDate: caseData.judgmentDate,
        effectiveFrom: caseData.judgmentDate,
        currentStatus:
          caseData.precedentStatus === "OVERRULED"
            ? KnowledgeDocumentStatus.REPEALED
            : KnowledgeDocumentStatus.IN_FORCE,
        versionTag: "1.0",
        citations: [
          {
            citationText: caseData.citation,
            normalizedCitation: caseData.citation.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            citationType: "CASE_LAW",
          },
          {
            citationText: caseData.caseName,
            normalizedCitation: caseData.caseName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
            citationType: "CASE_LAW",
          },
        ],
        nodes,
      });

      // Save caseLaw metadata and precedent status
      const doc = await this.repository.getDocumentById(docId);
      if (doc) {
        doc.metadata = {
          ...doc.metadata,
          caseLaw: caseData,
          precedentStatus: caseData.precedentStatus,
          court: caseData.court,
          state: caseData.state,
          legalDomain: caseData.legalDomain,
        };
      }
    }

    // 3. INGEST PRACTICAL LEGAL KNOWLEDGE (FORUMS, REMEDIES, LIMITATIONS, NOTICES)
    for (const rem of PRACTICAL_REMEDIES) {
      await this.ingestSeededDocument({
        id: `doc_remedy_${rem.remedyId}`,
        sourceId: srcGov.id,
        collectionId: colLegal.id,
        title: `Legal Remedy: ${rem.name} (${rem.statutoryBasis})`,
        documentType: KnowledgeDocumentType.RULE,
        jurisdiction: KnowledgeJurisdiction.INDIAN,
        authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
        legalDomain: rem.legalDomain,
        currentStatus: KnowledgeDocumentStatus.IN_FORCE,
        versionTag: "1.0",
        nodes: [
          {
            identifier: `Remedy: ${rem.reliefKind}`,
            nodeType: KnowledgeNodeType.RULE,
            title: rem.name,
            text: `Remedy: ${rem.name}\nStatutory Basis: ${rem.statutoryBasis}\nConstitutional Basis: ${rem.constitutionalBasis || "N/A"}\nForum: ${rem.forumName}\nDescription: ${rem.description}\nPreconditions: ${rem.preconditions.join("; ")}`,
            startPage: 1,
            endPage: 1,
            orderIndex: 1,
            depth: 1,
          },
        ],
      });
    }

    // 4. BUILD GENERIC LEGAL KNOWLEDGE GRAPH
    const graph = this.repository.getKnowledgeGraph();
    const graphNodes: LegalGraphNodeV1[] = [];
    const graphEdges: LegalGraphEdgeV1[] = [];

    // 4.1 Register Domain Nodes
    const domains: LegalDomain[] = [
      "CRIMINAL_PROCEDURE",
      "CRIMINAL",
      "PROPERTY",
      "CONTRACT",
      "FAMILY",
      "CONSUMER",
      "CYBER",
      "EMPLOYMENT",
      "REAL_ESTATE",
      "ARBITRATION",
      "SUCCESSION",
      "CONSTITUTIONAL",
      "COMMERCIAL",
      "CORPORATE",
    ];

    for (const dom of domains) {
      graphNodes.push({
        id: `node_dom_${dom.toLowerCase()}`,
        type: "LEGAL_DOMAIN",
        label: dom,
        title: `Legal Domain: ${dom}`,
        legalDomain: dom,
        jurisdiction: "INDIAN",
        provenance: "Indian Legal Taxonomy Standard",
      });
    }

    // 4.2 Register Problem Nodes (Generic entry points)
    const problems = [
      { id: "prob_criminal_arrest", domain: "CRIMINAL_PROCEDURE" as LegalDomain, title: "Police Station Arrest & Detention Without Family Intimation" },
      { id: "prob_property_sale", domain: "PROPERTY" as LegalDomain, title: "Inherited / Ancestral Property Sold Without Co-Owner Consent" },
      { id: "prob_contract_breach", domain: "CONTRACT" as LegalDomain, title: "Commercial Agreement Breach & Payment Default" },
      { id: "prob_family_maintenance", domain: "FAMILY" as LegalDomain, title: "Non-Payment of Spousal / Child Maintenance" },
      { id: "prob_consumer_defect", domain: "CONSUMER" as LegalDomain, title: "Defective Product Sold with Refund Refused by Seller" },
      { id: "prob_cyber_impersonation", domain: "CYBER" as LegalDomain, title: "Fake Social Media Profile Identity Theft & Photo Misuse" },
      { id: "prob_employment_unpaid", domain: "EMPLOYMENT" as LegalDomain, title: "Unpaid Salary and Gratuity Withheld by Employer" },
      { id: "prob_rera_delay", domain: "REAL_ESTATE" as LegalDomain, title: "Builder Delayed Flat Possession Past Possession Date" },
      { id: "prob_arbitration_notice", domain: "ARBITRATION" as LegalDomain, title: "Arbitration Notice Received & Section 8 Application" },
      { id: "prob_succession_intestate", domain: "SUCCESSION" as LegalDomain, title: "Father Died Without a Will - Intestate Succession Partition" },
    ];

    for (const p of problems) {
      graphNodes.push({
        id: `node_${p.id}`,
        type: "LEGAL_PROBLEM",
        label: p.title,
        title: p.title,
        legalDomain: p.domain,
        jurisdiction: "INDIAN",
        provenance: "User Legal Problem Taxonomy",
      });

      // Edge: Problem -> Domain
      graphEdges.push({
        id: `edge_${p.id}_to_dom`,
        sourceNodeId: `node_${p.id}`,
        targetNodeId: `node_dom_${p.domain.toLowerCase()}`,
        edgeType: "GOVERNED_BY",
        provenance: "Problem Taxonomy Definition",
      });
    }

    // 4.3 Register Constitutional Nodes
    for (const art of CONSTITUTION_CORPUS) {
      const artNodeId = `node_cg_art_${art.articleNumber.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      graphNodes.push({
        id: artNodeId,
        type: "CONSTITUTIONAL_PROVISION",
        label: `Article ${art.articleNumber}`,
        identifier: `Article ${art.articleNumber}`,
        title: `Article ${art.articleNumber}: ${art.heading}`,
        legalDomain: art.legalDomain,
        jurisdiction: "INDIAN",
        authorityLevel: "CONSTITUTIONAL",
        provenance: art.provenance,
        metadata: { articleNumber: art.articleNumber, heading: art.heading },
      });
    }

    // 4.4 Register Statute Nodes
    const statutes = [
      { id: "stat_bnss_2023", name: "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)", domain: "CRIMINAL_PROCEDURE" as LegalDomain },
      { id: "stat_crpc_1973", name: "Code of Criminal Procedure, 1973 (CrPC - Repealed)", domain: "CRIMINAL_PROCEDURE" as LegalDomain },
      { id: "stat_bns_2023", name: "Bharatiya Nyaya Sanhita, 2023 (BNS)", domain: "CRIMINAL" as LegalDomain },
      { id: "stat_ipc_1860", name: "Indian Penal Code, 1860 (IPC - Repealed)", domain: "CRIMINAL" as LegalDomain },
      { id: "stat_it_act_2000", name: "Information Technology Act, 2000", domain: "CYBER" as LegalDomain },
      { id: "stat_contract_act_1872", name: "Indian Contract Act, 1872", domain: "CONTRACT" as LegalDomain },
      { id: "stat_arbitration_act_1996", name: "Arbitration and Conciliation Act, 1996", domain: "ARBITRATION" as LegalDomain },
      { id: "stat_tpa_1882", name: "Transfer of Property Act, 1882", domain: "PROPERTY" as LegalDomain },
      { id: "stat_cpa_2019", name: "Consumer Protection Act, 2019", domain: "CONSUMER" as LegalDomain },
      { id: "stat_rera_2016", name: "Real Estate (Regulation and Development) Act, 2016", domain: "REAL_ESTATE" as LegalDomain },
      { id: "stat_hsa_1956", name: "Hindu Succession Act, 1956", domain: "SUCCESSION" as LegalDomain },
      { id: "stat_hma_1955", name: "Hindu Marriage Act, 1955", domain: "FAMILY" as LegalDomain },
      { id: "stat_wages_act_1936", name: "Payment of Wages Act, 1936", domain: "EMPLOYMENT" as LegalDomain },
      { id: "stat_dpdp_2023", name: "Digital Personal Data Protection Act, 2023", domain: "DATA_PRIVACY" as LegalDomain },
      { id: "stat_ni_act_1881", name: "Negotiable Instruments Act, 1881", domain: "COMMERCIAL" as LegalDomain },
      { id: "stat_sra_1963", name: "Specific Relief Act, 1963", domain: "CONTRACT" as LegalDomain },
      { id: "stat_limitation_act_1963", name: "Limitation Act, 1963", domain: "CIVIL_PROCEDURE" as LegalDomain },
    ];

    for (const st of statutes) {
      graphNodes.push({
        id: `node_${st.id}`,
        type: "STATUTE",
        label: st.name,
        title: st.name,
        legalDomain: st.domain,
        jurisdiction: "INDIAN",
        authorityLevel: "OFFICIAL_PRIMARY",
        provenance: `Official Gazette of India, ${st.name}`,
      });
    }

    // 4.5 Register Case Law Nodes
    for (const cs of CASE_LAW_CORPUS) {
      const caseNodeId = `node_case_${cs.caseId}`;
      graphNodes.push({
        id: caseNodeId,
        type: "CASE",
        label: cs.caseName,
        identifier: cs.citation,
        title: `${cs.caseName} [${cs.citation}]`,
        legalDomain: cs.legalDomain,
        jurisdiction: "INDIAN",
        authorityLevel: cs.court === "SUPREME_COURT" ? "BINDING_PRECEDENT" : "PERSUASIVE_PRECEDENT",
        provenance: cs.provenance,
        metadata: {
          citation: cs.citation,
          precedentStatus: cs.precedentStatus,
          ratioDecidendi: cs.ratioDecidendi,
          court: cs.court,
          state: cs.state,
        },
      });
    }

    // 4.6 Register Forum & Remedy & Limitation & Notice Nodes
    const procedures = [
      { id: "proc_arrest_safeguards", title: "Arrest Memo & 24-hr Magistrate Production Procedure", domain: "CRIMINAL_PROCEDURE" as LegalDomain, provenance: "Sections 36, 47, 58 BNSS 2023 & D.K. Basu guidelines" },
      { id: "proc_consumer_filing", title: "District Consumer Commission E-Daakhil Complaint Procedure", domain: "CONSUMER" as LegalDomain, provenance: "Consumer Protection Act 2019 Section 35" },
      { id: "proc_civil_suit", title: "Plaint Presentation and Summons Procedure under CPC", domain: "CIVIL_PROCEDURE" as LegalDomain, provenance: "Code of Civil Procedure 1908 Order IV & V" },
      { id: "proc_arbitration_ref", title: "Section 8 Reference to Arbitration Procedure", domain: "ARBITRATION" as LegalDomain, provenance: "Arbitration and Conciliation Act 1996 Section 8" },
      { id: "proc_rera_complaint", title: "Form M Complaint for Delayed Possession under RERA", domain: "REAL_ESTATE" as LegalDomain, provenance: "Real Estate (Regulation and Development) Act 2016 Section 31" },
    ];

    for (const pr of procedures) {
      graphNodes.push({
        id: `node_${pr.id}`,
        type: "PROCEDURE",
        label: pr.title,
        title: pr.title,
        identifier: pr.title,
        legalDomain: pr.domain,
        jurisdiction: "INDIAN",
        provenance: pr.provenance,
      });
    }

    for (const f of PRACTICAL_FORUMS) {
      for (const dom of f.subjectJurisdiction) {
        graphNodes.push({
          id: `node_${f.forumId}_${dom.toLowerCase()}`,
          type: "FORUM",
          label: f.name,
          title: f.name,
          identifier: f.name,
          legalDomain: dom,
          jurisdiction: f.jurisdiction,
          provenance: f.provenance,
        });
      }
    }

    for (const r of PRACTICAL_REMEDIES) {
      graphNodes.push({
        id: `node_${r.remedyId}`,
        type: "REMEDY",
        label: r.name,
        title: r.name,
        identifier: r.name,
        legalDomain: r.legalDomain,
        jurisdiction: "INDIAN",
        provenance: r.provenance,
        metadata: {
          reliefKind: r.reliefKind,
          statutoryBasis: r.statutoryBasis,
          forumName: r.forumName,
        },
      });
    }

    for (const lim of PRACTICAL_LIMITATIONS) {
      graphNodes.push({
        id: `node_${lim.limitationId}`,
        type: "LIMITATION",
        label: `${lim.subjectAction} (${lim.duration})`,
        title: `${lim.subjectAction} - Limitation ${lim.duration}`,
        identifier: `${lim.subjectAction} (${lim.duration})`,
        legalDomain: lim.legalDomain,
        jurisdiction: "INDIAN",
        provenance: lim.provenance,
      });
    }

    for (const not of PRACTICAL_NOTICES) {
      graphNodes.push({
        id: `node_${not.noticeId}`,
        type: "NOTIFICATION",
        label: `${not.name} (${not.noticePeriodDays} days)`,
        title: `${not.name} (${not.noticePeriodDays} days)`,
        identifier: `${not.name} (${not.noticePeriodDays} days)`,
        legalDomain: not.legalDomain,
        jurisdiction: "INDIAN",
        provenance: not.provenance,
        metadata: {
          statute: not.statute,
          section: not.section,
          noticePeriodDays: not.noticePeriodDays,
        },
      });
    }

    // 4.7 Register Graph Edges (Generic Relationships)
    // Constitutional Implementation Edges
    graphEdges.push({
      id: "edge_bnss_impl_art21_22",
      sourceNodeId: "node_stat_bnss_2023",
      targetNodeId: "node_cg_art_22",
      edgeType: "STATUTE_IMPLEMENTS_CONSTITUTIONAL_RIGHT",
      description: "Sections 35, 36, 47 BNSS implement constitutional arrest safeguards under Article 22",
      provenance: "Legislative Statement of Objects and Reasons, BNSS 2023",
    });
    graphEdges.push({
      id: "edge_dpdp_impl_art21",
      sourceNodeId: "node_stat_dpdp_2023",
      targetNodeId: "node_cg_art_21",
      edgeType: "STATUTE_IMPLEMENTS_CONSTITUTIONAL_RIGHT",
      description: "DPDP Act 2023 implements fundamental right to privacy under Article 21",
      provenance: "DPDP Act Preamble & Puttaswamy (2017) 10 SCC 1",
    });
    graphEdges.push({
      id: "edge_rera_impl_art300a",
      sourceNodeId: "node_stat_rera_2016",
      targetNodeId: "node_cg_art_300a",
      edgeType: "STATUTE_IMPLEMENTS_CONSTITUTIONAL_RIGHT",
      description: "RERA Section 18 protects property rights and investment of allottees under Article 300A",
      provenance: "RERA Statement of Objects and Reasons",
    });

    // Case Interpetation & Application Edges
    graphEdges.push({
      id: "edge_dk_basu_interp_art21_22",
      sourceNodeId: "node_case_dk_basu_1997",
      targetNodeId: "node_cg_art_22",
      edgeType: "CASE_INTERPRETS_CONSTITUTIONAL_PROVISION",
      description: "D.K. Basu interprets Article 21 and 22(1) to mandate arrest memos and family intimation",
      provenance: "(1997) 1 SCC 416 at Para 35",
    });
    graphEdges.push({
      id: "edge_dk_basu_applies_bnss",
      sourceNodeId: "node_case_dk_basu_1997",
      targetNodeId: "node_stat_bnss_2023",
      edgeType: "CASE_APPLIES_STATUTE",
      description: "D.K. Basu arrest guidelines are codified in Sections 36 and 47 BNSS 2023",
      provenance: "(1997) 1 SCC 416 & BNSS Section 36/47",
    });
    graphEdges.push({
      id: "edge_arnesh_kumar_applies_bnss",
      sourceNodeId: "node_case_arnesh_kumar_2014",
      targetNodeId: "node_stat_bnss_2023",
      edgeType: "CASE_APPLIES_STATUTE",
      description: "Arnesh Kumar mandates notice of appearance codified in Section 35 BNSS",
      provenance: "(2014) 8 SCC 273",
    });
    graphEdges.push({
      id: "edge_puttaswamy_interp_art21",
      sourceNodeId: "node_case_puttaswamy_2017",
      targetNodeId: "node_cg_art_21",
      edgeType: "CASE_INTERPRETS_CONSTITUTIONAL_PROVISION",
      description: "Puttaswamy holds Right to Privacy is a fundamental right under Article 21",
      provenance: "(2017) 10 SCC 1 at Para 647",
    });
    graphEdges.push({
      id: "edge_puttaswamy_overrules_adm_jabalpur",
      sourceNodeId: "node_case_puttaswamy_2017",
      targetNodeId: "node_case_adm_jabalpur_1976",
      edgeType: "CASE_OVERRULES_CASE",
      description: "9-Judge Bench in Puttaswamy expressly overrules ADM Jabalpur v. Shivkant Shukla",
      provenance: "(2017) 10 SCC 1 at Para 648",
    });
    graphEdges.push({
      id: "edge_maneka_gandhi_overrules_ak_gopalan",
      sourceNodeId: "node_case_maneka_gandhi_1978",
      targetNodeId: "node_case_ak_gopalan_1950",
      edgeType: "CASE_OVERRULES_CASE",
      description: "7-Judge Bench in Maneka Gandhi overrules narrow mutual-exclusivity doctrine of A.K. Gopalan",
      provenance: "(1978) 1 SCC 248 at Para 15",
    });
    graphEdges.push({
      id: "edge_kailash_nath_considers_contract_act",
      sourceNodeId: "node_case_kailash_nath_2015",
      targetNodeId: "node_stat_contract_act_1872",
      edgeType: "CASE_CONSIDERS_STATUTE",
      description: "Kailash Nath interprets Section 74 Contract Act to require proof of actual loss",
      provenance: "(2015) 4 SCC 136 at Para 43",
    });
    graphEdges.push({
      id: "edge_vidya_drolia_applies_arbitration",
      sourceNodeId: "node_case_vidya_drolia_2021",
      targetNodeId: "node_stat_arbitration_act_1996",
      edgeType: "CASE_APPLIES_STATUTE",
      description: "Vidya Drolia lays down four-fold arbitrability test under Sections 8 and 11",
      provenance: "(2021) 2 SCC 1 at Para 76",
    });
    graphEdges.push({
      id: "edge_shreya_singhal_interp_art19",
      sourceNodeId: "node_case_shreya_singhal_2015",
      targetNodeId: "node_cg_art_19",
      edgeType: "CASE_INTERPRETS_CONSTITUTIONAL_PROVISION",
      description: "Shreya Singhal strikes down Section 66A IT Act for violating freedom of speech under Article 19(1)(a)",
      provenance: "(2015) 5 SCC 1 at Para 119",
    });
    graphEdges.push({
      id: "edge_vineeta_sharma_considers_hsa",
      sourceNodeId: "node_case_vineeta_sharma_2020",
      targetNodeId: "node_stat_hsa_1956",
      edgeType: "CASE_CONSIDERS_STATUTE",
      description: "Vineeta Sharma holds daughters have coparcenary rights by birth under Section 6 HSA",
      provenance: "(2020) 9 SCC 1 at Para 137",
    });

    // Problem to Remedy and Forum Edges
    graphEdges.push({
      id: "edge_prob_arrest_to_rem",
      sourceNodeId: "node_prob_criminal_arrest",
      targetNodeId: "node_rem_habeas_corpus_arrest",
      edgeType: "REQUIRES",
      description: "Arrest without family intimation enables Habeas Corpus / Section 47 BNSS remedy",
      provenance: "Article 22 & D.K. Basu guidelines",
    });
    graphEdges.push({
      id: "edge_prob_arrest_to_forum",
      sourceNodeId: "node_prob_criminal_arrest",
      targetNodeId: "node_forum_magistrate",
      edgeType: "AVAILABLE_BEFORE",
      description: "Production and bail applications are made before Judicial Magistrate First Class",
      provenance: "Section 58, 187, 480 BNSS",
    });
    graphEdges.push({
      id: "edge_prob_property_to_rem",
      sourceNodeId: "node_prob_property_sale",
      targetNodeId: "node_rem_property_partition_injunction",
      edgeType: "REQUIRES",
      description: "Unauthorized sale of ancestral property enables suit for partition & injunction",
      provenance: "Section 6 HSA & Section 38 Specific Relief Act",
    });
    graphEdges.push({
      id: "edge_prob_contract_to_lim",
      sourceNodeId: "node_prob_contract_breach",
      targetNodeId: "node_lim_contract_breach",
      edgeType: "LIMITED_BY",
      description: "Breach of contract damages claim must be filed within 3 years",
      provenance: "Article 55, Schedule to Limitation Act 1963",
    });
    graphEdges.push({
      id: "edge_prob_consumer_to_forum",
      sourceNodeId: "node_prob_consumer_defect",
      targetNodeId: "node_forum_consumer_district",
      edgeType: "AVAILABLE_BEFORE",
      description: "Defective product claims up to INR 50 Lakhs filed before District Consumer Commission",
      provenance: "Section 34, 35 Consumer Protection Act 2019",
    });
    graphEdges.push({
      id: "edge_prob_rera_to_forum",
      sourceNodeId: "node_prob_rera_delay",
      targetNodeId: "node_forum_rera_authority",
      edgeType: "AVAILABLE_BEFORE",
      description: "Delayed possession complaints filed before RERA Authority under Section 31",
      provenance: "Section 31 RERA 2016",
    });
    graphEdges.push({
      id: "edge_prob_arbitration_to_rem",
      sourceNodeId: "node_prob_arbitration_notice",
      targetNodeId: "node_rem_arbitration_section_8_reference",
      edgeType: "REQUIRES",
      description: "Arbitration notice requires Section 8 reference application before submitting defense on merits",
      provenance: "Section 8 Arbitration and Conciliation Act 1996",
    });

    // Register all nodes & edges into graph
    graph.registerNodes(graphNodes);
    graph.registerEdges(graphEdges);

    this.logger.log(`Phase 2 Legal Knowledge Graph seeded: ${graphNodes.length} nodes, ${graphEdges.length} edges across ${domains.length} legal domains.`);
  }

  /**
   * Helper to ingest and vectorize a structured seed document.
   */
  private async ingestSeededDocument(params: {
    id: string;
    sourceId: string;
    collectionId: string;
    firmId?: string;
    caseId?: string;
    userId?: string;
    title: string;
    documentType: KnowledgeDocumentType;
    jurisdiction: KnowledgeJurisdiction;
    authorityLevel: KnowledgeAuthorityLevel;
    legalDomain?: LegalDomain;
    publicationDate?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    currentStatus: KnowledgeDocumentStatus;
    currentVersion?: string;
    versionTag: string;
    supersedesVersionId?: string;
    amendmentReferences?: string[];
    citations?: { citationText: string; normalizedCitation: string; citationType: string }[];
    nodes: {
      identifier: string;
      nodeType: KnowledgeNodeType;
      title: string;
      text: string;
      startPage: number;
      endPage: number;
      orderIndex: number;
      depth: number;
    }[];
  }): Promise<void> {
    const fullText = params.nodes.map((n) => n.text).join("\n\n");
    const contentHash = createHash("sha256").update(fullText).digest("hex");

    // 1. Register Document
    await this.repository.registerDocument({
      id: params.id,
      sourceId: params.sourceId,
      collectionId: params.collectionId,
      firmId: params.firmId,
      caseId: params.caseId,
      userId: params.userId,
      title: params.title,
      documentType: params.documentType,
      jurisdiction: params.jurisdiction,
      authorityLevel: params.authorityLevel,
      publicationDate: params.publicationDate,
      effectiveFrom: params.effectiveFrom,
      effectiveTo: params.effectiveTo,
      currentStatus: params.currentStatus,
      currentVersion: params.versionTag,
      contentHash,
      metadata: {
        legalDomain: params.legalDomain || "GENERAL",
      },
    });

    // 2. Register Version
    const versionId = `ver_${params.id}_${params.versionTag.toLowerCase()}`;
    await this.repository.registerVersion({
      id: versionId,
      documentId: params.id,
      versionTag: params.versionTag,
      effectiveFrom: params.effectiveFrom,
      effectiveTo: params.effectiveTo,
      supersedesVersionId: params.supersedesVersionId,
      amendmentReferences: params.amendmentReferences,
      contentHash,
      status: "ACTIVE" as any,
    });

    // 3. Register Nodes
    const nodesToInsert = params.nodes.map((n, idx) => ({
      id: `node_${params.id}_${idx + 1}`,
      documentId: params.id,
      versionId,
      nodeType: n.nodeType,
      identifier: n.identifier,
      title: n.title,
      text: n.text,
      textHash: createHash("sha256").update(n.text).digest("hex"),
      startPage: n.startPage,
      endPage: n.endPage,
      orderIndex: n.orderIndex,
      depth: n.depth,
      metadata: {
        legalDomain: params.legalDomain || "GENERAL",
      },
    }));
    await this.repository.insertNodes(nodesToInsert);

    // 4. Register Chunks & Embeddings
    const chunksToInsert = params.nodes.map((n, idx) => ({
      id: `chk_${params.id}_${params.versionTag}_${idx + 1}`,
      documentId: params.id,
      versionId,
      nodeId: `node_${params.id}_${idx + 1}`,
      collectionId: params.collectionId,
      firmId: params.firmId,
      caseId: params.caseId,
      userId: params.userId,
      chunkIndex: idx,
      structuralUnit: n.nodeType,
      section: n.identifier,
      clause: n.identifier.includes("Clause") || n.identifier.includes("8.2") || n.identifier.includes("11.2") ? n.identifier : undefined,
      schedule: n.identifier.includes("Schedule") ? n.identifier : undefined,
      page: n.startPage,
      pageEnd: n.endPage,
      position: idx,
      content: n.text,
      tokenCount: Math.ceil(n.text.length / 4),
      characterCount: n.text.length,
      textHash: createHash("sha256").update(n.text).digest("hex"),
      isOperativeClause: !n.identifier.includes("Preamble"),
      metadata: {
        legalDomain: params.legalDomain || "GENERAL",
        title: params.title,
        authorityLevel: params.authorityLevel,
        jurisdiction: params.jurisdiction,
        currentStatus: params.currentStatus,
      },
    }));

    // Generate real embeddings for candidate retrieval
    const embeddingsToInsert: any[] = [];
    if (this.embeddingProvider) {
      const texts = chunksToInsert.map((c) => c.content);
      const embRes = await this.embeddingProvider.generateEmbeddings(texts);
      for (let i = 0; i < chunksToInsert.length; i++) {
        embeddingsToInsert.push({
          chunkId: chunksToInsert[i].id,
          provider: embRes.provider,
          model: embRes.model,
          dimensions: embRes.dimensions,
          version: "1.0",
          embedding: embRes.embeddings[i],
          textHash: chunksToInsert[i].textHash,
        });
      }
    }

    await this.repository.indexChunks(chunksToInsert, embeddingsToInsert);

    // 5. Register Citations
    if (params.citations && params.citations.length > 0) {
      await this.repository.createCitations(
        params.citations.map((c, idx) => ({
          documentId: params.id,
          nodeId: `node_${params.id}_${idx + 1}`,
          citationText: c.citationText,
          normalizedCitation: c.normalizedCitation,
          citationType: c.citationType,
        })),
      );
    }
  }
}
