/**
 * CRUVELS AI — Layer 03 Retrieval & Evidence Envelope Version 1 (RetrievalContractV1)
 *
 * Contract Version: 1.0.0 (IMMUTABLE)
 *
 * Defines the retrieval policy decisions, multi-dimensional confidence model,
 * query-evidence alignment validation, and evidence envelope contract.
 */

import type {
  AccessContext,
  EvidenceCitation,
  LegalChunk,
  ScoredRetrievalItem,
} from "../knowledge-intelligence.types";

export type RetrievalModeV1 =
  | "NONE"
  | "STRUCTURAL"
  | "SPARSE"
  | "DENSE"
  | "HYBRID"
  | "EXTERNAL"
  | "MULTI_SOURCE";

export type VersionPolicyV1 =
  | "CURRENT_VERSION"
  | "SPECIFIC_VERSION"
  | "VERSION_AT_DATE"
  | "ALL_VERSIONS"
  | "COMPARE_VERSIONS";

export type DocumentRelationshipTypeV1 =
  | "AMENDS"
  | "SUPERSEDES"
  | "REFERENCES"
  | "ATTACHED_TO"
  | "DERIVED_FROM"
  | "IMPLEMENTS"
  | "CONTRADICTS";

export type EvidenceClassificationV1 =
  | "PRIMARY"
  | "CONTEXTUAL"
  | "INCIDENTAL"
  | "EXCLUDED";

export type RetrievalResultStateV1 =
  | "EXACT_MATCH"
  | "HIGH_CONFIDENCE"
  | "PARTIAL_MATCH"
  | "WEAK_MATCH"
  | "NO_MATCH"
  | "CONFLICTING_EVIDENCE"
  | "UNAUTHORIZED"
  | "AMBIGUOUS_SCOPE"
  | "STALE_SOURCE"
  | "INGESTION_UNAVAILABLE"
  | "RETRIEVAL_SKIPPED";

export interface RetrievalScopeV1 {
  tenantId: string;
  firmId?: string;
  workspaceId?: string;
  userId: string;
  matterId?: string;
  caseId?: string;
  documentIds?: string[];
  documentVersionIds?: string[];
  jurisdiction?: string;
  accessLevel?: string;
  isSuperAdmin?: boolean;
}

export interface EvidenceBudgetV1 {
  primaryEvidenceLimit: number;
  contextEvidenceLimit: number;
  maxEvidenceTokens: number;
}

export interface RetrievalDecisionV1 {
  required: boolean;
  mode: RetrievalModeV1;
  sourceTypes: string[];
  scope: RetrievalScopeV1;
  targets: string[];
  filters: Record<string, unknown>[];
  maxResults: number;
  evidenceBudget: EvidenceBudgetV1;
  versionPolicy: VersionPolicyV1;
  targetDate?: string;
  reason: string;
  skippedReason?: string;
  knowledgeRequirement?: string;
  contextBinding?: string;
  evidenceRequirement?: string;
  groundingRequirement?: string;
  authorityLevel?: string;
  isCurrentnessRequired?: boolean;
  isEvidenceMandatory?: boolean;
}

export interface MultiDimensionalConfidenceV1 {
  retrievalConfidence: number;
  evidenceConfidence: number;
  queryEvidenceAlignment: number;
  scopeConfidence: number;
  versionConfidence: number;
  overallConfidence: number;
  passesHardGates: boolean;
  rejectionReasons?: string[];
}

export interface ClassifiedEvidenceItemV1 {
  item: ScoredRetrievalItem;
  classification: EvidenceClassificationV1;
  isSupportedByEvidence: boolean;
  isRelevantToQuery: boolean;
  isAuthorized: boolean;
  isCurrentEnough: boolean;
  isCorrectScope: boolean;
  alignmentScore: number;
  rejectionReason?: string;
}

