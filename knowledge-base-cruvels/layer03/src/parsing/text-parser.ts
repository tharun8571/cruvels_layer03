import { Injectable } from "@nestjs/common";

export interface NormalizedLegalTextResult {
  text: string;
  detectedStatutes: string[];
  detectedCurrencyAmounts: string[];
  detectedSections: string[];
  originalLength: number;
  normalizedLength: number;
}

@Injectable()
export class TextParserService {
  /**
   * Comprehensive legal normalization:
   * 1. CRLF and carriage returns -> clean single \n
   * 2. Tab expansion and excess horizontal whitespace collapse
   * 3. Unicode normalization (NFKC) preserving legal glyphs (§, ¶, ©, ®, ™, °, ±, —, –, '', "")
   * 4. Indian Currency & symbols: ₹, Rs., INR, Lakhs, Crores standard preservation
   * 5. Statutory citation symbols (§, ¶, Sec., Cl., Art.) preservation
   * 6. Indian Acts and sections standard formatting
   */
  normalize(rawText: string): string {
    if (!rawText || typeof rawText !== "string") {
      return "";
    }

    // 1. Unicode NFKC normalization
    let normalized = rawText.normalize("NFKC");

    // 2. Line breaks: CRLF (\r\n) and \r -> \n
    normalized = normalized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // 3. Normalize smart quotes, typographic quotes and dashes while preserving meaning
    normalized = normalized
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      .replace(/[\u2013\u2014]/g, "-");

    // 4. Preserve Indian Rupee symbol and standard denominations
    // Ensure "Rs." or "INR" or "₹" followed by digits are neatly spaced
    normalized = normalized
      .replace(/₹\s*([0-9,]+(?:\.[0-9]+)?)/g, "₹$1")
      .replace(/Rs\.?\s*([0-9,]+(?:\.[0-9]+)?)/gi, "₹$1")
      .replace(/INR\s*([0-9,]+(?:\.[0-9]+)?)/gi, "INR $1");

    // 5. Horizontal whitespace cleanup (preserve vertical \n layout)
    normalized = normalized
      .split("\n")
      .map((line) => line.replace(/[\t ]+/g, " ").trim())
      .join("\n");

    // 6. Collapse excessive blank lines (more than 2 consecutive newlines -> 2 newlines)
    normalized = normalized.replace(/\n{3,}/g, "\n\n").trim();

    return normalized;
  }

  /**
   * Extracts legal entities, statutes, sections, and currency references during text parsing.
   */
  parseLegalText(rawText: string): NormalizedLegalTextResult {
    const text = this.normalize(rawText);

    // Extract detected statutes (e.g. "Indian Penal Code", "Companies Act, 2013", "Arbitration and Conciliation Act, 1996")
    const statuteRegex = /\b(?:Indian\s+Penal\s+Code|Code\s+of\s+Criminal\s+Procedure|Civil\s+Procedure\s+Code|Companies\s+Act(?:,\s*\d{4})?|Arbitration\s+and\s+Conciliation\s+Act(?:,\s*\d{4})?|Insolvency\s+and\s+Bankruptcy\s+Code|Information\s+Technology\s+Act(?:,\s*\d{4})?|Contract\s+Act(?:,\s*\d{4})?|Specific\s+Relief\s+Act|Evidence\s+Act)\b/gi;
    const detectedStatutes = Array.from(new Set(text.match(statuteRegex) || []));

    // Extract currency amounts
    const currencyRegex = /(?:₹|\$|€|£|INR|USD)\s*[0-9,]+(?:\.[0-9]+)?(?:\s*(?:lakh|crore|million|billion|k|m))?/gi;
    const detectedCurrencyAmounts = Array.from(new Set(text.match(currencyRegex) || []));

    // Extract section and clause identifiers
    const sectionRegex = /\b(?:Section|Sec\.|Clause|Cl\.|Article|Art\.|§|¶)\s*([0-9]+(?:\.[0-9]+)*(?:\([a-z0-9]+\))*)/gi;
    const detectedSections = Array.from(new Set(text.match(sectionRegex) || []));

    return {
      text,
      detectedStatutes,
      detectedCurrencyAmounts,
      detectedSections,
      originalLength: rawText.length,
      normalizedLength: text.length,
    };
  }
}
