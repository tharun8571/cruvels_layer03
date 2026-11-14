import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from "@nestjs/common";
import { DocumentChunkSourceType } from "@prisma/client";
import { TextChunkerService } from "../chunking/services/text-chunker.service";
import { VectorRetrievalService } from "../retrieval/vector-retrieval.service";
import type { VectorSearchResultItem } from "../retrieval/vector-retrieval.types";
import { DocumentKnowledgeStoreService } from "./document-knowledge-store.service";
import type {
  BuildRagContextQuery,
  RagContextItem,
  RagContextResponse,
} from "./rag-context.types";

export const DEFAULT_RETRIEVAL_TOP_K = 5;
export const MAX_RETRIEVAL_TOP_K = 50;
export const DEFAULT_MAX_CONTEXT_TOKENS = 4000;
export const MAX_CONTEXT_TOKENS_BUDGET = 16000;
export const DEFAULT_MAX_CHUNK_TOKENS = 1000;
export const MAX_QUERY_LENGTH = 4000;

@Injectable()
export class RagContextService {
  private readonly logger = new Logger(RagContextService.name);

  constructor(
    private readonly vectorRetrieval: VectorRetrievalService,
    private readonly textChunker: TextChunkerService,
    @Optional()
    private readonly knowledgeStore?: DocumentKnowledgeStoreService,
  ) {}

