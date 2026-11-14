import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { DocumentChunkSourceType } from "@prisma/client";
import { AccessControlService } from "../../../../common/access-control.service";
import { PrismaService } from "../../../../common/prisma.service";
import { getAccessibleCaseIds } from "../../../../common/utils/case-access";
import { EmbeddingService } from "../embedding/embedding.service";
import type {
  VectorSearchQuery,
  VectorSearchResponse,
  VectorSearchResultItem,
} from "./vector-retrieval.types";

export const DEFAULT_TOP_K = 5;
export const MAX_TOP_K = 50;
export const MAX_QUERY_LENGTH = 4000;

@Injectable()
export class VectorRetrievalService {
  private readonly logger = new Logger(VectorRetrievalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Performs an authorized semantic vector search against DocumentChunk records.
   *
   * @param params Query string, authenticated user context, firm/case filters, and search options
   * @returns Ranked VectorSearchResultItem results ordered by cosine distance ascending
   */
  async search(params: VectorSearchQuery): Promise<VectorSearchResponse> {
    const startedAt = Date.now();

    // 1. Validate query input
    const query = (params.query || "").trim();
    if (!query) {
      throw new BadRequestException("Search query cannot be empty.");
    }
    if (query.length > MAX_QUERY_LENGTH) {
      throw new BadRequestException(`Search query exceeds maximum length of ${MAX_QUERY_LENGTH} characters.`);
    }

    if (!params.firmId || typeof params.firmId !== "string") {
      throw new BadRequestException("Firm ID is required for tenant isolation.");
    }

    if (!params.user || !params.user.sub) {
      throw new ForbiddenException("Authentication context is missing.");
    }

    // 2. Validate topK parameter
    const topK = Math.min(MAX_TOP_K, Math.max(1, params.topK ?? DEFAULT_TOP_K));

    // 3. Multi-Tenant Authorization Check
    const isPersonalScope =
      params.firmId === "personal_workspace" ||
      params.firmId === "none" ||
      params.firmId.startsWith("personal_");

    let membership: any = null;
    if (!isPersonalScope) {
      membership = await this.accessControl.assertActiveFirmMembership(params.user.sub, params.firmId);
    }

    // 4. Generate query embedding (1536 dims)
    let queryVector: number[] | null = null;
    try {
      const [vec] = await this.embeddingService.generateEmbeddings([query]);
      if (vec && vec.length > 0) {
        queryVector = vec;
      }
    } catch (embErr: any) {
      this.logger.warn(
        `Query embedding generation failed, proceeding with fallback knowledge retrieval: ${embErr?.message || embErr}`,
      );
      return {
        query,
        firmId: params.firmId,
        caseId: params.caseId,
        topK,
        resultCount: 0,
        durationMs: Date.now() - startedAt,
        results: [],
      };
    }

    if (!queryVector || queryVector.length !== 1536) {
      return {
        query,
        firmId: params.firmId,
        caseId: params.caseId,
        topK,
        resultCount: 0,
        durationMs: Date.now() - startedAt,
        results: [],
      };
    }

    const vectorStr = `[${queryVector.join(",")}]`;

    // 5. Construct parameterized pgvector SQL query
    const sqlParams: (string | number | string[])[] = [];

    // Param $1: queryVector
    sqlParams.push(vectorStr);
    const pVec = `$${sqlParams.length}`;

    // Param $2: firmId or scope
    sqlParams.push(params.firmId);
    const pFirm = `$${sqlParams.length}`;

    // 6. Case Access Scoping
    let caseCondition = "";
    if (params.caseId) {
      // User explicitly targeted a specific case: verify visibility
      await this.accessControl.assertCaseVisible(params.user, params.caseId);
      sqlParams.push(params.caseId);
      const pCase = `$${sqlParams.length}`;
      caseCondition = `c."caseId" = ${pCase}`;
    } else if (isPersonalScope) {
      const accessibleCaseIds = await getAccessibleCaseIds(this.prisma, params.user.sub);
      sqlParams.push(accessibleCaseIds);
      const pAccessibleCases = `$${sqlParams.length}`;
      caseCondition = `(c."caseId" = ANY(${pAccessibleCases}::text[]))`;
    } else {
      const isManagement = membership?.role === "OWNER" || membership?.role === "ADMIN";
      if (isManagement) {
        caseCondition = "1=1";
      } else {
        const accessibleCaseIds = await getAccessibleCaseIds(this.prisma, params.user.sub);
        sqlParams.push(accessibleCaseIds);
        const pAccessibleCases = `$${sqlParams.length}`;
        caseCondition = `(c."caseId" IS NULL OR c."caseId" = ANY(${pAccessibleCases}::text[]))`;
      }
    }

    let documentIdsCondition = "";
    if (params.documentIds && params.documentIds.length > 0) {
      sqlParams.push(params.documentIds);
      const pDocIds = `$${sqlParams.length}`;
      documentIdsCondition = `AND (c."documentId" = ANY(${pDocIds}::text[]) OR c."sourceId" = ANY(${pDocIds}::text[]))`;
    }

    let sourceTypeCondition = "";
    if (params.sourceTypes && params.sourceTypes.length > 0) {
      sqlParams.push(params.sourceTypes);
      const pSourceTypes = `$${sqlParams.length}`;
      sourceTypeCondition = `AND c."sourceType" = ANY(${pSourceTypes}::"DocumentChunkSourceType"[])`;
    }

    let distanceThresholdCondition = "";
    if (params.maxDistance !== undefined && params.maxDistance !== null) {
      sqlParams.push(params.maxDistance);
      const pMaxDist = `$${sqlParams.length}`;
      distanceThresholdCondition = `AND (c."embedding" <=> ${pVec}::vector) <= ${pMaxDist}`;
    }

    sqlParams.push(topK);
    const pTopK = `$${sqlParams.length}`;

    const rawSql = `
      SELECT 
        c."id" as "chunkId",
        c."sourceType",
        c."sourceId",
        c."documentId",
        c."firmId",
        c."caseId",
        c."chunkIndex",
        c."content",
        c."tokenCount",
        c."metadata",
        (c."embedding" <=> ${pVec}::vector) as "distance"
      FROM "document_chunks" c
      LEFT JOIN "CaseDocument" d ON c."documentId" = d."id" AND c."sourceType" = 'CASE_DOCUMENT'
      LEFT JOIN "ResearchMemo" rm ON c."sourceId" = rm."id" AND c."sourceType" = 'RESEARCH_MEMO'
      LEFT JOIN "KnowledgeAsset" ka ON c."sourceId" = ka."id" AND c."sourceType" = 'KNOWLEDGE_ASSET'
      LEFT JOIN "KnowledgeWikiPage" kw ON c."sourceId" = kw."id" AND c."sourceType" = 'KNOWLEDGE_WIKI_PAGE'
      LEFT JOIN "case_resources" cr ON c."sourceId" = cr."id" AND c."sourceType" = 'CASE_RESOURCE'
      WHERE c."embedding" IS NOT NULL
        AND c."firmId" = ${pFirm}
        AND (${caseCondition})
        ${documentIdsCondition}
        AND (c."sourceType" != 'CASE_DOCUMENT' OR (d."deletedAt" IS NULL AND (d."scanStatus" IS NULL OR d."scanStatus" NOT IN ('quarantined', 'infected'))))
        AND (c."sourceType" != 'RESEARCH_MEMO' OR (rm."id" IS NULL OR rm."deletedAt" IS NULL))
        AND (c."sourceType" != 'KNOWLEDGE_ASSET' OR (ka."id" IS NULL OR ka."deletedAt" IS NULL))
        AND (c."sourceType" != 'KNOWLEDGE_WIKI_PAGE' OR (kw."id" IS NULL OR kw."deletedAt" IS NULL))
        AND (c."sourceType" != 'CASE_RESOURCE' OR (cr."id" IS NULL OR cr."deletedAt" IS NULL))
        ${sourceTypeCondition}
        ${distanceThresholdCondition}
      ORDER BY c."embedding" <=> ${pVec}::vector ASC
      LIMIT ${pTopK}
    `;

    interface RawSearchRow {
      chunkId: string;
      sourceType: DocumentChunkSourceType;
      sourceId: string;
      documentId: string | null;
      firmId: string | null;
      caseId: string | null;
      chunkIndex: number;
      content: string;
      tokenCount: number | null;
      metadata: Record<string, unknown> | null;
      distance: number;
    }

    const rows = await this.prisma.$queryRawUnsafe<RawSearchRow[]>(rawSql, ...sqlParams);

    const durationMs = Date.now() - startedAt;

    const results: VectorSearchResultItem[] = rows.map((r) => {
      const distance = Number(r.distance);
      const similarityScore = Math.max(0, 1 - distance);
      return {
        chunkId: r.chunkId,
        sourceType: r.sourceType,
        sourceId: r.sourceId,
        documentId: r.documentId,
        firmId: r.firmId,
        caseId: r.caseId,
        chunkIndex: r.chunkIndex,
        content: r.content,
        tokenCount: r.tokenCount,
        metadata: r.metadata || {},
        distance,
        similarityScore,
      };
    });

    this.logger.log(
      JSON.stringify({
        service: "api",
        module: "vector-retrieval",
        event: "search.completed",
        firmId: params.firmId,
        caseId: params.caseId,
        topK,
        resultCount: results.length,
        durationMs,
        sourceTypes: params.sourceTypes,
        ts: new Date().toISOString(),
      }),
    );

    return {
      query,
      firmId: params.firmId,
      caseId: params.caseId,
      topK,
      resultCount: results.length,
      durationMs,
      results,
    };
  }

  /**
   * Helper method: Search specifically within a case.
   */
  async searchCase(
    caseId: string,
    query: string,
    user: VectorSearchQuery["user"],
    firmId: string,
    options?: Omit<VectorSearchQuery, "caseId" | "query" | "user" | "firmId">,
  ): Promise<VectorSearchResponse> {
    return this.search({
      query,
      user,
      firmId,
      caseId,
      ...options,
    });
  }

  /**
   * Helper method: Search firm-wide knowledge assets, wiki pages, and research memos.
   */
  async searchFirmKnowledge(
    query: string,
    user: VectorSearchQuery["user"],
    firmId: string,
    options?: Omit<VectorSearchQuery, "query" | "user" | "firmId">,
  ): Promise<VectorSearchResponse> {
    return this.search({
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
}
