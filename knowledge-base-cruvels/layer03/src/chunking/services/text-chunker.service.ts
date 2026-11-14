import * as crypto from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { ChunkingOptions, TextChunk } from "../document-chunking.types";
import type { ExtractedPage } from "./raw-document-parser.service";

export const DEFAULT_CHUNKING_OPTIONS: Required<ChunkingOptions> = {
  targetTokens: 400,
  minTokens: 80,
  maxTokens: 600,
  overlapTokens: 80,
};

export interface EnrichedTextChunk {
  chunkIndex: number;
  chunkId: string;
  citationId: string;
  documentId: string;
  documentName: string;
  documentVersion?: string;
  pageNumber: number;
  pageEndNumber: number;
  sectionHeading?: string;
  clauseNumber?: string;
  content: string;
  characterCount: number;
  tokenCount: number;
  sourceReference: string;
  metadata?: Record<string, unknown>;
}

export interface ChunkDocumentParams {
  documentId: string;
  documentName: string;
  documentVersion?: string;
  pages: ExtractedPage[];
  options?: ChunkingOptions;
}

// Common boilerplate headers/footers in legal documents to strip from chunk content
export const BOILERPLATE_PATTERNS = [
  /^(?:CONFIDENTIAL|STRICTLY CONFIDENTIAL|PRIVILEGED & CONFIDENTIAL|PRIVATE & CONFIDENTIAL)\s*$/gim,
  /^(?:Page\s+\d+\s+of\s+\d+|Page\s+\d+|\d+\s*\/\s*\d+)\s*$/gim,
  /^(?:Draft\s+for\s+Discussion|Subject\s+to\s+Contract|Execution\s+Version|All\s+Rights\s+Reserved)\s*$/gim,
];

// Comprehensive regex for identifying legal section, clause, article, and schedule headings
export const LEGAL_HEADING_REGEX =
  /(?:^|\n)\s*((?:ARTICLE|Article)\s+(?:[0-9IVXLCDM]+|[A-Z])(?:\s*[-:–—.]\s*[^\n]+)?|(?:SECTION|Section|Sec\.)\s+(?:[0-9]+(?:\.[0-9]+)*)(?:\s*[-:–—.]\s*[^\n]+)?|(?:CLAUSE|Clause)\s+(?:[0-9]+(?:\.[0-9]+)*)(?:\s*[-:–—.]\s*[^\n]+)?|(?:SCHEDULE|Schedule|ANNEXURE|Annexure|EXHIBIT|Exhibit|APPENDIX|Appendix)\s+(?:[A-Z0-9]+|[IVXLCDM]+)(?:\s*[-:–—.]\s*[^\n]+)?|(?:[0-9]+(?:\.[0-9]+)+)\s+[A-Z][A-Za-z\s]{3,}|(?:RECITALS|DEFINITIONS|INDEMNIFICATION|INDEMNITY|LIMITATION OF LIABILITY|TERMINATION|GOVERNING LAW|JURISDICTION|DISPUTE RESOLUTION|CONFIDENTIALITY|REPRESENTATIONS AND WARRANTIES|FORCE MAJEURE|MISCELLANEOUS|GENERAL PROVISIONS)(?:\s*[:–—-][^\n]*)?)/i;

