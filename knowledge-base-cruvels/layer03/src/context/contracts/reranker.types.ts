/**
 * Cruvels AI Reranker Contracts (Phase 1 Stage 1D)
 *
 * Defines candidate item and reranking result structures used in the
 * post-retrieval reranking pipeline.
 */

import type { DocumentChunkSourceType } from "@prisma/client";

export interface RerankCandidateItem {
  /** Unique chunk ID */
  chunkId: string;
  /** Chunk textual content */
  content: string;
  /** Estimated token count */
  tokenCount: number | null;
  /** Source classification type */
  sourceType: DocumentChunkSourceType;
  /** Source document/memo/asset ID */
  sourceId: string;
  /** Associated document ID */
  documentId: string | null;
  /** Tenant firm ID */
  firmId: string | null;
  /** Case ID */
  caseId: string | null;
  /** Chunk sequence index within document */
  chunkIndex: number;
  /** Document / chunk metadata */
  metadata: Record<string, unknown>;
  /** Cosine distance from original pgvector query */
  originalDistance: number;
  /** Similarity score (1 - distance) from original pgvector query */
  originalScore: number;
  /** Initial rank from pgvector retrieval (1-indexed) */
  originalRank: number;
  /** Normalized composite relevance score from reranker (0 to 1) */
  rerankScore: number;
  /** Final rank after reranking (1-indexed) */
  finalRank: number;
}

export interface RerankResult {
  /** User search query */
  query: string;
  /** Ordered list of reranked candidates */
  candidates: RerankCandidateItem[];
  /** Name of the reranker service that produced this ranking */
  rerankerName: string;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Whether fallback to original vector ranking occurred */
  fallbackUsed: boolean;
}