  /**
   * Builds a secure, deterministic, token-budget-bounded grounded context package
   * for a user query on top of VectorRetrievalService and DocumentKnowledgeStoreService.
   */
  async buildContext(params: BuildRagContextQuery): Promise<RagContextResponse> {
    const startedAt = Date.now();

    // 1. Validate query input
    const query = (params.query || "").trim();
    if (!query) {
      throw new BadRequestException("Query cannot be empty.");
    }
    if (query.length > MAX_QUERY_LENGTH) {
      throw new BadRequestException(`Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters.`);
    }

    if (!params.firmId || typeof params.firmId !== "string") {
      throw new BadRequestException("Firm ID is required for tenant isolation.");
    }

    if (!params.user || !params.user.sub) {
      throw new BadRequestException("User authentication context is required.");
    }

    // 2. Budget and limit configuration
    const topK = Math.min(
      MAX_RETRIEVAL_TOP_K,
      Math.max(1, params.topK ?? DEFAULT_RETRIEVAL_TOP_K),
    );
    const maxTokens = Math.min(
      MAX_CONTEXT_TOKENS_BUDGET,
      Math.max(1, params.maxTokens ?? DEFAULT_MAX_CONTEXT_TOKENS),
    );
    const maxChunkTokens = Math.min(
      maxTokens,
      Math.max(1, params.maxChunkTokens ?? DEFAULT_MAX_CHUNK_TOKENS),
    );

    // 3. Attempt authorized vector retrieval via VectorRetrievalService
    let retrievedChunks: VectorSearchResultItem[] = [];
    try {
      const retrievalRes = await this.vectorRetrieval.search({
        query,
        user: params.user,
        firmId: params.firmId,
        caseId: params.caseId,
        documentIds: params.documentIds || (params.documentId ? [params.documentId] : undefined),
        version: params.version,
        sourceTypes: params.sourceTypes,
        topK,
        maxDistance: params.maxDistance,
      });
      retrievedChunks = retrievalRes.results || [];
    } catch (err: any) {
      this.logger.warn(`Vector retrieval database search failed/unseeded: ${err.message}`);
      retrievedChunks = [];
    }

    // 4. Fallback to DocumentKnowledgeStoreService if pgvector returned empty
    if (retrievedChunks.length === 0 && this.knowledgeStore) {
      if (params.documentId) {
        // Single document scoped lookup
        const docRes = this.knowledgeStore.search({
          documentId: params.documentId,
          query,
          topK,
          firmId: params.firmId,
        });

        retrievedChunks = docRes.items.map((item) => {
          const docKind = (item.documentName?.includes("Act") || item.documentName?.includes("Statute")
            ? ("STATUTORY_ACT" as any)
            : item.documentName?.includes("Constitution")
            ? ("CONSTITUTION" as any)
            : item.documentName?.includes("Judgment") || item.documentName?.includes("v.")
            ? ("JUDGMENT" as any)
            : item.documentName?.includes("Lease") || item.documentName?.includes("Agreement") || item.documentName?.includes("Contract")
            ? ("CONTRACT" as any)
            : DocumentChunkSourceType.CASE_DOCUMENT);
          return {
            chunkId: item.chunkId,
            sourceType: docKind,
            sourceId: item.documentId,
            documentId: item.documentId,
            firmId: params.firmId,
            caseId: params.caseId || null,
            chunkIndex: item.rank - 1,
            content: item.content,
            tokenCount: item.tokenCount,
            metadata: {
              pageNumber: item.pageNumber,
              pageEndNumber: item.pageEndNumber,
              sectionHeading: item.sectionHeading,
              clauseNumber: item.clauseNumber,
              documentName: item.documentName,
              documentVersion: item.documentVersion,
              sourceReference: item.sourceReference,
            },
            distance: 1 - item.similarityScore,
            similarityScore: item.similarityScore,
          };
        });
      } else {
        // Multi-document scoped lookup
        const multiRes = this.knowledgeStore.searchMultiDocument({
          query,
          firmId: params.firmId,
          caseId: params.caseId,
          documentIds: params.documentIds,
          topK,
        });

        retrievedChunks = multiRes.items.map((item) => {
          const docKind = (item.documentName?.includes("Act") || item.documentName?.includes("Statute")
            ? ("STATUTORY_ACT" as any)
            : item.documentName?.includes("Constitution")
            ? ("CONSTITUTION" as any)
            : item.documentName?.includes("Judgment") || item.documentName?.includes("v.")
            ? ("JUDGMENT" as any)
            : item.documentName?.includes("Lease") || item.documentName?.includes("Agreement") || item.documentName?.includes("Contract")
            ? ("CONTRACT" as any)
            : DocumentChunkSourceType.CASE_DOCUMENT);
          return {
            chunkId: item.chunkId,
            sourceType: docKind,
            sourceId: item.documentId,
            documentId: item.documentId,
            firmId: params.firmId,
            caseId: params.caseId || null,
            chunkIndex: item.rank - 1,
            content: item.content,
            tokenCount: item.tokenCount,
            metadata: {
              pageNumber: item.pageNumber,
              pageEndNumber: item.pageEndNumber,
              sectionHeading: item.sectionHeading,
              clauseNumber: item.clauseNumber,
              documentName: item.documentName,
              documentVersion: item.documentVersion,
              sourceReference: item.sourceReference,
            },
            distance: 1 - item.similarityScore,
            similarityScore: item.similarityScore,
          };
        });
      }
    }

    // 5. Document-scoped filtering enforcement: if documentId or documentIds specified, strictly filter
    if (params.documentId) {
      retrievedChunks = retrievedChunks.filter((c) => c.documentId === params.documentId);
    } else if (params.documentIds && params.documentIds.length > 0) {
      const allowedDocSet = new Set(params.documentIds);
      retrievedChunks = retrievedChunks.filter((c) => c.documentId && allowedDocSet.has(c.documentId));
    }

    // 6. Empty retrieval handling: return valid empty context
    if (retrievedChunks.length === 0) {
      return {
        query,
        contextText: "",
        items: [],
        totalTokenCount: 0,
        resultCount: 0,
      };
    }

    // 7. Deduplication (preserve highest-ranked occurrences)
    const deduplicatedChunks = this.deduplicateChunks(retrievedChunks);

    // 8. Context Selection & Token Budget Enforcement
    const selectedItems: RagContextItem[] = [];
    let accumulatedTokens = 0;
    let citationCounter = 1;

    for (const chunk of deduplicatedChunks) {
      // Ensure chunk content is safe and within single-chunk bounds
      let content = (chunk.content || "").trim();
      let chunkTokens = chunk.tokenCount ?? this.textChunker.estimateTokenCount(content);

      if (chunkTokens > maxChunkTokens) {
        content = this.truncateToTokenBudget(content, maxChunkTokens);
        chunkTokens = this.textChunker.estimateTokenCount(content);
      }

      // Check if adding this chunk would violate the total context budget
      if (accumulatedTokens + chunkTokens > maxTokens) {
        if (selectedItems.length === 0 && maxTokens >= 1) {
          content = this.truncateToTokenBudget(content, maxTokens);
          chunkTokens = this.textChunker.estimateTokenCount(content);
        } else {
          break;
        }
      }

      const citationId = `[${citationCounter}]`;
      citationCounter++;

      const meta = chunk.metadata || {};
      const pageNumber = typeof meta.pageNumber === "number" ? meta.pageNumber : typeof meta.page === "number" ? meta.page : undefined;
      const section = typeof meta.section === "string" ? meta.section : undefined;
      const clause = typeof meta.clause === "string" ? meta.clause : undefined;
      const version = meta.version !== undefined ? (meta.version as string | number) : undefined;

      selectedItems.push({
        citationId,
        chunkId: chunk.chunkId,
        content,
        tokenCount: chunkTokens,
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        documentId: chunk.documentId,
        firmId: chunk.firmId,
        caseId: chunk.caseId,
        chunkIndex: chunk.chunkIndex,
        pageNumber,
        section,
        clause,
        version,
        metadata: meta,
        distance: chunk.distance,
        similarityScore: chunk.similarityScore,
      });

      accumulatedTokens += chunkTokens;
    }

    // 9. Format structured context text
    const contextText = this.formatContextText(selectedItems);
    const durationMs = Date.now() - startedAt;

    if (process.env.DEBUG_RAG === "true") {
      this.logger.debug(
        JSON.stringify({
          service: "api",
          module: "rag-context",
          event: "rag_context.built",
          firmId: params.firmId,
          caseId: params.caseId,
          documentId: params.documentId,
          retrievedCount: retrievedChunks.length,
          selectedCount: selectedItems.length,
          totalTokenCount: accumulatedTokens,
          durationMs,
          ts: new Date().toISOString(),
        }),
      );
    }

    return {
      query,
      contextText,
      items: selectedItems,
      totalTokenCount: accumulatedTokens,
      resultCount: selectedItems.length,
    };
  }

