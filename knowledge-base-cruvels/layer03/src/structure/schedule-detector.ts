import { Injectable } from "@nestjs/common";
import type { LegalStructuralNode } from "../knowledge-intelligence.types";

@Injectable()
export class ScheduleDetectorService {
  /**
   * Detects schedules (e.g. "SCHEDULE A", "SCHEDULE B - PRICING SCHEDULE", "Schedule 1").
   */
  detectSchedules(text: string, pageNumber = 1): LegalStructuralNode[] {
    if (!text || typeof text !== "string") return [];

    const nodes: LegalStructuralNode[] = [];
    const scheduleRegex = /(?:^|\n)\s*(?:SCHEDULE|Schedule)\s+([A-Z0-9]+|[IVXLCDM]+)(?:\s*[:\-–—.]\s*([^\n]+))?/gi;
    let match: RegExpExecArray | null;

    while ((match = scheduleRegex.exec(text)) !== null) {
      const schedNum = match[1];
      const title = (match[2] || "").trim();
      const identifier = `Schedule ${schedNum}`;
      const startOffset = match.index;
      const rawMatch = match[0].trim();

      nodes.push({
        type: "SCHEDULE",
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
