import { Injectable } from "@nestjs/common";
import type { LegalStructuralNode } from "../knowledge-intelligence.types";

@Injectable()
export class ArticleDetectorService {
  /**
   * Detects top-level legal Articles (e.g. "ARTICLE I", "ARTICLE VIII - INDEMNIFICATION").
   */
  detectArticles(text: string, pageNumber = 1): LegalStructuralNode[] {
    if (!text || typeof text !== "string") return [];

    const nodes: LegalStructuralNode[] = [];
    const articleRegex = /(?:^|\n)\s*(?:ARTICLE|Article)\s+([0-9IVXLCDM]+|[A-Z])(?:\s*[:\-–—.]\s*([^\n]+))?/gi;
    let match: RegExpExecArray | null;

    while ((match = articleRegex.exec(text)) !== null) {
      const artNum = match[1];
      const title = (match[2] || "").trim();
      const identifier = `Article ${artNum}`;
      const startOffset = match.index;
      const rawMatch = match[0].trim();

      nodes.push({
        type: "ARTICLE",
        identifier,
        title: title || undefined,
        pageNumber,
        pageEndNumber: pageNumber,
        startOffset,
        endOffset: startOffset + rawMatch.length,
        rawText: rawMatch,
        children: [],
      });
    }

    return nodes;
  }
}
