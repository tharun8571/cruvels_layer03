import { BadRequestException, Injectable, Logger, Optional } from "@nestjs/common";
import { DocumentPermissionFilterService } from "../access/document-permission-filter";
import { TenantFilterService } from "../access/tenant-filter";
import type {
  KnowledgeRetrievalQuery,
  RetrievalResult,
  ScoredRetrievalItem,
} from "../knowledge-intelligence.types";
import { ChunkDeduplicatorService } from "./deduplicator";
import { HybridFusionService } from "./fusion";
import { LexicalRetrieverService } from "./lexical-retriever";
import { LegalRerankerService } from "./reranker";
import { VectorRetrieverService } from "./vector-retriever";
import { StructuralRetrieverService } from "./structural-retriever";
import { EvidenceAdmissionPolicy } from "./evidence-admission.policy";

@Injectable()
export class HybridRetrieverService {
  private readonly logger = new Logger(HybridRetrieverService.name);
  private readonly admissionPolicyInstance: EvidenceAdmissionPolicy;

  constructor(
    private readonly vectorRetriever: VectorRetrieverService,
    private readonly lexicalRetriever: LexicalRetrieverService,
    private readonly fusionService: HybridFusionService,
    private readonly rerankerService: LegalRerankerService,
    private readonly deduplicator: ChunkDeduplicatorService,
    private readonly tenantFilter: TenantFilterService,
    private readonly docFilter: DocumentPermissionFilterService,
    private readonly structuralRetriever: StructuralRetrieverService,
    @Optional() admissionPolicy?: EvidenceAdmissionPolicy,
  ) {
    this.admissionPolicyInstance = admissionPolicy || new EvidenceAdmissionPolicy();
  }

