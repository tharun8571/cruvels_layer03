/**
 * CRUVELS AI — Layer 03 Practical Legal Knowledge Contract (V1)
 *
 * Contract Version: 1.0.0
 *
 * Defines structured practical legal knowledge primitives:
 * Remedies, Procedural Steps, Forums, Limitations, and Statutory Notice Requirements.
 */

import type { LegalAuthorityLevel, LegalDomain, LegalJurisdictionCode } from "./legal-source.contract";

export type ReliefKind =
  | "INJUNCTION"
  | "DAMAGES"
  | "COMPENSATION"
  | "RESTITUTION"
  | "WRIT_HABEAS_CORPUS"
  | "WRIT_MANDAMUS"
  | "WRIT_CERTIORARI"
  | "WRIT_PROHIBITION"
  | "WRIT_QUO_WARRANTO"
  | "SPECIFIC_PERFORMANCE"
  | "BAIL"
  | "ANTICIPATORY_BAIL"
  | "POSSESSION"
  | "INTERIM_MEASURE"
  | "SETTING_ASIDE_AWARD"
  | "MAINTENANCE"
  | "PARTITION"
  | "QUASHING_FIR"
  | "DECLARATION"
  | "PENAL"
  | "PROSECUTION"
  | "OTHER";

export type ForumTier =
  | "SUPREME_COURT"
  | "HIGH_COURT"
  | "DISTRICT_COURT"
  | "MAGISTRATE_COURT"
  | "COMMERCIAL_COURT"
  | "TRIBUNAL"
  | "REGULATORY_AUTHORITY"
  | "ARBITRAL_TRIBUNAL"
  | "POLICE_STATION"
  | "OTHER";

export interface LegalRemedyV1 {
  remedyId: string;
  name: string;
  reliefKind: ReliefKind;
  statutoryBasis: string; // e.g. "Section 18, Real Estate (Regulation and Development) Act, 2016"
  constitutionalBasis?: string; // e.g. "Article 32 / 226, Constitution of India"
  legalDomain: LegalDomain;
  forumId: string;
  forumName: string;
  description: string;
  preconditions: string[];
  interimReliefAvailable: boolean;
  provenance: string;
}

export interface ProceduralStepV1 {
  stepId: string;
  order: number;
  name: string;
  actionRequired: string;
  mandatoryCondition: boolean;
  statutoryReference?: string;
  noticeRequired?: string;
  limitation?: string;
  forumId?: string;
  documentationRequired: string[];
  appealRevisionPath?: string;
  legalDomain: LegalDomain;
  provenance: string;
}

export interface LegalForumV1 {
  forumId: string;
  name: string;
  tier: ForumTier;
  state?: string;
  jurisdiction: LegalJurisdictionCode;
  pecuniaryJurisdiction?: string;
  territorialJurisdiction: string;
  subjectJurisdiction: LegalDomain[];
  statutoryBasis: string;
  appellateForumId?: string;
  provenance: string;
}

export interface LimitationPeriodV1 {
  limitationId: string;
  subjectAction: string;
  duration: string; // e.g. "3 years", "30 days", "2 years"
  startingPoint: string; // e.g. "From the date of breach", "From date of receipt of notice"
  statute: string; // e.g. "Limitation Act, 1963", "Arbitration and Conciliation Act, 1996"
  section: string; // e.g. "Article 55 Schedule", "Section 34(3)"
  isExtendable: boolean;
  condonationProvision?: string; // e.g. "Section 5 Limitation Act / Section 34(3) proviso (max 30 days)"
  legalDomain: LegalDomain;
  provenance: string;
}

export interface StatutoryNoticeRequirementV1 {
  noticeId: string;
  name: string;
  statute: string;
  section: string;
  noticePeriodDays: number;
  isMandatoryPrecondition: boolean;
  recipient: string;
  serviceMode: string;
  contentRequirements: string[];
  consequenceOfNonService: string;
  legalDomain: LegalDomain;
  provenance: string;
}

export interface PracticalLegalGuidanceV1 {
  domain: LegalDomain;
  problemSummary: string;
  applicableConstitutionalProvisions: string[];
  applicableStatutes: string[];
  governingPrecedents: string[];
  remedies: LegalRemedyV1[];
  proceduralSteps: ProceduralStepV1[];
  appropriateForums: LegalForumV1[];
  limitationPeriods: LimitationPeriodV1[];
  noticeRequirements: StatutoryNoticeRequirementV1[];
  requiredDocumentTypes: string[];
  appealOrRevisionRemedies: string[];
  provenance: string[];
}
