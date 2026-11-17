import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type {
  ExtractedPageData,
  LegalChunk,
  LegalDocumentKind,
  LegalStructuralUnitType,
} from "../knowledge-intelligence.types";
import { DocumentStructureDetectorService } from "../structure/document-structure-detector";
import { ChunkValidatorService } from "./chunk-validator";
import { SemanticChunkerService } from "./semantic-chunker";
import { TokenBoundarySplitterService } from "./token-boundary-splitter";

export interface LegalStructureChunkOptions {
  documentId: string;
  documentName: string;
  version?: string;
  isCurrentVersion?: boolean;
  documentKind?: LegalDocumentKind;
  maxTokens?: number;
  overlapTokens?: number;
}

// Comprehensive regex for identifying distinct legal units within a page
const PAGE_INTERNAL_SPLIT_REGEX = /(?=(?:^|\n)\s*(?:(?:ARTICLE|Article)\s+[0-9IVXLCDM]+|(?:SECTION|Section|Sec\.|§)\s+[0-9a-zA-Z]+(?:\.[0-9a-zA-Z]+)*|(?:\b[0-9a-zA-Z]+\.[0-9a-zA-Z]+(?:\([a-z0-9]+\))*\s+[A-Z])|(?:SCHEDULE|Schedule|ANNEXURE|Annexure|EXHIBIT|Exhibit)\s+[A-Z0-9]+|(?:CLAUSE|Clause|Cl\.)\s+[0-9a-zA-Z]+(?:\.[0-9a-zA-Z]+)*))/;

@Injectable()
export class LegalStructureChunkerService {
  constructor(
    private readonly structureDetector: DocumentStructureDetectorService,
    private readonly semanticChunker: SemanticChunkerService,
    private readonly boundarySplitter: TokenBoundarySplitterService,
    private readonly chunkValidator: ChunkValidatorService,
  ) {}

