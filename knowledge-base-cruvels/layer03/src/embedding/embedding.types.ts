export interface ChunkEmbeddingResult {
  chunkId: string;
  embedded: boolean;
  skipped: boolean;
  skipReason?: string;
  dimensions?: number;
  model?: string;
  error?: string;
}

export interface BatchEmbeddingOptions {
  model?: string;
  dimensions?: number;
  batchSize?: number;
  timeoutMs?: number;
}

export interface BatchEmbeddingResult {
  totalProcessed: number;
  embeddedCount: number;
  skippedCount: number;
  failedCount: number;
  results: ChunkEmbeddingResult[];
  failed: {
    chunkId: string;
    error: string;
  }[];
}
