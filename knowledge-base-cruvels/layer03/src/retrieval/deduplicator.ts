import { Injectable } from "@nestjs/common";
import type { LegalChunk, ScoredRetrievalItem } from "../knowledge-intelligence.types";

@Injectable()
export class ChunkDeduplicatorService {
  /**
   * Deduplicates retrieved items by chunkId, exact contentHash, and content fingerprint.
   * Retains the highest-scoring occurrence.
   */
  deduplicateScoredItems(items: ScoredRetrievalItem[]): ScoredRetrievalItem[] {
    const seenChunkIds = new Set<string>();
    const seenContentHashes = new Set<string>();
    const seenFingerprints = new Set<string>();
    const unique: ScoredRetrievalItem[] = [];

    for (const item of items) {
      if (seenChunkIds.has(item.chunk.chunkId)) {
        continue;
      }
      seenChunkIds.add(item.chunk.chunkId);

      if (item.chunk.contentHash && seenContentHashes.has(item.chunk.contentHash)) {
        continue;
      }
      if (item.chunk.contentHash) {
        seenContentHashes.add(item.chunk.contentHash);
      }

      // Fast prefix fingerprint for near-identical header/footer boilerplate suppression
      const fingerprint = item.chunk.content
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 140);

      if (fingerprint && seenFingerprints.has(fingerprint)) {
        continue;
      }
      if (fingerprint) {
        seenFingerprints.add(fingerprint);
      }

      unique.push(item);
    }

    return unique;
  }

  /**
   * Deduplicates raw LegalChunk list.
   */
  deduplicateChunks(chunks: LegalChunk[]): LegalChunk[] {
    const seenHashes = new Set<string>();
    const unique: LegalChunk[] = [];

    for (const chunk of chunks) {
      if (chunk.contentHash && seenHashes.has(chunk.contentHash)) {
        continue;
      }
      if (chunk.contentHash) {
        seenHashes.add(chunk.contentHash);
      }
      unique.push(chunk);
    }

    return unique;
  }
}
