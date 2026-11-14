/**
 * CRUVELS AI — Layer 03: Knowledge Intelligence & RAG Types
 *
 * Master contracts and type definitions for Legal Ingestion, Parsing, OCR,
 * Structural Hierarchy, Legal Chunking, Indexing, Hybrid Retrieval,
 * Access Security, Context Assembly, and Evaluation.
 */

export * from "./contracts/legal-source.contract";

export type LegalStructuralUnitType =
  | "ARTICLE"
  | "SECTION"
  | "SUBSECTION"
  | "CLAUSE"
  | "SUBCLAUSE"
  | "SCHEDULE"
  | "ANNEXURE"
  | "EXHIBIT"
  | "PARAGRAPH"
  | "PAGE"
  | "PREAMBLE"
  | "RECITAL"
  | "DEFINITION"
  | "TABLE"
  | "SIGNATURE_BLOCK"
  | "EXPLANATION"
  | "PROVISO"
  | "ILLUSTRATION";

export type LegalDocumentKind =
  | "CONSTITUTION"
  | "STATUTORY_ACT"
  | "CODE"
  | "RULE"
  | "REGULATION"
  | "NOTIFICATION"
  | "CIRCULAR"
  | "ORDER"
  | "JUDGMENT"
  | "SUPREME_COURT_JUDGMENT"
  | "HIGH_COURT_JUDGMENT"
  | "CONTRACT"
  | "MSA"
  | "NDA"
  | "SLA"
  | "EMPLOYMENT_AGREEMENT"
  | "POLICY"
  | "PETITION"
  | "WRIT_PETITION"
  | "CHARGE_SHEET"
  | "COURT_ORDER"
  | "AFFIDAVIT"
  | "NOTICE"
  | "GENERAL_DOCUMENT"
  | "USER_DOCUMENT"
  | "CASE_DOCUMENT";

export type Jurisdiction = "INDIAN" | "US" | "UK" | "EU" | "INTERNATIONAL" | "UNKNOWN";

export interface DocumentMetadata {
  documentId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  contentHash: string; // SHA-256
  title?: string;
  author?: string;
  createdAt?: string;
  modifiedAt?: string;
  version: string;
  isCurrentVersion: boolean;
  effectiveDate?: string;
  expiryDate?: string;
  documentKind: LegalDocumentKind;
  jurisdiction: Jurisdiction;
  governingLaw?: string;
  parties?: string[];
  statutoryCitations?: string[];
  pageCount: number;
  isScanned?: boolean;
  ocrConfidence?: number;
  ocrQualityWarning?: boolean;
  tags?: string[];
  customAttributes?: Record<string, unknown>;
}

export interface ExtractedPageData {
  pageNumber: number;
  text: string;
  characterCount: number;
  tokenCount: number;
  isScanned?: boolean;
  ocrConfidence?: number;
  ocrQualityWarning?: boolean;
  tables?: ExtractedTable[];
  headings?: string[];
}

export interface ExtractedTable {
  tableIndex: number;
  pageNumber: number;
  title?: string;
  headers: string[];
  rows: string[][];
  markdown: string;
  isFinancialSchedule?: boolean;
  isFeeMatrix?: boolean;
}

export interface LegalStructuralNode {
  type: LegalStructuralUnitType;
  identifier: string; // e.g., "Article VIII", "Section 8.2", "Clause 8.2(a)", "Schedule B"
  title?: string;
  pageNumber: number;
  pageEndNumber: number;
  startOffset: number;
  endOffset: number;
  rawText: string;
  children: LegalStructuralNode[];
  parentIdentifier?: string;
}

export interface LegalDocumentStructure {
  documentId: string;
  title?: string;
  preamble?: string;
  recitals?: string[];
  articles: LegalStructuralNode[];
  sections: LegalStructuralNode[];
  clauses: LegalStructuralNode[];
  schedules: LegalStructuralNode[];
  annexures: LegalStructuralNode[];
  exhibits: LegalStructuralNode[];
  tables: ExtractedTable[];
}

export interface LegalChunk {
  chunkId: string;
  citationId: string; // e.g. "[1]"
  documentId: string;
  documentName: string;
  version: string;
  isCurrentVersion: boolean;
  pageNumber: number;
  pageEndNumber: number;
  section?: string;
  clause?: string;
  article?: string;
  schedule?: string;
  annexure?: string;
  exhibit?: string;
  structuralUnit: LegalStructuralUnitType;
  content: string;
  rawSourceText: string;
  startOffset: number;
  endOffset: number;
  tokenCount: number;
  characterCount: number;
  contentHash: string; // SHA-256
  isOperativeClause: boolean;
  isTable: boolean;
  ocrConfidence?: number;
  ocrQualityWarning?: boolean;
  metadata: Record<string, unknown>;
}

export interface AccessContext {
  userId: string;
  firmId: string; // Tenant ID
  workspaceId?: string;
  caseId?: string; // Matter ID
  allowedDocumentIds?: string[];
  userRoles?: string[];
  isSuperAdmin?: boolean;
}

export interface IngestionOptions {
  firmId: string;
  workspaceId?: string;
  caseId?: string;
  documentId?: string;
  version?: string;
  isCurrentVersion?: boolean;
  generateEmbeddings?: boolean;
  ocrEnabled?: boolean;
  forceOcr?: boolean;
  ocrConfidenceThreshold?: number;
  maxChunkTokens?: number;
  overlapTokens?: number;
}

