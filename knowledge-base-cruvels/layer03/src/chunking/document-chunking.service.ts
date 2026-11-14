import { Injectable, Logger } from "@nestjs/common";
import { DocumentChunkSourceType, type Prisma } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma.service";
import type {
  BatchChunkingResult,
  ChunkingOptions,
  ChunkingResult,
} from "./document-chunking.types";
import { DocumentExtractorService } from "./services/document-extractor.service";
import { TextChunkerService } from "./services/text-chunker.service";
import { TextNormalizerService } from "./services/text-normalizer.service";

@Injectable()
export class DocumentChunkingService {
  private readonly logger = new Logger(DocumentChunkingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extractor: DocumentExtractorService,
    private readonly normalizer: TextNormalizerService,
    private readonly chunker: TextChunkerService,
  ) {}

  /**
   * Main entry point: Extracts, normalizes, chunks, and transactionally persists
   * DocumentChunk records for a single source.
   *
   * Idempotent: existing chunks for the same (sourceType, sourceId) are removed
   * in the transaction before new chunks are inserted.
   */
  async chunkSource(
    sourceType: DocumentChunkSourceType,
    sourceId: string,
    options?: ChunkingOptions,
  ): Promise<ChunkingResult> {
    // 1. Extract source content & metadata
    const extracted = await this.extractor.extractSource(sourceType, sourceId);

    if (extracted.skipped) {
      // If deleted or invalid, purge any obsolete chunks for this source
      await this.prisma.documentChunk.deleteMany({
        where: { sourceType, sourceId },
      });

      return {
        sourceType,
        sourceId,
        firmId: extracted.firmId,
        caseId: extracted.caseId,
        documentId: extracted.documentId,
        chunksCreated: 0,
        totalTokens: 0,
        skipped: true,
        skipReason: extracted.skipReason,
      };
    }

    // 2. Normalize text
    const normalizedText = this.normalizer.normalize(extracted.rawText);
    if (!normalizedText) {
      await this.prisma.documentChunk.deleteMany({
        where: { sourceType, sourceId },
      });

      return {
        sourceType,
        sourceId,
        firmId: extracted.firmId,
        caseId: extracted.caseId,
        documentId: extracted.documentId,
        chunksCreated: 0,
        totalTokens: 0,
        skipped: true,
        skipReason: "NORMALIZED_TEXT_EMPTY",
      };
    }

    // 3. Chunk text deterministically
    const textChunks = this.chunker.chunk(normalizedText, options);
    if (textChunks.length === 0) {
      await this.prisma.documentChunk.deleteMany({
        where: { sourceType, sourceId },
      });

      return {
        sourceType,
        sourceId,
        firmId: extracted.firmId,
        caseId: extracted.caseId,
        documentId: extracted.documentId,
        chunksCreated: 0,
        totalTokens: 0,
        skipped: true,
        skipReason: "NO_CHUNKS_GENERATED",
      };
    }

    // 4. Transactionally replace existing chunks (Idempotent persistence)
    const chunksToInsert: Prisma.DocumentChunkCreateManyInput[] = textChunks.map((c) => ({
      firmId: extracted.firmId,
      caseId: extracted.caseId,
      sourceType,
      sourceId,
      documentId: extracted.documentId,
      chunkIndex: c.chunkIndex,
      content: c.content,
      tokenCount: c.tokenCount,
      metadata: {
        ...extracted.metadata,
        chunkIndex: c.chunkIndex,
        totalChunks: textChunks.length,
      } as Prisma.InputJsonValue,
    }));

    await this.prisma.$transaction(async (tx) => {
      // Purge prior chunks for this exact source
      await tx.documentChunk.deleteMany({
        where: { sourceType, sourceId },
      });

      // Batch insert fresh chunks
      await tx.documentChunk.createMany({
        data: chunksToInsert,
      });
    });

    const totalTokens = textChunks.reduce((sum, c) => sum + c.tokenCount, 0);

    this.logger.log(
      `Chunked ${sourceType}:${sourceId} -> ${chunksToInsert.length} chunks (${totalTokens} estimated tokens)`,
    );

    return {
      sourceType,
      sourceId,
      firmId: extracted.firmId,
      caseId: extracted.caseId,
      documentId: extracted.documentId,
      chunksCreated: chunksToInsert.length,
      totalTokens,
      skipped: false,
    };
  }

  /**
   * Convenience method: Chunk a CaseDocument
   */
  async chunkCaseDocument(documentId: string, options?: ChunkingOptions): Promise<ChunkingResult> {
    return this.chunkSource(DocumentChunkSourceType.CASE_DOCUMENT, documentId, options);
  }

  /**
   * Convenience method: Chunk a CaseResource
   */
  async chunkCaseResource(resourceId: string, options?: ChunkingOptions): Promise<ChunkingResult> {
    return this.chunkSource(DocumentChunkSourceType.CASE_RESOURCE, resourceId, options);
  }