  /**
   * Chunks a document structurally by recognizing Articles, Sections, Clauses, Subclauses,
   * Schedules, Annexures, Exhibits, and Paragraphs.
   * Splits multi-clause pages into distinct atomic chunks while preserving all provenance.
   */
  chunkDocument(
    pages: ExtractedPageData[],
    options: LegalStructureChunkOptions,
  ): LegalChunk[] {
    const {
      documentId,
      documentName,
      version = "1.0",
      isCurrentVersion = true,
      maxTokens = 500,
      overlapTokens = 50,
    } = options;

    const chunks: LegalChunk[] = [];
    let globalChunkIndex = 0;
    let runningArticle: string | undefined;
    let runningSection: string | undefined;
    let runningClause: string | undefined;
    let runningSchedule: string | undefined;
    let runningAnnexure: string | undefined;
    let runningExhibit: string | undefined;

    for (const page of pages) {
      const pageText = (page.text || "").trim();
      if (!pageText) continue;

      // Extract intra-page clause boundaries
      const rawBlocks = pageText.split(PAGE_INTERNAL_SPLIT_REGEX).map((b) => b.trim()).filter(Boolean);

      let pageOffset = 0;

      for (const block of rawBlocks) {
        // Detect structural identifiers in this specific block
        const blockIdentifiers = this.extractBlockIdentifiers(block);

        if (blockIdentifiers.article) runningArticle = blockIdentifiers.article;
        if (blockIdentifiers.section) runningSection = blockIdentifiers.section;
        if (blockIdentifiers.clause) runningClause = blockIdentifiers.clause;
        if (blockIdentifiers.schedule) runningSchedule = blockIdentifiers.schedule;
        if (blockIdentifiers.annexure) runningAnnexure = blockIdentifiers.annexure;
        if (blockIdentifiers.exhibit) runningExhibit = blockIdentifiers.exhibit;

        const effectiveSection = blockIdentifiers.section || runningSection;
        const effectiveClause = blockIdentifiers.clause || runningClause;
        const effectiveArticle = blockIdentifiers.article || runningArticle;
        const effectiveSchedule = blockIdentifiers.schedule || runningSchedule;
        const effectiveAnnexure = blockIdentifiers.annexure || runningAnnexure;
        const effectiveExhibit = blockIdentifiers.exhibit || runningExhibit;

        const structuralUnit = this.determineStructuralUnit(blockIdentifiers);
        const isOperativeClause = this.isOperativeLegalClause(block, structuralUnit, effectiveSection);
        const isTable = Boolean(block.includes("| ---") || (page.tables && page.tables.length > 0));

        const blockTokens = this.boundarySplitter.estimateTokens(block);

        // If block fits within token limit, create single atomic legal chunk
        if (blockTokens <= maxTokens) {
          globalChunkIndex++;
          const contentHash = createHash("sha256").update(block).digest("hex");
          const chunkId = `chk-${documentId}-p${page.pageNumber}-${String(globalChunkIndex).padStart(3, "0")}`;
          const citationId = `[${globalChunkIndex}]`;

          const chunk: LegalChunk = {
            chunkId,
            citationId,
            documentId,
            documentName,
            version,
            isCurrentVersion,
            pageNumber: page.pageNumber,
            pageEndNumber: page.pageNumber,
            section: effectiveSection,
            clause: effectiveClause,
            article: effectiveArticle,
            schedule: effectiveSchedule,
            annexure: effectiveAnnexure,
            exhibit: effectiveExhibit,
            structuralUnit,
            content: block,
            rawSourceText: block,
            startOffset: pageOffset,
            endOffset: pageOffset + block.length,
            tokenCount: blockTokens,
            characterCount: block.length,
            contentHash,
            isOperativeClause,
            isTable,
            ocrConfidence: page.ocrConfidence,
            ocrQualityWarning: page.ocrQualityWarning || (page.ocrConfidence !== undefined && page.ocrConfidence < 0.8),
            metadata: {
              page: page.pageNumber,
              section: effectiveSection,
              clause: effectiveClause,
              article: effectiveArticle,
              schedule: effectiveSchedule,
              annexure: effectiveAnnexure,
              exhibit: effectiveExhibit,
              version,
              isCurrentVersion,
            },
          };

          this.chunkValidator.validateChunk(chunk);
          chunks.push(chunk);
        } else {
          // Block exceeds maxTokens: semantic splitting while strictly preserving clause provenance
          const subPieces = this.semanticChunker.chunkSemantically(block, { maxTokens, overlapTokens });
          let subOffset = pageOffset;

          for (const piece of subPieces) {
            globalChunkIndex++;
            const pieceToks = this.boundarySplitter.estimateTokens(piece);
            const contentHash = createHash("sha256").update(piece).digest("hex");
            const chunkId = `chk-${documentId}-p${page.pageNumber}-${String(globalChunkIndex).padStart(3, "0")}`;
            const citationId = `[${globalChunkIndex}]`;

            const chunk: LegalChunk = {
              chunkId,
              citationId,
              documentId,
              documentName,
              version,
              isCurrentVersion,
              pageNumber: page.pageNumber,
              pageEndNumber: page.pageNumber,
              section: effectiveSection,
              clause: effectiveClause,
              article: effectiveArticle,
              schedule: effectiveSchedule,
              annexure: effectiveAnnexure,
              exhibit: effectiveExhibit,
              structuralUnit,
              content: piece,
              rawSourceText: piece,
              startOffset: subOffset,
              endOffset: subOffset + piece.length,
              tokenCount: pieceToks,
              characterCount: piece.length,
              contentHash,
              isOperativeClause,
              isTable,
              ocrConfidence: page.ocrConfidence,
              ocrQualityWarning: page.ocrQualityWarning || (page.ocrConfidence !== undefined && page.ocrConfidence < 0.8),
              metadata: {
                page: page.pageNumber,
                section: effectiveSection,
                clause: effectiveClause,
                article: effectiveArticle,
                schedule: effectiveSchedule,
                annexure: effectiveAnnexure,
                exhibit: effectiveExhibit,
                version,
                isCurrentVersion,
              },
            };

            this.chunkValidator.validateChunk(chunk);
            chunks.push(chunk);
            subOffset += piece.length;
          }
        }

        pageOffset += block.length;
      }
    }

    return chunks;
  }

