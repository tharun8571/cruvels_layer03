/**
 * CRUVELS AI — Layer 03: Knowledge Repository Contract Interface
 *
 * Provides a clean, decoupled abstraction over storage backends (PostgreSQL/pgvector,
 * relational metadata, and in-memory caches) for Layer 03 Knowledge Intelligence.
 */

import type {
  KnowledgeAuthorityLevel,
  KnowledgeCollectionType,
  KnowledgeDocumentStatus,
  KnowledgeDocumentType,
  KnowledgeIngestionStatus,
  KnowledgeJurisdiction,
  KnowledgeNodeType,
  KnowledgeRelationType,
  KnowledgeSourceType,
  KnowledgeUpdatePolicy,
  KnowledgeVerificationStatus,
  KnowledgeVersionStatus,
} from "@prisma/client";

export interface AccessContext {
  userId: string;
  firmId: string; // Tenant ID
  tenantId?: string;
  workspaceId?: string;
  caseId?: string; // Matter ID
  matterId?: string;
  allowedDocumentIds?: string[];
  userRoles?: string[];
  roles?: string[];
  isSuperAdmin?: boolean;
}

export interface CreateKnowledgeSourceDto {
  id?: string;
  name: string;
  sourceType: KnowledgeSourceType;
  authorityLevel: KnowledgeAuthorityLevel;
  jurisdiction?: KnowledgeJurisdiction;
  country?: string;
  state?: string;
  court?: string;
  publisher?: string;
  sourceUrl?: string;
  license?: string;
  trustLevel?: number;
  updatePolicy?: KnowledgeUpdatePolicy;
  verificationStatus?: KnowledgeVerificationStatus;
  metadata?: Record<string, unknown>;
}

