/**
 * Cruvels Enterprise Legal AI Platform
 * System Contract V2: Evidence Envelope & Multi-Document Evidence Mapping
 */

import type { GroundingDecisionContractV2 } from "./grounding-decision.contract.v2";
import type { AuthorityTier, KnowledgeSourceType } from "./knowledge-scope.contract.v2";
import type { LegalStructuralFilter, RetrievalMethodType } from "./knowledge-retrieval.contract.v2";

export const EVIDENCE_ENVELOPE_CONTRACT_VERSION = "2.0.0" as const;

export type EvidenceEnvelopeStatus =
  | "GROUNDED_EVIDENCE_FOUND"
  | "NO_GROUNDED_EVIDENCE"
  | "INSUFFICIENT_EVIDENCE"
  | "SCOPE_RESTRICTED";

export interface LegalStructuralNode {
  article?: string;
  chapter?: string;
  part?: string;
  section?: string;
  subsection?: string;
  clause?: string;
  subclause?: string;
  schedule?: string;
  annexure?: string;
  exhibit?: string;
  appendix?: string;
  page?: number;
  paragraph?: number;
}

export interface EvidenceItemContractV2 {
  evidenceId: string;
  sourceId: string;
  sourceType: KnowledgeSourceType;
  documentId?: string;
  documentTitle?: string;
  versionId?: string;
  nodeId?: string;
  structure: LegalStructuralNode;
  exactText: string;
  tokenCount: number;
  retrievalMethod: RetrievalMethodType;
  retrievalScore: number;
  rerankScore: number;
  authority: AuthorityTier;
  jurisdiction?: string;
  effectiveDate?: string;
  sourceHash: string;
  accessScope: {
    tenantId: string;
    matterId?: string;
    isPublic: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface CrossDocumentRelationship {
  sourceDocumentId: string;
  targetDocumentId: string;
  relationshipType: "AMENDMENT" | "REPLACES" | "SUPERSEDES" | "REFERENCES" | "EXHIBIT_TO" | "SCHEDULE_TO" | "INCORPORATES_BY_REFERENCE" | "CONTRADICTS";
  confidence: number;
  summary: string;
}

export interface DocumentSetContractV2 {
  setId: string;
  documents: {
    documentId: string;
    title: string;
    kind?: string;
    version?: string;
    chunkCount: number;
  }[];
  relationships: CrossDocumentRelationship[];
  comparisonMatrix?: {
    clauseTopic: string;
    alignments: { documentId: string; clauseSummary: string; exactCitationId?: string }[];
  }[];
}

export interface EvidenceEnvelopeContractV2 {
  contractVersion: typeof EVIDENCE_ENVELOPE_CONTRACT_VERSION;
  envelopeId: string;
  requestId: string;
  status: EvidenceEnvelopeStatus;
  items: EvidenceItemContractV2[];
  documentSet?: DocumentSetContractV2;
  totalTokenCount: number;
  groundingDecision: GroundingDecisionContractV2;
  formattedContext: string;
  provenance: {
    retrievedAt: string;
    retrievalDurationMs: number;
    isolationVerified: boolean;
    pipelineStage: string;
    retrieverUsed: string;
    scopeHash: string;
  };
}
