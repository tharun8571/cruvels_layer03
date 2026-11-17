import { Injectable, Logger } from "@nestjs/common";
import zlib from "node:zlib";
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

function decodePdfAscii85(str: string): Buffer {
  let cleaned = str.replace(/\s/g, "");
  if (cleaned.startsWith("<~")) cleaned = cleaned.slice(2);
  const endIdx = cleaned.indexOf("~>");
  if (endIdx !== -1) cleaned = cleaned.slice(0, endIdx);

  const out: number[] = [];
  let tuple = 0;
  let count = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned.charCodeAt(i);
    if (c === 122 && count === 0) {
      out.push(0, 0, 0, 0);
      continue;
    }
    if (c < 33 || c > 117) continue;
    tuple = tuple * 85 + (c - 33);
    count++;
    if (count === 5) {
      out.push((tuple >>> 24) & 255, (tuple >>> 16) & 255, (tuple >>> 8) & 255, tuple & 255);
      tuple = 0;
      count = 0;
    }
  }

  if (count > 0) {
    for (let j = count; j < 5; j++) tuple = tuple * 85 + 84;
    for (let j = 0; j < count - 1; j++) {
      out.push((tuple >>> (24 - j * 8)) & 255);
    }
  }

  return Buffer.from(out);
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
    const rawString = buffer.toString("latin1");
    const streamRegex = /\bstream[\r\n]+/g;
    let match: RegExpExecArray | null;
    const pageTexts: string[] = [];

    while ((match = streamRegex.exec(rawString)) !== null) {
      const streamStart = match.index + match[0].length;
      const streamEnd = rawString.indexOf("endstream", streamStart);
      if (streamEnd === -1) continue;

      const streamData = rawString.slice(streamStart, streamEnd);
      const dictBefore = rawString.slice(Math.max(0, match.index - 250), match.index);

      let decompressed: Buffer | null = null;
      if (dictBefore.includes("/ASCII85Decode")) {
        const decodedA85 = decodePdfAscii85(streamData);
        try {
          decompressed = zlib.inflateSync(decodedA85);
        } catch {
          try {
            decompressed = zlib.inflateRawSync(decodedA85);
          } catch {
            decompressed = decodedA85;
          }
        }
      } else if (dictBefore.includes("/FlateDecode")) {
        const rawBuf = Buffer.from(streamData, "latin1");
        try {
          decompressed = zlib.inflateSync(rawBuf);
        } catch {
          try {
            decompressed = zlib.inflateRawSync(rawBuf);
          } catch {
            decompressed = rawBuf;
          }
        }
      } else {
        decompressed = Buffer.from(streamData, "latin1");
      }

      if (decompressed) {
        const text = decompressed.toString("latin1");
        const lines: string[] = [];
        const tjRegex = /(?:\(((?:[^()\\]|\\.)*)\)\s*Tj|\[(.*?)\]\s*TJ)/g;
        let tm: RegExpExecArray | null;
        while ((tm = tjRegex.exec(text)) !== null) {
          if (tm[1] !== undefined) {
            lines.push(tm[1].replace(/\\([()\\])/g, "$1"));
          } else if (tm[2]) {
            const parts = tm[2].match(/\(((?:[^()\\]|\\.)*)\)/g);
            if (parts) {
              lines.push(parts.map((p) => p.slice(1, -1).replace(/\\([()\\])/g, "$1")).join(""));
            }
          }
        }

        if (lines.length > 5) {
          pageTexts.push(lines.join("\n"));
        }
      }
    }

    if (pageTexts.length > 0) {
      const pages: ExtractedPageData[] = pageTexts.map((txt, idx) => {
        const pageNum = idx + 1;
        const clean = this.textParser.normalize(txt);
        const tables = this.tableParser.extractTables(clean, pageNum);
        return {
          pageNumber: pageNum,
          text: clean,
          characterCount: clean.length,
          tokenCount: Math.ceil(clean.length / 4),
          isScanned: false,
          ocrConfidence: 1.0,
          ocrQualityWarning: false,
          tables,
        };
      });

      const fullText = pages.map((p) => p.text).join("\n\n");
      return {
        pageCount: pages.length,
        pages,
        fullText,
        isScanned: false,
        ocrConfidence: 1.0,
      };
    }

    // Fallback: check uncompressed BT ... ET blocks
    const textBlocks: string[] = [];
    const btRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let btm: RegExpExecArray | null;
    while ((btm = btRegex.exec(rawString)) !== null) {
      const block = btm[1];
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
