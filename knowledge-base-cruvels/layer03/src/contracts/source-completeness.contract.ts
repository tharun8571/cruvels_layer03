/**
 * CRUVELS AI — Layer 03 Source Completeness & Knowledge Gap Contract
 *
 * Contract Version: 1.0.0
 *
 * Defines measurable corpus coverage metrics, automated completeness reporting,
 * and structured diagnostic reporting for knowledge gaps.
 */

import type { LegalDomain, LegalJurisdictionCode } from "./legal-source.contract";

export interface CorpusCompletenessMetricV1 {
  corpusCategory: string; // e.g. "CONSTITUTION_OF_INDIA", "CENTRAL_PRIMARY_LEGISLATION", "STATE_STATUTES", "SUPREME_COURT_CASE_LAW", "DELEGATED_LEGISLATION"
  domain?: LegalDomain;
  jurisdiction: LegalJurisdictionCode;
  expectedUnits: number; // Expected benchmark count
  ingestedUnits: number;
  structuredUnits: number;
  verifiedUnits: number;
  currentUnits: number;
  retrievableUnits: number;
  admissibleUnits: number;
  coveragePercentage: number; // 0.00% to 100.00%
  completenessStatus: "COMPLETE" | "PARTIAL" | "INSUFFICIENT" | "STALE";
  lastVerifiedAt: string;
}

export interface KnowledgeGapReportV1 {
  query: string;
  identifiedDomain?: LegalDomain;
  targetJurisdiction?: LegalJurisdictionCode;
  queryAsOfDate?: string;
  abstentionReason: "NO_RELEVANT_EVIDENCE" | "INSUFFICIENT_EVIDENCE" | "CLARIFICATION_REQUIRED";
  gapDiagnostics: {
    missingAuthorityType?: string[]; // e.g. ["CONSTITUTIONAL", "CENTRAL_STATUTE", "STATE_RULE"]
    missingJurisdiction?: string; // e.g. "IN-KA"
    missingTemporalVersion?: string; // e.g. "PRE_2024_REPEAL"
    missingProceduralSource?: boolean;
    missingCaseLawPrecedent?: boolean;
    missingStateStatute?: boolean;
    missingDelegatedRule?: boolean;
    unresolvedAmbiguity?: string;
  };
  recommendedCorpusExpansion?: string;
  timestamp: string;
}
