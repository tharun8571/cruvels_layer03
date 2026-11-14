import { Injectable } from "@nestjs/common";

export interface SplitBoundaryOptions {
  maxTokens?: number;
  minTokens?: number;
  overlapTokens?: number;
}

@Injectable()
export class TokenBoundarySplitterService {
  /**
   * Approximates token count for legal text.
   */
  estimateTokens(text: string): number {
    if (!text || !text.trim()) return 0;
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length === 0) return 0;
    const wordEst = Math.ceil(words.length * 1.33);
    const charEst = Math.ceil(trimmed.length / 4);
    return Math.max(1, Math.round((wordEst + charEst) / 2));
  }

  /**
   * Splits a long text block at clean boundaries (sentence endings, semicolons in legal lists, paragraph breaks)
   * without slicing mid-word, mid-citation (e.g. "Section 8.2(a)"), or mid-currency (e.g. "₹1,50,000" or "$500k").
   */
  splitAtBoundaries(text: string, options?: SplitBoundaryOptions): string[] {
    const maxTokens = options?.maxTokens ?? 500;
    const overlapTokens = options?.overlapTokens ?? 50;

    const totalTokens = this.estimateTokens(text);
    if (totalTokens <= maxTokens) {
      return [text.trim()];
    }

    // Split candidate segments by paragraph or sentence
    const candidateBoundaries = /(?<=[.!?;\n])\s+(?=[A-Z0-9§¶₹$])/;
    const rawSegments = text.split(candidateBoundaries).filter(Boolean);

    const chunks: string[] = [];
    let currentSegmentBlock: string[] = [];
    let currentTokens = 0;

    for (const segment of rawSegments) {
      const segTokens = this.estimateTokens(segment);

      if (currentSegmentBlock.length > 0 && currentTokens + segTokens > maxTokens) {
        const chunkContent = currentSegmentBlock.join(" ").trim();
        if (chunkContent) {
          chunks.push(chunkContent);
        }

        // Build overlap
        const overlapBlock: string[] = [];
        let accumulatedOverlap = 0;
        for (let i = currentSegmentBlock.length - 1; i >= 0; i--) {
          const item = currentSegmentBlock[i];
          const itemTok = this.estimateTokens(item);
          if (accumulatedOverlap + itemTok <= overlapTokens || overlapBlock.length === 0) {
            overlapBlock.unshift(item);
            accumulatedOverlap += itemTok;
          } else {
            break;
          }
        }

        currentSegmentBlock = [...overlapBlock];
        currentTokens = accumulatedOverlap;
      }

      currentSegmentBlock.push(segment);
      currentTokens += segTokens;
    }

    if (currentSegmentBlock.length > 0) {
      const chunkContent = currentSegmentBlock.join(" ").trim();
      if (chunkContent) {
        chunks.push(chunkContent);
      }
    }

    return chunks;
  }
}