export interface EvidenceEnvelopeContractV1 {
  readonly envelopeId: string;
  readonly contractVersion: "1.0.0";
  readonly retrievalId: string;

  readonly query: string;
  readonly scope: RetrievalScopeV1;
  readonly decision: RetrievalDecisionV1;
  readonly resultState: RetrievalResultStateV1;

  readonly confidence: MultiDimensionalConfidenceV1;
  readonly items: ScoredRetrievalItem[];
  readonly primaryEvidence: ClassifiedEvidenceItemV1[];
  readonly contextualEvidence: ClassifiedEvidenceItemV1[];
  readonly citations: EvidenceCitation[];

  readonly budget: {
    allocatedTokens: number;
    usedTokens: number;
    truncated: boolean;
  };

  readonly alignment: {
    isAligned: boolean;
    validEvidenceCount: number;
    rejectedEvidenceCount: number;
    rejectionReasons: string[];
  };

  readonly contextText: string;
  readonly sanitized: boolean;
  readonly assembledAt: string;
}

export interface LegalRetrievalRequestV1 {
  schemaVersion: "1.0.0";
  retrievalId: string;
  query: string;
  legalDomain?: string;
  jurisdiction?: string;
  requestedDate?: string;
  intent?: string;
  taskType?: string;
  evidenceRequirement?: string;
  scope: RetrievalScopeV1;
  filter?: Record<string, unknown>;
  topK?: number;
  maxTokens?: number;
  enableReranking?: boolean;
  denseWeight?: number;
  sparseWeight?: number;
}

export interface LegalEvidenceResultV1 {
  schemaVersion: "1.0.0";
  retrievalId: string;
  query: string;
  evidenceState:
    | "EXACT_MATCH"
    | "HIGH_CONFIDENCE"
    | "PARTIAL_MATCH"
    | "WEAK_MATCH"
    | "NO_RELEVANT_EVIDENCE"
    | "INSUFFICIENT_EVIDENCE"
    | "JURISDICTION_REQUIRED"
    | "UNAUTHORIZED";
  admittedEvidence: ClassifiedEvidenceItemV1[];
  rejectedCandidates: Array<{
    item: ScoredRetrievalItem;
    rejectionReason: string;
    admissionStatus: string;
    domainMismatch?: boolean;
    temporalMismatch?: boolean;
    authorityMismatch?: boolean;
    scopeMismatch?: boolean;
  }>;
  confidence: MultiDimensionalConfidenceV1;
  overallAdequacyScore: number;
  rationale: string;
  citations: EvidenceCitation[];
  contextText: string;
  latencyMs: number;
  assembledAt: string;
}

/**
 * Validates an EvidenceEnvelopeContractV1
 */
export function validateEvidenceEnvelopeContractV1(envelope: unknown): envelope is EvidenceEnvelopeContractV1 {
  if (!envelope || typeof envelope !== "object") return false;
  const e = envelope as Record<string, any>;
  if (e.contractVersion !== "1.0.0") return false;
  if (typeof e.envelopeId !== "string" || !e.envelopeId) return false;
  if (typeof e.retrievalId !== "string" || !e.retrievalId) return false;
  if (typeof e.resultState !== "string") return false;
  if (!e.confidence || typeof e.confidence.overallConfidence !== "number") return false;
  if (!Array.isArray(e.items)) return false;
  return true;
}

export function validateLegalEvidenceResultV1(result: unknown): result is LegalEvidenceResultV1 {
  if (!result || typeof result !== "object") return false;
  const r = result as Record<string, any>;
  if (r.schemaVersion !== "1.0.0") return false;
  if (typeof r.retrievalId !== "string" || !r.retrievalId) return false;
  if (typeof r.query !== "string") return false;
  if (typeof r.evidenceState !== "string") return false;
  if (!Array.isArray(r.admittedEvidence)) return false;
  if (!Array.isArray(r.rejectedCandidates)) return false;
  return true;
}

