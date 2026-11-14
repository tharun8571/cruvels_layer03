import { Injectable, Logger } from "@nestjs/common";
import * as zlib from "node:zlib";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  characterCount: number;
}

export interface ParsedDocumentResult {
  documentId?: string;
  fileName: string;
  format: "pdf" | "docx" | "txt" | "md" | "unknown";
  rawText: string;
  pages: ExtractedPage[];
  characterCount: number;
  estimatedPages: number;
  metadata: Record<string, unknown>;
  error?: string;
}

export interface DocumentParseInput {
  documentId?: string;
  fileName: string;
  content?: string;
  buffer?: Buffer;
  base64?: string;
  mimeType?: string;
}

@Injectable()
export class RawDocumentParserService {
  private readonly logger = new Logger(RawDocumentParserService.name);

  /**
   * Parses uploaded or referenced document (PDF, DOCX, TXT, MD) into raw text and structured pages.
   */
  parse(input: DocumentParseInput): ParsedDocumentResult {
    const fileName = input.fileName || "document.txt";
    const documentId = input.documentId || `doc_${Date.now().toString(36)}`;
    const ext = fileName.split(".").pop()?.toLowerCase() || "txt";

    let buffer: Buffer | null = null;
    if (input.buffer) {
      buffer = input.buffer;
    } else if (input.base64) {
      try {
        const cleanBase64 = input.base64.replace(/^data:[^;]+;base64,/, "");
        buffer = Buffer.from(cleanBase64, "base64");
      } catch (err: any) {
        return {
          documentId,
          fileName,
          format: "unknown",
          rawText: "",
          pages: [],
          characterCount: 0,
          estimatedPages: 0,
          metadata: {},
          error: `Failed to decode base64 buffer: ${err.message}`,
        };
      }
    } else if (typeof input.content === "string") {
      buffer = Buffer.from(input.content, "utf8");
    }

    if (!buffer || buffer.length === 0) {
      return {
        documentId,
        fileName,
        format: ext === "pdf" ? "pdf" : ext === "docx" ? "docx" : ext === "md" ? "md" : "txt",
        rawText: "",
        pages: [],
        characterCount: 0,
        estimatedPages: 0,
        metadata: { byteLength: 0 },
        error: "Document content is empty (0 bytes).",
      };
    }

    try {
      if (ext === "pdf" || input.mimeType === "application/pdf") {
        return this.parsePdf(documentId, fileName, buffer);
      }

      if (
        ext === "docx" ||
        input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        return this.parseDocx(documentId, fileName, buffer);
      }

      if (ext === "md" || ext === "markdown") {
        return this.parseTextBased(documentId, fileName, "md", buffer);
      }

      // Default: Plain text (.txt, etc.)
      return this.parseTextBased(documentId, fileName, "txt", buffer);
    } catch (err: any) {
      this.logger.error(`Failed to parse document '${fileName}': ${err.message}`);
      return {
        documentId,
        fileName,
        format: "unknown",
        rawText: "",
        pages: [],
        characterCount: 0,
        estimatedPages: 0,
        metadata: { byteLength: buffer.length },
        error: `Document extraction error: ${err.message}`,
      };
    }
  }

