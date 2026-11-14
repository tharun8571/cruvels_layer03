import { Injectable } from "@nestjs/common";
import { DocumentChunkSourceType } from "@prisma/client";

export interface KnowledgeUnitScores {
  semanticSimilarity: number;  // 0.0 - 1.0
  keywordRelevance?: number;   // 0.0 - 1.0 (BM25)
  importanceScore?: number;    // 0.0 - 1.0 (Operative vs background)
  authorityScore?: number;     // 0.0 - 1.0 (Supreme Court > High Court > District)
  contextRelevance?: number;   // 0.0 - 1.0 (Direct case match)
  entityMatchScore?: number;   // 0.0 - 1.0 (Named parties/statutes match)
}

export interface CalibratedRankingResult {
  chunkId: string;
  finalScore: number;
  breakdown: KnowledgeUnitScores;
}

export const LEGAL_SYNONYM_MAP: Record<string, string[]> = {
  indemnity: ["indemnification", "hold harmless", "defend and hold harmless", "indemnify", "liability"],
  indemnification: ["indemnity", "hold harmless", "indemnify", "reimburse"],
  termination: ["cancel", "cancellation", "terminate", "notice period", "expiry"],
  arbitration: ["dispute resolution", "arbitral tribunal", "arbitrator", "mediation", "conciliation"],
  "governing law": ["applicable law", "choice of law", "jurisdiction", "governed by"],
  breach: ["default", "material breach", "non-performance", "cure period", "failure to perform"],
  damages: ["compensation", "liquidated damages", "remedies", "indemnification"],
  quashing: ["quash", "Section 482", "inherent powers", "quash FIR", "quashing of charge sheet"],
  injunction: ["restraining order", "stay order", "interim relief", "temporary injunction"],
  limitation: ["limitation period", "barred by limitation", "prescribed period", "condonation of delay"],
  protect: ["indemnify", "indemnification", "hold harmless", "defend", "liability", "damages"],
  protects: ["indemnify", "indemnification", "hold harmless", "defend", "liability", "damages"],
  sue: ["claim", "claims", "litigation", "proceeding", "third-party", "suit", "infringement"],
  sues: ["claim", "claims", "litigation", "proceeding", "third-party", "suit", "infringement"],
  lawsuit: ["claim", "claims", "litigation", "dispute", "proceeding"],
  vendor: ["supplier", "contractor", "service provider"],
  supplier: ["vendor", "contractor", "service provider"],
  petitioner: ["appellant", "applicant", "plaintiff", "claimant"],
  respondent: ["opposite party", "defendant", "respondent"],
  offline: ["downtime", "outage", "unavailable", "sla", "penalty"],
  outage: ["downtime", "offline", "unavailable", "sla", "penalty"],
  downtime: ["outage", "offline", "availability", "sla", "penalty"],
  penalty: ["liquidated damages", "fee", "tariff", "penalties"],
};

export const LEGAL_STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "also", "am", "an", "and",
  "any", "anyone", "anything", "are", "aren't", "as", "at", "be", "because", "been",
  "before", "being", "below", "between", "both", "but", "by", "can", "can't", "cannot",
  "come", "came", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing",
  "done", "don't", "down", "during", "each", "else", "evening", "explain", "few", "for",
  "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having",
  "he", "he'd", "he'll", "he's", "help", "her", "here", "here's", "hers", "herself",
  "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if",
  "in", "into", "is", "isn't", "it", "it's", "its", "itself", "just", "know", "let's",
  "like", "make", "me", "more", "morning", "most", "must", "mustn't", "my", "myself",
  "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or", "other", "ought",
  "our", "ours", "ourselves", "out", "over", "own", "please", "said", "same", "say",
  "shall", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so",
  "some", "someone", "something", "still", "such", "supposed", "sure", "tell", "told",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
  "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
  "things", "this", "those", "through", "time", "to", "too", "took", "two", "under",
  "until", "up", "us", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've",
  "went", "were", "weren't", "what", "what's", "when", "when's", "where", "where's",
  "whether", "which", "while", "who", "who's", "whom", "why", "why's", "will", "with",
  "without", "won't", "worse", "would", "wouldn't", "yesterday", "yet", "you", "you'd",
  "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
]);

@Injectable()
export class ImportanceScorerService {
  /**
   * Expands query with canonical legal synonyms without introducing keyword drift.
   */
  expandLegalQuery(query: string | string[]): string[] {
    const rawTokens = Array.isArray(query)
      ? query.flatMap((q) => (typeof q === "string" ? q.toLowerCase().split(/\s+/) : []))
      : (typeof query === "string" ? query.toLowerCase().split(/\s+/) : []);

    const tokens = rawTokens.map((t) => t.replace(/[^a-z0-9]/g, "")).filter((t) => t && !LEGAL_STOP_WORDS.has(t));
    const expanded = new Set<string>(tokens);

    for (const token of tokens) {
      const synonyms = LEGAL_SYNONYM_MAP[token];
      if (synonyms) {
        for (const syn of synonyms) {
          expanded.add(syn.toLowerCase());
        }
      }
    }

    // Check multi-word phrases
    const rawString = Array.isArray(query) ? query.join(" ") : (typeof query === "string" ? query : "");
    const lowerQuery = rawString.toLowerCase();
    for (const [phrase, synonyms] of Object.entries(LEGAL_SYNONYM_MAP)) {
      if (phrase.includes(" ") && lowerQuery.includes(phrase)) {
        for (const syn of synonyms) {
          expanded.add(syn.toLowerCase());
        }
      }
    }

    return Array.from(expanded);
  }

  /**
   * Computes BM25-like keyword relevance overlap between query tokens and chunk content.
   */
  computeKeywordOverlap(query: string | string[], chunkContent: string): number {
    if (!query || !chunkContent) return 0;
    const expandedTokens = this.expandLegalQuery(query);
    if (expandedTokens.length === 0) return 0;

    const contentLower = chunkContent.toLowerCase();
    let matches = 0;

    for (const token of expandedTokens) {
      if (contentLower.includes(token)) {
        matches++;
      }
    }

    return Math.min(1.0, matches / Math.min(expandedTokens.length, 10));
  }

  /**
   * Computes the calibrated combined score for a candidate chunk.
   */
  computeCompositeScore(scores: KnowledgeUnitScores, sourceType?: DocumentChunkSourceType): number {
    const wSemantic = 0.40;
    const wImportance = 0.25;
    const wAuthority = 0.15;
    const wContext = 0.10;
    const wEntity = 0.10;

    const semantic = scores.semanticSimilarity || 0;
    const importance = scores.importanceScore ?? 0.5;
    const authority = scores.authorityScore ?? (sourceType === DocumentChunkSourceType.KNOWLEDGE_ASSET ? 0.8 : 0.6);
    const context = scores.contextRelevance ?? 0.5;
    const entity = scores.entityMatchScore ?? 0.0;

    const composite =
      semantic * wSemantic +
      importance * wImportance +
      authority * wAuthority +
      context * wContext +
      entity * wEntity;

    return Math.min(1.0, Math.max(0.0, composite));
  }
}
