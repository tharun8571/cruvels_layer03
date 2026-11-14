import { Injectable, Logger } from "@nestjs/common";
import { DocumentPermissionFilterService } from "../access/document-permission-filter";
import { MatterFilterService } from "../access/matter-filter";
import { TenantFilterService } from "../access/tenant-filter";
import { EmbeddingService } from "../embedding/embedding.service";
import { MetadataIndexService } from "../indexing/metadata-index";
import { VectorIndexService } from "../indexing/vector-index";
import type { AccessContext, KnowledgeRetrievalQuery, LegalChunk } from "../knowledge-intelligence.types";

export interface VectorCandidateResult {
  chunk: LegalChunk;
  score: number; // 0.0 - 1.0 (similarity)
  distance: number;
}

@Injectable()
export class VectorRetrieverService {
  private readonly logger = new Logger(VectorRetrieverService.name);

  constructor(
    private readonly vectorIndex: VectorIndexService,
    private readonly metadataIndex: MetadataIndexService,
    private readonly tenantFilter: TenantFilterService,
    private readonly matterFilter: MatterFilterService,
    private readonly docFilter: DocumentPermissionFilterService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Performs authorized dense semantic vector retrieval.
   */
  async retrieve(
    query: string,
    access: AccessContext,
    options?: Partial<KnowledgeRetrievalQuery>,
  ): Promise<VectorCandidateResult[]> {
    this.tenantFilter.assertTenantContext(access);

    // 1. Generate query embedding
    let queryVector: number[] = [];
    try {
      const [vec] = await this.embeddingService.generateEmbeddings([query]);
      if (vec && vec.length > 0) {
        queryVector = vec;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Dense query embedding failed: ${msg}`);
      return [];
    }

    if (!queryVector || queryVector.length === 0) {
      return [];
    }

    // 2. Vector search in index
    const vectorMatches = this.vectorIndex.search({
      queryVector,
      firmId: access.firmId,
      caseId: access.caseId,
      documentIds: access.allowedDocumentIds || options?.filter?.documentIds,
      topK: (options?.topK ?? 10) * 2, // over-fetch for post-filtering
      maxDistance: options?.filter?.maxDistance,
    });

    const candidates: VectorCandidateResult[] = [];

    for (const match of vectorMatches) {
      const chunk = this.metadataIndex.getChunk(match.id);
      if (!chunk) continue;

      candidates.push({
        chunk,
        score: match.similarity,
        distance: match.distance,
      });
    }

    // 3. Security filters
    let filtered = this.tenantFilter.filterByTenant(candidates, access);
    filtered = this.matterFilter.filterByMatter(filtered, access);
    filtered = this.docFilter.filterAuthorizedDocuments(filtered, access);

    return filtered.slice(0, options?.topK ?? 10);
  }
}
