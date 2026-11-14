import { Injectable } from "@nestjs/common";
import { TokenBoundarySplitterService } from "./token-boundary-splitter";

export interface SemanticChunkOptions {
  maxTokens?: number;
  minTokens?: number;
  overlapTokens?: number;
}

@Injectable()
export class SemanticChunkerService {
  constructor(private readonly boundarySplitter: TokenBoundarySplitterService) {}

  /**
   * Splits legal text into semantic units respecting paragraph boundaries, provisos,
   * subclauses, and lists.
   */
  chunkSemantically(text: string, options?: SemanticChunkOptions): string[] {
    if (!text || typeof text !== "string" || !text.trim()) {
      return [];
    }

    const maxTokens = options?.maxTokens ?? 500;
    const totalTokens = this.boundarySplitter.estimateTokens(text);

    if (totalTokens <= maxTokens) {
      return [text.trim()];
    }

    // 1. Separate by major structural/semantic paragraphs
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const semanticBlocks: string[] = [];

    for (const para of paragraphs) {
      const pTokens = this.boundarySplitter.estimateTokens(para);
      if (pTokens <= maxTokens) {
        semanticBlocks.push(para);
      } else {
        // Break large paragraphs at provisos, semicolons, or sentence boundaries
        const subPieces = this.boundarySplitter.splitAtBoundaries(para, options);
        semanticBlocks.push(...subPieces);
      }
    }

    return semanticBlocks;
  }
}
