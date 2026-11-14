import { Injectable } from "@nestjs/common";
import type { LegalStructuralNode } from "../knowledge-intelligence.types";

@Injectable()
export class SectionDetectorService {
  /**
   * Detects numbered and titled sections (e.g. "Section 8", "Section 8.2", "Sec. 482", "8.2 Indemnification").
   */
  detectSections(text: string, pageNumber = 1): LegalStructuralNode[] {
    if (!text || typeof text !== "string") return [];

    const nodes: LegalStructuralNode[] = [];
    const sectionRegex = /(?:^|\n)\s*(?:(?:SECTION|Section|Sec\.|§)\s*([0-9a-zA-Z]+(?:\.[0-9a-zA-Z]+)*)|(\d+\.\d+))\s*(?:[:\-–—.]\s*([^\n]+)|(?=[A-Z]))/gi;
    let match: RegExpExecArray | null;

    while ((match = sectionRegex.exec(text)) !== null) {
      const secNum = match[1] || match[2];
      const title = (match[3] || "").trim();
      const identifier = `Section ${secNum}`;
      const startOffset = match.index;
      const rawMatch = match[0].trim();

      nodes.push({
        type: "SECTION",
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
