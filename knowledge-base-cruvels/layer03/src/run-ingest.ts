/**
 * CRUVELS LEGAL AI — LAYER 03 MANUAL INGESTION & PARSING CLI
 *
 * Direct terminal tool to manually test Document Ingestion, Parsing, Table Extraction,
 * OCR Quality Assessment (< 0.80 thresholding), and Citation Generation.
 *
 * Usage:
 *   npx tsx src/run-ingest.ts
 *   npx tsx src/run-ingest.ts path/to/document.pdf
 *   npx tsx src/run-ingest.ts path/to/contract.docx
 *   npx tsx src/run-ingest.ts "ARTICLE I: DEFINITIONS... Section 1.1 Applicable Law..."
 */

import fs from "node:fs";
import path from "node:path";
import { FileValidatorService } from "./ingestion/file-validator.js";
import { TextParserService } from "./parsing/text-parser.js";
import { TableParserService } from "./parsing/table-parser.js";
import { PdfParserService } from "./parsing/pdf-parser.js";
import { DocxParserService } from "./parsing/docx-parser.js";
import { OcrDetectorService } from "./ocr/ocr-detector.js";
import { OcrEngineService } from "./ocr/ocr-engine.js";
import { OcrQualityService } from "./ocr/ocr-quality.js";
import { DocumentStructureDetectorService } from "./structure/document-structure-detector.js";
import { LegalStructureChunkerService } from "./chunking/legal-structure-chunker.js";
import { SemanticChunkerService } from "./chunking/semantic-chunker.js";
import { TokenBoundarySplitterService } from "./chunking/token-boundary-splitter.js";
import { ChunkValidatorService } from "./chunking/chunk-validator.js";
import { MetadataExtractorService } from "./ingestion/metadata-extractor.js";
import { DocumentIngestorService } from "./ingestion/document-ingestor.js";
import { CitationBuilderService } from "./context/citation-builder.js";

