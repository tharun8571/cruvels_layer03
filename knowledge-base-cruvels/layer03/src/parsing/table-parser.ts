import { Injectable } from "@nestjs/common";
import type { ExtractedTable } from "../knowledge-intelligence.types";

@Injectable()
export class TableParserService {
  /**
   * Extracts structured tables from text (Markdown tables, pipe-delimited, tab-delimited, or CSV).
   */
  extractTables(text: string, pageNumber = 1): ExtractedTable[] {
    if (!text || typeof text !== "string") {
      return [];
    }

    const tables: ExtractedTable[] = [];
    const lines = text.split("\n");
    let currentTableLines: string[] = [];
    let inTable = false;
    let tableIndex = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isPipeTableLine = line.startsWith("|") && line.endsWith("|") && line.split("|").length >= 3;
      const isTabDelimitedLine = line.includes("\t") && line.split("\t").length >= 2;
      const isCsvLine = line.includes(",") && line.split(",").length >= 3 && !line.includes(". ");

      if (isPipeTableLine || (inTable && (isTabDelimitedLine || isCsvLine))) {
        inTable = true;
        currentTableLines.push(lines[i]);
      } else {
        if (inTable && currentTableLines.length >= 2) {
          const parsed = this.parseTableBlock(currentTableLines, pageNumber, tableIndex++);
          if (parsed) tables.push(parsed);
        }
        inTable = false;
        currentTableLines = [];
      }
    }

    if (inTable && currentTableLines.length >= 2) {
      const parsed = this.parseTableBlock(currentTableLines, pageNumber, tableIndex++);
      if (parsed) tables.push(parsed);
    }

    // Also detect financial milestone payment patterns in unstructured text if not formatted as a markdown pipe table
    if (tables.length === 0) {
      const heuristicTable = this.detectFinancialMilestoneTable(text, pageNumber, tableIndex++);
      if (heuristicTable) {
        tables.push(heuristicTable);
      }
    }

    return tables;
  }

  /**
   * Parses a contiguous block of table lines into an ExtractedTable structure.
   */
  private parseTableBlock(
    lines: string[],
    pageNumber: number,
    tableIndex: number,
  ): ExtractedTable | null {
    if (lines.length < 2) return null;

    // Filter out separator lines like |---|---|
    const nonSeparatorLines = lines.filter((l) => !/^\|?\s*[-:]+[-| :]*\s*\|?$/.test(l.trim()));
    if (nonSeparatorLines.length === 0) return null;

    const rawHeader = nonSeparatorLines[0];
    const headers = this.parseRow(rawHeader);
    const rows = nonSeparatorLines.slice(1).map((l) => this.parseRow(l));

    // Construct clean Markdown representation
    const mdLines: string[] = [];
    mdLines.push(`| ${headers.join(" | ")} |`);
    mdLines.push(`| ${headers.map(() => "---").join(" | ")} |`);
    for (const r of rows) {
      mdLines.push(`| ${r.join(" | ")} |`);
    }
    const markdown = mdLines.join("\n");

    const fullTableText = markdown.toLowerCase();
    const isFinancialSchedule =
      fullTableText.includes("milestone") ||
      fullTableText.includes("fee") ||
      fullTableText.includes("amount") ||
      fullTableText.includes("price") ||
      fullTableText.includes("penalty") ||
      fullTableText.includes("payment") ||
      fullTableText.includes("₹") ||
      fullTableText.includes("$");

    const isFeeMatrix =
      fullTableText.includes("rate") ||
      fullTableText.includes("hourly") ||
      fullTableText.includes("tier") ||
      fullTableText.includes("cost");

    return {
      tableIndex,
      pageNumber,
      headers,
      rows,
      markdown,
      isFinancialSchedule,
      isFeeMatrix,
    };
  }

  private parseRow(line: string): string[] {
    if (line.startsWith("|") && line.endsWith("|")) {
      return line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim());
    }
    if (line.includes("\t")) {
      return line.split("\t").map((cell) => cell.trim());
    }
    return line.split(",").map((cell) => cell.trim());
  }

  /**
   * Detects bulleted or numbered milestone fee tables in legal schedules.
   */
  private detectFinancialMilestoneTable(
    text: string,
    pageNumber: number,
    tableIndex: number,
  ): ExtractedTable | null {
    const milestoneRegex = /(?:Milestone\s*(\d+|[A-Z])|Item\s*(\d+))\s*[:\-–—]\s*([^,\n\r]+?)(?:[:\-–—]|\s+(?:fee|amount|cost)?\s*[:\-–—]?\s*)((?:₹|\$|INR|USD)\s*[0-9,]+(?:\.[0-9]+)?(?:\s*(?:k|m|lakh|crore))?)/gi;
    const matches = Array.from(text.matchAll(milestoneRegex));

    if (matches.length >= 2) {
      const headers = ["Milestone / Item", "Description", "Fee / Amount"];
      const rows: string[][] = matches.map((m) => [
        m[1] ? `Milestone ${m[1]}` : `Item ${m[2]}`,
        m[3].trim(),
        m[4].trim(),
      ]);

      const mdLines: string[] = [];
      mdLines.push(`| ${headers.join(" | ")} |`);
      mdLines.push(`| ${headers.map(() => "---").join(" | ")} |`);
      for (const r of rows) {
        mdLines.push(`| ${r.join(" | ")} |`);
      }

      return {
        tableIndex,
        pageNumber,
        title: "Milestone Payment Schedule",
        headers,
        rows,
        markdown: mdLines.join("\n"),
        isFinancialSchedule: true,
        isFeeMatrix: false,
      };
    }

    return null;
  }
}