  /**
   * Helper to split text by explicit page markers or character thresholds into ExtractedPage array.
   */
  private buildPagesFromText(fullText: string, defaultCharsPerPage = 2500): ExtractedPage[] {
    if (!fullText || !fullText.trim()) {
      return [];
    }

    // 1. Check for form feed character \f (0x0C)
    if (fullText.includes("\f")) {
      const rawPages = fullText.split("\f");
      return rawPages
        .map((p, idx) => ({
          pageNumber: idx + 1,
          text: p.trim(),
          characterCount: p.trim().length,
        }))
        .filter((p) => p.characterCount > 0);
    }

    // 2. Check for explicit page headers: e.g. "--- Page 1 ---", "=== Page 1 ===", "[Page 1]"
    const pageHeaderRegex = /(?:^|\n)(?:[-=]{3,}\s*Page\s+(\d+)\s*[-=]{3,}|\[Page\s+(\d+)\]|Page\s+(\d+)\s*:\s*\n)/gi;
    if (pageHeaderRegex.test(fullText)) {
      pageHeaderRegex.lastIndex = 0;
      const parts = fullText.split(/(?:^|\n)(?:[-=]{3,}\s*Page\s+\d+\s*[-=]{3,}|\[Page\s+\d+\]|Page\s+\d+\s*:\s*\n)/gi);
      const pages: ExtractedPage[] = [];
      let pageNum = 1;
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed) {
          pages.push({
            pageNumber: pageNum++,
            text: trimmed,
            characterCount: trimmed.length,
          });
        }
      }
      if (pages.length > 0) {
        return pages;
      }
    }

    // 3. Fallback: Divide text into logical pages preserving paragraph boundaries
    const paragraphs = fullText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const pages: ExtractedPage[] = [];
    let currentParagraphs: string[] = [];
    let currentChars = 0;
    let pageNumber = 1;

    for (const paragraph of paragraphs) {
      if (currentParagraphs.length > 0 && currentChars + paragraph.length > defaultCharsPerPage) {
        const pageText = currentParagraphs.join("\n\n").trim();
        pages.push({
          pageNumber,
          text: pageText,
          characterCount: pageText.length,
        });
        pageNumber++;
        currentParagraphs = [paragraph];
        currentChars = paragraph.length;
      } else {
        currentParagraphs.push(paragraph);
        currentChars += paragraph.length;
      }
    }

    if (currentParagraphs.length > 0) {
      const pageText = currentParagraphs.join("\n\n").trim();
      pages.push({
        pageNumber,
        text: pageText,
        characterCount: pageText.length,
      });
    }

    return pages;
  }

  /**
   * Parses TXT or MD buffer with page extraction.
   */
  private parseTextBased(
    documentId: string,
    fileName: string,
    format: "txt" | "md",
    buffer: Buffer,
  ): ParsedDocumentResult {
    const rawText = buffer.toString("utf8");
    const pages = this.buildPagesFromText(rawText);

    return {
      documentId,
      fileName,
      format,
      rawText,
      pages,
      characterCount: rawText.length,
      estimatedPages: Math.max(1, pages.length),
      metadata: { format, byteLength: buffer.length, pageCount: pages.length },
    };
  }

  /**
   * Extracts text streams and page markers from PDF binary buffer.
   */
  private parsePdf(documentId: string, fileName: string, buffer: Buffer): ParsedDocumentResult {
    // Basic verification of PDF header
    const header = buffer.slice(0, 10).toString("binary");
    if (!header.includes("%PDF-")) {
      return {
        documentId,
        fileName,
        format: "pdf",
        rawText: "",
        pages: [],
        characterCount: 0,
        estimatedPages: 0,
        metadata: { invalidPdf: true },
        error: "Invalid PDF header: Missing %PDF- signature.",
      };
    }

    const str = buffer.toString("binary");
    const pageMatches = str.match(/\/Type\s*\/Page\b/g);
    const pageCountEstimate = pageMatches ? pageMatches.length : 1;

    const streamPieces: string[] = [];
    let pos = 0;

    // Search and inflate compressed PDF streams
    while (pos < buffer.length) {
      const sIdx = buffer.indexOf("stream\r\n", pos);
      const sIdxAlt = buffer.indexOf("stream\n", pos);
      const streamStart = sIdx !== -1 && sIdxAlt !== -1 ? Math.min(sIdx, sIdxAlt) : sIdx !== -1 ? sIdx : sIdxAlt;

      if (streamStart === -1) break;
      const offset = buffer[streamStart + 6] === 13 ? 8 : 7; // \r\n vs \n
      const eIdx = buffer.indexOf("endstream", streamStart + offset);
      if (eIdx === -1) break;

      const rawSlice = buffer.slice(streamStart + offset, eIdx);
      pos = eIdx + 9;

      let decompressed: string | null = null;
      try {
        decompressed = zlib.inflateSync(rawSlice).toString("latin1");
      } catch {
        try {
          decompressed = zlib.inflateRawSync(rawSlice).toString("latin1");
        } catch {
          decompressed = rawSlice.toString("latin1");
        }
      }

      if (decompressed) {
        // Extract text from PDF operators: (text) Tj or [(text)] TJ
        const textPieces: string[] = [];
        const tjRegex = /\(([^)]+)\)\s*Tj/g;
        let match: RegExpExecArray | null;
        while ((match = tjRegex.exec(decompressed)) !== null) {
          const cleaned = match[1]
            .replace(/\\([0-9]{3})/g, " ")
            .replace(/\\r/g, "")
            .replace(/\\n/g, " ")
            .replace(/\\/g, "");
          if (cleaned.trim()) {
            textPieces.push(cleaned);
          }
        }

        // TJ array syntax: [ (Text1) 20 (Text2) ] TJ
        const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
        while ((match = arrayTjRegex.exec(decompressed)) !== null) {
          const inner = match[1];
          const innerRe = /\(([^)]+)\)/g;
          let im: RegExpExecArray | null;
          while ((im = innerRe.exec(inner)) !== null) {
            const cleaned = im[1]
              .replace(/\\([0-9]{3})/g, " ")
              .replace(/\\/g, "");
            if (cleaned.trim()) {
              textPieces.push(cleaned);
            }
          }
        }

        if (textPieces.length > 0) {
          streamPieces.push(textPieces.join(" "));
        }
      }
    }

    let extractedText = streamPieces.join("\n\n").trim();

    // Fallback: If compressed stream extraction produced little text, extract readable ASCII strings
    if (extractedText.length < 50) {
      const asciiBlocks: string[] = [];
      const asciiRegex = /[A-Za-z0-9\s.,;:'"()\-–—]{15,}/g;
      let m: RegExpExecArray | null;
      while ((m = asciiRegex.exec(str)) !== null) {
        const blk = m[0].trim();
        if (
          !blk.includes("/Filter") &&
          !blk.includes("/FlateDecode") &&
          !blk.includes("endobj") &&
          !blk.includes("xref") &&
          !blk.includes("/Font")
        ) {
          asciiBlocks.push(blk);
        }
      }
      if (asciiBlocks.length > 0) {
        extractedText = asciiBlocks.join("\n\n");
      }
    }

    // Construct structured pages
    let pages: ExtractedPage[] = [];
    if (streamPieces.length === pageCountEstimate && streamPieces.length > 1) {
      pages = streamPieces.map((piece, idx) => ({
        pageNumber: idx + 1,
        text: piece.trim(),
        characterCount: piece.trim().length,
      }));
    } else {
      pages = this.buildPagesFromText(extractedText);
    }

    return {
      documentId,
      fileName,
      format: "pdf",
      rawText: extractedText,
      pages,
      characterCount: extractedText.length,
      estimatedPages: Math.max(1, pageCountEstimate, pages.length),
      metadata: {
        format: "pdf",
        streamSectionsExtracted: streamPieces.length,
        byteLength: buffer.length,
        estimatedPages: Math.max(1, pageCountEstimate, pages.length),
      },
    };
  }

  /**
   * Extracts text and pages from DOCX (OpenXML Word document ZIP package)
   */
  private parseDocx(documentId: string, fileName: string, buffer: Buffer): ParsedDocumentResult {
    // DOCX is a ZIP file starting with PK\x03\x04
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return {
        documentId,
        fileName,
        format: "docx",
        rawText: "",
        pages: [],
        characterCount: 0,
        estimatedPages: 0,
        metadata: { invalidDocx: true },
        error: "Invalid DOCX file: Missing ZIP archive signature.",
      };
    }

    // Find word/document.xml in the ZIP entries
    const targetEntryName = "word/document.xml";
    let pos = 0;
    let documentXmlContent: string | null = null;

    while (pos < buffer.length - 30) {
      // Local file header signature: 0x04034b50 (PK\x03\x04)
      if (buffer[pos] === 0x50 && buffer[pos + 1] === 0x4b && buffer[pos + 2] === 0x03 && buffer[pos + 3] === 0x04) {
        const compressionMethod = buffer.readUInt16LE(pos + 8);
        const compressedSize = buffer.readUInt32LE(pos + 18);
        const fileNameLength = buffer.readUInt16LE(pos + 26);
        const extraFieldLength = buffer.readUInt16LE(pos + 28);

        const entryFileName = buffer.toString("utf8", pos + 30, pos + 30 + fileNameLength);
        const dataStart = pos + 30 + fileNameLength + extraFieldLength;

        if (entryFileName === targetEntryName) {
          const compressedData = buffer.slice(dataStart, dataStart + compressedSize);
          if (compressionMethod === 8) {
            // Deflate
            try {
              documentXmlContent = zlib.inflateRawSync(compressedData).toString("utf8");
            } catch {
              try {
                documentXmlContent = zlib.inflateSync(compressedData).toString("utf8");
              } catch {}
            }
          } else if (compressionMethod === 0) {
            // Stored (no compression)
            documentXmlContent = compressedData.toString("utf8");
          }
          break;
        }

        pos = dataStart + compressedSize;
      } else {
        pos++;
      }
    }

    if (!documentXmlContent) {
      return {
        documentId,
        fileName,
        format: "docx",
        rawText: "",
        pages: [],
        characterCount: 0,
        estimatedPages: 0,
        metadata: {},
        error: "Could not locate word/document.xml within the DOCX package.",
      };
    }

    // Extract text from paragraphs <w:p> and check for page breaks
    const pages: ExtractedPage[] = [];
    let currentPageParagraphs: string[] = [];
    let pageNum = 1;

    const paragraphRegex = /<w:p(?:\s[^>]*)?>(.*?)<\/w:p>/g;
    let pMatch: RegExpExecArray | null;

    while ((pMatch = paragraphRegex.exec(documentXmlContent)) !== null) {
      const pBody = pMatch[1];
      const hasPageBreak =
        pBody.includes("w:type=\"page\"") ||
        pBody.includes("w:lastRenderedPageBreak");

      const textPieces: string[] = [];
      const textRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g;
      let tMatch: RegExpExecArray | null;
      while ((tMatch = textRegex.exec(pBody)) !== null) {
        textPieces.push(tMatch[1]);
      }
      const fullPara = textPieces.join("").trim();

      if (fullPara) {
        currentPageParagraphs.push(fullPara);
      }

      if (hasPageBreak && currentPageParagraphs.length > 0) {
        const pageText = currentPageParagraphs.join("\n\n").trim();
        pages.push({
          pageNumber: pageNum++,
          text: pageText,
          characterCount: pageText.length,
        });
        currentPageParagraphs = [];
      }
    }

    if (currentPageParagraphs.length > 0) {
      const pageText = currentPageParagraphs.join("\n\n").trim();
      pages.push({
        pageNumber: pageNum,
        text: pageText,
        characterCount: pageText.length,
      });
    }

    const allPagesText = pages.map((p) => p.text).join("\n\n").trim();

    return {
      documentId,
      fileName,
      format: "docx",
      rawText: allPagesText,
      pages,
      characterCount: allPagesText.length,
      estimatedPages: Math.max(1, pages.length),
      metadata: {
        format: "docx",
        pageCount: pages.length,
        byteLength: buffer.length,
      },
    };
  }
}
