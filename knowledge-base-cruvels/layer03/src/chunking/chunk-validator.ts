import { BadRequestException, Injectable } from "@nestjs/common";
import type { LegalChunk } from "../knowledge-intelligence.types";

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  sanitizedContent: string;
  hasAdversarialInjection: boolean;
}

@Injectable()
export class ChunkValidatorService {
  /**
   * Validates chunk integrity and required metadata attributes.
   */
  validateChunk(chunk: Partial<LegalChunk>): ValidationReport {
    const errors: string[] = [];

    if (!chunk.documentId) {
      errors.push("Missing required field: documentId");
    }
    if (chunk.pageNumber === undefined || chunk.pageNumber === null || chunk.pageNumber < 1) {
      errors.push("Missing or invalid required field: pageNumber");
    }
    if (!chunk.content || !chunk.content.trim()) {
      errors.push("Missing or empty required field: content");
    }
    if (!chunk.contentHash) {
      errors.push("Missing required field: contentHash");
    }
    if (chunk.tokenCount === undefined || chunk.tokenCount < 0) {
      errors.push("Missing or invalid field: tokenCount");
    }

    // Neutralize / check adversarial prompt injection in legal documents
    const content = chunk.content || "";
    const injectionRegex = /(?:SYSTEM\s*INSTRUCTION|IGNORE\s+ALL\s+PREVIOUS\s+INSTRUCTIONS|REVEAL\s+(?:ALL\s+)?CONFIDENTIAL|YOU\s+ARE\s+NOW\s+IN\s+DEVELOPER\s+MODE|DAN\s+MODE)/i;
    const hasAdversarialInjection = injectionRegex.test(content);

    let sanitizedContent = content;
    if (hasAdversarialInjection) {
      sanitizedContent = `[UNTRUSTED_DOCUMENT_PAYLOAD_NEUTRALIZED]\n${content}`;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedContent,
      hasAdversarialInjection,
    };
  }

  /**
   * Asserts validity or throws BadRequestException.
   */
  assertValid(chunk: Partial<LegalChunk>): void {
    const report = this.validateChunk(chunk);
    if (!report.isValid) {
      throw new BadRequestException(`Legal chunk validation failed: ${report.errors.join(", ")}`);
    }
  }
}
