import { Module } from "@nestjs/common";
import { EmbeddingModule } from "../embedding/embedding.module";
import { VectorRetrievalService } from "./vector-retrieval.service";

@Module({
  imports: [EmbeddingModule],
  providers: [VectorRetrievalService],
  exports: [VectorRetrievalService],
})
export class VectorRetrievalModule {}
