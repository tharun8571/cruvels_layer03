import { Injectable } from "@nestjs/common";
import type {
  ExtractedPageData,
  LegalDocumentStructure,
  LegalStructuralNode,
} from "../knowledge-intelligence.types";
import { TableParserService } from "../parsing/table-parser";
import { AnnexureDetectorService } from "./annexure-detector";
import { ArticleDetectorService } from "./article-detector";
import { ClauseDetectorService } from "./clause-detector";
import { ScheduleDetectorService } from "./schedule-detector";
import { SectionDetectorService } from "./section-detector";

@Injectable()
export class DocumentStructureDetectorService {
  constructor(
    private readonly articleDetector: ArticleDetectorService = new ArticleDetectorService(),
    private readonly sectionDetector: SectionDetectorService = new SectionDetectorService(),
    private readonly clauseDetector: ClauseDetectorService = new ClauseDetectorService(),
    private readonly scheduleDetector: ScheduleDetectorService = new ScheduleDetectorService(),
    private readonly annexureDetector: AnnexureDetectorService = new AnnexureDetectorService(),
    private readonly tableParser: TableParserService = new TableParserService(),
  ) {}

  /**
   * Analyzes an entire document and extracts its complete structural hierarchy.
   */
  detectStructure(
    documentId: string,
    pages: ExtractedPageData[],
    fullText?: string,
  ): LegalDocumentStructure {
    const text = fullText || pages.map((p) => p.text).join("\n\n");

    const allArticles: LegalStructuralNode[] = [];
    const allSections: LegalStructuralNode[] = [];
    const allClauses: LegalStructuralNode[] = [];
    const allSchedules: LegalStructuralNode[] = [];
    const allAnnexures: LegalStructuralNode[] = [];
    const allExhibits: LegalStructuralNode[] = [];
    const allTables = pages.flatMap((p) => p.tables || this.tableParser.extractTables(p.text, p.pageNumber));

    // Page-by-page detection
    for (const page of pages) {
      const pageArticles = this.articleDetector.detectArticles(page.text, page.pageNumber);
      const pageSections = this.sectionDetector.detectSections(page.text, page.pageNumber);
      const pageClauses = this.clauseDetector.detectClauses(page.text, page.pageNumber);
      const pageSchedules = this.scheduleDetector.detectSchedules(page.text, page.pageNumber);
      const pageAnnexAndExhibits = this.annexureDetector.detectAnnexuresAndExhibits(page.text, page.pageNumber);

      allArticles.push(...pageArticles);
      allSections.push(...pageSections);
      allClauses.push(...pageClauses);
      allSchedules.push(...pageSchedules);

      for (const node of pageAnnexAndExhibits) {
        if (node.type === "EXHIBIT") {
          allExhibits.push(node);
        } else {
          allAnnexures.push(node);
        }
      }
    }

    // Preamble & Recitals extraction
    let preamble: string | undefined;
    const preambleMatch = text.match(/(?:THIS\s+(?:MASTER\s+SERVICES\s+)?AGREEMENT|BETWEEN|BY\s+AND\s+BETWEEN)([\s\S]*?)(?=WHEREAS|RECITALS|NOW\s+THEREFORE|ARTICLE|SECTION)/i);
    if (preambleMatch) {
      preamble = preambleMatch[0].trim();
    }

    const recitals: string[] = [];
    const recitalMatches = text.match(/(?:WHEREAS|Whereas)\s*[:\-–—]?\s*([^\n\r]+(?:\n[^\n\r]+)*?)(?=(?:WHEREAS|Whereas|NOW\s+THEREFORE|NOW,\s+THEREFORE|ARTICLE|SECTION|\n\n))/gi);
    if (recitalMatches) {
      for (const r of recitalMatches) {
        recitals.push(r.trim());
      }
    }

    // Title heuristic
    let title: string | undefined;
    const titleMatch = text.match(/^(?:#\s+)?([A-Z0-9\s,\.\-—–]{5,80})(?:\n|$)/);
    if (titleMatch && !titleMatch[1].toLowerCase().includes("page")) {
      title = titleMatch[1].trim();
    }

    return {
      documentId,
      title,
      preamble,
      recitals,
      articles: allArticles,
      sections: allSections,
      clauses: allClauses,
      schedules: allSchedules,
      annexures: allAnnexures,
      exhibits: allExhibits,
      tables: allTables,
    };
  }
}
