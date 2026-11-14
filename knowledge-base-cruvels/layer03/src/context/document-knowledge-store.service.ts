import { Injectable, Logger } from "@nestjs/common";
import type { ExtractedPage } from "../chunking/services/raw-document-parser.service";
import type { EnrichedTextChunk } from "../chunking/services/text-chunker.service";

export interface StoredDocumentRecord {
  documentId: string;
  documentName: string;
  documentVersion?: string;
  firmId: string;
  caseId?: string;
  format: string;
  rawText: string;
  normalizedText: string;
  pages: ExtractedPage[];
  allChunks: EnrichedTextChunk[];
  indexedAt: string;
  totalTokens: number;
  metadata: Record<string, unknown>;
}

export interface RetrievalResultItem {
  rank: number;
  chunkId: string;
  citationId: string;
  documentId: string;
  documentName: string;
  documentVersion?: string;
  pageNumber: number;
  pageEndNumber: number;
  sectionHeading?: string;
  clauseNumber?: string;
  content: string;
  characterCount: number;
  tokenCount: number;
  sourceReference: string;
  similarityScore: number; // 0.0 to 1.0 (normalized BM25)
  rawBm25Score: number;
  matchedTerms: string[];
}

export interface DocumentSearchQuery {
  documentId: string;
  query: string;
  topK?: number;
  minScoreThreshold?: number;
  firmId?: string;
}

export interface MultiDocumentSearchQuery {
  query: string;
  firmId: string;
  caseId?: string;
  documentIds?: string[];
  topK?: number;
  minScoreThreshold?: number;
}

export interface DocumentSearchResponse {
  documentId?: string;
  documentName?: string;
  query: string;
  retrievalMethod: string;
  embeddingModel: string;
  vectorIndex: string;
  totalChunksInDocument: number;
  resultCount: number;
  items: RetrievalResultItem[];
  hasStrongMatch: boolean;
  searchDurationMs: number;
}

// Legal synonym dictionary for BM25 term expansion
export const LEGAL_SYNONYMS: Record<string, string[]> = {
  indemnity: ["indemnification", "hold harmless", "defend", "damages", "reimbursement"],
  indemnification: ["indemnity", "hold harmless", "defend", "damages"],
  liability: ["damages", "obligation", "responsibility", "claim", "exposure"],
  termination: ["cancellation", "expiry", "rescission", "severance", "exit"],
  notice: ["written notice", "notification", "intimation", "communication"],
  arbitration: ["dispute resolution", "arbitrator", "mediation", "tribunal"],
  jurisdiction: ["governing law", "competent court", "forum", "venue"],
  petition: ["application", "pleading", "motion", "appeal", "suit"],
  petitioner: ["appellant", "applicant", "plaintiff", "claimant"],
  respondent: ["opposite party", "defendant", "defendants", "non-applicant"],
  confidential: ["proprietary", "non-disclosure", "secrecy", "trade secret"],
  warranty: ["representation", "guarantee", "covenant", "assurance"],
};

@Injectable()
export class DocumentKnowledgeStoreService {
  private readonly logger = new Logger(DocumentKnowledgeStoreService.name);

  // In-memory document storage keyed by documentId
  private readonly documents = new Map<string, StoredDocumentRecord>();

  /**
   * Indexes and stores an uploaded document with its structured pages and chunks.
   */
  indexDocument(record: StoredDocumentRecord): StoredDocumentRecord {
    this.documents.set(record.documentId, record);
    this.logger.log(
      `Indexed document '${record.documentId}' (${record.documentName}) with ${record.pages.length} pages and ${record.allChunks.length} chunks.`,
    );
    return record;
  }

  /**
   * Retrieves an indexed document by documentId with optional firmId tenant check.
   */
  getDocument(documentId: string, firmId?: string): StoredDocumentRecord | undefined {
    const doc = this.documents.get(documentId);
    if (!doc) return undefined;
    if (firmId && doc.firmId !== firmId) return undefined;
    return doc;
  }

  /**
   * Lists all indexed documents matching firmId (and optionally caseId).
   */
  listDocuments(firmId?: string, caseId?: string): StoredDocumentRecord[] {
    const all = Array.from(this.documents.values());
    return all.filter((d) => {
      if (firmId && d.firmId !== firmId) return false;
      if (caseId && d.caseId !== caseId) return false;
      return true;
    });
  }

