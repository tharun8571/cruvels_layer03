/**
 * Cruvels Enterprise Legal AI Platform
 * System Contract V2: Grounding & Evidence Verification Decision
 */

export const GROUNDING_DECISION_CONTRACT_VERSION = "2.0.0" as const;

export type GroundingStatus =
  | "GROUNDED_SUFFICIENT"
  | "NO_GROUNDED_EVIDENCE"
  | "INSUFFICIENT_EVIDENCE"
  | "EVIDENCE_CONTRADICTED"
  | "UNGROUNDED_CLAIM_DETECTED";

export type GroundingPolicyAction =
  | "ALLOW"
  | "ATTACH_CAUTION_BANNER"
  | "REVISE_ANSWER"
  | "EMIT_NO_EVIDENCE_FALLBACK"
  | "BLOCK_EXECUTION";

export interface GroundingClaimVerification {
  claimIndex: number;
  statement: string;
  isSupported: boolean;
  citationMarkers: string[];
  matchedEvidenceIds: string[];
  confidence: number;
  unsupportedReason?: string;
}

export interface GroundingDecisionContractV2 {
  contractVersion: typeof GROUNDING_DECISION_CONTRACT_VERSION;
  decisionId: string;
  requestId: string;
  status: GroundingStatus;
  supportRatio: number;
  supportedClaimCount: number;
  unsupportedClaimCount: number;
  hallucinatedCitationCount: number;
  claims: GroundingClaimVerification[];
  policyAction: GroundingPolicyAction;
  explanation: string;
  evaluatedAt: string;
}
