import { Module, forwardRef } from "@nestjs/common";
import { AccessControlService } from "../../../common/access-control.service";
import { PrismaService } from "../../../common/prisma.service";
import { CaseIntelligenceModule } from "../../case-intelligence/case-intelligence.module";
import { AiGatewayModule } from "../08-gateway/ai-gateway.module";

// Ingestion
import { DocumentIngestorService } from "./ingestion/document-ingestor";
import { FileValidatorService } from "./ingestion/file-validator";
import { MetadataExtractorService } from "./ingestion/metadata-extractor";
import { LegalCorpusIngestorService } from "./ingestion/legal-corpus-ingestor.service";

// Parsing
import { DocxParserService } from "./parsing/docx-parser";
import { PdfParserService } from "./parsing/pdf-parser";
import { TableParserService } from "./parsing/table-parser";
import { TextParserService } from "./parsing/text-parser";

// OCR
import { OcrDetectorService } from "./ocr/ocr-detector";
import { OcrEngineService } from "./ocr/ocr-engine";
import { OcrQualityService } from "./ocr/ocr-quality";

// Structure
import { AnnexureDetectorService } from "./structure/annexure-detector";
import { ArticleDetectorService } from "./structure/article-detector";
import { ClauseDetectorService } from "./structure/clause-detector";
import { DocumentStructureDetectorService } from "./structure/document-structure-detector";
import { ScheduleDetectorService } from "./structure/schedule-detector";
import { SectionDetectorService } from "./structure/section-detector";
import { CaseStructureDetector } from "./structure/case-structure-detector";
import { ConstitutionStructureDetector } from "./structure/constitution-structure-detector";
import { ConstitutionCompletenessValidator } from "./structure/constitution-completeness-validator";
import { CaseLawIngestorService } from "./ingestion/case-law-ingestor.service";
import { LegalKnowledgeGraphService } from "./knowledge-graph/legal-knowledge-graph.service";
import { PrecedentGraphService } from "./knowledge-graph/precedent-graph.service";
import { LegalSourceRegistryService } from "./repository/legal-source-registry.service";
import { StateJurisdictionService } from "./repository/state-jurisdiction.service";
import { DelegatedLegislationRegistryService } from "./repository/delegated-legislation-registry.service";
import { CentralLegislationInventoryService } from "./repository/central-legislation-inventory.service";
import { KnowledgeGapDetectorService } from "./evaluation/knowledge-gap-detector.service";

// Chunking
import { ChunkValidatorService } from "./chunking/chunk-validator";
import { DocumentChunkingService } from "./chunking/document-chunking.service";
import { LegalStructureChunkerService } from "./chunking/legal-structure-chunker";
import { SemanticChunkerService } from "./chunking/semantic-chunker";
import { DocumentExtractorService } from "./chunking/services/document-extractor.service";
import { RawDocumentParserService } from "./chunking/services/raw-document-parser.service";
import { TextChunkerService } from "./chunking/services/text-chunker.service";
import { TextNormalizerService } from "./chunking/services/text-normalizer.service";
import { TokenBoundarySplitterService } from "./chunking/token-boundary-splitter";

// Indexing
import { EmbeddingService } from "./embedding/embedding.service";
import { MetadataIndexService } from "./indexing/metadata-index";
import { SparseIndexService } from "./indexing/sparse-index";
import { VectorIndexService } from "./indexing/vector-index";

// Retrieval
import { ChunkDeduplicatorService } from "./retrieval/deduplicator";
import { HybridFusionService } from "./retrieval/fusion";
import { HybridRetrieverService } from "./retrieval/hybrid-retriever";
import { ImportanceScorerService } from "./retrieval/importance-scorer.service";
import { LexicalRetrieverService } from "./retrieval/lexical-retriever";
import { LegalRerankerService } from "./retrieval/reranker";
import { StructuralRetrieverService } from "./retrieval/structural-retriever";
import { VectorRetrieverService } from "./retrieval/vector-retriever";
import { VectorRetrievalService } from "./retrieval/vector-retrieval.service";
import { RetrievalPolicyService } from "./retrieval/retrieval-policy.service";
import { EvidenceAdmissionPolicy } from "./retrieval/evidence-admission.policy";

