import { Injectable } from "@nestjs/common";

export interface VectorDocItem {
  id: string;
  firmId: string;
  caseId?: string;
  documentId: string;
  vector: number[];
  norm: number;
}

export interface VectorSearchResult {
  id: string;
  documentId: string;
  similarity: number; // 0.0 - 1.0 (cosine similarity)
  distance: number; // 1 - similarity
}

@Injectable()
export class VectorIndexService {
  private readonly vectorStore = new Map<string, VectorDocItem>();

  /**
   * Computes Euclidean L2 norm of a vector.
   */
  computeNorm(vec: number[]): number {
    let sumSq = 0;
    for (let i = 0; i < vec.length; i++) {
      sumSq += vec[i] * vec[i];
    }
    return Math.sqrt(sumSq) || 1.0;
  }

  /**
   * Computes Cosine Similarity between two dense vectors.
   */
  cosineSimilarity(u: number[], v: number[], normU?: number, normV?: number): number {
    if (u.length !== v.length) return 0;
    let dot = 0;
    for (let i = 0; i < u.length; i++) {
      dot += u[i] * v[i];
    }
    const nU = normU ?? this.computeNorm(u);
    const nV = normV ?? this.computeNorm(v);
    const sim = dot / (nU * nV);
    return Math.max(0, Math.min(1, Math.round(sim * 10000) / 10000));
  }

  /**
   * Indexes a dense vector into the index.
   */
  indexVector(item: {
    id: string;
    firmId: string;
    caseId?: string;
    documentId: string;
    vector: number[];
  }): void {
    const norm = this.computeNorm(item.vector);
    this.vectorStore.set(item.id, {
      id: item.id,
      firmId: item.firmId,
      caseId: item.caseId,
      documentId: item.documentId,
      vector: item.vector,
      norm,
    });
  }

  removeVector(id: string): void {
    this.vectorStore.delete(id);
  }

  /**
   * Searches the vector index with strict multi-tenant isolation.
   */
  search(params: {
    queryVector: number[];
    firmId: string;
    caseId?: string;
    documentIds?: string[];
    topK?: number;
    maxDistance?: number;
  }): VectorSearchResult[] {
    const topK = params.topK ?? 10;
    const queryNorm = this.computeNorm(params.queryVector);
    const results: VectorSearchResult[] = [];

    for (const [id, doc] of this.vectorStore.entries()) {
      // Strict Tenant Filter
      if (doc.firmId !== params.firmId) continue;
      if (params.caseId && doc.caseId && doc.caseId !== params.caseId) continue;
      if (params.documentIds && params.documentIds.length > 0 && !params.documentIds.includes(doc.documentId)) continue;

      const similarity = this.cosineSimilarity(params.queryVector, doc.vector, queryNorm, doc.norm);
      const distance = 1 - similarity;

      if (params.maxDistance !== undefined && distance > params.maxDistance) {
        continue;
      }

      results.push({
        id,
        documentId: doc.documentId,
        similarity,
        distance,
      });
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  clear(): void {
    this.vectorStore.clear();
  }
}