export interface CreateKnowledgeCollectionDto {
  id?: string;
  name: string;
  type: KnowledgeCollectionType;
  firmId?: string;
  workspaceId?: string;
  caseId?: string;
  userId?: string;
  description?: string;
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

export interface RegisterKnowledgeDocumentDto {
  id?: string;
  sourceId: string;
  collectionId: string;
  title: string;
  documentType: KnowledgeDocumentType;
  jurisdiction?: KnowledgeJurisdiction;
  authorityLevel: KnowledgeAuthorityLevel;
  language?: string;
  publicationDate?: Date | string;
  effectiveFrom?: Date | string;
  effectiveTo?: Date | string;
  currentStatus?: KnowledgeDocumentStatus;
  currentVersion?: string;
  contentHash: string;
  sourceHash?: string;
  sourceUrl?: string;
  firmId?: string;
  workspaceId?: string;
  caseId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface RegisterKnowledgeVersionDto {
  id?: string;
  documentId: string;
  versionTag: string;
  versionNumber?: number;
  effectiveFrom?: Date | string;
  effectiveTo?: Date | string;
  supersedesVersionId?: string;
  supersededByVersionId?: string;
  amendmentReferences?: string[];
  changeSummary?: string;
  contentHash: string;
  status?: KnowledgeVersionStatus;
  rawContentUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeNodeDto {
  id?: string;
  documentId: string;
  versionId: string;
  parentNodeId?: string;
  nodeType: KnowledgeNodeType;
  identifier: string; // e.g. "Section 8", "8.2", "8.2(a)", "Article 14", "Schedule II"
  title?: string;
  orderIndex?: number;
  depth?: number;
  startPage?: number;
  endPage?: number;
  text: string;
  textHash: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeChunkDto {
  id?: string;
  documentId: string;
  versionId: string;
  nodeId?: string;
  parentNodeId?: string;
  collectionId?: string;
  firmId?: string;
  caseId?: string;
  userId?: string;
  chunkIndex: number;
  structuralUnit: KnowledgeNodeType;
  section?: string;
  subsection?: string;
  clause?: string;
  schedule?: string;
  annexure?: string;
  page?: number;
  pageEnd?: number;
  position?: number;
  content: string;
  tokenCount?: number;
  characterCount?: number;
  textHash: string;
  isOperativeClause?: boolean;
  isTable?: boolean;
  ocrConfidence?: number;
  ocrQualityWarning?: boolean;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeEmbeddingDto {
  id?: string;
  chunkId: string;
  provider: string;
  model: string;
  dimensions: number;
  version: string;
  embedding: number[];
  textHash: string;
}

export interface KnowledgeRelationDto {
  id?: string;
  sourceDocumentId: string;
  sourceVersionId?: string;
  sourceNodeId?: string;
  targetDocumentId: string;
  targetVersionId?: string;
  targetNodeId?: string;
  relationType: KnowledgeRelationType;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeCitationDto {
  id?: string;
  documentId: string;
  nodeId?: string;
  citationText: string;
  normalizedCitation: string;
  citationType?: string;
  targetDocumentId?: string;
  targetNodeId?: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeEvidenceDto {
  id?: string;
  evidenceId: string;
  sourceId: string;
  documentId: string;
  versionId: string;
  nodeId?: string;
  chunkId?: string;
  title: string;
  section?: string;
  subsection?: string;
  page: number;
  exactText: string;
  sourceUrl?: string;
  authorityLevel: KnowledgeAuthorityLevel;
  jurisdiction: KnowledgeJurisdiction;
  effectiveDate?: Date | string;
  retrievalMethod: string;
  retrievalScore: number;
  contentHash: string;
  provenanceChain?: Record<string, unknown>;
}

export interface KnowledgeIngestionJobDto {
  id?: string;
  sourceId?: string;
  documentId?: string;
  versionTag?: string;
  status: KnowledgeIngestionStatus;
  progressPercentage?: number;
  totalNodes?: number;
  totalChunks?: number;
  totalEmbeddings?: number;
  pageCount?: number;
  ocrApplied?: boolean;
  ocrConfidence?: number;
  durationMs?: number;
  quarantineReason?: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeIngestionErrorDto {
  jobId: string;
  stage: string;
  errorCode: string;
  errorMessage: string;
  errorDetails?: Record<string, unknown>;
}

export interface RetrievalFilter {
  collectionTypes?: KnowledgeCollectionType[];
  documentIds?: string[];
  versionTag?: string;
  asOfDate?: Date | string;
  jurisdiction?: KnowledgeJurisdiction;
  minAuthorityLevel?: KnowledgeAuthorityLevel;
  nodeTypes?: KnowledgeNodeType[];
  sectionIdentifiers?: string[];
  firmId?: string;
  caseId?: string;
  isOperativeOnly?: boolean;
  includeGeneralKnowledge?: boolean;
}

export interface KnowledgeSearchQuery {
  query: string;
  access: AccessContext;
  filter?: RetrievalFilter;
  topK?: number;
  denseWeight?: number;
  sparseWeight?: number;
  enableReranking?: boolean;
  minScoreThreshold?: number;
}

export interface ResolvedProvenance {
  sourceId: string;
  sourceName: string;
  sourceAuthority: KnowledgeAuthorityLevel;
  sourceUrl?: string;
  documentId: string;
  documentTitle: string;
  documentType: KnowledgeDocumentType;
  legalDomain?: string;
  versionId: string;
  versionTag: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  nodeId?: string;
  nodeIdentifier?: string;
  nodeType?: KnowledgeNodeType;
  chunkId: string;
  pageNumber: number;
  contentHash: string;
}

export interface KnowledgeSearchResultItem {
  evidenceId: string;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  versionId: string;
  versionTag: string;
  nodeId?: string;
  nodeIdentifier?: string;
  structuralUnit: KnowledgeNodeType;
  section?: string;
  clause?: string;
  page: number;
  pageEnd: number;
  content: string;
  authorityLevel: KnowledgeAuthorityLevel;
  jurisdiction: KnowledgeJurisdiction;
  legalDomain?: string;
  retrievalMethod: string;
  denseScore: number;
  sparseScore: number;
  fusedScore: number;
  rerankScore: number;
  finalScore: number;
  exactStructuralMatch: boolean;
  exactCitationMatch: boolean;
  provenance: ResolvedProvenance;
}

export interface KnowledgeSearchResponse {
  query: string;
  access: AccessContext;
  items: KnowledgeSearchResultItem[];
  totalScanned: number;
  retrievedCount: number;
  confidenceState: "HIGH" | "MEDIUM" | "LOW" | "NO_RELEVANT_EVIDENCE" | "JURISDICTION_REQUIRED";
  jurisdictionWarning?: string;
  latencyMs: number;
  evidenceAdmission?: {
    admittedCount: number;
    rejectedCount: number;
    overallAdequacyScore: number;
    rationale: string;
  };
}

export interface IKnowledgeRepository {
  // Sources
  createSource(source: CreateKnowledgeSourceDto): Promise<any>;
  getSourceById(id: string): Promise<any | null>;
  listSources(jurisdiction?: KnowledgeJurisdiction): Promise<any[]>;

  // Collections
  createCollection(collection: CreateKnowledgeCollectionDto): Promise<any>;
  getCollectionById(id: string): Promise<any | null>;

  // Documents & Versions
  registerDocument(doc: RegisterKnowledgeDocumentDto): Promise<any>;
  getDocumentById(id: string, access?: AccessContext): Promise<any | null>;
  registerVersion(version: RegisterKnowledgeVersionDto): Promise<any>;
  resolveVersion(documentId: string, versionTagOrDate?: string, access?: AccessContext): Promise<any | null>;

  // Structural Hierarchy
  insertNodes(nodes: KnowledgeNodeDto[]): Promise<any[]>;
  resolveStructure(documentId: string, versionId: string, identifier: string, access?: AccessContext): Promise<any | null>;
  getNodeHierarchy(documentId: string, versionId: string): Promise<any[]>;

  // Chunks & Embeddings
  indexChunks(chunks: KnowledgeChunkDto[], embeddings?: KnowledgeEmbeddingDto[]): Promise<void>;

  // Multi-Document Relations & Citations
  createRelations(relations: KnowledgeRelationDto[]): Promise<any[]>;
  getRelatedDocuments(documentId: string, access?: AccessContext): Promise<any[]>;
  createCitations(citations: KnowledgeCitationDto[]): Promise<any[]>;
  resolveCitation(citationText: string): Promise<any | null>;

  // Multi-Modal Retrieval
  search(query: KnowledgeSearchQuery): Promise<KnowledgeSearchResponse>;
  retrieveEvidence(query: KnowledgeSearchQuery): Promise<KnowledgeEvidenceDto[]>;

  // Ingestion Jobs & Telemetry
  recordIngestionJob(job: KnowledgeIngestionJobDto): Promise<any>;
  recordIngestionError(error: KnowledgeIngestionErrorDto): Promise<void>;
  getIngestionJobStatus(jobId: string): Promise<any | null>;
}
