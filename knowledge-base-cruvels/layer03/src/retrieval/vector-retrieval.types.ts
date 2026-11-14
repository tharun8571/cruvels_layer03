import type { DocumentChunkSourceType } from "@prisma/client";
import type { JwtUser } from "../../../../common/auth.types";

export interface VectorSearchQuery {
  query: string;
  user: JwtUser;
  firmId: string;
  caseId?: string;
  documentIds?: string[];
  sourceTypes?: DocumentChunkSourceType[];
  version?: string | number;
  topK?: number;
  maxDistance?: number;
  minSimilarity?: number;
}

export interface VectorSearchResultItem {
  chunkId: string;
  sourceType: DocumentChunkSourceType;
  sourceId: string;
  documentId: string | null;
  firmId: string | null;
  caseId: string | null;
  chunkIndex: number;
  content: string;
  tokenCount: number | null;
  metadata: Record<string, unknown>;
  distance: number; // Cosine distance: 0.0 = identical, 1.0 = orthogonal, 2.0 = opposite
  similarityScore: number; // 1 - distance
}

export interface VectorSearchResponse {
  query: string;
  firmId: string;
  caseId?: string;
  topK: number;
  resultCount: number;
  durationMs: number;
  results: VectorSearchResultItem[];
}
