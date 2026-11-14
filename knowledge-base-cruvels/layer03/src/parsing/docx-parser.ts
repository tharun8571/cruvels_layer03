import { Injectable, Logger } from "@nestjs/common";
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
    const rawContent = typeof input === "string" ? input : input.toString("utf8");
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
