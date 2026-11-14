/**
 * Cruvels AI RAG Reranker Interface (Phase 1 Stage 1D)
 *
 * Defines the contract that all reranking implementations must fulfill.
 */

import type {
  RerankCandidateItem,
  RerankResult,
} from "../contracts/reranker.types";

export interface IRagReranker {
  /** Identifier of the reranker implementation */
  readonly name: string;

  /**
   * Reranks a candidate set of authorized chunks against the user query.
   *
   * @param query The user search query or question
   * @param candidates Pre-filtered, authorized candidate chunks from vector retrieval
   * @param options Optional reranker configuration parameters
   * @returns RerankResult containing re-ordered candidates
   */
  rerank(
    query: string,
    candidates: RerankCandidateItem[],
    options?: Record<string, unknown>,
  ): Promise<RerankResult>;
}
