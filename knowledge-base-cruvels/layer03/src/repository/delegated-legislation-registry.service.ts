/**
 * CRUVELS AI — Layer 03 Delegated Legislation Registry Service
 *
 * Manages subordinate legislation (Rules, Regulations, Notifications, Circulars, Statutory Orders)
 * and their deterministic relational links to parent statutory Acts and Sections.
 */

import { Injectable, Logger } from "@nestjs/common";
import type {
  DelegatedLegislationItemV1,
  DelegatedRelationshipType,
  DelegatedSourceType,
} from "../contracts/delegated-legislation.contract";

@Injectable()
export class DelegatedLegislationRegistryService {
  private readonly logger = new Logger(DelegatedLegislationRegistryService.name);
  private readonly items = new Map<string, DelegatedLegislationItemV1>();

  constructor() {
    this.seedDefaultDelegatedLegislation();
  }

  /**
   * Registers a delegated legislation item.
   */
  registerDelegatedItem(item: DelegatedLegislationItemV1): void {
    if (!item.issuingAuthority && item.issuingMinistryOrDepartment) {
      item.issuingAuthority = item.issuingMinistryOrDepartment;
    }
    this.items.set(item.id, item);
  }

  /**
   * Retrieves a delegated legislation item by ID.
   */
  getItem(id: string): DelegatedLegislationItemV1 | undefined {
    return this.items.get(id);
  }

  /**
   * Finds all delegated legislation made under or implementing a specific parent statute.
   */
  findByParentStatute(parentStatuteNameOrId: string): DelegatedLegislationItemV1[] {
    const qLower = parentStatuteNameOrId.toLowerCase();
    return Array.from(this.items.values()).filter(
      (item) =>
        item.parentStatuteId.toLowerCase().includes(qLower) ||
        item.parentStatuteName.toLowerCase().includes(qLower)
    );
  }

  /**
   * Finds delegated rules or notifications by relationship type.
   */
  findByRelationship(relationship: DelegatedRelationshipType): DelegatedLegislationItemV1[] {
    return Array.from(this.items.values()).filter((item) => item.relationshipToParent === relationship);
  }

  /**
   * Searches delegated clauses by text query.
   */
  searchDelegatedClauses(query: string): Array<{
    item: DelegatedLegislationItemV1;
    matchedClause: { ruleOrClauseNumber: string; heading: string; text: string };
  }> {
    const qLower = query.toLowerCase();
    const results: Array<{
      item: DelegatedLegislationItemV1;
      matchedClause: { ruleOrClauseNumber: string; heading: string; text: string };
    }> = [];

    for (const item of this.items.values()) {
      for (const clause of item.operativeClauses) {
        if (
          clause.heading.toLowerCase().includes(qLower) ||
          clause.text.toLowerCase().includes(qLower) ||
          clause.ruleOrClauseNumber.toLowerCase().includes(qLower)
        ) {
          results.push({ item, matchedClause: clause });
        }
      }
    }

    return results;
  }

  getDelegatedSummary(): {
    totalDelegatedInstruments: number;
    bySourceType: Record<DelegatedSourceType, number>;
  } {
    const bySourceType: Record<DelegatedSourceType, number> = {
      RULE: 0,
      REGULATION: 0,
      NOTIFICATION: 0,
      CIRCULAR: 0,
      STATUTORY_ORDER: 0,
    };
    for (const item of this.items.values()) {
      if (bySourceType[item.sourceType] !== undefined) {
        bySourceType[item.sourceType]++;
      }
    }
    return {
      totalDelegatedInstruments: this.items.size,
      bySourceType,
    };
  }

  getRegistrySummary(): {
    totalDelegatedInstruments: number;
    bySourceType: Record<DelegatedSourceType, number>;
  } {
    return this.getDelegatedSummary();
  }

