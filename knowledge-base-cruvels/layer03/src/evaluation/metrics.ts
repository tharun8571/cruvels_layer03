import { Injectable } from "@nestjs/common";
import type { EvaluationMetrics, LegalChunk, ScoredRetrievalItem } from "../knowledge-intelligence.types";

@Injectable()
export class MetricsCalculatorService {
  /**
   * Recall@K: Proportion of relevant items retrieved in top K.
   */
  calculateRecallAtK(retrievedIds: string[], relevantIds: string[], k = 5): number {
    if (!relevantIds || relevantIds.length === 0) return 1.0;
    const topK = retrievedIds.slice(0, k);
    const relevantSet = new Set(relevantIds);
    let hitCount = 0;
    for (const id of topK) {
      if (relevantSet.has(id)) hitCount++;
    }
    return Math.round((hitCount / relevantIds.length) * 1000) / 1000;
  }

  /**
   * Precision@K: Proportion of top K retrieved items that are relevant.
   */
  calculatePrecisionAtK(retrievedIds: string[], relevantIds: string[], k = 5): number {
    if (!retrievedIds || retrievedIds.length === 0) return 0.0;
    const topK = retrievedIds.slice(0, k);
    const relevantSet = new Set(relevantIds);
    let hitCount = 0;
    for (const id of topK) {
      if (relevantSet.has(id)) hitCount++;
    }
    return Math.round((hitCount / topK.length) * 1000) / 1000;
  }

  /**
   * Mean Reciprocal Rank (MRR): 1 / rank of first relevant item.
   */
  calculateMRR(retrievedIds: string[], relevantIds: string[]): number {
    if (!relevantIds || relevantIds.length === 0 || !retrievedIds || retrievedIds.length === 0) return 0.0;
    const relevantSet = new Set(relevantIds);
    for (let i = 0; i < retrievedIds.length; i++) {
      if (relevantSet.has(retrievedIds[i])) {
        return Math.round((1 / (i + 1)) * 1000) / 1000;
      }
    }
    return 0.0;
  }

  /**
   * Normalized Discounted Cumulative Gain (NDCG@K).
   */
  calculateNDCG(retrievedIds: string[], relevantIds: string[], k = 5): number {
    if (!relevantIds || relevantIds.length === 0) return 1.0;
    const topK = retrievedIds.slice(0, k);
    const relevantSet = new Set(relevantIds);

    // Calculate DCG
    let dcg = 0;
    for (let i = 0; i < topK.length; i++) {
      const isRelevant = relevantSet.has(topK[i]) ? 1 : 0;
      dcg += isRelevant / Math.log2(i + 2);
    }

    // Calculate Ideal DCG (IDCG)
    let idcg = 0;
    const idealCount = Math.min(relevantIds.length, k);
    for (let i = 0; i < idealCount; i++) {
      idcg += 1 / Math.log2(i + 2);
    }

    if (idcg === 0) return 0.0;
    return Math.round((dcg / idcg) * 1000) / 1000;
  }

  /**
   * Citation Preservation Rate: Checks if citations for retrieved chunks exist in context text.
   */
  calculateCitationPreservation(contextText: string, chunks: LegalChunk[]): number {
    if (!chunks || chunks.length === 0) return 1.0;
    let preserved = 0;
    for (const chunk of chunks) {
      const docName = chunk.documentName || chunk.documentId;
      if (contextText.includes(docName) && contextText.includes(`Page ${chunk.pageNumber}`)) {
        preserved++;
      }
    }
    return Math.round((preserved / chunks.length) * 1000) / 1000;
  }

  /**
   * Page Preservation Rate: Checks if actual retrieved page numbers match expected.
   */
  calculatePagePreservation(chunks: LegalChunk[], expectedPages: number[]): number {
    if (!expectedPages || expectedPages.length === 0) return 1.0;
    const retrievedPages = new Set(chunks.map((c) => c.pageNumber));
    let matches = 0;
    for (const ep of expectedPages) {
      if (retrievedPages.has(ep)) matches++;
    }
    return Math.round((matches / expectedPages.length) * 1000) / 1000;
  }

  /**
   * Tenant Isolation Pass Rate: Strictly asserts 0% cross-tenant contamination.
   */
  calculateTenantIsolation(items: ScoredRetrievalItem[], authorizedFirmId: string): number {
    if (!items || items.length === 0) return 1.0;
    for (const item of items) {
      const itemFirm = item.chunk.metadata?.firmId as string | undefined;
      if (itemFirm && itemFirm !== authorizedFirmId) {
        return 0.0; // Contamination detected!
      }
    }
    return 1.0;
  }

  /**
   * Latency percentiles (P50, P95, P99).
   */
  calculateLatencyPercentiles(latencies: number[]): { p50: number; p95: number; p99: number } {
    if (!latencies || latencies.length === 0) return { p50: 0, p95: 0, p99: 0 };
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.50)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
    const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? sorted[sorted.length - 1];
    return {
      p50: Math.round(p50 * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      p99: Math.round(p99 * 100) / 100,
    };
  }
}
