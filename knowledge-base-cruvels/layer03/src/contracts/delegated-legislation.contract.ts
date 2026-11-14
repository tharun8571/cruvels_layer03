/**
 * CRUVELS AI — Layer 03 Delegated Legislation Contract
 *
 * Contract Version: 1.0.0
 *
 * Models subordinate legislation (Rules, Regulations, Notifications, Circulars, Statutory Orders)
 * and their explicit legal relationships to parent Acts and Sections.
 */

import type { LegalJurisdictionCode } from "./legal-source.contract";

export type DelegatedSourceType =
  | "RULE"
  | "REGULATION"
  | "NOTIFICATION"
  | "CIRCULAR"
  | "STATUTORY_ORDER";

export type DelegatedRelationshipType =
  | "IMPLEMENTS"
  | "MADE_UNDER"
  | "AMENDS"
  | "SUPERSEDES"
  | "CLARIFIES"
  | "COMMENCES"
  | "EXEMPTS";

export interface DelegatedLegislationItemV1 {
  id: string;
  sourceType: DelegatedSourceType;
  title: string;
  identifier: string; // e.g. "G.S.R. 321(E)", "Circular No. 12/2023", "F. No. 1/1/2021"
  issuingMinistryOrDepartment: string; // e.g. "Ministry of Electronics and Information Technology", "Ministry of Finance (CBIC)", "Reserve Bank of India"
  issuingAuthority?: string; // e.g. "Reserve Bank of India"
  parentStatuteId: string; // e.g. "stat_it_act_2000"
  parentStatuteName: string; // e.g. "Information Technology Act, 2000"
  parentSectionRef?: string; // e.g. "Section 87(2)(z) & (zg)"
  relationshipToParent: DelegatedRelationshipType;
  effectiveFrom: string;
  effectiveTo?: string;
  isCurrentLaw: boolean;
  jurisdiction: LegalJurisdictionCode;
  gazetteDetails?: {
    gazetteType: "EXTRAORDINARY" | "ORDINARY";
    part: string;
    section: string;
    notificationNumber: string;
    publicationDate: string;
  };
  summaryOfLegalEffect: string;
  operativeClauses: Array<{
    ruleOrClauseNumber: string;
    heading: string;
    text: string;
    crossReferences?: string[];
  }>;
  provenance: {
    officialUrl: string;
    sourceDepartment: string;
    gazetteNumber?: string;
  };
}
