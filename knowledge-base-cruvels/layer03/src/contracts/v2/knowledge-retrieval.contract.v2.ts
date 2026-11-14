/**
 * Cruvels Enterprise Legal AI Platform
 * System Contract V2: Knowledge Retrieval Request
 */

import type { KnowledgeScopeContractV2 } from "./knowledge-scope.contract.v2";

export const KNOWLEDGE_RETRIEVAL_CONTRACT_VERSION = "2.0.0" as const;

export type RetrievalMethodType =
  | "EXACT_SECTION"
  | "SUBSECTION"
  | "CLAUSE"
  | "PARAGRAPH"
  | "PAGE"
  | "DOCUMENT"
  | "MATTER"
  | "SEMANTIC"
  | "LEXICAL"
  | "HYBRID"
  | "MULTI_DOCUMENT"
  | "VERSION_AWARE"
  | "TEMPORAL"
  | "JURISDICTION_AWARE"
  | "AUTHORITY_AWARE";

export interface LegalStructuralFilter {
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
  paragraph?: number;
  page?: number;
}

export interface RetrievalTokenBudget {
  maxContextTokens: number;
  maxChunkTokens: number;
  maxCandidatePool: number;
}

export interface KnowledgeRetrievalRequestContractV2 {
  contractVersion: typeof KNOWLEDGE_RETRIEVAL_CONTRACT_VERSION;
  requestId: string;
  query: string;
  expandedQueries: string[];
  scope: KnowledgeScopeContractV2;
  retrievalTypes: RetrievalMethodType[];
  structuralFilter?: LegalStructuralFilter;
  topK: number;
  candidatePoolSize: number;
  budget: RetrievalTokenBudget;
  options: {
    enableSparseDenseFusion: boolean;
    enableDeterministicReranking: boolean;
    minConfidenceThreshold: number;
    maxDistanceThreshold?: number;
  };
}
