import { Injectable, Logger } from "@nestjs/common";
import { LegalStructureChunkerService } from "../chunking/legal-structure-chunker";
import type {
  ExtractedPageData,
  IngestionOptions,
  IngestionResult,
} from "../knowledge-intelligence.types";
import { OcrDetectorService } from "../ocr/ocr-detector";
import { OcrEngineService } from "../ocr/ocr-engine";
import { OcrQualityService } from "../ocr/ocr-quality";
import { DocxParserService } from "../parsing/docx-parser";
import { PdfParserService } from "../parsing/pdf-parser";
import { TextParserService } from "../parsing/text-parser";
import { DocumentStructureDetectorService } from "../structure/document-structure-detector";
import { FileValidatorService } from "./file-validator";
import { MetadataExtractorService } from "./metadata-extractor";

@Injectable()
export class DocumentIngestorService {
  private readonly logger = new Logger(DocumentIngestorService.name);

  constructor(
    private readonly validator: FileValidatorService,
    private readonly textParser: TextParserService,
    private readonly pdfParser: PdfParserService,
    private readonly docxParser: DocxParserService,
    private readonly ocrDetector: OcrDetectorService,
    private readonly ocrEngine: OcrEngineService,
    private readonly ocrQuality: OcrQualityService,
    private readonly structureDetector: DocumentStructureDetectorService,
    private readonly chunker: LegalStructureChunkerService,
    private readonly metadataExtractor: MetadataExtractorService,
  ) {}

  /**
   * Complete end-to-end ingestion of any legal document buffer or text string.
   */
  async ingestDocument(
    input: Buffer | string | { fileName?: string; buffer?: Buffer | string; mimeType?: string; text?: string },
    fileNameOrOptions?: string | IngestionOptions,
    maybeOptions?: IngestionOptions,
  ): Promise<IngestionResult> {
    const startedAt = performance.now();

    let rawInput: Buffer | string;
    let fileName = "document.txt";
    let options: IngestionOptions = { firmId: "firm-default" };

    if (typeof input === "object" && !Buffer.isBuffer(input)) {
      rawInput = (input as any).buffer || (input as any).text || "";
      if ((input as any).fileName) fileName = (input as any).fileName;
      if (typeof fileNameOrOptions === "object") {
        options = fileNameOrOptions as IngestionOptions;
      } else if (typeof maybeOptions === "object") {
        options = maybeOptions;
      }
    } else {
      rawInput = input;
      if (typeof fileNameOrOptions === "string") {
        fileName = fileNameOrOptions;
        options = maybeOptions || { firmId: "firm-default" };
      } else if (typeof fileNameOrOptions === "object") {
        options = fileNameOrOptions as IngestionOptions;
      }
    }

    const documentId = options.documentId || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // 1. Validate File
    const validation = this.validator.assertValid(rawInput, fileName);

    // 2. Format-specific extraction
    let pages: ExtractedPageData[] = [];
    let fullText = "";
    let isScanned = false;
    let ocrApplied = false;
    let ocrConfidence: number | undefined;
    let ocrQualityWarning: boolean | undefined;

    if (validation.detectedFormat === "PDF") {
      const pdfRes = await this.pdfParser.parsePdf(rawInput);
      pages = pdfRes.pages;
      fullText = pdfRes.fullText;
      isScanned = pdfRes.isScanned;
    } else if (validation.detectedFormat === "DOCX") {
      const docxRes = await this.docxParser.parseDocx(rawInput);
      pages = docxRes.pages;
      fullText = docxRes.fullText;
    } else {
      // Plain text or Markdown
      const raw = typeof rawInput === "string" ? rawInput : rawInput.toString("utf8");
      const normalized = this.textParser.normalize(raw);
      fullText = normalized;
      pages = [
        {
          pageNumber: 1,
          text: normalized,
          characterCount: normalized.length,
          tokenCount: Math.ceil(normalized.length / 4),
        },
      ];
    }

    // 3. OCR Detection & Evaluation
    const detection = this.ocrDetector.detectScannedDocument(pages);
    if (detection.isScanned || options.forceOcr) {
      isScanned = true;
      if (options.ocrEnabled !== false) {
        const ocrRes = await this.ocrEngine.processOcr(fullText || (typeof rawInput === "string" ? rawInput : rawInput.toString("utf8")));
        ocrApplied = true;
        ocrConfidence = ocrRes.overallConfidence;
        const qualityAssess = this.ocrQuality.assessTextQuality(ocrRes.fullText, ocrRes.overallConfidence);
        ocrQualityWarning = qualityAssess.ocrQualityWarning;

        if (ocrRes.fullText.length > fullText.length) {
          fullText = ocrRes.fullText;
          pages = ocrRes.pages.map((p) => ({
            pageNumber: p.pageNumber,
            text: p.extractedText,
            characterCount: p.extractedText.length,
            tokenCount: Math.ceil(p.extractedText.length / 4),
            isScanned: true,
            ocrConfidence: p.confidence,
            ocrQualityWarning: p.isLowQuality,
          }));
        }
      }
    }

    // 4. Extract Structure
    const structure = this.structureDetector.detectStructure(documentId, pages, fullText);

    // 5. Extract Metadata
    const metadata = this.metadataExtractor.extractMetadata(
      documentId,
      fileName,
      validation.fileSize,
      validation.mimeType,
      fullText,
      {
        version: options.version,
        isCurrentVersion: options.isCurrentVersion,
      },
    );
    metadata.isScanned = isScanned;
    metadata.ocrConfidence = ocrConfidence;
    metadata.ocrQualityWarning = ocrQualityWarning;

    // 6. Legal Structure Chunking
    const chunks = this.chunker.chunkDocument(pages, {
      documentId,
      documentName: metadata.title || fileName,
      version: options.version,
      isCurrentVersion: options.isCurrentVersion,
      documentKind: metadata.documentKind,
      maxTokens: options.maxChunkTokens,
      overlapTokens: options.overlapTokens,
    });

    const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
    const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);

    this.logger.log(
      `Ingested ${fileName} (${documentId}): ${pages.length} pages, ${chunks.length} legal chunks, ${totalTokens} tokens in ${durationMs}ms`,
    );

    return {
      documentId,
      fileName,
      contentHash: metadata.contentHash,
      metadata,
      structure,
      chunks,
      totalChunks: chunks.length,
      totalTokens,
      pageCount: pages.length,
      ocrApplied,
      ocrConfidence,
      ocrQualityWarning,
      durationMs,
      ingestedAt: new Date().toISOString(),
    };
  }
}