  /**
   * Executes the full production-grade hybrid retrieval pipeline with failover resilience:
   * 1. Priority 1: Exact structural-reference resolution (Section 8.1, Section 8.2, Schedule B)
   * 2. Priority 2: Exact lexical match
   * 3. Priority 3: Metadata match
   * 4. Priority 4: Hybrid Reciprocal Rank Fusion (RRF) with exact legal citation priority boost
   * 5. Priority 5: Legal significance re-ranking (operative terms, temporal versions, schedules)
   * 6. SHA-256 and lexical deduplication
   * 7. Post-retrieval security boundary validation
   */
  async retrieve(queryObj: KnowledgeRetrievalQuery): Promise<RetrievalResult> {
    const startedAt = performance.now();
    const query = (queryObj.query || "").trim();

    if (!query) {
      throw new BadRequestException("Query string cannot be empty.");
    }

    // 0. Hard Retrieval Gate Check
    const isExplicitlyDisabled = queryObj.retrievalRequired === false;
    const isGeneralOrTool =
      (queryObj.knowledgeRequirement === "NONE" ||
      queryObj.knowledgeRequirement === "GENERAL_KNOWLEDGE" ||
      queryObj.knowledgeRequirement === "TOOL_REQUIRED") &&
      queryObj.retrievalRequired !== true;

    if (isExplicitlyDisabled || isGeneralOrTool) {
      const skippedReason = isExplicitlyDisabled
        ? "EXPLICIT_RETRIEVAL_REQUIRED_FALSE"
        : queryObj.knowledgeRequirement === "GENERAL_KNOWLEDGE"
        ? "SKIPPED_GENERAL_KNOWLEDGE_QUERY"
        : queryObj.knowledgeRequirement === "TOOL_REQUIRED"
        ? "SKIPPED_REALTIME_TOOL_QUERY"
        : "SKIPPED_NO_DOCUMENT_GROUNDING_REQUIRED";

      const sourceType =
        queryObj.knowledgeRequirement === "GENERAL_KNOWLEDGE"
          ? "GENERAL"
          : queryObj.knowledgeRequirement === "LEGAL_KNOWLEDGE"
          ? "LEGAL"
          : queryObj.knowledgeRequirement === "TOOL_REQUIRED"
          ? "EXTERNAL"
          : "NONE";

      return {
        query,
        access: queryObj.access,
        items: [],
        totalCandidatesScanned: 0,
        retrievedCount: 0,
        isEmpty: true,
        retrievalSkipped: true,
        retrievalDecision: {
          required: false,
          reason: `Knowledge requirement is ${queryObj.knowledgeRequirement || "NONE"} with context binding ${queryObj.contextBinding || "NONE"}. Retrieval gate: ${skippedReason}.`,
          sourceType: sourceType as any,
          resolvedContext: {
            caseId: queryObj.filter?.caseId || queryObj.access?.caseId,
            documentId: queryObj.filter?.documentIds?.[0],
            documentIds: queryObj.filter?.documentIds,
          },
          skippedReason,
        },
        fallbackUsed: false,
        confidenceState: "RETRIEVAL_SKIPPED",
        latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      };
    }

    // 1. Mandatory Tenant Boundary Assertion
    this.tenantFilter.assertTenantContext(queryObj.access);

    const topK = queryObj.topK ?? 5;
    let fallbackUsed = false;
    let fallbackReason: string | undefined;
    const warnings: string[] = [];

    // 2. Priority 1: Exact Structural Reference Resolution
    let structuralCandidates: ScoredRetrievalItem[] = [];
    try {
      if (this.structuralRetriever) {
        structuralCandidates = this.structuralRetriever.resolveStructuralReferences(
          query,
          queryObj.access,
          queryObj,
        );
      }
    } catch (err: unknown) {
      this.logger.warn(`Structural resolution error: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 3. Dense & Sparse Candidate Retrieval
    let denseCandidates: { chunk: any; score: number }[] = [];
    let sparseCandidates: { chunk: any; score: number; matchedTerms: string[] }[] = [];

    // Dense retrieval with fail-safe error isolation
    try {
      denseCandidates = await this.vectorRetriever.retrieve(query, queryObj.access, queryObj);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Vector retrieval failed, activating sparse fallback: ${msg}`);
      fallbackUsed = true;
      fallbackReason = `VECTOR_RETRIEVAL_UNAVAILABLE: ${msg}`;
      warnings.push(`Vector retrieval unavailable, executed on sparse index fallback.`);
      denseCandidates = [];
    }

    // Sparse retrieval with fail-safe error isolation
    try {
      sparseCandidates = this.lexicalRetriever.retrieve(query, queryObj.access, queryObj);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Sparse retrieval failed, activating vector fallback: ${msg}`);
      fallbackUsed = true;
      fallbackReason = `SPARSE_RETRIEVAL_UNAVAILABLE: ${msg}`;
      warnings.push(`Sparse retrieval unavailable, executed on vector index fallback.`);
      sparseCandidates = [];
    }

    const totalScanned = structuralCandidates.length + denseCandidates.length + sparseCandidates.length;

    // 4. Fusion
    let fusedItems: ScoredRetrievalItem[] = this.fusionService.fuseResults(
      query,
      denseCandidates,
      sparseCandidates,
      {
        denseWeight: queryObj.denseWeight ?? 0.50,
        sparseWeight: queryObj.sparseWeight ?? 0.50,
      },
    );

    // Prepend structural items with top priority if any were resolved
    if (structuralCandidates.length > 0) {
      const existingIds = new Set(structuralCandidates.map((s) => s.chunk.chunkId));
      const remainingFused = fusedItems.filter((f) => !existingIds.has(f.chunk.chunkId));
      fusedItems = [...structuralCandidates, ...remainingFused];
    }

    // 5. Reranking (if enabled, default true)
    if (queryObj.enableReranking !== false && fusedItems.length > 0) {
      fusedItems = this.rerankerService.rerankCandidates(query, fusedItems, {
        targetVersion: queryObj.filter?.versions?.[0],
        boostCurrentVersion: queryObj.filter?.versions ? false : (queryObj.filter?.onlyCurrentVersion ?? true),
      });
    }

    // 6. Deduplication
    let deduplicated = this.deduplicator.deduplicateScoredItems(fusedItems);

    // Apply explicit targetSection filter if specified
    const targetSection = (queryObj as any).targetSection;
    if (targetSection) {
      const cleanTarget = targetSection.replace(/^(?:section|clause|schedule)\s+/i, "").trim();
      deduplicated = deduplicated.filter(
        (i) => i.chunk.section === cleanTarget || (i.chunk.section && cleanTarget.includes(i.chunk.section))
      );
    }

    // Apply explicit version filter if specified
    if (queryObj.filter?.versions && queryObj.filter.versions.length > 0) {
      const allowedVersions = new Set(queryObj.filter.versions);
      deduplicated = deduplicated.filter((i) => allowedVersions.has(i.chunk.version));
    }

    // Apply structural unit filter if specified
    if (queryObj.filter?.structuralUnits && queryObj.filter.structuralUnits.length > 0) {
      const allowedUnits = new Set(queryObj.filter.structuralUnits);
      deduplicated = deduplicated.filter((i) => allowedUnits.has(i.chunk.structuralUnit));
    }

    // 7. Security Post-Filter Verification
    const authorizedItems = this.docFilter.filterAuthorizedDocuments(deduplicated, queryObj.access);
    this.docFilter.assertAllItemsAuthorized(authorizedItems, queryObj.access);

    // 8. Evidence Admission Policy Evaluation (Decouple raw score from true legal adequacy)
    const candidatePayloads = authorizedItems.map((item) => ({
      chunkId: item.chunk.chunkId,
      documentId: item.chunk.documentId,
      title: item.chunk.documentName,
      section: item.chunk.section,
      content: item.chunk.content,
      exactText: item.chunk.content,
      finalScore: item.finalScore,
      authorityLevel:
        (item.chunk.metadata as any)?.sourceAuthority ||
        (item.chunk.metadata?.documentKind === "STATUTORY_ACT"
          ? "OFFICIAL_PRIMARY"
          : item.chunk.metadata?.firmId || item.chunk.metadata?.caseId
          ? "VERIFIED_FIRM_SOURCE"
          : "UNVERIFIED"),
      provenance: {
        sourceAuthority:
          (item.chunk.metadata as any)?.sourceAuthority ||
          (item.chunk.metadata?.documentKind === "STATUTORY_ACT"
            ? "OFFICIAL_PRIMARY"
            : item.chunk.metadata?.firmId || item.chunk.metadata?.caseId
            ? "VERIFIED_FIRM_SOURCE"
            : "UNVERIFIED"),
        firmId: (item.chunk.metadata as any)?.firmId,
        currentStatus: (item.chunk.metadata as any)?.currentStatus,
      },
      rawItem: item,
    }));

    const admissionResult = this.admissionPolicyInstance.evaluateCandidates(
      {
        query,
        access: queryObj.access,
        filter: queryObj.filter as any,
      },
      candidatePayloads,
    );

    // Map admitted operative evidence back to ScoredRetrievalItem
    const operativeIdSet = new Set(admissionResult.operativeEvidence.map((op) => op.chunkId));
    const operativeItems: ScoredRetrievalItem[] = [];

    for (const item of authorizedItems) {
      if (operativeIdSet.has(item.chunk.chunkId)) {
        const opMetrics = admissionResult.operativeEvidence.find((op) => op.chunkId === item.chunk.chunkId)?.metrics;
        operativeItems.push({
          ...item,
          finalScore: opMetrics ? opMetrics.evidenceAdequacy : item.finalScore,
          rerankScore: opMetrics ? opMetrics.evidenceAdequacy : item.rerankScore,
        });
      }
    }

    // Sort admitted items by evidence adequacy descending
    operativeItems.sort((a, b) => b.finalScore - a.finalScore);

    const finalItems = operativeItems.slice(0, topK);
    const latencyMs = Math.round((performance.now() - startedAt) * 100) / 100;
    const isEmpty = finalItems.length === 0;
    const confidenceState = admissionResult.confidenceState;

    return {
      query,
      access: queryObj.access,
      items: finalItems,
      totalCandidatesScanned: totalScanned,
      retrievedCount: finalItems.length,
      isEmpty,
      retrievalSkipped: false,
      retrievalDecision: {
        required: true,
        reason: `Retrieval executed for ${queryObj.knowledgeRequirement || "DOCUMENT_GROUNDED"} query.`,
        sourceType: (queryObj.knowledgeRequirement === "CASE_GROUNDED" ? "CASE" : "DOCUMENT") as any,
        resolvedContext: {
          caseId: queryObj.filter?.caseId || queryObj.access?.caseId,
          documentId: queryObj.filter?.documentIds?.[0],
          documentIds: queryObj.filter?.documentIds,
        },
      },
      fallbackUsed,
      fallbackReason,
      confidenceState,
      latencyMs,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}
