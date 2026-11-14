import { Injectable } from "@nestjs/common";

@Injectable()
export class TextNormalizerService {
  /**
   * Normalizes raw extracted text for chunking and retrieval while strictly
   * preserving legal citations, section references, numbers, dates, and paragraph boundaries.
   *
   * @param rawText Input raw string from OCR or direct textual content
   * @returns Cleaned and normalized text
   */
  normalize(rawText: string | null | undefined): string {
    if (!rawText || typeof rawText !== "string") {
      return "";
    }

    // 1. Normalize line endings (CRLF and CR to standard LF)
    let text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // 2. Remove non-printable control characters & form feeds, but preserve \t and \n
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\uFFFD]/g, " ");

    // 3. Normalize horizontal whitespace per line (multiple spaces/tabs to single space)
    const lines = text.split("\n");
    const cleanedLines = lines.map((line) => {
      return line.replace(/[^\S\n]+/g, " ").trim();
    });

    // 4. Recombine lines
    text = cleanedLines.join("\n");

    // 5. Normalize consecutive empty lines (allow max 2 newlines to preserve paragraph boundaries)
    text = text.replace(/\n{3,}/g, "\n\n");

    // 6. Trim leading/trailing whitespace
    return text.trim();
  }
}
