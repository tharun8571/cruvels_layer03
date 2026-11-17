import { Injectable, Logger } from "@nestjs/common";
import zlib from "node:zlib";
import type { ExtractedPageData } from "../knowledge-intelligence.types";
import { TableParserService } from "./table-parser";
import { TextParserService } from "./text-parser";

export interface ParsedDocxDocument {
  title?: string;
  headings: { level: number; text: string }[];
  paragraphs: string[];
  tables: ExtractedPageData["tables"];
  fullText: string;
  pages: ExtractedPageData[];
}

function extractZipEntry(buffer: Buffer, targetEntry: string): string | null {
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) {
      break;
    }
    const compression = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString("utf8", offset + 30, offset + 30 + nameLen);
    const dataOffset = offset + 30 + nameLen + extraLen;

    if (name === targetEntry) {
      const compData = buffer.slice(dataOffset, dataOffset + compSize);
      if (compression === 0) return compData.toString("utf8");
      if (compression === 8) {
        try {
          return zlib.inflateRawSync(compData).toString("utf8");
        } catch {
          return null;
        }
      }
    }
    offset = dataOffset + compSize;
  }
  return null;
}

function parseWordXml(xml: string): string {
  const tables: string[] = [];
  const textWithoutTables = xml.replace(/<w:tbl[\s\S]*?<\/w:tbl>/g, (tbl) => {
    const rows: string[][] = [];
    const trMatches = tbl.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    for (const tr of trMatches) {
      const cells: string[] = [];
      const tcMatches = tr.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
      for (const tc of tcMatches) {
        const tParts = (tc.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || []).map((t) =>
          t.replace(/<[^>]+>/g, ""),
        );
        cells.push(tParts.join(" ").trim());
      }
      if (cells.length > 0) rows.push(cells);
    }
    if (rows.length === 0) return "";
    const md: string[] = [];
    md.push("| " + rows[0].join(" | ") + " |");
    md.push("| " + rows[0].map(() => "---").join(" | ") + " |");
    for (let i = 1; i < rows.length; i++) md.push("| " + rows[i].join(" | ") + " |");
    const idx = tables.length;
    tables.push(md.join("\n"));
    return "\n\n__CRUVELS_TBL_" + idx + "__\n\n";
  });

  let full = textWithoutTables.replace(/<w:p[\s\S]*?<\/w:p>/g, (p) => {
    if (p.includes("__CRUVELS_TBL_")) return p;
    const tParts = (p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || []).map((t) =>
      t.replace(/<[^>]+>/g, ""),
    );
    return "\n" + tParts.join("").trim() + "\n";
  });

  full = full.replace(/<[^>]+>/g, "");
  full = full.replace(/__CRUVELS_TBL_(\d+)__/g, (_, idx) => "\n\n" + tables[Number(idx)] + "\n\n");
  full = full
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  return full.replace(/\n{3,}/g, "\n\n").trim();
}

@Injectable()
export class DocxParserService {
  private readonly logger = new Logger(DocxParserService.name);

  constructor(
    private readonly textParser: TextParserService,
    private readonly tableParser: TableParserService,
  ) {}

  /**
   * Parses DOCX buffer or normalized DOCX xml/text content.
   */
  async parseDocx(input: Buffer | string): Promise<ParsedDocxDocument> {
    let rawContent: string;

    if (Buffer.isBuffer(input) && input.length >= 4 && input.readUInt32LE(0) === 0x04034b50) {
      // Real binary DOCX / ZIP file
      const xml = extractZipEntry(input, "word/document.xml");
      if (xml) {
        rawContent = parseWordXml(xml);
      } else {
        rawContent = input.toString("utf8");
      }
    } else {
      rawContent = typeof input === "string" ? input : input.toString("utf8");
    }

    const normalized = this.textParser.normalize(rawContent);

    // Extract headings (e.g. lines starting with "# " or "HEADING 1" or numbered sections)
    const lines = normalized.split("\n");
    const headings: { level: number; text: string }[] = [];
    const paragraphs: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("# ")) {
        headings.push({ level: 1, text: trimmed.replace(/^#\s+/, "") });
      } else if (trimmed.startsWith("## ")) {
        headings.push({ level: 2, text: trimmed.replace(/^##\s+/, "") });
      } else if (trimmed.startsWith("### ")) {
        headings.push({ level: 3, text: trimmed.replace(/^###\s+/, "") });
      } else if (/^(?:ARTICLE|Article|SECTION|Section|SCHEDULE|Schedule)\s+[0-9A-ZIVXLCDM]+/i.test(trimmed)) {
        headings.push({ level: 1, text: trimmed });
      } else {
        paragraphs.push(trimmed);
      }
    }

    const tables = this.tableParser.extractTables(normalized, 1);

    const pages: ExtractedPageData[] = [
      {
        pageNumber: 1,
        text: normalized,
        characterCount: normalized.length,
        tokenCount: Math.ceil(normalized.length / 4),
        tables,
        headings: headings.map((h) => h.text),
      },
    ];

    return {
      title: headings[0]?.text,
      headings,
      paragraphs,
      tables,
      fullText: normalized,
      pages,
    };
  }
}
