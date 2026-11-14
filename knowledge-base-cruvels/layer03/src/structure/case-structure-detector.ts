/**
 * CRUVELS AI — Layer 03 Case Law Structure Detector
 *
 * Specialised AST and regex detector for Indian judicial judgments (Supreme Court & High Courts).
 * Identifies paragraph numbers, headings, issues, submissions, findings,
 * ratio decidendi, directions, orders, statutory references, and citations.
 */

import { Injectable } from "@nestjs/common";
import type {
  CaseJudgmentChunkV1,
  JudgmentStructuralSection,
  PrecedentStatus,
} from "../contracts/case-law.contract";
import type { LegalDomain, LegalJurisdictionCode } from "../contracts/legal-source.contract";
import { createHash } from "node:crypto";

export interface RawJudgmentInput {
  caseId: string;
  caseName: string;
  citation: string;
  court: "SUPREME_COURT" | "HIGH_COURT" | "TRIBUNAL" | "OTHER";
  state?: string;
  fullJudgmentText: string;
  legalDomain: LegalDomain;
  jurisdiction: LegalJurisdictionCode;
  precedentStatus: PrecedentStatus;
}

@Injectable()
export class CaseStructureDetector {
  /**
   * Parses raw judgment text into structural paragraph-level chunks with complete provenance.
   */
  detectAndChunkJudgment(input: RawJudgmentInput): CaseJudgmentChunkV1[] {
    const lines = input.fullJudgmentText.split(/\r?\n/);
    const chunks: CaseJudgmentChunkV1[] = [];
    let currentSection: JudgmentStructuralSection = "GENERAL";
    let currentHeading = "";
    let currentParaNum: number | undefined;
    let accumulatedText: string[] = [];

    const flushCurrentChunk = () => {
      if (accumulatedText.length === 0) return;
      const content = accumulatedText.join("\n").trim();
      if (!content) return;

      const chunkIndex = chunks.length + 1;
      const paraNum = currentParaNum || chunkIndex;
      const isRatio = currentSection === "RATIO" || /\b(we hold that|the law is settled that|the ratio of|we lay down the following principle)\b/i.test(content);
      const isDirection = currentSection === "DIRECTIONS" || /\b(we direct that|following directions are issued|we issue the following guidelines)\b/i.test(content);
      const isHolding = currentSection === "FINDINGS" || isRatio || isDirection;

      const statutesMentioned = this.extractStatutes(content);
      const articlesMentioned = this.extractArticles(content);
      const precedentsMentioned = this.extractPrecedentCitations(content);

      const provenance = `[${input.caseName}, ${input.citation}, at Para ${paraNum}]`;
      const contentHash = createHash("sha256").update(content).digest("hex");

      chunks.push({
        chunkId: `chk_case_${input.caseId}_p${paraNum}_${chunkIndex}`,
        caseId: input.caseId,
        caseName: input.caseName,
        citation: input.citation,
        court: input.court,
        state: input.state,
        paragraphNumber: paraNum,
        heading: currentHeading || undefined,
        structuralSection: currentSection,
        content,
        rawText: content,
        proposition: this.extractProposition(content),
        isRatio,
        isDirection,
        isHolding,
        statutesMentioned,
        articlesMentioned,
        precedentsMentioned,
        legalDomain: input.legalDomain,
        jurisdiction: input.jurisdiction,
        precedentStatus: input.precedentStatus,
        provenance,
        contentHash,
        tokenCount: Math.ceil(content.length / 4),
      });

      accumulatedText = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // 1. Detect structural headings
      const headingMatch = this.matchStructuralHeading(line);
      if (headingMatch) {
        flushCurrentChunk();
        currentSection = headingMatch.section;
        currentHeading = headingMatch.heading;
        continue;
      }

      // 2. Detect paragraph boundaries (e.g. "12. ", "[12]", "Para 12:", "12 ")
      const paraMatch = line.match(/^(?:(?:para(?:graph)?\.?\s*)|\[)?(\d{1,4})(?:\]|\.|\:|\))\s+(.*)$/i);
      if (paraMatch && paraMatch[1]) {
        flushCurrentChunk();
        currentParaNum = parseInt(paraMatch[1], 10);
        accumulatedText.push(paraMatch[2] || line);
        continue;
      }

      accumulatedText.push(line);
    }

