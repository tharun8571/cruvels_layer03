import { Injectable } from "@nestjs/common";
import type { LegalChunk, ScoredRetrievalItem } from "../knowledge-intelligence.types";

export interface FusionCandidate {
  chunk: LegalChunk;
  denseRank?: number; // 1-indexed
  sparseRank?: number; // 1-indexed
  denseScore: number;
  sparseScore: number;
  matchedTerms: string[];
}

export interface FusionOptions {
  denseWeight?: number; // default 0.50
  sparseWeight?: number; // default 0.50
  rrfConstant?: number; // default 60
  exactCitationBoost?: number; // default 0.25
}

@Injectable()
export class HybridFusionService {
  private readonly DEFAULT_RRF_K = 60;
  private readonly DEFAULT_EXACT_BOOST = 0.25;

  /**
   * Deterministically fuses dense vector retrieval results and sparse lexical results.
   * Guarantees exact legal section/schedule matches receive appropriate priority boost.
   */
  fuseResults(
    query: string,
    denseCandidates: { chunk: LegalChunk; score: number }[],
    sparseCandidates: { chunk: LegalChunk; score: number; matchedTerms: string[] }[],
    options?: FusionOptions,
  ): ScoredRetrievalItem[] {
    const denseWeight = options?.denseWeight ?? 0.50;
    const sparseWeight = options?.sparseWeight ?? 0.50;
    const k = options?.rrfConstant ?? this.DEFAULT_RRF_K;
    const exactBoostAmount = options?.exactCitationBoost ?? this.DEFAULT_EXACT_BOOST;

    const candidateMap = new Map<string, FusionCandidate>();

    // 1. Ingest dense ranks
    for (let i = 0; i < denseCandidates.length; i++) {
      const item = denseCandidates[i];
      const chunkId = item.chunk.chunkId;
      candidateMap.set(chunkId, {
        chunk: item.chunk,
        denseRank: i + 1,
        denseScore: item.score,
        sparseScore: 0,
        matchedTerms: [],
      });
    }

    // 2. Ingest sparse ranks
    for (let j = 0; j < sparseCandidates.length; j++) {
      const item = sparseCandidates[j];
      const chunkId = item.chunk.chunkId;
      if (candidateMap.has(chunkId)) {
        const existing = candidateMap.get(chunkId)!;
        existing.sparseRank = j + 1;
        existing.sparseScore = item.score;
        existing.matchedTerms = item.matchedTerms;
      } else {
        candidateMap.set(chunkId, {
          chunk: item.chunk,
          sparseRank: j + 1,
          denseScore: 0,
          sparseScore: item.score,
          matchedTerms: item.matchedTerms,
        });
      }
    }

    // 3. Detect exact citation references in query (e.g. "Section 8", "8.2", "Schedule B", "Notice period")
    const queryExactCitations = this.extractQueryCitations(query);

    const fusedItems: ScoredRetrievalItem[] = [];

    for (const cand of candidateMap.values()) {
      const chunk = cand.chunk;

      // Reciprocal Rank Fusion calculation
      const rrfDense = cand.denseRank ? (denseWeight / (k + cand.denseRank)) : 0;
      const rrfSparse = cand.sparseRank ? (sparseWeight / (k + cand.sparseRank)) : 0;
      const baseRrfScore = rrfDense + rrfSparse;

      // Normalized score combining linear weights and RRF
      const linearScore = cand.denseScore * denseWeight + cand.sparseScore * sparseWeight;
      let fusedScore = (baseRrfScore * 100 * 0.4) + (linearScore * 0.6);

      // Exact legal citation check
      const exactMatch = this.checkExactCitationMatch(queryExactCitations, chunk);
      let exactPhraseBonus = 0;
      if (exactMatch) {
        exactPhraseBonus = exactBoostAmount;
        fusedScore += exactPhraseBonus;
      }

      fusedScore = Math.max(0, Math.min(1.0, Math.round(fusedScore * 1000) / 1000));

      const provenance = `${chunk.documentName} [Page ${chunk.pageNumber}${chunk.section ? `, Section ${chunk.section}` : ""}${chunk.clause ? `, Clause ${chunk.clause}` : ""}, Version ${chunk.version}]`;

      fusedItems.push({
        chunk,
        denseScore: cand.denseScore,
        sparseScore: cand.sparseScore,
        fusedScore,
        rerankScore: fusedScore,
        finalScore: fusedScore,
        rank: 0,
        matchedTerms: cand.matchedTerms,
        exactCitationMatch: exactMatch,
        provenance,
        scoreBreakdown: {
          dense: cand.denseScore,
          sparse: cand.sparseScore,
          exactPhrase: exactPhraseBonus,
          versionBoost: 0,
          operativeBoost: 0,
          boilerplatePenalty: 0,
        },
      });
    }

    fusedItems.sort((a, b) => b.finalScore - a.finalScore);
    for (let idx = 0; idx < fusedItems.length; idx++) {
      fusedItems[idx].rank = idx + 1;
    }

    return fusedItems;
  }

