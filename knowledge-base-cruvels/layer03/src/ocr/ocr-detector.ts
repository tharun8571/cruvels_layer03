import { Injectable } from "@nestjs/common";

export interface OcrDetectionResult {
  isScanned: boolean;
  isSearchable: boolean;
  textDensity: number; // characters per page
  confidenceScore: number; // 0.0 - 1.0
  recommendation: "USE_EXISTING_TEXT" | "RUN_FULL_OCR" | "RUN_SELECTIVE_PAGE_OCR";
  scannedPageNumbers: number[];
}

@Injectable()
export class OcrDetectorService {
  /**
   * Evaluates if a document or page is scanned or non-searchable.
   * Criteria:
   * - Less than 50 text characters on a page
   * - High proportion of whitespace / unprintable characters
   * - Absence of word boundary spacing
   */
  detectScannedDocument(
    pages: { pageNumber: number; text: string; characterCount?: number }[],
  ): OcrDetectionResult {
    if (!pages || pages.length === 0) {
      return {
        isScanned: true,
        isSearchable: false,
        textDensity: 0,
        confidenceScore: 0.0,
        recommendation: "RUN_FULL_OCR",
        scannedPageNumbers: [],
      };
    }

    const scannedPages: number[] = [];
    let totalChars = 0;

    for (const page of pages) {
      const text = (page.text || "").trim();
      const len = page.characterCount ?? text.length;
      totalChars += len;

      const words = text.split(/\s+/).filter(Boolean);
      const isPageScanned = len < 50 || (words.length < 10 && !text.includes("---"));

      if (isPageScanned) {
        scannedPages.push(page.pageNumber);
      }
    }

    const avgDensity = totalChars / pages.length;
    const scannedRatio = scannedPages.length / pages.length;
    const isScanned = scannedRatio > 0.4;
    const isSearchable = !isScanned && avgDensity >= 100;

    let recommendation: OcrDetectionResult["recommendation"] = "USE_EXISTING_TEXT";
    if (scannedRatio >= 0.75) {
      recommendation = "RUN_FULL_OCR";
    } else if (scannedPages.length > 0) {
      recommendation = "RUN_SELECTIVE_PAGE_OCR";
    }

    const confidenceScore = isSearchable ? 0.95 : Math.max(0.4, 1.0 - scannedRatio);

    return {
      isScanned,
      isSearchable,
      textDensity: Math.round(avgDensity),
      confidenceScore,
      recommendation,
      scannedPageNumbers: scannedPages,
    };
  }
}
