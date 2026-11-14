import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type {
  DocumentMetadata,
  Jurisdiction,
  LegalDocumentKind,
} from "../knowledge-intelligence.types";

@Injectable()
export class MetadataExtractorService {
  /**
   * Extracts legal document metadata from text content and file parameters.
   */
  extractMetadata(
    documentId: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    text: string,
    customOptions?: {
      version?: string;
      isCurrentVersion?: boolean;
      tags?: string[];
      customAttributes?: Record<string, unknown>;
    },
  ): DocumentMetadata {
    const contentHash = createHash("sha256").update(text.trim()).digest("hex");
    const docKind = this.inferDocumentKind(fileName, text);
    const jurisdiction = this.inferJurisdiction(text);
    const parties = this.extractParties(text);
    const statutoryCitations = this.extractStatutoryCitations(text);
    const governingLaw = this.extractGoverningLaw(text);
    const title = this.extractTitle(fileName, text);

    return {
      documentId,
      fileName,
      fileSize,
      mimeType,
      contentHash,
      title,
      version: customOptions?.version || "1.0",
      isCurrentVersion: customOptions?.isCurrentVersion ?? true,
      documentKind: docKind,
      jurisdiction,
      governingLaw,
      parties,
      statutoryCitations,
      pageCount: (text.match(/\[Page\s*\d+\]|---+\s*Page\s*\d+\s*---+/gi) || []).length || 1,
      tags: customOptions?.tags || [],
      customAttributes: customOptions?.customAttributes,
    };
  }

  private inferDocumentKind(fileName: string, text: string): LegalDocumentKind {
    const fnLower = fileName.toLowerCase();
    const textLower = text.toLowerCase().slice(0, 3000);

    if (fnLower.includes("msa") || textLower.includes("master service") || textLower.includes("master agreement")) return "MSA";
    if (fnLower.includes("nda") || textLower.includes("non-disclosure") || textLower.includes("confidentiality agreement")) return "NDA";
    if (fnLower.includes("sla") || textLower.includes("service level")) return "SLA";
    if (fnLower.includes("charge_sheet") || fnLower.includes("chargesheet") || textLower.includes("charge sheet")) return "CHARGE_SHEET";
    if (fnLower.includes("petition") || textLower.includes("writ petition") || textLower.includes("special leave petition")) return "PETITION";
    if (fnLower.includes("judgment") || fnLower.includes("order") || textLower.includes("in the high court") || textLower.includes("supreme court of india")) return "COURT_ORDER";
    if (fnLower.includes("handbook") || fnLower.includes("policy") || textLower.includes("employee handbook") || textLower.includes("travel policy")) return "POLICY";
    if (fnLower.includes("affidavit") || textLower.includes("affirm and state")) return "AFFIDAVIT";
    if (fnLower.includes("agreement") || fnLower.includes("contract")) return "CONTRACT";

    return "GENERAL_DOCUMENT";
  }

  private inferJurisdiction(text: string): Jurisdiction {
    const lower = text.toLowerCase();
    if (
      lower.includes("india") ||
      lower.includes("new delhi") ||
      lower.includes("mumbai") ||
      lower.includes("bengaluru") ||
      lower.includes("high court") ||
      lower.includes("ipc") ||
      lower.includes("crpc") ||
      lower.includes("section 482") ||
      lower.includes("₹") ||
      lower.includes("lakh") ||
      lower.includes("crore")
    ) {
      return "INDIAN";
    }

    if (
      lower.includes("delaware") ||
      lower.includes("california") ||
      lower.includes("new york") ||
      lower.includes("united states") ||
      lower.includes("federal circuit") ||
      lower.includes("u.s.c.")
    ) {
      return "US";
    }

    if (lower.includes("england and wales") || lower.includes("united kingdom") || lower.includes("london court")) {
      return "UK";
    }

    return "INDIAN"; // Default for Cruvels legal engine
  }

  private extractParties(text: string): string[] {
    const parties: string[] = [];
    const partyRegex = /(?:BETWEEN|BY AND BETWEEN)\s*([A-Z0-9\s,\.\-—–]+?)(?:\s+(?:AND|and|\&)\s+)([A-Z0-9\s,\.\-—–]+?)(?=(?:WHEREAS|\n\n|\(|hereinafter))/i;
    const match = text.match(partyRegex);
    if (match) {
      if (match[1]?.trim()) parties.push(match[1].trim().replace(/[,;\n\r]/g, ""));
      if (match[2]?.trim()) parties.push(match[2].trim().replace(/[,;\n\r]/g, ""));
    }
    return parties;
  }

  private extractStatutoryCitations(text: string): string[] {
    const citations = new Set<string>();
    const patterns = [
      /\b(?:Section|Sec\.)\s*\d+(?:\s*\([a-z0-9]+\))*(?:\s+of\s+(?:the\s+)?[A-Za-z\s]+(?:Act|Code)(?:,\s*\d{4})?)?/gi,
      /\b(?:Article|Art\.)\s*\d+(?:\s*\([a-z0-9]+\))*(?:\s+of\s+(?:the\s+)?Constitution)?/gi,
      /\b(?:Order\s+[IVXLCDM0-9]+(?:\s+Rule\s+\d+)?)\b/gi,
    ];

    for (const pat of patterns) {
      const matches = text.match(pat);
      if (matches) {
        for (const m of matches) {
          citations.add(m.trim());
        }
      }
    }

    return Array.from(citations).slice(0, 20);
  }

  private extractGoverningLaw(text: string): string | undefined {
    const match = text.match(/(?:GOVERNING\s+LAW|APPLICABLE\s+LAW|CHOICE\s+OF\s+LAW)[^.\n\r]*?[:\-–—]?\s*([^\n\r]+(?:\n[^\n\r]+)?)/i);
    return match ? match[1].trim().slice(0, 200) : undefined;
  }

  private extractTitle(fileName: string, text: string): string {
    const titleMatch = text.match(/^(?:#\s+)?([A-Z0-9\s,\.\-—–]{5,80})(?:\n|$)/);
    if (titleMatch && !titleMatch[1].toLowerCase().includes("page")) {
      return titleMatch[1].trim();
    }
    return fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  }
}
