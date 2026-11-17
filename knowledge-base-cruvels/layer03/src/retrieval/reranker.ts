import { Injectable } from "@nestjs/common";
import type { ScoredRetrievalItem } from "../knowledge-intelligence.types.js";
import { LegalIntentExpander } from "./intent-expander.js";

export interface RerankingOptions {
  targetVersion?: string;
  boostCurrentVersion?: boolean;
  boostOperativeClauses?: boolean;
  expandedIntent?: ReturnType<typeof LegalIntentExpander.expandQuery>;
}

@Injectable()
export class LegalRerankerService {
  /**
   * Reranks fused retrieval candidates using deep legal intent & semantic relevance:
   * 1. Substantive Intent Relevance (Matches the core legal doctrine answering the query)
   * 2. Sub-Question Alignment (Exceptions, Qualifications, Enforceability, Temporal scope)
   * 3. Operative Statutory Authority (In force primary legislation vs repealed/draft)
   * 4. Schedule & Exception completeness boost
   */
  rerankCandidates(
    query: string,
    items: ScoredRetrievalItem[] | any[],
    options?: RerankingOptions,
  ): any[] {
    if (!items || items.length === 0) return [];
    if (items.length === 1) return items;

    const intent = options?.expandedIntent || LegalIntentExpander.expandQuery(query);
    const targetVersion = options?.targetVersion;
    const boostCurrent = options?.boostCurrentVersion ?? true;
    const boostOperative = options?.boostOperativeClauses ?? true;

    const lowerQuery = query.toLowerCase();
    const asksExceptions = /exception|qualification|saving/i.test(lowerQuery);
    const asksEnforceability = /enforceab|valid|void|binding/i.test(lowerQuery);
    const asksEmploymentOrDeparture = /employment|departure|termination|compet/i.test(lowerQuery);

    const reranked: any[] = items.map((item: any) => {
      const chunk = item.chunk || item || {};
      const content = chunk.content || item.content || "";
      const contentLower = content.toLowerCase();
      const titleLower = (
        chunk.documentName ||
        chunk.documentTitle ||
        item.documentName ||
        item.documentTitle ||
        item.title ||
        chunk.section ||
        item.section ||
        ""
      ).toLowerCase();
      const itemSection = chunk.section || item.section || "";

      let intentRelevanceScore = 0;
      let subQuestionBoost = 0;
      let versionBoost = 0;
      let operativeBoost = 0;

      // 1. Check direct alignment with Inferred Acts and Sections
      const isTargetAct = intent.inferredActs.some((act) =>
        titleLower.includes(act.toLowerCase()) || contentLower.includes(act.toLowerCase())
      );
      const isTargetSection = intent.inferredSections.some(
        (sec) => itemSection === sec || titleLower.includes(`section ${sec}`)
      );

      if (isTargetAct && isTargetSection) {
        intentRelevanceScore += 0.50;
      } else if (isTargetSection) {
        intentRelevanceScore += 0.35;
      } else if (isTargetAct) {
        intentRelevanceScore += 0.20;
      }

      // 2. Doctrine & Conceptual Term Matches
      for (const term of intent.expandedTokens) {
        if (contentLower.includes(term.toLowerCase())) {
          intentRelevanceScore += 0.08;
        }
      }
      intentRelevanceScore = Math.min(0.60, intentRelevanceScore);

      // 3. Sub-Question Alignment
      if (asksExceptions && (contentLower.includes("exception") || contentLower.includes("saving") || contentLower.includes("goodwill"))) {
        subQuestionBoost += 0.15;
      }
      if (asksEnforceability && (contentLower.includes("void") || contentLower.includes("valid") || contentLower.includes("unlawful"))) {
        subQuestionBoost += 0.12;
      }
      if (asksEmploymentOrDeparture && (contentLower.includes("restrain") || contentLower.includes("trade") || contentLower.includes("profession") || contentLower.includes("business"))) {
        subQuestionBoost += 0.12;
      }

      // 4. Version & Operative Status
      const isCurrentVersion = chunk.isCurrentVersion ?? item.isCurrentVersion;
      if (targetVersion) {
        versionBoost = chunk.version === targetVersion ? 0.10 : -0.10;
      } else if (boostCurrent) {
        versionBoost = isCurrentVersion ? 0.10 : 0.02;
      }

      const isOperativeClause = chunk.isOperativeClause ?? item.isOperativeClause ?? item.isOperative;
      if (boostOperative && isOperativeClause) {
        operativeBoost = 0.08;
      }

      const exactCitationBonus = item.exactCitationMatch ? 0.20 : 0;

      // 5. Composite Final Score
      const baseScore = item.fusedScore ?? item.finalScore ?? item.score ?? 0.5;
      const isExactMatch =
        item.retrievalMethod === "EXACT_STRUCTURAL_INDEX" ||
        item.retrievalMethod === "EXACT_CONCORDANCE_GRAPH" ||
        item.retrievalMethod === "EXACT_LANDMARK_PRECEDENT_INDEX" ||
        item.authorityLevel === "OFFICIAL_PRIMARY";

      const baseWeight = isExactMatch ? 0.80 : 0.30;

      const composite = Math.min(
        1.0,
        Math.max(
          0.05,
          Math.round(
            (baseScore * baseWeight +
              intentRelevanceScore +
              subQuestionBoost +
              versionBoost +
              operativeBoost +
              exactCitationBonus) *
              1000,
          ) / 1000,
        ),
      );

      const existingBreakdown = item.scoreBreakdown || {};

      return {
        ...item,
        rerankScore: composite,
        finalScore: composite,
        score: composite,
        scoreBreakdown: {
          ...existingBreakdown,
          exactPhrase: (existingBreakdown.exactPhrase || 0) + exactCitationBonus,
          versionBoost,
          operativeBoost,
        },
      };
    });

    // Sort descending by finalScore
    reranked.sort((a, b) => {
      const scoreA = a.finalScore ?? a.score ?? 0;
      const scoreB = b.finalScore ?? b.score ?? 0;
      if (Math.abs(scoreB - scoreA) > 0.001) {
        return scoreB - scoreA;
      }
      return (a.rank || 0) - (b.rank || 0);
    });

    // Re-assign ranks
    return reranked.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }
}
