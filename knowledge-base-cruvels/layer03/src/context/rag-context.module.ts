import { Module } from "@nestjs/common";
import { DocumentChunkingModule } from "../chunking/document-chunking.module";
import { VectorRetrievalModule } from "../retrieval/vector-retrieval.module";
import { DocumentKnowledgeStoreService } from "./document-knowledge-store.service";
import { RagContextService } from "./rag-context.service";

@Module({
  imports: [
    VectorRetrievalModule,
    DocumentChunkingModule,
  ],
  providers: [RagContextService, DocumentKnowledgeStoreService],
  exports: [RagContextService, DocumentKnowledgeStoreService],
})
export class RagContextModule {}