@Injectable()
export class TextChunkerService {
  /**
   * Approximates token count for legal text.
   * Standard heuristic: combination of word count (1.33 tokens/word)
   * and character length (4 characters/token).
   */
  estimateTokenCount(text: string): number {
    if (!text || !text.trim()) {
      return 0;
    }
    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length === 0) return 0;
    const wordEstimate = Math.ceil(words.length * 1.33);
    const charEstimate = Math.ceil(trimmed.length / 4);
    return Math.max(1, Math.round((wordEstimate + charEstimate) / 2));
  }

  /**
   * Sanitizes text by removing repetitive running header/footer lines.
   */
  sanitizeText(text: string): string {
    let cleaned = text;
    for (const pattern of BOILERPLATE_PATTERNS) {
      cleaned = cleaned.replace(pattern, "");
    }
    return cleaned.replace(/\n{3,}/g, "\n\n").trim();
  }

  /**
   * Deterministically generates a SHA-256 content hash for deduplication.
   */
  generateContentHash(text: string): string {
    if (!text || typeof text !== "string") return "";
    return crypto.createHash("sha256").update(text.trim()).digest("hex");
  }

  /**
   * Alias for chunk()
   */
  chunkText(normalizedText: string, options?: ChunkingOptions): TextChunk[] {
    return this.chunk(normalizedText, options);
  }

  /**
   * Deterministically splits normalized text into structured chunks.
   */
  chunk(normalizedText: string, options?: ChunkingOptions): TextChunk[] {
    if (!normalizedText || typeof normalizedText !== "string" || !normalizedText.trim()) {
      return [];
    }

    const text = this.sanitizeText(normalizedText);
    const opts: Required<ChunkingOptions> = {
      ...DEFAULT_CHUNKING_OPTIONS,
      ...options,
    };

    const totalTokens = this.estimateTokenCount(text);

    if (totalTokens <= opts.maxTokens) {
      const structural = this.extractStructuralHeaders(text);
      return [
        {
          chunkIndex: 0,
          content: text,
          tokenCount: totalTokens,
          metadata: structural,
        },
      ];
    }

    const segments = this.decomposeIntoSegments(text, opts.maxTokens);
    if (segments.length === 0) {
      return [];
    }

    const chunks: TextChunk[] = [];
    let currentSegments: string[] = [];
    let currentTokens = 0;
    let chunkIndex = 0;
    let segmentIndex = 0;

    while (segmentIndex < segments.length) {
      const segment = segments[segmentIndex];
      const segmentTokens = this.estimateTokenCount(segment);

      if (currentSegments.length > 0 && currentTokens + segmentTokens > opts.maxTokens) {
        const content = currentSegments.join("\n\n").trim();
        if (content) {
          const structural = this.extractStructuralHeaders(content);
          chunks.push({
            chunkIndex,
            content,
            tokenCount: currentTokens,
            metadata: structural,
          });
          chunkIndex++;
        }

        const overlapSegments: string[] = [];
        let overlapTokens = 0;

        for (let i = currentSegments.length - 1; i >= 0; i--) {
          const seg = currentSegments[i];
          const segToks = this.estimateTokenCount(seg);
          if (overlapTokens + segToks <= opts.overlapTokens || overlapSegments.length === 0) {
            overlapSegments.unshift(seg);
            overlapTokens += segToks;
          } else {
            break;
          }
        }

        if (overlapSegments.length >= currentSegments.length) {
          overlapSegments.pop();
          overlapTokens = overlapSegments.reduce((sum, s) => sum + this.estimateTokenCount(s), 0);
        }

        currentSegments = [...overlapSegments];
        currentTokens = overlapTokens;
      }

      currentSegments.push(segment);
      currentTokens += segmentTokens;
      segmentIndex++;
    }

    if (currentSegments.length > 0) {
      const content = currentSegments.join("\n\n").trim();
      if (content) {
        const structural = this.extractStructuralHeaders(content);
        chunks.push({
          chunkIndex,
          content,
          tokenCount: currentTokens,
          metadata: structural,
        });
      }
    }

    return chunks;
  }

  /**
   * Chunks a document page-by-page, strictly preserving page boundaries,
   * clause headings, clause numbers, and legal text.
   */
  chunkDocument(params: ChunkDocumentParams): EnrichedTextChunk[] {
    const { documentId, documentName, documentVersion, pages, options } = params;
    if (!pages || pages.length === 0) {
      return [];
    }

    const opts: Required<ChunkingOptions> = {
      ...DEFAULT_CHUNKING_OPTIONS,
      ...options,
    };

    const enrichedChunks: EnrichedTextChunk[] = [];
    let chunkIndex = 0;
    let lastKnownHeading = "";
    let lastKnownClause = "";

    for (const page of pages) {
      const pageText = this.sanitizeText(page.text);
      if (!pageText) continue;

      let pageHeading = lastKnownHeading;
      let pageClause = lastKnownClause;

      const headingMatch = pageText.match(LEGAL_HEADING_REGEX);
      if (headingMatch) {
        pageHeading = headingMatch[1].trim();
        lastKnownHeading = pageHeading;

        const clauseMatch = pageHeading.match(/([0-9]+(?:\.[0-9]+)*)/);
        if (clauseMatch) {
          pageClause = clauseMatch[1];
          lastKnownClause = pageClause;
        }
      }

      const pageTokens = this.estimateTokenCount(pageText);

      // If the page fits within maxTokens, keep the page as an atomic legal chunk
      if (pageTokens <= opts.maxTokens) {
        const chunkId = `${documentId}_chunk_${String(chunkIndex + 1).padStart(3, "0")}`;
        const citationId = `[${chunkIndex + 1}]`;
        const sourceRef = `${documentName}${documentVersion ? ` (v${documentVersion})` : ""}, Page ${page.pageNumber}${pageHeading ? ` (${pageHeading})` : ""}`;

        enrichedChunks.push({
          chunkIndex,
          chunkId,
          citationId,
          documentId,
          documentName,
          documentVersion,
          pageNumber: page.pageNumber,
          pageEndNumber: page.pageNumber,
          sectionHeading: pageHeading || undefined,
          clauseNumber: pageClause || undefined,
          content: pageText,
          characterCount: pageText.length,
          tokenCount: pageTokens,
          sourceReference: sourceRef,
          metadata: {
            pageNumber: page.pageNumber,
            sectionHeading: pageHeading || undefined,
            clauseNumber: pageClause || undefined,
            documentVersion,
          },
        });
        chunkIndex++;
      } else {
        // Page exceeds maxTokens: decompose into clause/paragraph segments for this page
        const segments = this.decomposeIntoSegments(pageText, opts.maxTokens);
        let currentSegs: string[] = [];
        let currentToks = 0;
        let subIndex = 1;

        for (const seg of segments) {
          const segMatch = seg.match(LEGAL_HEADING_REGEX);
          if (segMatch) {
            pageHeading = segMatch[1].trim();
            lastKnownHeading = pageHeading;
            const clauseMatch = pageHeading.match(/([0-9]+(?:\.[0-9]+)*)/);
            if (clauseMatch) {
              pageClause = clauseMatch[1];
              lastKnownClause = pageClause;
            }
          }

          const segToks = this.estimateTokenCount(seg);

          if (currentSegs.length > 0 && currentToks + segToks > opts.maxTokens) {
            const content = currentSegs.join("\n\n").trim();
            const chunkId = `${documentId}_chunk_${String(chunkIndex + 1).padStart(3, "0")}`;
            const citationId = `[${chunkIndex + 1}]`;
            const sourceRef = `${documentName}${documentVersion ? ` (v${documentVersion})` : ""}, Page ${page.pageNumber}${pageHeading ? ` (${pageHeading})` : ""}`;

            enrichedChunks.push({
              chunkIndex,
              chunkId,
              citationId,
              documentId,
              documentName,
              documentVersion,
              pageNumber: page.pageNumber,
              pageEndNumber: page.pageNumber,
              sectionHeading: pageHeading || undefined,
              clauseNumber: pageClause || undefined,
              content,
              characterCount: content.length,
              tokenCount: currentToks,
              sourceReference: sourceRef,
              metadata: {
                pageNumber: page.pageNumber,
                subIndex: subIndex++,
                sectionHeading: pageHeading || undefined,
                clauseNumber: pageClause || undefined,
                documentVersion,
              },
            });
            chunkIndex++;

            // Trailing segment overlap
            currentSegs = [currentSegs[currentSegs.length - 1]];
            currentToks = this.estimateTokenCount(currentSegs[0]);
          }

          currentSegs.push(seg);
          currentToks += segToks;
        }

        if (currentSegs.length > 0) {
          const content = currentSegs.join("\n\n").trim();
          const chunkId = `${documentId}_chunk_${String(chunkIndex + 1).padStart(3, "0")}`;
          const citationId = `[${chunkIndex + 1}]`;
          const sourceRef = `${documentName}${documentVersion ? ` (v${documentVersion})` : ""}, Page ${page.pageNumber}${pageHeading ? ` (${pageHeading})` : ""}`;

          enrichedChunks.push({
            chunkIndex,
            chunkId,
            citationId,
            documentId,
            documentName,
            documentVersion,
            pageNumber: page.pageNumber,
            pageEndNumber: page.pageNumber,
            sectionHeading: pageHeading || undefined,
            clauseNumber: pageClause || undefined,
            content,
            characterCount: content.length,
            tokenCount: currentToks,
            sourceReference: sourceRef,
            metadata: {
              pageNumber: page.pageNumber,
              subIndex,
              sectionHeading: pageHeading || undefined,
              clauseNumber: pageClause || undefined,
              documentVersion,
            },
          });
          chunkIndex++;
        }
      }
    }

    return enrichedChunks;
  }

  /**
   * Extracts legal structural identifiers from text content (sections, clauses, schedules, annexures, exhibits, page numbers).
   */
  public extractStructuralHeaders(text: string): Record<string, unknown> {
    const meta: Record<string, unknown> = {};

    // 1. Detect page numbers (e.g., "[Page 24]" or "--- Page 24 ---" or "Page 24 of 50")
    const pageMatch = text.match(/(?:\[|\b|\-\-\-)\s*Page\s+(\d+)(?:\s+of\s+\d+)?(?:\s*\]|\b|\-\-\-)/i);
    if (pageMatch) {
      meta.pageNumber = parseInt(pageMatch[1], 10);
      meta.page = meta.pageNumber;
    }

    // 2. Detect section headers (e.g. "Section 8" or "Section 8.2" or "8.2(a) Indemnification")
    const secMatch = text.match(/\b(?:Section|Sec\.)\s*(\d+(?:\.\d+)?(?:\([a-z0-9]+\))?)\b/i);
    if (secMatch) {
      meta.section = secMatch[1];
    }

    // 3. Detect clause headers (e.g. "Clause 8" or "Clause 8.2" or "8.2(a)")
    const clauseMatch = text.match(/\b(?:Clause|Cl\.)\s*(\d+(?:\.\d+)?(?:\([a-z0-9]+\))?)\b/i) ||
                        text.match(/^\s*(\d+\.\d+(?:\([a-z0-9]+\))?)\s+[A-Z]/m);
    if (clauseMatch) {
      meta.clause = clauseMatch[1];
      if (!meta.section) {
        meta.section = clauseMatch[1];
      }
    }

    // 4. Detect schedules / annexures / exhibits
    const scheduleMatch = text.match(/\b(Schedule\s+[A-Z0-9]+)\b/i);
    if (scheduleMatch) {
      meta.schedule = scheduleMatch[1];
    }

    const annexureMatch = text.match(/\b(Annexure\s+[A-Z0-9]+)\b/i);
    if (annexureMatch) {
      meta.annexure = annexureMatch[1];
    }

    const exhibitMatch = text.match(/\b(Exhibit\s+[A-Z0-9]+)\b/i);
    if (exhibitMatch) {
      meta.exhibit = exhibitMatch[1];
    }

    return meta;
  }

  /**
   * Recursively decomposes text into atomic chunks that are each under maxTokens.
   */
  private decomposeIntoSegments(text: string, maxTokens: number): string[] {
    const rawParagraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const segments: string[] = [];

    for (const paragraph of rawParagraphs) {
      const pTokens = this.estimateTokenCount(paragraph);
      if (pTokens <= maxTokens) {
        segments.push(paragraph);
      } else {
        // Sentence-level splitting if paragraph is huge
        const sentences = paragraph.split(/(?<=[.?!])\s+/).filter(Boolean);
        let currSentences: string[] = [];
        let currTokens = 0;

        for (const sentence of sentences) {
          const sTokens = this.estimateTokenCount(sentence);
          if (currSentences.length > 0 && currTokens + sTokens > maxTokens) {
            segments.push(currSentences.join(" "));
            currSentences = [sentence];
            currTokens = sTokens;
          } else {
            currSentences.push(sentence);
            currTokens += sTokens;
          }
        }

        if (currSentences.length > 0) {
          segments.push(currSentences.join(" "));
        }
      }
    }

    return segments;
  }
}
