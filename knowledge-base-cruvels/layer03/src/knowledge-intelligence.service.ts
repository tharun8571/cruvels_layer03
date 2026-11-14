import { Injectable, Logger } from "@nestjs/common";
import { ContextAssemblerService } from "./context/context-assembler";
import type {
  AccessContext,
  IKnowledgeRepository,
  KnowledgeEvidenceDto,
  KnowledgeSearchQuery,
  KnowledgeSearchResponse,
} from "./contracts/knowledge-repository.interface";
import { BenchmarkRunnerService } from "./evaluation/benchmark-runner";
import { DocumentIngestorService } from "./ingestion/document-ingestor";
import { MetadataIndexService } from "./indexing/metadata-index";
import { SparseIndexService } from "./indexing/sparse-index";
import { VectorIndexService } from "./indexing/vector-index";
import type {
  AssembledContextEnvelope,
  EvaluationMetrics,
  IngestionOptions,
  IngestionResult,
  KnowledgeRetrievalQuery,
  RetrievalResult,
} from "./knowledge-intelligence.types";
import { KnowledgeRepositoryService } from "./repository/knowledge-repository.service";
import { HybridRetrieverService } from "./retrieval/hybrid-retriever";

@Injectable()
export class KnowledgeIntelligenceService {
  private readonly logger = new Logger(KnowledgeIntelligenceService.name);

  constructor(
    private readonly repository: KnowledgeRepositoryService,
    private readonly ingestor: DocumentIngestorService,
    private readonly hybridRetriever: HybridRetrieverService,
    private readonly contextAssembler: ContextAssemblerService,
    private readonly benchmarkRunner: BenchmarkRunnerService,
    private readonly sparseIndex: SparseIndexService,
    private readonly vectorIndex: VectorIndexService,
    private readonly metadataIndex: MetadataIndexService,
  ) {}

  /**
   * Returns the underlying decoupled KnowledgeRepository interface.
   */
  getRepository(): IKnowledgeRepository {
    return this.repository;
  }

  /**
   * 1. Multi-Modal Knowledge Search (Layer 03 search contract)
   */
  async search(query: KnowledgeSearchQuery): Promise<KnowledgeSearchResponse> {
    return this.repository.search(query);
  }

  /**
   * 2. Evidence Retrieval (Returns structured, provenance-preserving KnowledgeEvidence)
   */
  async retrieveEvidence(query: KnowledgeSearchQuery): Promise<KnowledgeEvidenceDto[]> {
    return this.repository.retrieveEvidence(query);
  }

  /**
   * 3. Document Resolution
   */
  async resolveDocument(documentId: string, access?: AccessContext): Promise<any | null> {
    return this.repository.getDocumentById(documentId, access);
  }

  /**
   * 4. Version & Temporal Resolution ("What was document at date T?")
   */
  async resolveVersion(
    documentId: string,
    versionTagOrDate?: string,
    access?: AccessContext,
  ): Promise<any | null> {
    return this.repository.resolveVersion(documentId, versionTagOrDate, access);
  }

  /**
   * 5. Structural Hierarchy Resolution (Exact Section / Clause / Article tree node)
   */
  async resolveStructure(
    documentId: string,
    versionId: string,
    identifier: string,
    access?: AccessContext,
  ): Promise<any | null> {
    return this.repository.resolveStructure(documentId, versionId, identifier, access);
  }

  /**
   * 6. Hybrid dense + sparse search
   */
  async searchHybrid(query: KnowledgeSearchQuery): Promise<KnowledgeSearchResponse> {
    return this.repository.search(query);
  }

  /**
   * 7. Ingestion: Ingests, parses, detects structure, chunks, and indexes a legal document.
   */
  async ingestDocument(
    input: Buffer | string,
    fileName: string,
    options: IngestionOptions,
  ): Promise<IngestionResult> {
    const result = await this.ingestor.ingestDocument(input, fileName, options);

    // Populate indexes
    for (const chunk of result.chunks) {
      chunk.metadata.firmId = options.firmId;
      chunk.metadata.caseId = options.caseId;
      chunk.metadata.workspaceId = options.workspaceId;

      this.sparseIndex.indexDocument({
        id: chunk.chunkId,
        firmId: options.firmId,
        caseId: options.caseId,
        documentId: chunk.documentId,
        content: chunk.content,
      });

      this.metadataIndex.indexChunk(chunk, options.firmId, options.caseId);
    }

    return result;
  }

  /**
   * 8. Legacy Context Assembly: Assembles grounded, sanitized evidence envelope with standardized citations.
   */
  assembleContext(
    retrievalResult: RetrievalResult,
    maxContextTokens?: number,
  ): AssembledContextEnvelope {
    return this.contextAssembler.assembleContext(retrievalResult, {
      maxContextTokens,
    });
  }

  /**
   * 9. Legacy Hybrid Retrieval
   */
  async retrieve(query: KnowledgeRetrievalQuery): Promise<RetrievalResult> {
    return this.hybridRetriever.retrieve(query);
  }

  /**
   * 10. End-to-End Query-to-Context Pipeline.
   */
  async queryAndAssemble(
    query: string,
    access: any,
    options?: Partial<KnowledgeRetrievalQuery>,
  ): Promise<AssembledContextEnvelope> {
    const retrieval = await this.retrieve({
      query,
      access,
      ...options,
    });

    return this.assembleContext(retrieval, options?.maxTokens);
  }

  /**
   * 11. Evaluation: Runs complete 10-scenario benchmark suite and returns metrics.
   */
  async runEvaluation(): Promise<{ metrics: EvaluationMetrics; passed: boolean }> {
    const res = await this.benchmarkRunner.runBenchmarks();
    return {
      metrics: res.metrics,
      passed: res.passed,
    };
  }
}
