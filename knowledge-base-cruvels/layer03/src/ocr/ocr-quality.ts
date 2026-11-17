import { Injectable } from "@nestjs/common";

export interface OcrQualityAssessment {
  confidence: number; // 0.0 - 1.0
  isQualityAcceptable: boolean;
  ocrQualityWarning: boolean;
  estimatedCharErrorRate: number; // 0.0 - 1.0
  legibilityScore: number; // 0.0 - 100.0
  issuesDetected: string[];
}

export const OCR_CONFIDENCE_THRESHOLD = 0.80;

@Injectable()
export class OcrQualityService {
  /**
   * Evaluates quality metrics of OCR-extracted text.
   */
  assessTextQuality(ocrText: string, reportedConfidence?: number): OcrQualityAssessment {
    if (!ocrText || typeof ocrText !== "string" || !ocrText.trim()) {
      return {
        confidence: 0.0,
        isQualityAcceptable: false,
        ocrQualityWarning: true,
        estimatedCharErrorRate: 1.0,
        legibilityScore: 0.0,
        issuesDetected: ["EMPTY_OCR_TEXT"],
      };
    }

    const issues: string[] = [];
    const text = ocrText.trim();
    const words = text.split(/\s+/).filter(Boolean);

    // 1. Check dictionary ratio / recognizable alphanumeric words
    let validWordCount = 0;
    for (const w of words) {
      if (/^[A-Za-z0-9₹$,.()\-/%:;'"§¶]+$/.test(w)) {
        validWordCount++;
      }
    }
    const validWordRatio = words.length > 0 ? validWordCount / words.length : 0;

    if (validWordRatio < 0.75) {
      issues.push("HIGH_GARBLED_CHARACTER_RATIO");
    }

    // 2. Check for broken line breaks or fragmented single-character tokens
    const singleCharWords = words.filter((w) => w.length === 1 && !/^[aAiI0-9§¶₹$]$/.test(w));
    if (singleCharWords.length / (words.length || 1) > 0.15) {
      issues.push("EXCESSIVE_TOKEN_FRAGMENTATION");
    }

    // 3. Check for repetitive OCR noise patterns
    if (/(.)\1{5,}/.test(text)) {
      issues.push("REPETITIVE_GLYPH_NOISE");
    }

    // 4. Compute composite confidence
    let computedConfidence = reportedConfidence ?? 0.90;
    if (issues.includes("HIGH_GARBLED_CHARACTER_RATIO")) {
      computedConfidence -= 0.25;
    }
    if (issues.includes("EXCESSIVE_TOKEN_FRAGMENTATION")) {
      computedConfidence -= 0.15;
    }
    if (issues.includes("REPETITIVE_GLYPH_NOISE")) {
      computedConfidence -= 0.10;
    }

    computedConfidence = Math.max(0.1, Math.min(1.0, Math.round(computedConfidence * 100) / 100));

    const isQualityAcceptable = computedConfidence >= OCR_CONFIDENCE_THRESHOLD;
    const ocrQualityWarning = !isQualityAcceptable;
    const estimatedCharErrorRate = Math.round((1.0 - computedConfidence) * 100) / 100;
    const legibilityScore = Math.round(computedConfidence * 1000) / 10;

    return {
      confidence: computedConfidence,
      isQualityAcceptable,
      ocrQualityWarning,
      estimatedCharErrorRate,
      legibilityScore,
      issuesDetected: issues,
    };
  }
}