  /**
   * Checks if a document exists in store.
   */
  hasDocument(documentId: string): boolean {
    return this.documents.has(documentId);
  }

  /**
   * Clears the in-memory store.
   */
  clear(): void {
    this.documents.clear();
  }

  /**
   * Expands query terms with legal synonyms.
   */
  private expandTerms(terms: string[]): string[] {
    const expanded = new Set<string>(terms);
    for (const term of terms) {
      const syns = LEGAL_SYNONYMS[term.toLowerCase()];
      if (syns) {
        for (const s of syns) {
          expanded.add(s.toLowerCase());
        }
      }
    }
    return Array.from(expanded);
  }

  /**
   * Performs an isolated BM25 search over chunks of a specific document.
   */
  search(params: DocumentSearchQuery): DocumentSearchResponse {
    const startedAt = Date.now();
    const { documentId, query, topK = 5, minScoreThreshold = 0.05, firmId } = params;

    const doc = this.getDocument(documentId, firmId);
    if (!doc) {
      return {
        documentId,
        documentName: "UNKNOWN_DOCUMENT",
        query,
        retrievalMethod: "BM25 / TF-IDF Token Relevance & Lexical Density Matching (In-Memory Index)",
        embeddingModel: "NONE (Local BM25 In-Memory Index)",
        vectorIndex: "In-Memory BM25 Lexical Inverted Index scoped by documentId",
        totalChunksInDocument: 0,
        resultCount: 0,
        items: [],
        hasStrongMatch: false,
        searchDurationMs: Date.now() - startedAt,
      };
    }

    const chunks = doc.allChunks || [];
    const results = this.scoreChunks(chunks, query, topK, minScoreThreshold);

    return {
      documentId,
      documentName: doc.documentName,
      query,
      retrievalMethod: "BM25 / TF-IDF Token Relevance & Lexical Density Matching (In-Memory Index)",
      embeddingModel: "NONE (Local BM25 In-Memory Index)",
      vectorIndex: "In-Memory BM25 Lexical Inverted Index scoped by documentId",
      totalChunksInDocument: chunks.length,
      resultCount: results.length,
      items: results,
      hasStrongMatch: results.length > 0 && results[0].similarityScore >= 0.35,
      searchDurationMs: Date.now() - startedAt,
    };
  }

  /**
   * Performs multi-document BM25 retrieval across all authorized documents in the firm/case scope.
   */
  searchMultiDocument(params: MultiDocumentSearchQuery): DocumentSearchResponse {
    const startedAt = Date.now();
    const { query, firmId, caseId, documentIds, topK = 10, minScoreThreshold = 0.05 } = params;

    // Filter documents by firmId and optional caseId / documentIds
    let docs = this.listDocuments(firmId, caseId);
    if (documentIds && documentIds.length > 0) {
      docs = docs.filter((d) => documentIds.includes(d.documentId));
    }

    if (docs.length === 0) {
      return {
        query,
        retrievalMethod: "Multi-Document BM25 Lexical Search",
        embeddingModel: "NONE (Local BM25 Multi-Doc Index)",
        vectorIndex: "In-Memory Multi-Doc Inverted Index",
        totalChunksInDocument: 0,
        resultCount: 0,
        items: [],
        hasStrongMatch: false,
        searchDurationMs: Date.now() - startedAt,
      };
    }

    const allChunks: EnrichedTextChunk[] = [];
    for (const doc of docs) {
      allChunks.push(...(doc.allChunks || []));
    }

    const results = this.scoreChunks(allChunks, query, topK, minScoreThreshold);

    return {
      query,
      retrievalMethod: "Multi-Document BM25 Lexical Search",
      embeddingModel: "NONE (Local BM25 Multi-Doc Index)",
      vectorIndex: "In-Memory Multi-Doc Inverted Index",
      totalChunksInDocument: allChunks.length,
      resultCount: results.length,
      items: results,
      hasStrongMatch: results.length > 0 && results[0].similarityScore >= 0.35,
      searchDurationMs: Date.now() - startedAt,
    };
  }

  /**
   * Compares a specific clause or section across two versions of a document.
   */
  compareDocumentVersions(params: {
    baseDocId: string;
    targetDocId: string;
    query: string;
    firmId: string;
  }): { baseResults: RetrievalResultItem[]; targetResults: RetrievalResultItem[] } {
    const baseResponse = this.search({
      documentId: params.baseDocId,
      query: params.query,
      firmId: params.firmId,
      topK: 3,
    });

    const targetResponse = this.search({
      documentId: params.targetDocId,
      query: params.query,
      firmId: params.firmId,
      topK: 3,
    });

    return {
      baseResults: baseResponse.items,
      targetResults: targetResponse.items,
    };
  }

