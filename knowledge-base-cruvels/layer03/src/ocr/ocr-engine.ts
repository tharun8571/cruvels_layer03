import { Injectable, Logger } from "@nestjs/common";

export interface OcrProcessingOptions {
  language?: string; // "eng", "hin", "eng+hin"
  enhanceContrast?: boolean;
  deskew?: boolean;
  detectOrientation?: boolean;
}

export interface OcrPageResult {
  pageNumber: number;
  extractedText: string;
  confidence: number; // 0.0 - 1.0
  wordCount: number;
  isLowQuality: boolean;
  skewAngle?: number;
  processingTimeMs: number;
}

export interface OcrDocumentResult {
  documentId?: string;
  pages: OcrPageResult[];
  fullText: string;
  overallConfidence: number;
  hasQualityWarnings: boolean;
  totalProcessingTimeMs: number;
}

@Injectable()
export class OcrEngineService {
  private readonly logger = new Logger(OcrEngineService.name);

  /**
   * Processes a document or page buffer through the OCR pipeline.
   */
  async processOcr(
    input: Buffer | string | { pageNumber: number; content: string | Buffer }[],
    options?: OcrProcessingOptions,
  ): Promise<OcrDocumentResult> {
    const startedAt = performance.now();

    if (Array.isArray(input)) {
      const pageResults: OcrPageResult[] = [];
      for (const item of input) {
        const res = await this.processSinglePage(item.pageNumber, item.content, options);
        pageResults.push(res);
      }
      return this.aggregateResults(pageResults, startedAt);
    }

    if (typeof input === "string") {
      const single = await this.processSinglePage(1, input, options);
      return this.aggregateResults([single], startedAt);
    }

    // Buffer processing
    const single = await this.processSinglePage(1, input, options);
    return this.aggregateResults([single], startedAt);
  }

  private async processSinglePage(
    pageNumber: number,
    content: string | Buffer,
    _options?: OcrProcessingOptions,
  ): Promise<OcrPageResult> {
    const pStart = performance.now();
    let text = "";

    if (typeof content === "string") {
      text = content.trim();
    } else {
      text = content.toString("utf8").trim();
    }

    // Measure quality and calculate confidence
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Simulate OCR confidence based on character coherence and noise ratios
    let confidence = 0.92;
    if (wordCount < 15) {
      confidence = 0.58;
    } else if (/[^\x20-\x7E\t\n\r₹]/.test(text)) {
      const nonAsciiCount = (text.match(/[^\x20-\x7E\t\n\r₹]/g) || []).length;
      confidence = Math.max(0.4, 0.95 - (nonAsciiCount / (text.length || 1)) * 2);
    }

    const isLowQuality = confidence < 0.80;
    const processingTimeMs = Math.round((performance.now() - pStart) * 100) / 100;

    return {
      pageNumber,
      extractedText: text,
      confidence: Math.round(confidence * 100) / 100,
      wordCount,
      isLowQuality,
      skewAngle: 0.0,
      processingTimeMs,
    };
  }

  private aggregateResults(pages: OcrPageResult[], startedAt: number): OcrDocumentResult {
    const fullText = pages.map((p) => p.extractedText).join("\n\n");
    const avgConf =
      pages.length > 0
        ? pages.reduce((sum, p) => sum + p.confidence, 0) / pages.length
        : 0.0;

    const hasQualityWarnings = pages.some((p) => p.isLowQuality);
    const totalProcessingTimeMs = Math.round((performance.now() - startedAt) * 100) / 100;

    return {
      pages,
      fullText,
      overallConfidence: Math.round(avgConf * 100) / 100,
      hasQualityWarnings,
      totalProcessingTimeMs,
    };
  }
}
