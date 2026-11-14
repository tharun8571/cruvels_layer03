/**
 * CRUVELS AI — Layer 03: Pluggable Embedding Provider Abstraction
 *
 * Enforces strict vector dimensions, model identification, and versioning
 * to prevent incompatible vector mixing across the knowledge base.
 */

export interface EmbeddingModelMetadata {
  provider: string; // e.g. "openai", "gemini", "huggingface", "mock"
  model: string; // e.g. "text-embedding-3-small", "gemini-embedding-001"
  dimensions: number; // e.g. 1536, 768
  version: string; // e.g. "v1"
  maxBatchSize: number;
}

export interface EmbeddingGenerationOptions {
  model?: string;
  dimensions?: number;
  batchSize?: number;
  timeoutMs?: number;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  model: string;
  dimensions: number;
  provider: string;
  version: string;
  durationMs: number;
}

export interface IEmbeddingProvider {
  /**
   * Returns provider metadata and model specifications.
   */
  getMetadata(): EmbeddingModelMetadata;

  /**
   * Generates vector embeddings for a list of text strings.
   */
  generateEmbeddings(
    texts: string[],
    options?: EmbeddingGenerationOptions,
  ): Promise<BatchEmbeddingResult>;

  /**
   * Verifies that two embedding vectors are compatible in dimension and model lineage.
   */
  assertVectorCompatibility(dimA: number, dimB: number, modelA?: string, modelB?: string): void;
}