  /**
   * Convenience method: Chunk a ResearchMemo
   */
  async chunkResearchMemo(memoId: string, options?: ChunkingOptions): Promise<ChunkingResult> {
    return this.chunkSource(DocumentChunkSourceType.RESEARCH_MEMO, memoId, options);
  }

  /**
   * Convenience method: Chunk a KnowledgeAsset
   */
  async chunkKnowledgeAsset(assetId: string, options?: ChunkingOptions): Promise<ChunkingResult> {
    return this.chunkSource(DocumentChunkSourceType.KNOWLEDGE_ASSET, assetId, options);
  }

  /**
   * Convenience method: Chunk a KnowledgeWikiPage
   */
  async chunkKnowledgeWikiPage(wikiId: string, options?: ChunkingOptions): Promise<ChunkingResult> {
    return this.chunkSource(DocumentChunkSourceType.KNOWLEDGE_WIKI_PAGE, wikiId, options);
  }

  /**
   * Batch chunks all usable documents and resources for a given case.
   */
  async chunkCase(caseId: string, options?: ChunkingOptions): Promise<BatchChunkingResult> {
    const documents = await this.prisma.caseDocument.findMany({
      where: { caseId, deletedAt: null },
      select: { id: true },
    });

    const resources = await this.prisma.caseResource.findMany({
      where: { caseId, deletedAt: null },
      select: { id: true },
    });

    const results: ChunkingResult[] = [];
    const failed: { sourceType: DocumentChunkSourceType; sourceId: string; error: string }[] = [];

    for (const doc of documents) {
      try {
        const res = await this.chunkCaseDocument(doc.id, options);
        results.push(res);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        failed.push({
          sourceType: DocumentChunkSourceType.CASE_DOCUMENT,
          sourceId: doc.id,
          error: message,
        });
      }
    }

    for (const res of resources) {
      try {
        const r = await this.chunkCaseResource(res.id, options);
        results.push(r);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        failed.push({
          sourceType: DocumentChunkSourceType.CASE_RESOURCE,
          sourceId: res.id,
          error: message,
        });
      }
    }

    const successful = results.filter((r) => !r.skipped);
    const skipped = results.filter((r) => r.skipped);

    return {
      totalProcessed: results.length + failed.length,
      totalChunksCreated: successful.reduce((sum, r) => sum + r.chunksCreated, 0),
      totalTokens: successful.reduce((sum, r) => sum + r.totalTokens, 0),
      successful,
      skipped,
      failed,
    };
  }

  /**
   * Batch chunks all knowledge assets, wiki pages, and research memos for a firm.
   */
  async chunkFirmKnowledge(firmId: string, options?: ChunkingOptions): Promise<BatchChunkingResult> {
    const memos = await this.prisma.researchMemo.findMany({
      where: { firmId, deletedAt: null },
      select: { id: true },
    });

    const assets = await this.prisma.knowledgeAsset.findMany({
      where: { firmId, deletedAt: null },
      select: { id: true },
    });

    const wikis = await this.prisma.knowledgeWikiPage.findMany({
      where: { firmId, deletedAt: null },
      select: { id: true },
    });

    const results: ChunkingResult[] = [];
    const failed: { sourceType: DocumentChunkSourceType; sourceId: string; error: string }[] = [];

    for (const m of memos) {
      try {
        results.push(await this.chunkResearchMemo(m.id, options));
      } catch (err: unknown) {
        failed.push({
          sourceType: DocumentChunkSourceType.RESEARCH_MEMO,
          sourceId: m.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    for (const a of assets) {
      try {
        results.push(await this.chunkKnowledgeAsset(a.id, options));
      } catch (err: unknown) {
        failed.push({
          sourceType: DocumentChunkSourceType.KNOWLEDGE_ASSET,
          sourceId: a.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    for (const w of wikis) {
      try {
        results.push(await this.chunkKnowledgeWikiPage(w.id, options));
      } catch (err: unknown) {
        failed.push({
          sourceType: DocumentChunkSourceType.KNOWLEDGE_WIKI_PAGE,
          sourceId: w.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const successful = results.filter((r) => !r.skipped);
    const skipped = results.filter((r) => r.skipped);

    return {
      totalProcessed: results.length + failed.length,
      totalChunksCreated: successful.reduce((sum, r) => sum + r.chunksCreated, 0),
      totalTokens: successful.reduce((sum, r) => sum + r.totalTokens, 0),
      successful,
      skipped,
      failed,
    };
  }

  /**
   * Retrieves all persisted chunks for a specific source ordered by chunkIndex.
   */
  async getChunksForSource(sourceType: DocumentChunkSourceType, sourceId: string) {
    return this.prisma.documentChunk.findMany({
      where: { sourceType, sourceId },
      orderBy: { chunkIndex: "asc" },
    });
  }

  /**
   * Deletes all persisted chunks for a specific source.
   */
  async deleteChunksForSource(sourceType: DocumentChunkSourceType, sourceId: string) {
    return this.prisma.documentChunk.deleteMany({
      where: { sourceType, sourceId },
    });
  }
}
