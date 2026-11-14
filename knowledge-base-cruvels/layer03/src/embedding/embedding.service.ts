import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../../../../common/prisma.service";
import { env } from "../../../../config/env";
import { AiGatewayService } from "../../08-gateway/ai-gateway.service";
import type {
  BatchEmbeddingOptions,
  BatchEmbeddingResult,
  ChunkEmbeddingResult,
} from "./embedding.types";

export const DEFAULT_EMBEDDING_DIMENSIONS = 1536;
export const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
export const DEFAULT_EMBEDDING_BATCH_SIZE = 50;

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiGateway: AiGatewayService,
  ) {}

  /**
   * Computes SHA-256 hash of chunk content for idempotency checks.
   */
  computeContentHash(content: string): string {
    return createHash("sha256").update(content.trim()).digest("hex");
  }

  /**
   * Generates vector embeddings for an arbitrary array of texts in batches.
   * Strictly validates that every returned vector matches the expected dimension.
   */
  async generateEmbeddings(
    texts: string[],
    options?: BatchEmbeddingOptions,
  ): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      return [];
    }

    // Check for empty strings
    for (let i = 0; i < texts.length; i++) {
      if (!texts[i] || !texts[i].trim()) {
        throw new BadRequestException(`Input text at index ${i} is empty or whitespace.`);
      }
    }

    const model = options?.model || env.openaiEmbeddingModel || DEFAULT_EMBEDDING_MODEL;
    const expectedDimensions = options?.dimensions ?? env.openaiEmbeddingDimensions ?? DEFAULT_EMBEDDING_DIMENSIONS;
    const batchSize = options?.batchSize ?? env.openaiEmbeddingBatchSize ?? DEFAULT_EMBEDDING_BATCH_SIZE;
    const timeoutMs = options?.timeoutMs ?? env.openaiTimeoutMs ?? 30000;

    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batchTexts = texts.slice(i, i + batchSize);
      const startedAt = Date.now();

      const response = await this.aiGateway.generateEmbeddings(batchTexts, {
        model,
        dimensions: expectedDimensions,
        timeoutMs,
      });

      const durationMs = Date.now() - startedAt;

      // Ensure returned items map 1-to-1 with batch inputs
      if (!response.embeddings || response.embeddings.length !== batchTexts.length) {
        throw new BadGatewayException(
          `Embedding provider returned ${response.embeddings?.length ?? 0} vectors for ${batchTexts.length} inputs.`,
        );
      }

      // Sort by index to preserve exact order
      const sorted = [...response.embeddings].sort((a, b) => a.index - b.index);

      for (const item of sorted) {
        if (!item.embedding || item.embedding.length !== expectedDimensions) {
          const actualDim = item.embedding ? item.embedding.length : 0;
          this.logger.error(
            JSON.stringify({
              service: "api",
              module: "embedding",
              event: "embedding.invalid_dimensions",
              expected: expectedDimensions,
              actual: actualDim,
              model,
              durationMs,
              ts: new Date().toISOString(),
            }),
          );
          throw new BadGatewayException(
            `Embedding dimension mismatch: expected ${expectedDimensions}, but received ${actualDim}.`,
          );
        }
        allEmbeddings.push(item.embedding);
      }
    }

    return allEmbeddings;
  }

  /**
   * Generates and persists an embedding for a single DocumentChunk record.
   * Idempotent: skips regeneration if the chunk already has an embedding and contentHash is unchanged.
   */
  async embedChunk(
    chunkId: string,
    options?: BatchEmbeddingOptions,
  ): Promise<ChunkEmbeddingResult> {
    const chunk = await this.prisma.documentChunk.findUnique({
      where: { id: chunkId },
    });

    if (!chunk) {
      throw new NotFoundException(`DocumentChunk with id '${chunkId}' was not found.`);
    }

    // Security check: verify parent CaseDocument is not quarantined / infected
    if (chunk.documentId) {
      const caseDoc = await this.prisma.caseDocument.findUnique({
        where: { id: chunk.documentId },
        select: { scanStatus: true, deletedAt: true },
      });
      if (caseDoc?.deletedAt) {
        return {
          chunkId,
          embedded: false,
          skipped: true,
          skipReason: "DOCUMENT_DELETED",
        };
      }
      if (caseDoc?.scanStatus === "quarantined" || caseDoc?.scanStatus === "infected") {
        return {
          chunkId,
          embedded: false,
          skipped: true,
          skipReason: `SECURITY_SCAN_FLAGGED: ${caseDoc.scanStatus}`,
        };
      }
    }

    const model = options?.model || env.openaiEmbeddingModel || DEFAULT_EMBEDDING_MODEL;
    const expectedDimensions = options?.dimensions ?? env.openaiEmbeddingDimensions ?? DEFAULT_EMBEDDING_DIMENSIONS;
    const contentHash = this.computeContentHash(chunk.content);

    // Check existing embedding status & metadata contentHash
    const rawCheck = await this.prisma.$queryRawUnsafe<
      { hasEmbedding: boolean; metadata: Record<string, unknown> | null }[]
    >(
      `SELECT ("embedding" IS NOT NULL) as "hasEmbedding", "metadata" FROM "document_chunks" WHERE "id" = $1`,
      chunkId,
    );

    const hasEmbedding = rawCheck[0]?.hasEmbedding ?? false;
    const currentMeta = (rawCheck[0]?.metadata || {}) as Record<string, unknown>;

    if (
      hasEmbedding &&
      currentMeta.contentHash === contentHash &&
      currentMeta.embeddingModel === model &&
      currentMeta.embeddingDimensions === expectedDimensions
    ) {
      return {
        chunkId,
        embedded: false,
        skipped: true,
        skipReason: "ALREADY_EMBEDDED",
        dimensions: expectedDimensions,
        model,
      };
    }

    // Generate embedding
    const [vector] = await this.generateEmbeddings([chunk.content], options);

    // Parameterized pgvector persistence
    await this.persistEmbedding(chunkId, vector, {
      ...currentMeta,
      contentHash,
      embeddingModel: model,
      embeddingDimensions: expectedDimensions,
      embeddedAt: new Date().toISOString(),
    });

    this.logger.log(
      JSON.stringify({
        service: "api",
        module: "embedding",
        event: "chunk.embedded",
        chunkId,
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        model,
        dimensions: expectedDimensions,
        ts: new Date().toISOString(),
      }),
    );

    return {
      chunkId,
      embedded: true,
      skipped: false,
      dimensions: expectedDimensions,
      model,
    };
  }

  /**
   * Generates and persists embeddings for multiple DocumentChunk records in batches.
   */
  async embedChunks(
    chunkIds: string[],
    options?: BatchEmbeddingOptions,
  ): Promise<BatchEmbeddingResult> {
    if (!chunkIds || chunkIds.length === 0) {
      return {
        totalProcessed: 0,
        embeddedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        results: [],
        failed: [],
      };
    }

    const model = options?.model || env.openaiEmbeddingModel || DEFAULT_EMBEDDING_MODEL;
    const expectedDimensions = options?.dimensions ?? env.openaiEmbeddingDimensions ?? DEFAULT_EMBEDDING_DIMENSIONS;
    const batchSize = options?.batchSize ?? env.openaiEmbeddingBatchSize ?? DEFAULT_EMBEDDING_BATCH_SIZE;

    // Fetch chunk data and raw embedding status
    const chunks = await this.prisma.documentChunk.findMany({
      where: { id: { in: chunkIds } },
    });

    const chunkMap = new Map(chunks.map((c) => [c.id, c]));

    // Query embedding presence directly from DB
    const rawPresence = await this.prisma.$queryRawUnsafe<
      { id: string; hasEmbedding: boolean; metadata: Record<string, unknown> | null }[]
    >(
      `SELECT "id", ("embedding" IS NOT NULL) as "hasEmbedding", "metadata" FROM "document_chunks" WHERE "id" = ANY($1::text[])`,
      chunkIds,
    );
    const presenceMap = new Map(rawPresence.map((r) => [r.id, r]));

    const results: ChunkEmbeddingResult[] = [];
    const failed: { chunkId: string; error: string }[] = [];
    const chunksToEmbed: { chunk: (typeof chunks)[0]; contentHash: string; currentMeta: Record<string, unknown> }[] = [];

    for (const chunkId of chunkIds) {
      const chunk = chunkMap.get(chunkId);
      if (!chunk) {
        failed.push({ chunkId, error: "Chunk not found" });
        continue;
      }

      // Check quarantine if CaseDocument
      if (chunk.documentId) {
        const caseDoc = await this.prisma.caseDocument.findUnique({
          where: { id: chunk.documentId },
          select: { scanStatus: true, deletedAt: true },
        });
        if (caseDoc?.deletedAt) {
          results.push({ chunkId, embedded: false, skipped: true, skipReason: "DOCUMENT_DELETED" });
          continue;
        }
        if (caseDoc?.scanStatus === "quarantined" || caseDoc?.scanStatus === "infected") {
          results.push({
            chunkId,
            embedded: false,
            skipped: true,
            skipReason: `SECURITY_SCAN_FLAGGED: ${caseDoc.scanStatus}`,
          });
          continue;
        }
      }

      const contentHash = this.computeContentHash(chunk.content);
      const presence = presenceMap.get(chunkId);
      const currentMeta = (presence?.metadata || chunk.metadata || {}) as Record<string, unknown>;

      if (
        presence?.hasEmbedding &&
        currentMeta.contentHash === contentHash &&
        currentMeta.embeddingModel === model &&
        currentMeta.embeddingDimensions === expectedDimensions
      ) {
        results.push({
          chunkId,
          embedded: false,
          skipped: true,
          skipReason: "ALREADY_EMBEDDED",
          dimensions: expectedDimensions,
          model,
        });
        continue;
      }

      chunksToEmbed.push({ chunk, contentHash, currentMeta });
    }

    // Process in batches
    for (let i = 0; i < chunksToEmbed.length; i += batchSize) {
      const batch = chunksToEmbed.slice(i, i + batchSize);
      const texts = batch.map((b) => b.chunk.content);

      try {
        const vectors = await this.generateEmbeddings(texts, options);

        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const vector = vectors[j];

          await this.persistEmbedding(item.chunk.id, vector, {
            ...item.currentMeta,
            contentHash: item.contentHash,
            embeddingModel: model,
            embeddingDimensions: expectedDimensions,
            embeddedAt: new Date().toISOString(),
          });

          results.push({
            chunkId: item.chunk.id,
            embedded: true,
            skipped: false,
            dimensions: expectedDimensions,
            model,
          });
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          JSON.stringify({
            service: "api",
            module: "embedding",
            event: "batch.failed",
            batchSize: batch.length,
            error: errorMsg,
            ts: new Date().toISOString(),
          }),
        );
        for (const item of batch) {
          failed.push({
            chunkId: item.chunk.id,
            error: errorMsg,
          });
        }
      }
    }

    const embeddedCount = results.filter((r) => r.embedded).length;
    const skippedCount = results.filter((r) => r.skipped).length;

    return {
      totalProcessed: chunkIds.length,
      embeddedCount,
      skippedCount,
      failedCount: failed.length,
      results,
      failed,
    };
  }

  /**
   * Helper: Embed all unembedded chunks in the database (with optional firm or case filter).
   */
  async embedUnembeddedChunks(filter?: {
    firmId?: string;
    caseId?: string;
    limit?: number;
    batchSize?: number;
  }): Promise<BatchEmbeddingResult> {
    const limit = filter?.limit ?? 500;

    let query = `SELECT "id" FROM "document_chunks" WHERE "embedding" IS NULL`;
    const params: (string | number)[] = [];

    if (filter?.firmId) {
      params.push(filter.firmId);
      query += ` AND "firmId" = $${params.length}`;
    }

    if (filter?.caseId) {
      params.push(filter.caseId);
      query += ` AND "caseId" = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY "createdAt" ASC LIMIT $${params.length}`;

    const unembedded = await this.prisma.$queryRawUnsafe<{ id: string }[]>(query, ...params);
    const chunkIds = unembedded.map((u) => u.id);

    return this.embedChunks(chunkIds, { batchSize: filter?.batchSize });
  }

  /**
   * Parameterized pgvector persistence helper.
   * Formats embedding as pgvector string and writes via $executeRawUnsafe.
   */
  private async persistEmbedding(
    chunkId: string,
    vector: number[],
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const vectorStr = `[${vector.join(",")}]`;
    const metadataJson = JSON.stringify(metadata);

    await this.prisma.$executeRawUnsafe(
      `UPDATE "document_chunks"
       SET "embedding" = $1::vector,
           "metadata" = $2::jsonb,
           "updatedAt" = NOW()
       WHERE "id" = $3`,
      vectorStr,
      metadataJson,
      chunkId,
    );
  }
}