async function main() {
  const args = process.argv.slice(2);
  const inputArg = args[0];

  let rawContent: Buffer | string;
  let fileName = "sample_commercial_agreement.pdf";

  if (inputArg && fs.existsSync(inputArg)) {
    fileName = path.basename(inputArg);
    rawContent = fs.readFileSync(inputArg);
    console.log(`\n📂 Reading file from disk: "${inputArg}" (${rawContent.length} bytes)`);
  } else if (inputArg) {
    rawContent = inputArg;
    fileName = "custom_legal_text.pdf";
    console.log(`\n📝 Processing direct text argument (${inputArg.length} chars)`);
  } else {
    // Default sample multi-page legal agreement with sections and a fee table
    fileName = "Commercial_Services_Agreement_2026.pdf";
    rawContent = `
[Page 1]
COMMERCIAL SERVICES & ARBITRATION AGREEMENT
THIS AGREEMENT is entered into at New Delhi, India.

ARTICLE I: DEFINITIONS & GOVERNING LAW
Section 1.1 Applicable Law: This agreement shall be governed by the laws of the Republic of India.
Section 1.2 Non-Compete Restriction: The Service Provider shall not engage in competing businesses for 12 months post-termination.

[Page 2]
ARTICLE IV: ARBITRAL EXPENSES & FEE MATRIX
The following fee schedule applies to all dispute resolution under Section 9 of the Arbitration Act:

| Fee Category | Amount (INR) | Payment Due Date |
| --- | --- | --- |
| Sole Arbitrator Sitting Fee | 1,50,000 | Within 15 days of constitution |
| Administrative Costs | 35,000 | Prior to preliminary hearing |
| Court Stenographer Expense | 15,000 | On demand |

ARTICLE V: JURISDICTION
Section 5.1 Courts at New Delhi shall have exclusive jurisdiction over all interim measures.
`;
    console.log(`\n📄 Running default multi-page legal agreement demonstration (Pages 1 & 2 with Fee Matrix)`);
  }

  // Initialize pipeline services
  const textParser = new TextParserService();
  const tableParser = new TableParserService();
  const pdfParser = new PdfParserService(textParser, tableParser);
  const docxParser = new DocxParserService(textParser, tableParser);
  const ocrDetector = new OcrDetectorService();
  const ocrEngine = new OcrEngineService();
  const ocrQuality = new OcrQualityService();
  const structureDetector = new DocumentStructureDetectorService();
  const boundarySplitter = new TokenBoundarySplitterService();
  const semanticChunker = new SemanticChunkerService(boundarySplitter);
  const chunkValidator = new ChunkValidatorService();
  const chunker = new LegalStructureChunkerService(structureDetector, semanticChunker, boundarySplitter, chunkValidator);
  const metadataExtractor = new MetadataExtractorService();
  const fileValidator = new FileValidatorService();
  const citationBuilder = new CitationBuilderService();

  const ingestor = new DocumentIngestorService(
    fileValidator,
    textParser,
    pdfParser,
    docxParser,
    ocrDetector,
    ocrEngine,
    ocrQuality,
    structureDetector,
    chunker,
    metadataExtractor
  );

  console.log("================================================================================");
  console.log("   CRUVELS LEGAL AI — LAYER 03 INGESTION & PARSING ENGINE");
  console.log("================================================================================\n");

  const startTime = performance.now();
  const result = await ingestor.ingestDocument(rawContent, fileName, {
    firmId: "firm-demo-01",
    version: "1.0",
    isCurrentVersion: true,
  });
  const elapsed = Math.round((performance.now() - startTime) * 100) / 100;

  // 1. Ingestion Summary
  console.log("📊 1. INGESTION SUMMARY:");
  console.log(`  • Document ID       : ${result.documentId}`);
  console.log(`  • File Name         : ${result.fileName}`);
  console.log(`  • Inferred Kind     : ${result.metadata.documentKind}`);
  console.log(`  • Jurisdiction      : ${result.metadata.jurisdiction}`);
  console.log(`  • Content SHA-256   : ${result.contentHash}`);
  console.log(`  • Pages Processed   : ${result.pageCount}`);
  console.log(`  • Total Tokens      : ${result.totalTokens}`);
  console.log(`  • Ingestion Time    : ${elapsed} ms\n`);

  // 2. OCR Quality Assessment
  console.log("🔍 2. OCR & SCAN QUALITY EVALUATION:");
  const conf = result.ocrConfidence ?? 1.0;
  console.log(`  • Is Scanned Document  : ${result.metadata.isScanned ? "YES" : "NO"}`);
  console.log(`  • OCR Confidence Score : ${conf} (Threshold: 0.80)`);
  if (conf < 0.80 || result.ocrQualityWarning) {
    console.log(`  ⚠️  WARNING             : SCANNING ARTIFACTS DETECTED (ocrConfidence < 0.80)`);
  } else {
    console.log(`  ✅ QUALITY STATUS      : HIGH LEGIBILITY (No Scanning Artifact Warnings)`);
  }
  console.log();

  // 3. Table Extraction
  if (result.structure.tables && result.structure.tables.length > 0) {
    console.log(`📋 3. EXTRACTED TABLES (${result.structure.tables.length} table found):`);
    result.structure.tables.forEach((tbl, idx) => {
      console.log(`  • Table #${idx + 1} (Page ${tbl.pageNumber}): Headers -> [${tbl.headers.join(" | ")}]`);
      tbl.rows.forEach((row) => {
        console.log(`    └─ Row: ${row.join(" | ")}`);
      });
    });
    console.log();
  }

  // 4. Generated Chunks & Standardized Citations for Layer 09
  console.log(`📦 4. LEGAL STRUCTURAL CHUNKS & CITATIONS FOR LAYER 09 (${result.chunks.length} chunks):`);
  console.log("────────────────────────────────────────────────────────────────────────────────");

  result.chunks.forEach((chunk, idx) => {
    const citation = citationBuilder.buildCitation(chunk, idx);
    console.log(`[Chunk #${idx + 1}] Citation ID: ${citation.citationId}`);
    console.log(`  • Formatted Citation : ${citation.formattedCitation}`);
    console.log(`  • Structural Unit    : ${chunk.structuralUnit}`);
    console.log(`  • Section / Clause   : ${chunk.section ? `§ ${chunk.section}` : (chunk.clause ? `Cl. ${chunk.clause}` : "General")}`);
    console.log(`  • Page Number        : Page ${chunk.pageNumber}`);
    console.log(`  • SHA-256 Hash       : ${chunk.contentHash.slice(0, 24)}...`);
    console.log(`  • Content Snippet    :`);
    const preview = chunk.content.split("\n")[0].slice(0, 100);
    console.log(`    "${preview}..."`);
    console.log("────────────────────────────────────────────────────────────────────────────────");
  });

  console.log("✅ Manual ingestion & parsing verification completed successfully!\n");
}

main().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
