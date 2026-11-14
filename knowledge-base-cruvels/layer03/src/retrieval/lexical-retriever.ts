import { Injectable } from "@nestjs/common";
import { DocumentPermissionFilterService } from "../access/document-permission-filter";
import { MatterFilterService } from "../access/matter-filter";
import { TenantFilterService } from "../access/tenant-filter";
import { MetadataIndexService } from "../indexing/metadata-index";
import { SparseIndexService } from "../indexing/sparse-index";
import type { AccessContext, KnowledgeRetrievalQuery, LegalChunk } from "../knowledge-intelligence.types";
import { ImportanceScorerService } from "./importance-scorer.service";

export interface LexicalCandidateResult {
  chunk: LegalChunk;
  score: number; // 0.0 - 1.0 (BM25 normalized)
  matchedTerms: string[];
}

@Injectable()
export class LexicalRetrieverService {
  constructor(
    private readonly sparseIndex: SparseIndexService,
    private readonly metadataIndex: MetadataIndexService,
    private readonly tenantFilter: TenantFilterService,
    private readonly matterFilter: MatterFilterService,
    private readonly docFilter: DocumentPermissionFilterService,
    private readonly importanceScorer: ImportanceScorerService,
  ) {}

  /**
   * Performs authorized lexical BM25 retrieval with legal synonym expansion.
   */
  retrieve(
    query: string,
    access: AccessContext,
    options?: Partial<KnowledgeRetrievalQuery>,
  ): LexicalCandidateResult[] {
    this.tenantFilter.assertTenantContext(access);

    // 1. Expand query with legal synonyms if enabled (default true)
    let effectiveQuery = query;
    if (options?.enableSynonymExpansion !== false) {
      const expandedTokens = this.importanceScorer.expandLegalQuery(query);
      effectiveQuery = `${query} ${expandedTokens.join(" ")}`;
    }

    // 2. Search sparse index
    const sparseMatches = this.sparseIndex.search({
      query: effectiveQuery,
      firmId: access.firmId,
      caseId: access.caseId,
      documentIds: access.allowedDocumentIds || options?.filter?.documentIds,
      topK: (options?.topK ?? 10) * 2,
    });

    const candidates: LexicalCandidateResult[] = [];

    for (const match of sparseMatches) {
      const chunk = this.metadataIndex.getChunk(match.id);
      if (!chunk) continue;

      candidates.push({
        chunk,
        score: match.score,
        matchedTerms: match.matchedTerms,
      });
    }

    // 3. Security filters
    let filtered = this.tenantFilter.filterByTenant(candidates, access);
    filtered = this.matterFilter.filterByMatter(filtered, access);
    filtered = this.docFilter.filterAuthorizedDocuments(filtered, access);

    return filtered.slice(0, options?.topK ?? 10);
  }
}