export interface IngestionResult {
  documentId: string;
  fileName: string;
  contentHash: string;
  metadata: DocumentMetadata;
  structure: LegalDocumentStructure;
  chunks: LegalChunk[];
  totalChunks: number;
  totalTokens: number;
  pageCount: number;
  ocrApplied: boolean;
  ocrConfidence?: number;
  ocrQualityWarning?: boolean;
  durationMs: number;
  ingestedAt: string;
}

export interface RetrievalFilter {
  firmId: string;
  workspaceId?: string;
  caseId?: string;
  documentIds?: string[];
  versions?: string[];
  onlyCurrentVersion?: boolean;
  structuralUnits?: LegalStructuralUnitType[];
  documentKinds?: LegalDocumentKind[];
  minOcrConfidence?: number;
  maxDistance?: number;
}

export type RetrievalSourceType =
  | "NONE"
  | "GENERAL"
  | "LEGAL"
  | "DOCUMENT"
  | "CASE"
  | "EXTERNAL";

export interface RetrievalDecisionTelemetry {
  required: boolean;
  reason: string;
  sourceType: RetrievalSourceType;
  resolvedContext?: {
    caseId?: string;
    documentId?: string;
    documentIds?: string[];
  };
  skippedReason?: string;
  groundingRequirement?: string;
  evidenceRequirement?: string;
}

export interface KnowledgeRetrievalQuery {
  query: string;
  access: AccessContext;
  filter?: Partial<RetrievalFilter>;
  knowledgeRequirement?: string;
  contextBinding?: string;
  retrievalRequired?: boolean;
  topK?: number;
  maxTokens?: number;
  denseWeight?: number; // 0.0 - 1.0 (default 0.5)
  sparseWeight?: number; // 0.0 - 1.0 (default 0.5)
  enableReranking?: boolean;
  enableSynonymExpansion?: boolean;
  exactMatchBoost?: number;
  requireExplanation?: boolean;
}

export interface ScoredRetrievalItem {
  chunk: LegalChunk;
  denseScore: number;
  sparseScore: number;
  fusedScore: number;
  rerankScore: number;
  finalScore: number;
  rank: number;
  matchedTerms: string[];
  exactCitationMatch: boolean;
  provenance: string;
  scoreBreakdown: {
    dense: number;
    sparse: number;
    exactPhrase: number;
    versionBoost: number;
    operativeBoost: number;
    boilerplatePenalty: number;
  };
}

export interface RetrievalResult {
  query: string;
  access: AccessContext;
  items: ScoredRetrievalItem[];
  totalCandidatesScanned: number;
  retrievedCount: number;
  isEmpty: boolean;
  retrievalSkipped?: boolean;
  retrievalDecision?: RetrievalDecisionTelemetry;
  fallbackUsed: boolean;
  fallbackReason?: string;
  confidenceState: "HIGH" | "MEDIUM" | "LOW" | "NO_RELEVANT_EVIDENCE" | "RETRIEVAL_SKIPPED" | "JURISDICTION_REQUIRED";
  latencyMs: number;
  warnings?: string[];
}

export interface EvidenceCitation {
  citationNumber: number;
  citationId: string; // e.g. "[1]"
  documentId: string;
  documentName: string;
  version: string;
  isCurrentVersion: boolean;
  pageNumber: number;
  section?: string;
  clause?: string;
  schedule?: string;
  formattedCitation: string; // "[MSA v2.0, § 8.2 at Page 4]"
  contentHash: string;
  isScanned?: boolean;
  ocrQualityWarning?: boolean;
}

export interface AssembledContextEnvelope {
  query: string;
  contextText: string;
  items: ScoredRetrievalItem[];
  citations: EvidenceCitation[];
  totalTokenCount: number;
  budgetAllocatedTokens: number;
  budgetUsedTokens: number;
  truncated: boolean;
  sanitized: boolean; // Prompt injection neutralization applied
  assembledAt: string;
}

export interface EvaluationMetrics {
  recallAtK: number;
  precisionAtK: number;
  mrr: number; // Mean Reciprocal Rank
  ndcg: number; // Normalized Discounted Cumulative Gain
  rerankingImprovementPercentage: number;
  citationPreservationRate: number;
  pagePreservationRate: number;
  tenantIsolationPassRate: number; // Must be 1.0 (100%)
  latencyP50Ms: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  testCount: number;
  passedCount: number;
  failedCount: number;
}

export interface GroundedAnswerClaim {
  text: string;
  source?: string;
  sourceId?: string;
  documentId: string;
  section?: string;
  clause?: string;
  page: number;
  evidence: string;
}

export interface GroundedAnswerResult {
  answerType:
    | "DOCUMENT_GROUNDED"
    | "PERMITTED_MODEL_KNOWLEDGE"
    | "STATUTORY_GROUNDED"
    | "CASE_LAW_GROUNDED"
    | "MATTER_GROUNDED"
    | "LEGAL_KNOWLEDGE_GROUNDED"
    | "UNSUPPORTED_LEGAL_GROUNDING"
    | "NO_GROUNDED_EVIDENCE"
    | "INSUFFICIENT_EVIDENCE"
    | "TOOL_OUTPUT";
  query: string;
  claims: GroundedAnswerClaim[];
  evidenceCount: number;
  unsupportedSectionsOmitted?: string[];
  permittedModelKnowledge?: boolean;
  disclaimer?: string;
  groundingRequirement?: string;
  evidenceRequirement?: string;
  assembledAt: string;
}


