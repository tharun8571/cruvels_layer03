import { Injectable } from "@nestjs/common";
import type { LegalStructuralNode } from "../knowledge-intelligence.types";

@Injectable()
export class AnnexureDetectorService {
  /**
   * Detects annexures, exhibits, appendices, and addenda (e.g. "ANNEXURE I", "EXHIBIT X", "APPENDIX A").
   */
  detectAnnexuresAndExhibits(text: string, pageNumber = 1): LegalStructuralNode[] {
    if (!text || typeof text !== "string") return [];

    const nodes: LegalStructuralNode[] = [];
    const regex = /(?:^|\n)\s*(?:(ANNEXURE|Annexure|EXHIBIT|Exhibit|APPENDIX|Appendix|ADDENDUM|Addendum))\s+([A-Z0-9]+|[IVXLCDM]+)(?:\s*[:\-–—.]\s*([^\n]+))?/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const typeStr = match[1].toUpperCase();
      const num = match[2];
      const title = (match[3] || "").trim();
      const type = typeStr.startsWith("EXHIBIT") ? "EXHIBIT" : "ANNEXURE";
      const identifier = `${typeStr.charAt(0) + typeStr.slice(1).toLowerCase()} ${num}`;
      const startOffset = match.index;
      const rawMatch = match[0].trim();

      nodes.push({
        type,
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
