import { Module } from "@nestjs/common";
import { DocumentChunkingService } from "./document-chunking.service";
import { DocumentExtractorService } from "./services/document-extractor.service";
import { TextChunkerService } from "./services/text-chunker.service";
import { TextNormalizerService } from "./services/text-normalizer.service";
import { RawDocumentParserService } from "./services/raw-document-parser.service";

@Module({
  providers: [
    TextNormalizerService,
    TextChunkerService,
    DocumentExtractorService,
    DocumentChunkingService,
    RawDocumentParserService,
  ],
  exports: [
    TextNormalizerService,
    TextChunkerService,
    DocumentExtractorService,
    DocumentChunkingService,
    RawDocumentParserService,
  ],
})
export class DocumentChunkingModule {}

