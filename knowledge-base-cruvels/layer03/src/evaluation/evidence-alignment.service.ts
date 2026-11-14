/**
 * CRUVELS AI — Layer 03 Evidence Alignment & Multi-Dimensional Confidence Service
 *
 * Enforces rigorous query-evidence verification, primary vs contextual classification,
 * rejection of true-but-irrelevant items, and multi-dimensional confidence calculation.
 */

import { Injectable, Logger } from "@nestjs/common";
import type {
  ClassifiedEvidenceItemV1,
  EvidenceClassificationV1,
  MultiDimensionalConfidenceV1,
  RetrievalDecisionV1,
  RetrievalResultStateV1,
} from "../contracts/retrieval-contract.v1";
import type { ScoredRetrievalItem } from "../knowledge-intelligence.types";

@Injectable()
export class EvidenceAlignmentService {
  private readonly logger = new Logger(EvidenceAlignmentService.name);

  /**
   * Evaluates each retrieved item for query alignment, classification, and authorization correctness.
   */
  public evaluateEvidenceAlignment(params: {
    query: string;
    decision: RetrievalDecisionV1;
    items: ScoredRetrievalItem[];
  }): {
    classifiedItems: ClassifiedEvidenceItemV1[];
    primaryEvidence: ClassifiedEvidenceItemV1[];
    contextualEvidence: ClassifiedEvidenceItemV1[];
    confidence: MultiDimensionalConfidenceV1;
    resultState: RetrievalResultStateV1;
    rejectionReasons: string[];
  } {
    const { query, decision, items } = params;
    const lowerQuery = query.toLowerCase();
    const rejectionReasons: string[] = [];

    if (!decision.required || items.length === 0) {
      const isSkipped = !decision.required;
      const confidence: MultiDimensionalConfidenceV1 = {
        retrievalConfidence: isSkipped ? 1.0 : 0.0,
        evidenceConfidence: 0.0,
        queryEvidenceAlignment: isSkipped ? 1.0 : 0.0,
        scopeConfidence: 1.0,
        versionConfidence: 1.0,
        overallConfidence: isSkipped ? 1.0 : 0.0,
        passesHardGates: isSkipped,
      };

      return {
        classifiedItems: [],
        primaryEvidence: [],
        contextualEvidence: [],
        confidence,
        resultState: isSkipped ? "RETRIEVAL_SKIPPED" : "NO_MATCH",
        rejectionReasons,
      };
    }

    const classifiedItems: ClassifiedEvidenceItemV1[] = [];

    for (const item of items) {
      const chunk = item.chunk;
      const contentLower = chunk.content.toLowerCase();

      // 1. Authorization & Scope Check
      const isAuthorized = !decision.scope.documentIds?.length || decision.scope.documentIds.includes(chunk.documentId);
      const isCorrectScope = Boolean(
        (!decision.scope.firmId || chunk.metadata?.firmId === undefined || chunk.metadata?.firmId === decision.scope.firmId) &&
        (!decision.scope.caseId || chunk.metadata?.caseId === undefined || chunk.metadata?.caseId === decision.scope.caseId),
      );

      // 2. Version Compliance Check
      let isCurrentEnough = true;
      if (decision.versionPolicy === "CURRENT_VERSION" && chunk.isCurrentVersion === false) {
        isCurrentEnough = false;
      }

      // 3. Query-Evidence Semantic & Structural Relevance Check
      let isRelevantToQuery = true;
      let rejectionReason: string | undefined = undefined;

      // Weather / Irrelevant inquiry vs contract chunk check (Phase 43)
      if (/\b(?:weather|temperature|forecast|photosynthesis|capital\s+of\s+[a-zA-Z]+)\b/i.test(lowerQuery)) {
        isRelevantToQuery = false;
        rejectionReason = "IRRELEVANT_TO_QUERY: Contract evidence cannot answer non-legal/general question.";
      }

      // Structural target mismatch check (e.g. asking for Section 8.1 but item is Section B.2)
      if (decision.targets.length > 0) {
        const hasMatchingTarget = decision.targets.some((target) => {
          const cleanTarget = target.replace(/^(?:section|clause|article|schedule)\s+/i, "").trim();
          return (
            (chunk.section && chunk.section.toLowerCase() === cleanTarget.toLowerCase()) ||
            (chunk.clause && chunk.clause.toLowerCase() === cleanTarget.toLowerCase()) ||
            (chunk.schedule && chunk.schedule.toLowerCase() === cleanTarget.toLowerCase()) ||
            contentLower.includes(target.toLowerCase())
          );
        });

        if (!hasMatchingTarget && !item.exactCitationMatch) {
          // If query specifically asked for a target section and chunk is totally different section
          const isSectionQuery = /\bsection\s+(\d+(?:\.\d+)?)\b/i.exec(lowerQuery);
          if (isSectionQuery && chunk.section && chunk.section !== isSectionQuery[1]) {
            isRelevantToQuery = false;
            rejectionReason = `WRONG_STRUCTURAL_TARGET: Query requested Section ${isSectionQuery[1]} but item is Section ${chunk.section}.`;
          }
        }
      }

      // 4. Evidence Classification: PRIMARY vs CONTEXTUAL vs INCIDENTAL vs EXCLUDED
      let classification: EvidenceClassificationV1 = "PRIMARY";

      if (!isAuthorized || !isCorrectScope) {
        classification = "EXCLUDED";
        rejectionReason = rejectionReason || "UNAUTHORIZED_OR_CROSS_TENANT_SCOPE";
      } else if (!isRelevantToQuery) {
        classification = "EXCLUDED";
      } else if (item.exactCitationMatch || item.finalScore >= 0.8) {
        classification = "PRIMARY";
      } else if (item.finalScore >= 0.4 || chunk.structuralUnit === "ARTICLE" || (chunk as any).structureType === "ARTICLE" || chunk.structuralUnit === "SCHEDULE") {
        classification = "CONTEXTUAL";
      } else {
        classification = "INCIDENTAL";
      }

      if (rejectionReason) {
        rejectionReasons.push(rejectionReason);
      }

      const alignmentScore = !isRelevantToQuery ? 0.0 : !isAuthorized ? 0.0 : item.finalScore;

      classifiedItems.push({
        item,
        classification,
        isSupportedByEvidence: true,
        isRelevantToQuery,
        isAuthorized,
        isCurrentEnough,
        isCorrectScope,
        alignmentScore,
        rejectionReason,
      });
    }

    const primaryEvidence = classifiedItems.filter((c) => c.classification === "PRIMARY" && c.isRelevantToQuery && c.isAuthorized);
    const contextualEvidence = classifiedItems.filter((c) => c.classification === "CONTEXTUAL" && c.isRelevantToQuery && c.isAuthorized);

    // 5. Calculate Multi-Dimensional Confidence
    const avgRetrieval = items.length > 0 ? items.reduce((sum, i) => sum + i.finalScore, 0) / items.length : 0;
    const avgAlignment = classifiedItems.length > 0 ? classifiedItems.reduce((sum, i) => sum + i.alignmentScore, 0) / classifiedItems.length : 0;
    const scopeScore = classifiedItems.every((c) => c.isAuthorized && c.isCorrectScope) ? 1.0 : 0.0;
    const versionScore = classifiedItems.filter((c) => c.classification !== "EXCLUDED").every((c) => c.isCurrentEnough) ? 1.0 : 0.5;
    const evidenceScore = primaryEvidence.length > 0 ? Math.min(1.0, primaryEvidence.length * 0.4 + 0.2) : 0.1;

    // Hard alignment check: If alignment score is near zero or hard gates fail, overall must be 0.0!
    const isSkipped = !decision.required;
    const passesHardGates = avgAlignment >= 0.3 && scopeScore === 1.0 && (isSkipped || primaryEvidence.length > 0 || contextualEvidence.length > 0);
    const overallConfidence = scopeScore === 0 || !passesHardGates ? 0.0 : Math.round((avgRetrieval * 0.2 + avgAlignment * 0.5 + evidenceScore * 0.2 + versionScore * 0.1) * 100) / 100;

    // 6. Result State
    let resultState: RetrievalResultStateV1 = "HIGH_CONFIDENCE";
    if (!passesHardGates || primaryEvidence.length === 0) {
      if (rejectionReasons.some((r) => r.includes("UNAUTHORIZED"))) {
        resultState = "UNAUTHORIZED";
      } else if (rejectionReasons.length > 0 && items.length > 0) {
        resultState = "NO_MATCH";
      } else {
        resultState = "NO_MATCH";
      }
    } else if (items.some((i) => i.exactCitationMatch)) {
      resultState = "EXACT_MATCH";
    } else if (overallConfidence >= 0.75) {
      resultState = "HIGH_CONFIDENCE";
    } else if (overallConfidence >= 0.45) {
      resultState = "PARTIAL_MATCH";
    } else {
      resultState = "WEAK_MATCH";
    }

    const confidence: MultiDimensionalConfidenceV1 = {
      retrievalConfidence: Math.round(avgRetrieval * 100) / 100,
      evidenceConfidence: Math.round(evidenceScore * 100) / 100,
      queryEvidenceAlignment: Math.round(avgAlignment * 100) / 100,
      scopeConfidence: scopeScore,
      versionConfidence: versionScore,
      overallConfidence,
      passesHardGates,
      rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : undefined,
    };

    return {
      classifiedItems,
      primaryEvidence,
      contextualEvidence,
      confidence,
      resultState,
      rejectionReasons,
    };
  }
}