  private seedDefaultDelegatedLegislation(): void {
    // 1. IT Intermediary Rules, 2021
    this.registerDelegatedItem({
      id: "del_it_rules_2021",
      sourceType: "RULE",
      title: "Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021",
      identifier: "G.S.R. 139(E)",
      issuingMinistryOrDepartment: "Ministry of Electronics and Information Technology (MeitY)",
      parentStatuteId: "stat_it_act_2000",
      parentStatuteName: "Information Technology Act, 2000",
      parentSectionRef: "Section 87(2)(z) and Section 79(2)",
      relationshipToParent: "IMPLEMENTS",
      effectiveFrom: "2021-02-25",
      isCurrentLaw: true,
      jurisdiction: "INDIA",
      gazetteDetails: {
        gazetteType: "EXTRAORDINARY",
        part: "Part II",
        section: "Section 3, Sub-section (i)",
        notificationNumber: "G.S.R. 139(E)",
        publicationDate: "2021-02-25",
      },
      summaryOfLegalEffect: "Prescribes mandatory due diligence for social media intermediaries, grievance officer mechanisms, 24-hr takedown for intimate imagery, and Grievance Appellate Committee (GAC) oversight.",
      operativeClauses: [
        {
          ruleOrClauseNumber: "Rule 3(1)(b)",
          heading: "Due diligence by an intermediary",
          text: "The intermediary shall inform its rules, privacy policy and user agreement and make reasonable efforts to cause the user of its computer resource not to host, display, upload, modify, publish, transmit, store, update or share any information that belongs to another person and to which the user does not have any right, or is impersonating another person.",
        },
        {
          ruleOrClauseNumber: "Rule 3(2)(b)",
          heading: "Grievance redressal mechanism of intermediary",
          text: "The intermediary shall, within 24 hours of receipt of a complaint, acknowledge receipt and resolve within fifteen days. For non-consensual sexual imagery or impersonation, it shall remove or disable access within 24 hours.",
        },
      ],
      provenance: {
        officialUrl: "https://www.meity.gov.in/writereaddata/files/Intermediary_Guidelines_and_Digital_Media_Ethics_Code_Rules-2021.pdf",
        sourceDepartment: "Ministry of Electronics and Information Technology",
        gazetteNumber: "G.S.R. 139(E)",
      },
    });

    // 2. BNSS Commencement Notification, 2024
    this.registerDelegatedItem({
      id: "del_bnss_commence_notif_2024",
      sourceType: "NOTIFICATION",
      title: "Notification bringing Bharatiya Nagarik Suraksha Sanhita, 2023 into force",
      identifier: "S.O. 850(E)",
      issuingMinistryOrDepartment: "Ministry of Home Affairs (MHA)",
      parentStatuteId: "stat_bnss_2023",
      parentStatuteName: "Bharatiya Nagarik Suraksha Sanhita, 2023",
      parentSectionRef: "Section 1(3)",
      relationshipToParent: "COMMENCES",
      effectiveFrom: "2024-07-01",
      isCurrentLaw: true,
      jurisdiction: "INDIA",
      summaryOfLegalEffect: "Notifies 1st day of July, 2024 as the date on which the provisions of the Bharatiya Nagarik Suraksha Sanhita, 2023 come into force across India.",
      operativeClauses: [
        {
          ruleOrClauseNumber: "Clause 1",
          heading: "Commencement Date",
          text: "In exercise of the powers conferred by sub-section (3) of section 1 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (46 of 2023), the Central Government appoints the 1st day of July, 2024 as the date on which the provisions of the said Sanhita shall come into force.",
        },
      ],
      provenance: {
        officialUrl: "https://egazette.gov.in/WriteReadData/2024/252273.pdf",
        sourceDepartment: "Ministry of Home Affairs",
        gazetteNumber: "S.O. 850(E)",
      },
    });

    // 3. Bombay High Court Circular on Mandatory Section 41A CrPC Compliance, 2021
    this.registerDelegatedItem({
      id: "del_bombay_hc_circ_41a_2021",
      sourceType: "CIRCULAR",
      title: "Bombay High Court Circular on Strict Compliance with Section 41A Notice & Arnesh Kumar Directives",
      identifier: "Circular No. P.0703/2021",
      issuingMinistryOrDepartment: "High Court of Judicature at Bombay",
      parentStatuteId: "stat_crpc_1973",
      parentStatuteName: "Code of Criminal Procedure, 1973 / BNSS 2023",
      parentSectionRef: "Section 41A CrPC / Section 35(3) BNSS",
      relationshipToParent: "CLARIFIES",
      effectiveFrom: "2021-04-15",
      isCurrentLaw: true,
      jurisdiction: "IN-MH",
      summaryOfLegalEffect: "Directs all subordinate judicial magistrates and police officers across Maharashtra to strictly maintain Section 41A compliance registers and checklist memos prior to any arrest authorization.",
      operativeClauses: [
        {
          ruleOrClauseNumber: "Directive 1",
          heading: "Mandatory Checklist Submission",
          text: "Magistrates across the State of Maharashtra shall not authorize mechanical police remand unless the police officer produces the Section 41(1)(b) checklist and reasons for non-issuance of Section 41A notice.",
        },
      ],
      provenance: {
        officialUrl: "https://bombayhighcourt.nic.in/notifications/cir41a.pdf",
        sourceDepartment: "High Court of Judicature at Bombay",
      },
    });

    // 4. IBBI (Insolvency Resolution Process for Corporate Persons) Regulations, 2016
    this.registerDelegatedItem({
      id: "del_ibbi_cirp_reg_2016",
      sourceType: "REGULATION",
      title: "Insolvency and Bankruptcy Board of India (Insolvency Resolution Process for Corporate Persons) Regulations, 2016",
      identifier: "IBBI/2016-17/GN/REG004",
      issuingMinistryOrDepartment: "Insolvency and Bankruptcy Board of India",
      parentStatuteId: "stat_ibc_2016",
      parentStatuteName: "Insolvency and Bankruptcy Code, 2016 (IBC)",
      parentSectionRef: "Section 240 read with Sections 7, 9, 12",
      relationshipToParent: "IMPLEMENTS",
      effectiveFrom: "2016-12-01",
      isCurrentLaw: true,
      jurisdiction: "INDIA",
      summaryOfLegalEffect: "Prescribes timeframes, Committee of Creditors (CoC) voting thresholds, Resolution Plan evaluation metrics, and claims admission protocols.",
      operativeClauses: [
        {
          ruleOrClauseNumber: "Regulation 38",
          heading: "Mandatory contents of the resolution plan",
          text: "A resolution plan shall identify specific sources of funds that will be used to pay the operational creditors priority over financial creditors.",
        },
      ],
      provenance: {
        officialUrl: "https://ibbi.gov.in/legal-framework/regulations",
        sourceDepartment: "Insolvency and Bankruptcy Board of India",
      },
    });

    // 5. RBI Master Circular on KYC Directions
    this.registerDelegatedItem({
      id: "del_rbi_kyc_circular_2016",
      sourceType: "CIRCULAR",
      title: "Reserve Bank of India (Know Your Customer (KYC)) Master Directions, 2016",
      identifier: "RBI/DBR/2015-16/18 Master Direction DBR.AML.BC.No.81/14.01.001/2015-16",
      issuingMinistryOrDepartment: "Reserve Bank of India",
      parentStatuteId: "stat_banking_reg_1949",
      parentStatuteName: "Banking Regulation Act, 1949",
      parentSectionRef: "Section 35A",
      relationshipToParent: "CLARIFIES",
      effectiveFrom: "2016-02-25",
      isCurrentLaw: true,
      jurisdiction: "INDIA",
      summaryOfLegalEffect: "Prescribes mandatory customer due diligence, beneficial ownership identification, and AML monitoring frameworks for all regulated banks.",
      operativeClauses: [
        {
          ruleOrClauseNumber: "Section 16",
          heading: "Customer Due Diligence (CDD) Procedure",
          text: "Regulated entities shall obtain officially valid documents (OVD) containing identity and address proof prior to opening bank accounts.",
        },
      ],
      provenance: {
        officialUrl: "https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=11566",
        sourceDepartment: "Reserve Bank of India",
      },
    });

    // 6. Consumer Protection (E-Commerce) Rules, 2020
    this.registerDelegatedItem({
      id: "del_cpa_ecomm_rules_2020",
      sourceType: "RULE",
      title: "Consumer Protection (E-Commerce) Rules, 2020",
      identifier: "G.S.R. 462(E)",
      issuingMinistryOrDepartment: "Ministry of Consumer Affairs",
      parentStatuteId: "stat_cpa_2019",
      parentStatuteName: "Consumer Protection Act, 2019",
      parentSectionRef: "Section 101(2)(zg)",
      relationshipToParent: "IMPLEMENTS",
      effectiveFrom: "2020-07-23",
      isCurrentLaw: true,
      jurisdiction: "INDIA",
      summaryOfLegalEffect: "Regulates unfair trade practices on marketplace e-commerce entities, price manipulation, and mandatory refund timelines.",
      operativeClauses: [
        {
          ruleOrClauseNumber: "Rule 5",
          heading: "Liabilities of marketplace e-commerce entities",
          text: "Every marketplace e-commerce entity shall provide in a clear and accessible manner on its platform details about ticket numbers for complaints.",
        },
      ],
      provenance: {
        officialUrl: "https://consumeraffairs.nic.in/e-commerce-rules-2020",
        sourceDepartment: "Ministry of Consumer Affairs",
      },
    });

    // 7. SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015
    this.registerDelegatedItem({
      id: "del_sebi_lodr_2015",
      sourceType: "REGULATION",
      title: "Securities and Exchange Board of India (Listing Obligations and Disclosure Requirements) Regulations, 2015",
      identifier: "SEBI/LAD-NRO/GN/2015-16/013",
      issuingMinistryOrDepartment: "Securities and Exchange Board of India",
      parentStatuteId: "stat_sebi_1992",
      parentStatuteName: "Securities and Exchange Board of India Act, 1992",
      parentSectionRef: "Section 30 read with Section 11",
      relationshipToParent: "IMPLEMENTS",
      effectiveFrom: "2015-12-01",
      isCurrentLaw: true,
      jurisdiction: "INDIA",
      summaryOfLegalEffect: "Prescribes continuous disclosure, corporate governance, independent director composition, and material event disclosures.",
      operativeClauses: [
        {
          ruleOrClauseNumber: "Regulation 30",
          heading: "Disclosure of events or information",
          text: "Every listed entity shall make disclosures of any events or information which, in the opinion of the board of directors of the listed company, is material.",
        },
      ],
      provenance: {
        officialUrl: "https://www.sebi.gov.in/legal/regulations/lodr.html",
        sourceDepartment: "Securities and Exchange Board of India",
      },
    });

    // 8. CGST Rate Notification, 2017
    this.registerDelegatedItem({
      id: "del_cgst_rate_notif_2017",
      sourceType: "NOTIFICATION",
      title: "Notification prescribing Central Tax Rates on Goods",
      identifier: "Notification No. 1/2017-Central Tax (Rate)",
      issuingMinistryOrDepartment: "Ministry of Finance (Department of Revenue)",
      parentStatuteId: "stat_cgst_2017",
      parentStatuteName: "Central Goods and Services Tax Act, 2017",
      parentSectionRef: "Section 9(1)",
      relationshipToParent: "IMPLEMENTS",
      effectiveFrom: "2017-07-01",
      isCurrentLaw: true,
      jurisdiction: "INDIA",
      summaryOfLegalEffect: "Notifies the rate schedules (5%, 12%, 18%, 28%) for the levy of CGST on intra-State supply of goods.",
      operativeClauses: [
        {
          ruleOrClauseNumber: "Schedule III",
          heading: "18% Rate Category",
          text: "Central tax at the rate of 9% shall be levied on all goods specified in Schedule III of this notification.",
        },
      ],
      provenance: {
        officialUrl: "https://cbic-gst.gov.in/central-tax-notifications.html",
        sourceDepartment: "Central Board of Indirect Taxes and Customs",
      },
    });

    // 9. Protection of Children from Sexual Offences Rules, 2020
    this.registerDelegatedItem({
      id: "del_pocso_rules_2020",
      sourceType: "RULE",
      title: "Protection of Children from Sexual Offences Rules, 2020",
      identifier: "G.S.R. 165(E)",
      issuingMinistryOrDepartment: "Ministry of Women and Child Development",
      parentStatuteId: "stat_pocso_2012",
      parentStatuteName: "Protection of Children from Sexual Offences Act, 2012",
      parentSectionRef: "Section 45",
      relationshipToParent: "IMPLEMENTS",
      effectiveFrom: "2020-03-09",
      isCurrentLaw: true,
      jurisdiction: "INDIA",
      summaryOfLegalEffect: "Prescribes child-friendly procedures, child welfare committee reporting, support persons, and compensation payment procedures.",
      operativeClauses: [
        {
          ruleOrClauseNumber: "Rule 4",
          heading: "Support Persons",
          text: "The Child Welfare Committee shall provide a support person through DCPU or an NGO to assist the child through investigation and trial.",
        },
      ],
      provenance: {
        officialUrl: "https://wcd.nic.in/pocso-rules-2020",
        sourceDepartment: "Ministry of Women and Child Development",
      },
    });

    // 10. National Green Tribunal (Practices and Procedure) Rules, 2011
    this.registerDelegatedItem({
      id: "del_ngt_procedure_rules_2011",
      sourceType: "RULE",
      title: "National Green Tribunal (Practices and Procedure) Rules, 2011",
      identifier: "G.S.R. 296(E)",
      issuingMinistryOrDepartment: "Ministry of Environment and Forests",
      parentStatuteId: "stat_ngt_2010",
      parentStatuteName: "National Green Tribunal Act, 2010",
      parentSectionRef: "Section 35",
      relationshipToParent: "IMPLEMENTS",
      effectiveFrom: "2011-04-04",
      isCurrentLaw: true,
      jurisdiction: "INDIA",
      summaryOfLegalEffect: "Prescribes procedure for filing original applications, appeals, expert evidence, and joint inspection committees.",
      operativeClauses: [
        {
          ruleOrClauseNumber: "Rule 14",
          heading: "Procedure on filing of application",
          text: "Every application or appeal filed before the Tribunal shall be in the prescribed Form and accompanied by the requisite documents.",
        },
      ],
      provenance: {
        officialUrl: "https://greentribunal.gov.in/rules",
        sourceDepartment: "Ministry of Environment, Forest and Climate Change",
      },
    });

    // 11. Foreign Trade Policy Statutory Order (Vehicle Homologation)
    this.registerDelegatedItem({
      id: "del_dgft_homologation_order_2023",
      sourceType: "STATUTORY_ORDER",
      title: "Statutory Order on Vehicle Import Homologation & Type Approval Exemption",
      identifier: "Notification No. 24/2023-DGFT",
      issuingMinistryOrDepartment: "Directorate General of Foreign Trade",
      parentStatuteId: "stat_ftdr_1992",
      parentStatuteName: "Foreign Trade (Development and Regulation) Act, 1992",
      parentSectionRef: "Section 3 read with Section 5",
      relationshipToParent: "EXEMPTS",
      effectiveFrom: "2023-08-01",
      isCurrentLaw: true,
      jurisdiction: "INDIA",
      summaryOfLegalEffect: "Specifies homologation requirements and exemptions for importing completely built units (CBUs) under Indian emission and safety standards.",
      operativeClauses: [
        {
          ruleOrClauseNumber: "Policy Condition 2",
          heading: "Homologation Compliance",
          text: "Imported vehicles must comply with Central Motor Vehicle Rules (CMVR) or submit EEC/ECE/EU type approval certificate issued by accredited testing agency.",
        },
      ],
      provenance: {
        officialUrl: "https://dgft.gov.in/vehicle-import-policy",
        sourceDepartment: "Directorate General of Foreign Trade",
      },
    });
  }
}