  private extractBlockIdentifiers(text: string): {
    article?: string;
    section?: string;
    clause?: string;
    schedule?: string;
    annexure?: string;
    exhibit?: string;
  } {
    const res: {
      article?: string;
      section?: string;
      clause?: string;
      schedule?: string;
      annexure?: string;
      exhibit?: string;
    } = {};

    const artMatch = text.match(/\b(?:ARTICLE|Article)\s+([0-9IVXLCDM]+|[A-Z])\b/i);
    if (artMatch) res.article = artMatch[1];

    const secMatch = text.match(/\b(?:SECTION|Section|Sec\.|§)\s*([0-9a-zA-Z]+(?:\.[0-9a-zA-Z]+)*)\b/i) ||
                     text.match(/^\s*([0-9a-zA-Z]+\.[0-9a-zA-Z]+)\s+[A-Z]/m);
    if (secMatch) res.section = secMatch[1];

    const clMatch = text.match(/\b(?:CLAUSE|Clause|Cl\.)\s*([0-9a-zA-Z]+(?:\.[0-9a-zA-Z]+)*(?:\([a-z0-9]+\))*)\b/i) ||
                    text.match(/\b(\d+(?:\.\d+)*(?:\([a-z0-9]+\))+)\b/i);
    if (clMatch) res.clause = clMatch[1];

    const schedMatch = text.match(/\b(?:SCHEDULE|Schedule)\s+([A-Z0-9]+|[IVXLCDM]+)\b/i);
    if (schedMatch) res.schedule = schedMatch[1];

    const annMatch = text.match(/\b(?:ANNEXURE|Annexure|APPENDIX|Appendix)\s+([A-Z0-9]+|[IVXLCDM]+)\b/i);
    if (annMatch) res.annexure = annMatch[1];

    const exhMatch = text.match(/\b(?:EXHIBIT|Exhibit)\s+([A-Z0-9]+|[IVXLCDM]+)\b/i);
    if (exhMatch) res.exhibit = exhMatch[1];

    return res;
  }

  private determineStructuralUnit(ids: ReturnType<typeof this.extractBlockIdentifiers>): LegalStructuralUnitType {
    if (ids.clause && ids.clause.includes("(")) return "SUBCLAUSE";
    if (ids.clause) return "CLAUSE";
    if (ids.section) return "SECTION";
    if (ids.article) return "ARTICLE";
    if (ids.schedule) return "SCHEDULE";
    if (ids.annexure) return "ANNEXURE";
    if (ids.exhibit) return "EXHIBIT";
    return "PARAGRAPH";
  }

  private isOperativeLegalClause(
    text: string,
    unit: LegalStructuralUnitType,
    section?: string,
  ): boolean {
    const lower = text.toLowerCase();
    const isOperativeKeyword =
      lower.includes("shall") ||
      lower.includes("indemnif") ||
      lower.includes("hold harmless") ||
      lower.includes("liab") ||
      lower.includes("terminat") ||
      lower.includes("penalty") ||
      lower.includes("fee") ||
      lower.includes("breach") ||
      lower.includes("warrant");

    const isDefOrPreamble =
      lower.includes("whereas") ||
      lower.includes("recital") ||
      lower.includes("definitions:") ||
      lower.includes("means and includes");

    return (isOperativeKeyword || unit === "CLAUSE" || unit === "SECTION") && !isDefOrPreamble;
  }
}
