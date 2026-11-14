/**
 * CRUVELS AI — Layer 03 Authoritative Case Law & Precedent Contract (V1)
 *
 * Contract Version: 1.0.0
 *
 * Defines first-class models for Supreme Court and High Court judgments,
 * structural paragraph chunks, judicial hierarchy, precedent status,
 * and subsequent judicial treatment.
 */

import type { LegalDomain, LegalJurisdictionCode } from "./legal-source.contract";

export type CourtLevel =
  | "SUPREME_COURT"
  | "HIGH_COURT"
  | "TRIBUNAL"
  | "OTHER";

export type PrecedentStatus =
  | "GOOD_LAW"
  | "OVERRULED"
  | "PARTIALLY_OVERRULED"
  | "DISTINGUISHED"
  | "AFFIRMED"
  | "REVERSED"
  | "FOLLOWED"
  | "LIMITED"
  | "UNCERTAIN";

export type RatioDecidendiType = "DERIVED" | "CANONICAL";

export type JudgmentStructuralSection =
  | "FACTS"
  | "SUBMISSIONS"
  | "ISSUES"
  | "FINDINGS"
  | "REASONING"
  | "RATIO"
  | "DIRECTIONS"
  | "FINAL_ORDER"
  | "GENERAL";

export interface SubsequentTreatmentV1 {
  citingCaseName: string;
  citingCitation: string;
  treatment: PrecedentStatus;
  treatmentYear: number;
  court: CourtLevel;
  description: string;
}

export interface CaseLawSourceV1 {
  schemaVersion: "1.0.0";
  caseId: string;
  caseName: string;
  petitioner?: string;
  respondent?: string;
  court: CourtLevel;
  courtName: string; // e.g. "Supreme Court of India", "High Court of Judicature at Bombay"
  state?: string; // Applicable for High Courts e.g. "Maharashtra", "Delhi"
  judgmentDate: string;
  citation: string;
  neutralCitation?: string;
  bench?: string; // e.g. "Division Bench (2 Judges)", "Constitution Bench (5 Judges)"
  benchStrength?: number; // e.g. 2, 3, 5, 7, 9, 13
  judges?: string[];
  appealNumber?: string;
  legalDomain: LegalDomain;
  jurisdiction: LegalJurisdictionCode;
  statutesConsidered?: string[];
  constitutionalProvisionsConsidered?: string[];
  sectionsConsidered?: string[];
  legalIssues: string[];
  holdings: string[];
  ratioDecidendi?: string;
  ratioType?: RatioDecidendiType;
  directions?: string[];
  finalDisposition: string;
  precedentStatus: PrecedentStatus;
  subsequentTreatment?: SubsequentTreatmentV1[];
  overruledBy?: {
    caseName: string;
    citation: string;
    year: number;
    benchStrength?: number;
    paragraph?: number;
  };
  sourceUrl?: string;
  provenance: string;
  temporalValidity: {
    effectiveFrom: string;
    effectiveUntil?: string;
    isValidCurrentLaw: boolean;
  };
  checksum: string;
  ingestionTimestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CaseJudgmentChunkV1 {
  chunkId: string;
  caseId: string;
  caseName: string;
  citation: string;
  court: CourtLevel;
  state?: string;
  paragraphNumber?: number;
  heading?: string;
  structuralSection: JudgmentStructuralSection;
  content: string;
  rawText: string;
  proposition?: string;
  isRatio: boolean;
  isDirection: boolean;
  isHolding: boolean;
  statutesMentioned?: string[];
  articlesMentioned?: string[];
  precedentsMentioned?: string[];
  legalDomain: LegalDomain;
  jurisdiction: LegalJurisdictionCode;
  precedentStatus: PrecedentStatus;
  provenance: string; // e.g. "[D.K. Basu v. State of West Bengal, (1997) 1 SCC 416, at Para 35]"
  contentHash: string;
  tokenCount: number;
}

export function isSupremeCourtPrecedent(caseSource: CaseLawSourceV1 | CaseJudgmentChunkV1): boolean {
  return caseSource.court === "SUPREME_COURT";
}

export function isGoodLaw(status: PrecedentStatus): boolean {
  return status === "GOOD_LAW" || status === "AFFIRMED" || status === "FOLLOWED";
}

export function isOverruledLaw(status: PrecedentStatus): boolean {
  return status === "OVERRULED" || status === "REVERSED";
}