    flushCurrentChunk();
    return chunks;
  }

  private matchStructuralHeading(line: string): { section: JudgmentStructuralSection; heading: string } | null {
    const clean = line.replace(/^[IVXLCDM\d\.\-\s]+/, "").trim();
    if (/^(?:facts|factual\s+background|brief\s+facts)\b/i.test(clean)) {
      return { section: "FACTS", heading: line };
    }
    if (/^(?:submissions|arguments\s+on\s+behalf|contentions\s+of)\b/i.test(clean)) {
      return { section: "SUBMISSIONS", heading: line };
    }
    if (/^(?:issues|questions\s+for\s+consideration|points\s+for\s+determination)\b/i.test(clean)) {
      return { section: "ISSUES", heading: line };
    }
    if (/^(?:findings|analysis|consideration|our\s+view)\b/i.test(clean)) {
      return { section: "FINDINGS", heading: line };
    }
    if (/^(?:reasoning|discussion)\b/i.test(clean)) {
      return { section: "REASONING", heading: line };
    }
    if (/^(?:ratio|holding|conclusion|legal\s+position)\b/i.test(clean)) {
      return { section: "RATIO", heading: line };
    }
    if (/^(?:directions|guidelines\s+issued|guidelines|operating\s+procedure)\b/i.test(clean)) {
      return { section: "DIRECTIONS", heading: line };
    }
    if (/^(?:order|final\s+order|disposition|result|decree)\b/i.test(clean)) {
      return { section: "FINAL_ORDER", heading: line };
    }
    return null;
  }

  private extractStatutes(text: string): string[] {
    const matches = new Set<string>();
    const patterns = [
      /\b(?:Bharatiya\s+Nagarik\s+Suraksha\s+Sanhita|BNSS|Code\s+of\s+Criminal\s+Procedure|CrPC|Bharatiya\s+Nyaya\s+Sanhita|BNS|Indian\s+Penal\s+Code|IPC|Information\s+Technology\s+Act|IT\s+Act|Indian\s+Contract\s+Act|Contract\s+Act|Arbitration\s+and\s+Conciliation\s+Act|Arbitration\s+Act|Transfer\s+of\s+Property\s+Act|TPA|Civil\s+Procedure\s+Code|CPC|Limitation\s+Act|Specific\s+Relief\s+Act|Companies\s+Act|Consumer\s+Protection\s+Act|RERA|Insolvency\s+and\s+Bankruptcy\s+Code|IBC|Digital\s+Personal\s+Data\s+Protection\s+Act|DPDP|Negotiable\s+Instruments\s+Act|NI\s+Act)\b/gi,
    ];
    for (const pat of patterns) {
      const found = text.match(pat);
      if (found) {
        for (const f of found) matches.add(f);
      }
    }
    return Array.from(matches);
  }

  private extractArticles(text: string): string[] {
    const matches = new Set<string>();
    const pat = /\b(?:Article|Art\.?)\s+(\d+[A-Z]?(?:\(\d+\))?)\b/gi;
    let m: RegExpExecArray | null;
    while ((m = pat.exec(text)) !== null) {
      matches.add(`Article ${m[1]}`);
    }
    return Array.from(matches);
  }

  private extractPrecedentCitations(text: string): string[] {
    const matches = new Set<string>();
    const pat = /\b(?:\(\d{4}\)\s+\d+\s+SCC\s+\d+|AIR\s+\d{4}\s+SC\s+\d+|\d{4}\s+INSC\s+\d+)\b/gi;
    let m: RegExpExecArray | null;
    while ((m = pat.exec(text)) !== null) {
      matches.add(m[0]);
    }
    return Array.from(matches);
  }

  private extractProposition(text: string): string | undefined {
    const sentences = text.split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      if (/\b(?:held\s+that|we\s+hold\s+that|it\s+is\s+mandatory\s+that|must\s+be\s+strictly|condition\s+precedent|liberty\s+under\s+Article|safeguard|obligation\s+of\s+the\s+police)\b/i.test(s)) {
        return s.trim();
      }
    }
    return sentences[0]?.trim();
  }
}
