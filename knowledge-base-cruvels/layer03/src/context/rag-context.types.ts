import type { DocumentChunkSourceType } from "@prisma/client";
import type { JwtUser } from "../../../../common/auth.types";

export interface BuildRagContextQuery {
  query: string;
  user: JwtUser;
  firmId: string;
  caseId?: string;
  documentId?: string;
  documentIds?: string[];
  sourceTypes?: DocumentChunkSourceType[];
  allowedRagScopes?: string[];
  version?: string | number;
  topK?: number;
  maxTokens?: number;
  maxChunkTokens?: number;
  maxDistance?: number;
}

export interface RagContextItem {
  citationId: string; // e.g. "[1]", "[2]"
  chunkId: string;
  content: string;
  tokenCount: number;
  sourceType: DocumentChunkSourceType;
  sourceId: string;
  documentId: string | null;
  firmId: string | null;
  caseId: string | null;
  chunkIndex: number;
  pageNumber?: number;
  section?: string;
  clause?: string;
  version?: string | number;
  metadata: Record<string, unknown>;
  distance: number;
  similarityScore: number;
}

export interface RagContextResponse {
  query: string;
  contextText: string;
  items: RagContextItem[];
  totalTokenCount: number;
  resultCount: number;
}
