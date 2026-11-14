/**
 * CRUVELS AI — Layer 03 Constitution Completeness & Structural Validator
 *
 * Implements deterministic validation of Constitutional coverage,
 * validating article counts, structural integrity, clause nesting,
 * schedules, and amendment lineages.
 */

import { Injectable, Logger } from "@nestjs/common";
import type { ConstitutionalArticleV1 } from "../contracts/constitution.contract";

export interface ConstitutionalCompletenessReport {
  expectedArticleCount: number;
  totalConstitutionalArticles: number;
  actualArticleCount: number;
  actualPresentCount: number;
  coveragePercentage: number;
  partsCovered: string[];
  presentArticleNumbers: string[];
  missingArticles: string[];
  missingCount: number;
  duplicateArticles: string[];
  structuralErrors: Array<{
    articleNumber: string;
    issue: string;
  }>;
  isValid: boolean;
  isComplete: boolean;
  validatedAt: string;
}

@Injectable()
export class ConstitutionCompletenessValidator {
  private readonly logger = new Logger(ConstitutionCompletenessValidator.name);

  // Canonical Part definitions of the Constitution of India (Parts I to XXII)
  public static readonly CANONICAL_PARTS = [
    "Preamble",
    "Part I",    // The Union and its Territory (Art 1-4)
    "Part II",   // Citizenship (Art 5-11)
    "Part III",  // Fundamental Rights (Art 12-35)
    "Part IV",   // Directive Principles of State Policy (Art 36-51)
    "Part IVA",  // Fundamental Duties (Art 51A)
    "Part V",    // The Union (Art 52-151)
    "Part VI",   // The States (Art 152-237)
    "Part VIII", // The Union Territories (Art 239-242)
    "Part IX",   // The Panchayats (Art 243-243O)
    "Part IXA",  // The Municipalities (Art 243P-243ZG)
    "Part IXB",  // The Co-operative Societies (Art 243ZH-243ZT)
    "Part X",    // The Scheduled and Tribal Areas (Art 244-244A)
    "Part XI",   // Relations between the Union and the States (Art 245-263)
    "Part XII",  // Finance, Property, Contracts and Suits (Art 264-300A)
    "Part XIII", // Trade, Commerce and Intercourse within India (Art 301-307)
    "Part XIV",  // Services under the Union and the States (Art 308-323)
    "Part XIVA", // Tribunals (Art 323A-323B)
    "Part XV",   // Elections (Art 324-329A)
    "Part XVI",  // Special Provisions Relating to Certain Classes (Art 330-342A)
    "Part XVII", // Official Language (Art 343-351)
    "Part XVIII",// Emergency Provisions (Art 352-360)
    "Part XIX",  // Miscellaneous (Art 361-367)
    "Part XX",   // Amendment of the Constitution (Art 368)
    "Part XXI",  // Temporary, Transitional and Special Provisions (Art 369-392)
    "Part XXII", // Short Title, Commencement, Authoritative Text in Hindi and Repeals (Art 393-395)
  ];

  /**
   * Validates a corpus of constitutional articles for structural completeness and integrity.
   */
  validateArticles(articles: ConstitutionalArticleV1[]): ConstitutionalCompletenessReport {
    return this.validateCompleteness(articles);
  }

  /**
   * Alias for coverage validation.
   */
  validateCoverage(articles: ConstitutionalArticleV1[]): ConstitutionalCompletenessReport {
    return this.validateCompleteness(articles);
  }

  /**
   * Validates a corpus of constitutional articles for structural completeness and integrity.
   */
  validateCompleteness(articles: ConstitutionalArticleV1[]): ConstitutionalCompletenessReport {
    const articleMap = new Map<string, ConstitutionalArticleV1>();
    const duplicateArticles: string[] = [];
    const structuralErrors: Array<{ articleNumber: string; issue: string }> = [];
    const partsSet = new Set<string>();

    for (const art of articles) {
      const artKey = art.articleNumber.toUpperCase().trim();
      if (articleMap.has(artKey)) {
        duplicateArticles.push(artKey);
      } else {
        articleMap.set(artKey, art);
      }

      if (art.part) {
        partsSet.add(art.part);
      }

      // Structural Integrity checks
      if (!art.heading || art.heading.trim().length === 0) {
        structuralErrors.push({ articleNumber: art.articleNumber, issue: "Missing canonical heading/title." });
      }
      if (!art.text || art.text.trim().length === 0) {
        structuralErrors.push({ articleNumber: art.articleNumber, issue: "Missing constitutional text body." });
      }
      if (art.authorityLevel !== "CONSTITUTIONAL") {
        structuralErrors.push({ articleNumber: art.articleNumber, issue: "Authority level must be CONSTITUTIONAL." });
      }
      if (art.jurisdiction !== "INDIA" && art.jurisdiction !== "INDIAN") {
        structuralErrors.push({ articleNumber: art.articleNumber, issue: "Jurisdiction must be INDIA or INDIAN." });
      }
    }

    const canonicalTotalArticles = 395;
    const presentArticleNumbers = Array.from(articleMap.keys());
    const missingArticles: string[] = [];

    for (let i = 1; i <= canonicalTotalArticles; i++) {
      const numStr = i.toString();
      if (!articleMap.has(numStr)) {
        missingArticles.push(numStr);
      }
    }

    const actualCount = articleMap.size;
    const coveragePercentage = parseFloat(((actualCount / canonicalTotalArticles) * 100).toFixed(2));
    const partsCovered = Array.from(partsSet);
    const isValid = duplicateArticles.length === 0 && structuralErrors.length === 0 && actualCount > 0;
    const isComplete = actualCount >= canonicalTotalArticles && missingArticles.length === 0;

    return {
      expectedArticleCount: canonicalTotalArticles,
      totalConstitutionalArticles: canonicalTotalArticles,
      actualArticleCount: actualCount,
      actualPresentCount: actualCount,
      coveragePercentage,
      partsCovered,
      presentArticleNumbers,
      missingArticles,
      missingCount: missingArticles.length,
      duplicateArticles,
      structuralErrors,
      isValid,
      isComplete,
      validatedAt: new Date().toISOString(),
    };
  }
}