  private extractQueryCitations(query: string): {
    sections: string[];
    schedules: string[];
    annexures: string[];
    exhibits: string[];
  } {
    const q = query.toLowerCase();
    const sections: string[] = [];
    const schedules: string[] = [];
    const annexures: string[] = [];
    const exhibits: string[] = [];

    const secMatches = q.match(/\b(?:sections?|sec\.|clauses?|cl\.|§)\s*([0-9a-zA-Z]+(?:\.[0-9a-zA-Z]+)*(?:\([a-z0-9]+\))*)/gi);
    if (secMatches) {
      for (const m of secMatches) {
        const num = m.replace(/^(?:sections?|sec\.|clauses?|cl\.|§)\s*/i, "");
        sections.push(num.trim().toLowerCase());
      }
    }

    const schedMatches = q.match(/\b(?:schedules?|sched\.)\s+([a-z0-9]+)/gi);
    if (schedMatches) {
      for (const m of schedMatches) {
        schedules.push(m.replace(/^(?:schedules?|sched\.)\s+/i, "").toUpperCase());
      }
    }

    const exhMatches = q.match(/\b(?:exhibits?|exh\.)\s+([a-z0-9]+)/gi);
    if (exhMatches) {
      for (const m of exhMatches) {
        exhibits.push(m.replace(/^(?:exhibits?|exh\.)\s+/i, "").toUpperCase());
      }
    }

    return { sections, schedules, annexures, exhibits };
  }

  private checkExactCitationMatch(
    cits: ReturnType<typeof this.extractQueryCitations>,
    chunk: LegalChunk,
  ): boolean {
    if (chunk.section) {
      const chunkSec = chunk.section.toLowerCase().replace(/^(?:section|sec\.)\s*/i, "").trim();
      for (const s of cits.sections) {
        if (chunkSec === s || chunkSec.startsWith(s + ".") || s.startsWith(chunkSec + ".")) {
          return true;
        }
      }
    }

    if (chunk.clause) {
      const chunkCl = chunk.clause.toLowerCase().replace(/^(?:clause|cl\.)\s*/i, "").trim();
      for (const s of cits.sections) {
        if (chunkCl === s || chunkCl.startsWith(s + ".")) {
          return true;
        }
      }
    }

    if (chunk.schedule) {
      const chunkSched = chunk.schedule.toUpperCase().replace(/^SCHEDULE\s+/i, "").trim();
      for (const sch of cits.schedules) {
        if (chunkSched === sch || chunkSched.startsWith(sch)) {
          return true;
        }
      }
    }

    if (chunk.exhibit) {
      const chunkExh = chunk.exhibit.toUpperCase().replace(/^EXHIBIT\s+/i, "").trim();
      for (const exh of cits.exhibits) {
        if (chunkExh === exh || chunkExh.startsWith(exh)) {
          return true;
        }
      }
    }

    // Also check content header for exact section matches
    for (const s of cits.sections) {
      const secPattern = new RegExp(`\\b(?:sections?|sec\\.|clauses?|cl\\.|§)\\s*${s.replace(".", "\\.")}\\b`, "i");
      if (secPattern.test(chunk.content)) {
        return true;
      }
    }

    return false;
  }
}