// Access
import { DocumentPermissionFilterService } from "./access/document-permission-filter";
import { MatterFilterService } from "./access/matter-filter";
import { TenantFilterService } from "./access/tenant-filter";
import { WorkspaceFilterService } from "./access/workspace-filter";

// Context
import { CitationBuilderService } from "./context/citation-builder";
import { ContextAssemblerService } from "./context/context-assembler";
import { ContextBudgeterService } from "./context/context-budgeter";
import { DocumentKnowledgeStoreService } from "./context/document-knowledge-store.service";
import { RagContextService } from "./context/rag-context.service";
import { DeterministicRerankerService } from "./context/services/deterministic-reranker.service";
import { MatterContextResolverService } from "./context/services/matter-context-resolver.service";

// Evaluation
import { BenchmarkRunnerService } from "./evaluation/benchmark-runner";
import { KnowledgeBenchmarkService } from "./evaluation/knowledge-benchmark.service";
import { Layer03EvaluationSuiteService } from "./evaluation/evaluation-suite";
import { MetricsCalculatorService } from "./evaluation/metrics";

// Knowledge Base Core Services (Layer 03 First-Class Infrastructure)
import { EmbeddingProviderService } from "./embedding/embedding-provider.service";
import { KnowledgeRepositoryService } from "./repository/knowledge-repository.service";
import { SeedCorpusService } from "./corpus/seed-corpus.service";

// Master Service
import { KnowledgeIntelligenceService } from "./knowledge-intelligence.service";

const PROVIDERS = [
  PrismaService,
  AccessControlService,

  // Knowledge Base Core Repository & Embeddings
  KnowledgeRepositoryService,
  EmbeddingProviderService,
  SeedCorpusService,

  // Ingestion
  FileValidatorService,
  MetadataExtractorService,
  DocumentIngestorService,
  LegalCorpusIngestorService,

  // Parsing
  TextParserService,
  TableParserService,
  PdfParserService,
  DocxParserService,

  // OCR
  OcrDetectorService,
  OcrEngineService,
  OcrQualityService,

  // Structure
  ArticleDetectorService,
  SectionDetectorService,
  ClauseDetectorService,
  ScheduleDetectorService,
  AnnexureDetectorService,
  DocumentStructureDetectorService,
  CaseStructureDetector,
  ConstitutionStructureDetector,
  ConstitutionCompletenessValidator,
  CaseLawIngestorService,
  LegalKnowledgeGraphService,
  PrecedentGraphService,
  LegalSourceRegistryService,
  StateJurisdictionService,
  DelegatedLegislationRegistryService,
  CentralLegislationInventoryService,
  KnowledgeGapDetectorService,

  // Chunking
  TokenBoundarySplitterService,
  ChunkValidatorService,
  SemanticChunkerService,
  LegalStructureChunkerService,
  TextChunkerService,
  TextNormalizerService,
  RawDocumentParserService,
  DocumentExtractorService,
  DocumentChunkingService,

  // Indexing
  EmbeddingService,
  VectorIndexService,
  SparseIndexService,
  MetadataIndexService,

  // Retrieval
  ImportanceScorerService,
  ChunkDeduplicatorService,
  HybridFusionService,
  LegalRerankerService,
  StructuralRetrieverService,
  VectorRetrieverService,
  LexicalRetrieverService,
  HybridRetrieverService,
  VectorRetrievalService,
  RetrievalPolicyService,
  EvidenceAdmissionPolicy,

  // Access
  TenantFilterService,
  WorkspaceFilterService,
  MatterFilterService,
  DocumentPermissionFilterService,

  // Context
  CitationBuilderService,
  ContextBudgeterService,
  ContextAssemblerService,
  DocumentKnowledgeStoreService,
  DeterministicRerankerService,
  MatterContextResolverService,
  RagContextService,

  // Evaluation
  MetricsCalculatorService,
  Layer03EvaluationSuiteService,
  BenchmarkRunnerService,
  KnowledgeBenchmarkService,

  // Master Service
  KnowledgeIntelligenceService,
];

@Module({
  imports: [
    AiGatewayModule,
    forwardRef(() => CaseIntelligenceModule),
  ],
  providers: PROVIDERS,
  exports: PROVIDERS,
})
export class KnowledgeIntelligenceModule {}

