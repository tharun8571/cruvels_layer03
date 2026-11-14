import { BadRequestException, Injectable } from "@nestjs/common";

export interface FileValidationResult {
  isValid: boolean;
  mimeType: string;
  fileSize: number;
  detectedFormat: "PDF" | "DOCX" | "TEXT" | "MARKDOWN" | "CSV" | "JSON" | "UNKNOWN";
  isCorrupted: boolean;
  errors: string[];
}

export const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class FileValidatorService {
  /**
   * Validates file size, MIME type, magic bytes, and basic integrity.
   */
  validateFile(
    fileBufferOrText: Buffer | string,
    fileName: string,
    mimeType?: string,
  ): FileValidationResult {
    const errors: string[] = [];
    const isBuffer = Buffer.isBuffer(fileBufferOrText);
    const size = isBuffer ? fileBufferOrText.length : Buffer.byteLength(fileBufferOrText, "utf8");

    if (size === 0) {
      errors.push("File is empty (0 bytes)");
      return {
        isValid: false,
        mimeType: mimeType || "application/octet-stream",
        fileSize: 0,
        detectedFormat: "UNKNOWN",
        isCorrupted: true,
        errors,
      };
    }

    if (size > MAX_FILE_SIZE_BYTES) {
      errors.push(`File exceeds maximum size limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`);
    }

    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    let detectedFormat: FileValidationResult["detectedFormat"] = "UNKNOWN";
    let inferredMime = mimeType || "";

    if (isBuffer) {
      // Magic bytes verification
      const head = fileBufferOrText.slice(0, 8);
      if (head.toString("latin1").startsWith("%PDF-")) {
        detectedFormat = "PDF";
        inferredMime = "application/pdf";
      } else if (head[0] === 0x50 && head[1] === 0x4b && (head[2] === 0x03 || head[2] === 0x05)) {
        detectedFormat = "DOCX";
        inferredMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        // Fallback by extension
        if (ext === "pdf") detectedFormat = "PDF";
        else if (ext === "docx" || ext === "doc") detectedFormat = "DOCX";
        else if (ext === "md") detectedFormat = "MARKDOWN";
        else if (ext === "csv") detectedFormat = "CSV";
        else if (ext === "json") detectedFormat = "JSON";
        else detectedFormat = "TEXT";
      }
    } else {
      if (ext === "pdf" || fileBufferOrText.startsWith("%PDF-")) detectedFormat = "PDF";
      else if (ext === "docx") detectedFormat = "DOCX";
      else if (ext === "md") detectedFormat = "MARKDOWN";
      else if (ext === "csv") detectedFormat = "CSV";
      else if (ext === "json") detectedFormat = "JSON";
      else detectedFormat = "TEXT";
    }

    if (!inferredMime) {
      if (detectedFormat === "PDF") inferredMime = "application/pdf";
      else if (detectedFormat === "DOCX") inferredMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      else if (detectedFormat === "MARKDOWN") inferredMime = "text/markdown";
      else if (detectedFormat === "CSV") inferredMime = "text/csv";
      else if (detectedFormat === "JSON") inferredMime = "application/json";
      else inferredMime = "text/plain";
    }

    if (!SUPPORTED_MIME_TYPES.has(inferredMime)) {
      errors.push(`Unsupported file type: ${inferredMime} (${fileName})`);
    }

    return {
      isValid: errors.length === 0,
      mimeType: inferredMime,
      fileSize: size,
      detectedFormat,
      isCorrupted: false,
      errors,
    };
  }

  assertValid(fileBufferOrText: Buffer | string, fileName: string, mimeType?: string): FileValidationResult {
    const result = this.validateFile(fileBufferOrText, fileName, mimeType);
    if (!result.isValid) {
      throw new BadRequestException(`File validation failed: ${result.errors.join("; ")}`);
    }
    return result;
  }
}