  /**
   * Core BM25 scoring algorithm over an array of EnrichedTextChunk objects.
   */
  private scoreChunks(
    chunks: EnrichedTextChunk[],
    query: string,
    topK: number,
    minScoreThreshold: number,
  ): RetrievalResultItem[] {
    if (chunks.length === 0) return [];

    const stopWords = new Set([
      "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
      "with", "by", "from", "as", "is", "are", "was", "were", "be", "been",
      "this", "that", "these", "those", "it", "its", "what", "which", "who", "whom",
      "how", "when", "where", "why", "does", "do", "did", "can", "could", "should", "would",
    ]);

    const cleanQuery = query.toLowerCase();
    const rawTerms = cleanQuery.split(/[^a-z0-9_-]+/).filter(Boolean);
    const baseTerms = rawTerms.filter((t) => t.length > 1 && !stopWords.has(t));
    const terms = this.expandTerms(baseTerms.length > 0 ? baseTerms : rawTerms);

    const k1 = 1.5;
    const b = 0.75;
    const N = chunks.length;

    const docLengths = chunks.map((c) => c.content.toLowerCase().split(/\s+/).filter(Boolean).length);
    const avgdl = docLengths.reduce((sum, len) => sum + len, 0) / Math.max(1, N);

    const docFrequency: Record<string, number> = {};
    for (const term of terms) {
      let count = 0;
      for (const chunk of chunks) {
        if (chunk.content.toLowerCase().includes(term)) {
          count++;
        }
      }
      docFrequency[term] = count;
    }

    interface ScoredChunk {
      chunk: EnrichedTextChunk;
      rawBm25: number;
      matchedTerms: string[];
    }

    const scored: ScoredChunk[] = chunks.map((chunk, idx) => {
      const contentLower = chunk.content.toLowerCase();
      const headingLower = (chunk.sectionHeading || "").toLowerCase();
      const dl = docLengths[idx];

      let score = 0;
      const matchedTerms: string[] = [];

      for (const term of terms) {
        let tf = 0;
        let pos = 0;
        while ((pos = contentLower.indexOf(term, pos)) !== -1) {
          tf++;
          pos += term.length;
        }

        if (tf > 0) {
          matchedTerms.push(term);
          const df = docFrequency[term] || 0;
          const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
          const tfWeight = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgdl)));
          score += Math.max(0, idf) * tfWeight;
        }

        // Section heading match boost
        if (headingLower.includes(term)) {
          score += 2.0;
        }
      }

      // Exact phrase match bonus
      if (terms.length >= 2 && contentLower.includes(cleanQuery)) {
        score += 4.0;
      }

      return {
        chunk,
        rawBm25: Math.round(score * 100) / 100,
        matchedTerms,
      };
    });

    const maxScore = Math.max(0.1, ...scored.map((s) => s.rawBm25));

    const sorted = scored
      .filter((s) => s.rawBm25 > 0)
      .sort((a, b) => b.rawBm25 - a.rawBm25);

    const selected = sorted.slice(0, topK);

    return selected
      .map((item, idx) => {
        const similarityScore = Math.min(1.0, Math.round((item.rawBm25 / maxScore) * 100) / 100);
        return {
          rank: idx + 1,
          chunkId: item.chunk.chunkId,
          citationId: `[${idx + 1}]`,
          documentId: item.chunk.documentId,
          documentName: item.chunk.documentName,
          documentVersion: item.chunk.documentVersion,
          pageNumber: item.chunk.pageNumber,
          pageEndNumber: item.chunk.pageEndNumber,
          sectionHeading: item.chunk.sectionHeading,
          clauseNumber: item.chunk.clauseNumber,
          content: item.chunk.content,
          characterCount: item.chunk.characterCount,
          tokenCount: item.chunk.tokenCount,
          sourceReference: item.chunk.sourceReference,
          similarityScore,
          rawBm25Score: item.rawBm25,
          matchedTerms: item.matchedTerms,
        };
      })
      .filter((item) => item.similarityScore >= minScoreThreshold);
  }
}
