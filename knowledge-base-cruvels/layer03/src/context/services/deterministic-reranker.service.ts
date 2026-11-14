/**
 * Cruvels AI Deterministic Multi-Signal Reranker Service (Phase 1 Stage 1D)
 *
 * Implements a local, deterministic, multi-signal reranking algorithm combining:
 * 1. Semantic vector similarity (45% weight)
 * 2. Lexical query term overlap (30% weight)
 * 3. Exact phrase & entity matching (15% weight)
 * 4. Document source & title relevance (10% weight)
 *
 * Includes fail-safe fallback to original vector ranking on any calculation failure.
 */

import { Injectable, Logger } from "@nestjs/common";
import type {
  RerankCandidateItem,
  RerankResult,
} from "../contracts/reranker.types";
import type { IRagReranker } from "../interfaces/reranker.interface";

export const COMMON_STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
  "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
  "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
  "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i",
  "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's",
  "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought",
  "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she",
  "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
  "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
  "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
  "they've", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
  "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
  "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
  "yourself", "yourselves",
]);

@Injectable()
export class DeterministicRerankerService implements IRagReranker {
  readonly name = "DeterministicMultiSignalReranker";
  private readonly logger = new Logger(DeterministicRerankerService.name);

  // Signal weights (sum to 1.0)
  private readonly WEIGHT_SEMANTIC = 0.45;
  private readonly WEIGHT_LEXICAL = 0.30;
  private readonly WEIGHT_PHRASE = 0.15;
  private readonly WEIGHT_SOURCE = 0.10;

  /**
   * Reranks candidate chunks against user query.
   */
  async rerank(
    query: string,
    candidates: RerankCandidateItem[],
    options?: Record<string, unknown>,
  ): Promise<RerankResult> {
    const startedAt = Date.now();

    // Edge case 1: Empty candidate list
    if (!candidates || candidates.length === 0) {
      return {
        query,
        candidates: [],
        rerankerName: this.name,
        durationMs: Date.now() - startedAt,
        fallbackUsed: false,
      };
    }

    // Edge case 2: Single candidate
    if (candidates.length === 1) {
      const single = candidates[0];
      return {
        query,
        candidates: [
          {
            ...single,
            rerankScore: single.originalScore,
            finalRank: 1,
          },
        ],
        rerankerName: this.name,
        durationMs: Date.now() - startedAt,
        fallbackUsed: false,
      };
    }

    try {
      const normalizedQuery = (query || "").trim().toLowerCase();
      const queryTokens = this.extractQueryTokens(normalizedQuery);

      const scoredCandidates = candidates.map((candidate) => {
        const rerankScore = this.computeCandidateScore(
          normalizedQuery,
          queryTokens,
          candidate,
        );

        return {
          ...candidate,
          rerankScore,
        };
      });

      // Sort descending by rerankScore, breaking ties by originalRank ascending
      scoredCandidates.sort((a, b) => {
        if (Math.abs(b.rerankScore - a.rerankScore) > 0.0001) {
          return b.rerankScore - a.rerankScore;
        }
        return a.originalRank - b.originalRank;
      });

      // Assign 1-indexed final ranks
      const finalCandidates: RerankCandidateItem[] = scoredCandidates.map(
        (c, idx) => ({
          ...c,
          finalRank: idx + 1,
        }),
      );

      return {
        query,
        candidates: finalCandidates,
        rerankerName: this.name,
        durationMs: Date.now() - startedAt,
        fallbackUsed: false,
      };
    } catch (err: any) {
      this.logger.warn(
        `Deterministic reranker failed, falling back to original vector ranking: ${err.message}`,
      );

      // Fail-Safe Fallback: Preserves original ranking safely
      const fallbackCandidates: RerankCandidateItem[] = candidates.map((c, idx) => ({
        ...c,
        rerankScore: c.originalScore,
        finalRank: idx + 1,
      }));

      return {
        query,
        candidates: fallbackCandidates,
        rerankerName: this.name,
        durationMs: Date.now() - startedAt,
        fallbackUsed: true,
      };
    }
  }

  /**
   * Computes the composite multi-signal relevance score for a single candidate.
   */
  private computeCandidateScore(
    normalizedQuery: string,
    queryTokens: string[],
    candidate: RerankCandidateItem,
  ): number {
    const content = (candidate.content || "").toLowerCase();
    const meta = candidate.metadata || {};
    const title = (
      (meta.title as string) ||
      (meta.fileName as string) ||
      (meta.name as string) ||
      ""
    ).toLowerCase();

    // 1. Semantic Vector Score (0 to 1)
    const semanticScore = Math.max(0, Math.min(1, candidate.originalScore));

    // 2. Lexical Term Overlap Score (0 to 1)
    let lexicalScore = 0.5; // default if query has no substantive keywords
    if (queryTokens.length > 0) {
      let matchedCount = 0;
      for (const token of queryTokens) {
        if (content.includes(token) || title.includes(token)) {
          matchedCount++;
        }
      }
      lexicalScore = matchedCount / queryTokens.length;
    }

    // 3. Exact Phrase & Entity Match Score (0 to 1)
    let phraseScore = 0;
    if (normalizedQuery.length >= 4 && content.includes(normalizedQuery)) {
      phraseScore = 1.0;
    } else if (queryTokens.length >= 2) {
      // Check 2-gram / 3-gram contiguous matches
      const bigrams = this.extractNgrams(queryTokens, 2);
      let matchedBigrams = 0;
      for (const bg of bigrams) {
        if (content.includes(bg)) {
          matchedBigrams++;
        }
      }
      phraseScore = bigrams.length > 0 ? Math.min(1.0, (matchedBigrams / bigrams.length) * 0.8) : 0;
    }

    // 4. Source & Structure Relevance (0 to 1)
    let sourceScore = 0.5;
    if (title && queryTokens.some((t) => title.includes(t))) {
      sourceScore += 0.3;
    }
    if (candidate.sourceType === "CASE_DOCUMENT" || candidate.sourceType === "RESEARCH_MEMO") {
      sourceScore += 0.2;
    }
    sourceScore = Math.min(1.0, sourceScore);

    // Weighted composite score
    const compositeScore =
      semanticScore * this.WEIGHT_SEMANTIC +
      lexicalScore * this.WEIGHT_LEXICAL +
      phraseScore * this.WEIGHT_PHRASE +
      sourceScore * this.WEIGHT_SOURCE;

    return Math.max(0, Math.min(1, compositeScore));
  }

  /**
   * Tokenizes and filters query string into substantive keywords.
   */
  private extractQueryTokens(query: string): string[] {
    const words = query
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2 && !COMMON_STOPWORDS.has(w));

    return Array.from(new Set(words));
  }

  /**
   * Extracts n-grams from token array for phrase matching.
   */
  private extractNgrams(tokens: string[], n: number): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      ngrams.push(tokens.slice(i, i + n).join(" "));
    }
    return ngrams;
  }
}
