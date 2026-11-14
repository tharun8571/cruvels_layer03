import { Injectable } from "@nestjs/common";
import { LEGAL_STOP_WORDS } from "../retrieval/importance-scorer.service";

export interface SparseDocItem {
  id: string;
  firmId: string;
  caseId?: string;
  documentId: string;
  content: string;
  tokens: string[];
  docLength: number;
}

export interface SparseSearchResult {
  id: string;
  documentId: string;
  score: number; // BM25 score normalized 0.0 - 1.0
  matchedTerms: string[];
}

@Injectable()
export class SparseIndexService {
  // BM25 Hyperparameters
  private readonly k1 = 1.2;
  private readonly b = 0.75;

  private readonly docStore = new Map<string, SparseDocItem>();
  private readonly termDocFreq = new Map<string, Set<string>>(); // term -> set of doc ids
  private totalTokensInCorpus = 0;

  /**
   * Tokenizes and filters legal stopwords.
   */
  tokenize(text: string): string[] {
    if (!text || typeof text !== "string") return [];
    return text
      .toLowerCase()
      .replace(/[^a-z0-9₹$§¶]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !LEGAL_STOP_WORDS.has(w));
  }

  /**
   * Indexes a document/chunk into the in-memory sparse BM25 inverted index.
   */
  indexDocument(item: {
    id: string;
    firmId: string;
    caseId?: string;
    documentId: string;
    content: string;
  }): void {
    const tokens = this.tokenize(item.content);
    const docLength = tokens.length;

    // Remove existing if re-indexing
    this.removeDocument(item.id);

    const docItem: SparseDocItem = {
      id: item.id,
      firmId: item.firmId,
      caseId: item.caseId,
      documentId: item.documentId,
      content: item.content,
      tokens,
      docLength,
    };

    this.docStore.set(item.id, docItem);
    this.totalTokensInCorpus += docLength;

    const uniqueTermsInDoc = new Set(tokens);
    for (const term of uniqueTermsInDoc) {
      if (!this.termDocFreq.has(term)) {
        this.termDocFreq.set(term, new Set());
      }
      this.termDocFreq.get(term)!.add(item.id);
    }
  }

  removeDocument(id: string): void {
    const existing = this.docStore.get(id);
    if (!existing) return;

    this.totalTokensInCorpus -= existing.docLength;
    this.docStore.delete(id);

    for (const term of new Set(existing.tokens)) {
      const set = this.termDocFreq.get(term);
      if (set) {
        set.delete(id);
        if (set.size === 0) {
          this.termDocFreq.delete(term);
        }
      }
    }
  }

  /**
   * Searches the sparse index using Okapi BM25 ranking algorithm with tenant isolation.
   */
  search(params: {
    query: string;
    firmId: string;
    caseId?: string;
    documentIds?: string[];
    topK?: number;
  }): SparseSearchResult[] {
    const queryTokens = this.tokenize(params.query);
    if (queryTokens.length === 0 || this.docStore.size === 0) {
      return [];
    }

    const N = this.docStore.size;
    const avgDocLength = this.totalTokensInCorpus / Math.max(1, N);
    const candidateScores = new Map<string, { score: number; matchedTerms: Set<string> }>();

    // Candidate selection strictly scoped by firmId, caseId, documentIds
    for (const token of queryTokens) {
      const matchingDocIds = this.termDocFreq.get(token);
      if (!matchingDocIds) continue;

      const df = matchingDocIds.size;
      // Standard Okapi BM25 IDF: ln((N - df + 0.5) / (df + 0.5) + 1)
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));

      for (const docId of matchingDocIds) {
        const doc = this.docStore.get(docId);
        if (!doc) continue;

        // Strict Tenant Filter
        if (doc.firmId !== params.firmId) continue;
        if (params.caseId && doc.caseId && doc.caseId !== params.caseId) continue;
        if (params.documentIds && params.documentIds.length > 0 && !params.documentIds.includes(doc.documentId)) continue;

        // Calculate term frequency in doc
        let tf = 0;
        for (const t of doc.tokens) {
          if (t === token) tf++;
        }

        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (doc.docLength / Math.max(1, avgDocLength)));
        const termScore = idf * (numerator / Math.max(0.001, denominator));

        if (!candidateScores.has(docId)) {
          candidateScores.set(docId, { score: 0, matchedTerms: new Set() });
        }
        const entry = candidateScores.get(docId)!;
        entry.score += termScore;
        entry.matchedTerms.add(token);
      }
    }

    const results: SparseSearchResult[] = [];
    let maxRawScore = 0.001;

    for (const [id, entry] of candidateScores.entries()) {
      if (entry.score > maxRawScore) maxRawScore = entry.score;
    }

    for (const [id, entry] of candidateScores.entries()) {
      const doc = this.docStore.get(id)!;
      // Normalize BM25 score to 0.0 - 1.0 range
      const normalizedScore = Math.min(1.0, Math.round((entry.score / maxRawScore) * 1000) / 1000);
      results.push({
        id,
        documentId: doc.documentId,
        score: normalizedScore,
        matchedTerms: Array.from(entry.matchedTerms),
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, params.topK ?? 10);
  }

  clear(): void {
    this.docStore.clear();
    this.termDocFreq.clear();
    this.totalTokensInCorpus = 0;
  }
}
