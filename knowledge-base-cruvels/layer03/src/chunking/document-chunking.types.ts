import type { DocumentChunkSourceType, Prisma } from "@prisma/client";

export interface ExtractedSourceText {
  sourceType: DocumentChunkSourceType;
  sourceId: string;
  firmId: string | null;
  caseId: string | null;
  documentId: string | null;
  rawText: string;
  metadata: Record<string, unknown>;
  skipped?: boolean;
  skipReason?: string;
}

export interface TextChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata?: Record<string, unknown>;
}

export interface ChunkingOptions {
  targetTokens?: number;
  minTokens?: number;
  maxTokens?: number;
  overlapTokens?: number;
}

export interface ChunkingResult {
  sourceType: DocumentChunkSourceType;
  sourceId: string;
  firmId: string | null;
  caseId: string | null;
  documentId: string | null;
  chunksCreated: number;
  totalTokens: number;
  skipped: boolean;
  skipReason?: string;
  chunks?: {
    id: string;
    chunkIndex: number;
    tokenCount: number | null;
  }[];
}

export interface BatchChunkingResult {
  totalProcessed: number;
  totalChunksCreated: number;
  totalTokens: number;
  successful: ChunkingResult[];
  skipped: ChunkingResult[];
  failed: {
    sourceType: DocumentChunkSourceType;
    sourceId: string;
    error: string;
  }[];
}
