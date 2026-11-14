import { Injectable, Logger } from "@nestjs/common";
import type { ExtractedPageData } from "../knowledge-intelligence.types";
import { TableParserService } from "./table-parser";
import { TextParserService } from "./text-parser";

export interface ParsedPdfDocument {
  pageCount: number;
  pages: ExtractedPageData[];
  fullText: string;
  isScanned: boolean;
  ocrConfidence?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);

  constructor(
    private readonly textParser: TextParserService,
    private readonly tableParser: TableParserService,
  ) {}

  /**
   * Parses PDF text or raw buffer into structured pages and metadata.
   */
  async parsePdf(input: Buffer | string): Promise<ParsedPdfDocument> {
    if (typeof input === "string") {
      return this.parsePdfText(input);
    }

    try {
      // If buffer, inspect text layer
      const textContent = input.toString("utf8");
      // If it looks like raw PDF syntax (%PDF-1.), attempt text extraction or page splitting
      if (textContent.startsWith("%PDF-")) {
        // Extract literal text blocks from PDF stream or fallback to text representation
        return this.parseRawPdfBuffer(input);
      }
      return this.parsePdfText(textContent);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`PDF buffer extraction fallback: ${msg}`);
      return this.parsePdfText(input.toString("utf8"));
    }
  }

  /**
   * Parses pre-extracted or simulated PDF page streams with "[Page X]" or "--- Page X ---" separators.
   */
  parsePdfText(rawText: string): ParsedPdfDocument {
    const normalized = this.textParser.normalize(rawText);
    const pageSplits = normalized.split(/(?:^|\n)(?:\[Page\s*(\d+)\]|---+\s*Page\s*(\d+)\s*---+|===+\s*Page\s*(\d+)\s*===+)/i);

    const pages: ExtractedPageData[] = [];

    if (pageSplits.length <= 1) {
      // Single page document or no explicit page markers
      const cleanText = normalized.trim();
      const tables = this.tableParser.extractTables(cleanText, 1);
      const isScanned = cleanText.length > 0 && cleanText.length < 40 && !cleanText.includes(" ");

      pages.push({
        pageNumber: 1,
        text: cleanText,
        characterCount: cleanText.length,
        tokenCount: Math.ceil(cleanText.length / 4),
        isScanned,
        ocrConfidence: isScanned ? 0.6 : 1.0,
        ocrQualityWarning: isScanned,
        tables,
      });
    } else {
      let currentPageNum = 1;
      for (let i = 1; i < pageSplits.length; i += 4) {
        const pageNumStr = pageSplits[i] || pageSplits[i + 1] || pageSplits[i + 2];
        const pageContent = pageSplits[i + 3] || "";
        const pageNumber = pageNumStr ? parseInt(pageNumStr, 10) : currentPageNum;
        currentPageNum = pageNumber + 1;

        const cleanText = pageContent.trim();
        const tables = this.tableParser.extractTables(cleanText, pageNumber);
        const isScanned = cleanText.length > 0 && cleanText.length < 40 && !cleanText.includes(" ");

        pages.push({
          pageNumber,
          text: cleanText,
          characterCount: cleanText.length,
          tokenCount: Math.ceil(cleanText.length / 4),
          isScanned,
          ocrConfidence: isScanned ? 0.6 : 1.0,
          ocrQualityWarning: isScanned,
          tables,
        });
      }
    }

    const fullText = pages.map((p) => p.text).join("\n\n");
    const scannedPagesCount = pages.filter((p) => p.isScanned).length;
    const isScanned = pages.length > 0 && scannedPagesCount / pages.length > 0.5;

    return {
      pageCount: pages.length,
      pages,
      fullText,
      isScanned,
      ocrConfidence: isScanned ? 0.65 : 1.0,
    };
  }

  private parseRawPdfBuffer(buffer: Buffer): ParsedPdfDocument {
    // Extract textual characters from stream objects
    const rawString = buffer.toString("latin1");
    // Extract BT ... ET text blocks if present
    const textBlocks: string[] = [];
    const btRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let match: RegExpExecArray | null;
    while ((match = btRegex.exec(rawString)) !== null) {
      const block = match[1];
      const tjMatches = block.match(/\((.*?)\)\s*Tj/g);
      if (tjMatches) {
        const line = tjMatches.map((tj) => tj.replace(/^\(|\)\s*Tj$/g, "")).join(" ");
        textBlocks.push(line);
      }
    }

    const extracted = textBlocks.join("\n").trim();
    if (extracted.length >= 50) {
      return this.parsePdfText(extracted);
    }

    // Low text density -> scanned PDF indication
    return {
      pageCount: 1,
      pages: [
        {
          pageNumber: 1,
          text: extracted,
          characterCount: extracted.length,
          tokenCount: Math.ceil(extracted.length / 4),
          isScanned: true,
          ocrConfidence: 0.5,
          ocrQualityWarning: true,
        },
      ],
      fullText: extracted,
      isScanned: true,
      ocrConfidence: 0.5,
    };
  }
}
