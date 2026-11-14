/**
 * CRUVELS AI — Layer 03 Constitution of India Contract (V1)
 *
 * Contract Version: 1.0.0
 *
 * Defines the canonical structural hierarchy, provisions, clauses, provisos,
 * and amendment lifecycle for the Constitution of India as the supreme primary legal source.
 */

import type { LegalAuthorityLevel, LegalDomain, LegalJurisdictionCode } from "./legal-source.contract";

export interface ConstitutionalClauseV1 {
  clauseNumber: string; // e.g. "(1)", "(2)", "(1)(a)"
  text: string;
  subclauses?: Array<{
    subclauseIdentifier: string; // e.g. "(a)", "(b)", "(g)"
    text: string;
  }>;
}

export interface ConstitutionalProvisoV1 {
  provisoIndex: number;
  text: string;
  appliesToClause?: string;
}

export interface ConstitutionalExplanationV1 {
  explanationNumber?: number;
  text: string;
  appliesToClause?: string;
}

export interface ConstitutionalAmendmentV1 {
  amendmentAct: string; // e.g. "Constitution (Forty-fourth Amendment) Act, 1978"
  amendmentNumber?: string; // e.g. "86th Amendment Act, 2002"
  year: number;
  effectiveDate?: string;
  description: string;
}

export interface ConstitutionalArticleV1 {
  schemaVersion: "1.0.0";
  articleId: string;
  articleNumber: string; // e.g. "14", "19", "20", "21", "21A", "22", "32", "136", "141", "142", "226", "300A", "311"
  part: string; // e.g. "Part III"
  partTitle: string; // e.g. "Fundamental Rights"
  chapter?: string; // e.g. "Chapter IV"
  chapterTitle?: string; // e.g. "The Union Judiciary"
  heading: string; // e.g. "Protection of life and personal liberty"
  text: string;
  clauses?: ConstitutionalClauseV1[];
  provisos?: ConstitutionalProvisoV1[];
  explanations?: ConstitutionalExplanationV1[];
  schedules?: string[];
  constitutionalSubject: string; // e.g. "Right to Life, Personal Liberty, Due Process"
  amendments?: ConstitutionalAmendmentV1[];
  effectiveFrom: string;
  effectiveUntil?: string;
  jurisdiction: LegalJurisdictionCode; // "INDIAN"
  authorityLevel: LegalAuthorityLevel; // "CONSTITUTIONAL"
  legalDomain: LegalDomain; // "CONSTITUTIONAL"
  sourceUrl: string;
  provenance: string; // "Legislative Department, Ministry of Law and Justice, Government of India"
  checksum: string;
}

export interface ConstitutionalHierarchyNodeV1 {
  nodeId: string;
  part: string;
  partTitle: string;
  chapter?: string;
  chapterTitle?: string;
  articleNumber: string;
  clauseIdentifier?: string;
  heading: string;
  fullBreadcrumb: string; // "Constitution of India > Part III: Fundamental Rights > Article 21"
  text: string;
  provenance: string;
}
