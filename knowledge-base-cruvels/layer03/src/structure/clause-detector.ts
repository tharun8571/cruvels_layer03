import { Injectable } from "@nestjs/common";
import type { LegalStructuralNode } from "../knowledge-intelligence.types";

@Injectable()
export class ClauseDetectorService {
  /**
   * Detects clauses and subclauses (e.g. "Clause 8.1", "8.2(a) Supplier Indemnity", "(i)", "(a)").
   */
  detectClauses(text: string, pageNumber = 1): LegalStructuralNode[] {
    if (!text || typeof text !== "string") return [];

    const nodes: LegalStructuralNode[] = [];
    const clauseRegex = /(?:^|\n)\s*(?:(?:CLAUSE|Clause|Cl\.)\s*(\d+(?:\.\d+)*(?:\([a-z0-9]+\))*)|(\d+(?:\.\d+)*(?:\([a-z0-9]+\))+))\s*(?:[:\-–—.]\s*([^\n]+)|(?=[A-Z]))/gi;
    let match: RegExpExecArray | null;

    while ((match = clauseRegex.exec(text)) !== null) {
      const clauseNum = match[1] || match[2];
      const title = (match[3] || "").trim();
      const isSubclause = clauseNum.includes("(");
      const identifier = `${isSubclause ? "Subclause" : "Clause"} ${clauseNum}`;
      const startOffset = match.index;
      const rawMatch = match[0].trim();

      nodes.push({
        type: isSubclause ? "SUBCLAUSE" : "CLAUSE",
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
