import { Module } from "@nestjs/common";
import { AiGatewayModule } from "../../08-gateway/ai-gateway.module";
import { EmbeddingService } from "./embedding.service";

@Module({
  imports: [AiGatewayModule],
  providers: [EmbeddingService],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
