/**
 * Cruvels AI Generic RAG Request Contracts (Phase 1 Stage 1D)
 *
 * Defines the domain-agnostic RAG retrieval request contract supporting
 * multi-domain knowledge retrieval, candidate pooling, and reranking options.
 */

import type { DocumentChunkSourceType } from "@prisma/client";
import type { JwtUser } from "../../../../../common/auth.types";
import type { CruvelsDomain } from "../../../../request-understanding/contracts/cruvels-intent.types";

export type RagScope = "GLOBAL" | "FIRM" | "CASE" | "USER" | "DOMAIN";

export interface RagRetrievalRequest {
  /** User search query or question */
  query: string;
  /** Target business domain (e.g. 'legal', 'general') */
  domain?: CruvelsDomain;
  /** Authenticated user identity from verified JWT */
  user: JwtUser;
  /** Verified firm tenant ID */
  firmId: string;
  /** Optional case ID verified via AccessControlService */
  caseId?: string;
  /** Permitted document source types for filtering */
  sourceTypes?: DocumentChunkSourceType[];
  /** Final number of top relevant chunks to include after reranking */
  topK?: number;
  /** Initial candidate pool size to retrieve from vector database before reranking */
  candidateTopK?: number;
  /** Total maximum token budget for the assembled context */
  maxTokens?: number;
  /** Maximum token budget for an individual chunk */
  maxChunkTokens?: number;
  /** Maximum vector cosine distance threshold */
  maxDistance?: number;
  /** Whether to enable deterministic reranking (defaults to true) */
  enableReranking?: boolean;
  /** Optional options passed to the reranker implementation */
  rerankerOptions?: Record<string, unknown>;
}