  /**
   * Helper method: Build RAG context specifically scoped to a case.
   */
  async buildCaseContext(
    caseId: string,
    query: string,
    user: BuildRagContextQuery["user"],
    firmId: string,
    options?: Omit<BuildRagContextQuery, "caseId" | "query" | "user" | "firmId">,
  ): Promise<RagContextResponse> {
    return this.buildContext({
      query,
      user,
      firmId,
      caseId,
      ...options,
    });
  }

  /**
   * Helper method: Build RAG context specifically for firm knowledge assets/wikis/memos.
   */
  async buildFirmKnowledgeContext(
    query: string,
    user: BuildRagContextQuery["user"],
    firmId: string,
    options?: Omit<BuildRagContextQuery, "query" | "user" | "firmId">,
  ): Promise<RagContextResponse> {
    return this.buildContext({
      query,
      user,
      firmId,
      sourceTypes: [
        DocumentChunkSourceType.RESEARCH_MEMO,
        DocumentChunkSourceType.KNOWLEDGE_ASSET,
        DocumentChunkSourceType.KNOWLEDGE_WIKI_PAGE,
      ],
      ...options,
    });
  }

  /**
   * Deduplicates chunks by chunk ID and identical normalized content.
   */
  private deduplicateChunks(chunks: VectorSearchResultItem[]): VectorSearchResultItem[] {
    const seenIds = new Set<string>();
    const seenContents = new Set<string>();
    const unique: VectorSearchResultItem[] = [];

    for (const chunk of chunks) {
      if (seenIds.has(chunk.chunkId)) {
        continue;
      }
      seenIds.add(chunk.chunkId);

      // Fast content fingerprint based on first 120 chars
      const fingerprint = (chunk.content || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);

      if (fingerprint && seenContents.has(fingerprint)) {
        continue;
      }
      if (fingerprint) {
        seenContents.add(fingerprint);
      }

      unique.push(chunk);
    }

    return unique;
  }

  /**
   * Truncates content text to approximate token budget.
   */
  private truncateToTokenBudget(text: string, maxTokens: number): string {
    const words = text.split(/\s+/).filter(Boolean);
    const maxWords = Math.floor(maxTokens * 0.75); // Safe word count
    if (words.length <= maxWords) {
      return text;
    }
    return words.slice(0, maxWords).join(" ") + " ... [truncated to context budget]";
  }

  private resolveSourceTitle(item: RagContextItem): string {
    const meta = item.metadata || {};
    return (
      (meta.documentName as string) ||
      (meta.title as string) ||
      item.documentId ||
      item.sourceId ||
      "Document"
    );
  }

  private formatContextText(items: RagContextItem[]): string {
    if (items.length === 0) {
      return "";
    }

    return items
      .map((item) => {
        const title = this.resolveSourceTitle(item);
        const meta = item.metadata || {};
        const locDetails: string[] = [];
        const page = item.pageNumber ?? meta.pageNumber;
        const section = item.section ?? meta.sectionHeading ?? meta.section;
        const clause = item.clause ?? meta.clauseNumber ?? meta.clause;
        const version = item.version ?? meta.documentVersion ?? meta.version;

        if (page !== undefined) locDetails.push(`Page: ${page}`);
        if (section) locDetails.push(`Section: ${section}`);
        if (clause) locDetails.push(`Clause: ${clause}`);
        if (version) locDetails.push(`Version: ${version}`);

        const locSuffix = locDetails.length > 0 ? ` [${locDetails.join(", ")}]` : "";
        const header = `--- SOURCE EVIDENCE ${item.citationId} (${title})${locSuffix} ---`;
        return `${header}\n${item.content}`;
      })
      .join("\n\n");
  }
}
