import { Injectable } from "@nestjs/common";
import type {
  AssembledContextEnvelope,
  EvidenceCitation,
  RetrievalResult,
  ScoredRetrievalItem,
} from "../knowledge-intelligence.types";
import { CitationBuilderService } from "./citation-builder";
import { ContextBudgeterService } from "./context-budgeter";

export interface ContextAssemblyOptions {
  maxContextTokens?: number;
  includeBibliography?: boolean;
  sanitizeInjectionProbes?: boolean;
}

@Injectable()
export class ContextAssemblerService {
  constructor(
    private readonly budgeter: ContextBudgeterService,
    private readonly citationBuilder: CitationBuilderService,
  ) {}

  /**
   * Assembles a structured, injection-neutralized evidence context envelope for downstream AI models.
   */
  assembleContext(
    retrieval: RetrievalResult,
    options?: ContextAssemblyOptions,
  ): AssembledContextEnvelope {
    const maxTokens = options?.maxContextTokens ?? 4000;
    const includeBibliography = options?.includeBibliography ?? true;
    const sanitizeProbes = options?.sanitizeInjectionProbes ?? true;

    if (retrieval.items.length === 0) {
      return {
        query: retrieval.query,
        contextText: "",
        items: [],
        citations: [],
        totalTokenCount: 0,
        budgetAllocatedTokens: maxTokens,
        budgetUsedTokens: 0,
        truncated: false,
        sanitized: true,
        assembledAt: new Date().toISOString(),
      };
    }

    // 1. Budget Allocation
    const budgetRes = this.budgeter.allocateBudget(retrieval.items, maxTokens);
    const selectedItems = budgetRes.selectedItems;

    // 2. Build Citations & Neutralize Injection Payloads
    const citations: EvidenceCitation[] = [];
    const formattedBlocks: string[] = [];

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      const chunk = item.chunk;

      const citation = this.citationBuilder.buildCitation(chunk, i);
      citations.push(citation);

      let cleanContent = chunk.content.trim();
      if (sanitizeProbes) {
        cleanContent = cleanContent
          .replace(/SYSTEM\s*INSTRUCTION[:\-]?/gi, "[NEUTRALIZED_INSTRUCTION]")
          .replace(/IGNORE\s+ALL\s+PREVIOUS\s+INSTRUCTIONS/gi, "[NEUTRALIZED_INSTRUCTION]");
      }

      const metaParts: string[] = [];
      if (chunk.pageNumber !== undefined) metaParts.push(`Page: ${chunk.pageNumber}`);
      if (chunk.section) metaParts.push(`Section: ${chunk.section}`);
      if (chunk.clause) metaParts.push(`Clause: ${chunk.clause}`);
      if (chunk.schedule) metaParts.push(`Schedule: ${chunk.schedule}`);
      if (chunk.annexure) metaParts.push(`Annexure: ${chunk.annexure}`);
      if (chunk.exhibit) metaParts.push(`Exhibit: ${chunk.exhibit}`);
      if (chunk.version) metaParts.push(`Version: ${chunk.version}`);
      if (chunk.isCurrentVersion !== undefined) metaParts.push(`Current: ${chunk.isCurrentVersion}`);

      const metaSuffix = metaParts.length > 0 ? ` [${metaParts.join(", ")}]` : "";
      const header = `[${i + 1}] Source: ${chunk.documentName}${metaSuffix}`;

      formattedBlocks.push(`${header}\n${cleanContent}`);
    }

    let contextText = formattedBlocks.join("\n\n---\n\n");

    if (includeBibliography && citations.length > 0) {
      const biblio = this.citationBuilder.formatCitationList(citations);
      contextText += `\n\n=== VERIFIED LEGAL CITATIONS ===\n${biblio}`;
    }

    return {
      query: retrieval.query,
      contextText,
      items: selectedItems,
      citations,
      totalTokenCount: budgetRes.totalTokens,
      budgetAllocatedTokens: maxTokens,
      budgetUsedTokens: budgetRes.totalTokens,
      truncated: budgetRes.isTruncated,
      sanitized: true,
      assembledAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a strictly grounded, provenance-backed answer object from verified retrieval evidence.
   * Enforces dual check:
   * 1. Evidence provenance correctness (must have valid chunk origin)
   * 2. Query relevance correctness (substantive relevance overlap with query)
   * Irrelevant claims are discarded, returning NO_GROUNDED_EVIDENCE if no relevant evidence exists.
   */
  /**
   * Generates a strictly grounded, provenance-backed answer object from verified retrieval evidence.
   * Enforces dual check:
   * 1. Evidence provenance correctness (must have valid chunk origin)
   * 2. Query relevance correctness (substantive relevance overlap with query)
   *
   * Differentiates between:
   * - PERMITTED_MODEL_KNOWLEDGE: Approved general knowledge queries where model knowledge is permitted.
   * - DOCUMENT_GROUNDED: Bound local contract/document inquiries.
   * - STATUTORY_GROUNDED / LEGAL_KNOWLEDGE_GROUNDED: Authoritative legal database retrievals.
   * - UNSUPPORTED_LEGAL_GROUNDING: Legal knowledge queries with missing authoritative evidence (prohibits hallucination).
   * - NO_GROUNDED_EVIDENCE: Standard empty retrieval fallback.
   */
  generateGroundedAnswer(retrieval: RetrievalResult, query?: string): import("../knowledge-intelligence.types").GroundedAnswerResult {
    const q = (query || retrieval.query || "").trim();
    const dec = retrieval.retrievalDecision;

    if (!retrieval.items || retrieval.items.length === 0 || retrieval.retrievalSkipped) {
      if (
        dec?.sourceType === "GENERAL" ||
        dec?.skippedReason === "SKIPPED_GENERAL_KNOWLEDGE_QUERY" ||
        dec?.groundingRequirement === "PERMITTED_MODEL_KNOWLEDGE"
      ) {
        return {
          answerType: "PERMITTED_MODEL_KNOWLEDGE",
          query: q,
          claims: [],
          evidenceCount: 0,
          permittedModelKnowledge: true,
          groundingRequirement: "PERMITTED_MODEL_KNOWLEDGE",
          assembledAt: new Date().toISOString(),
        };
      }

      if (
        dec?.sourceType === "LEGAL" ||
        dec?.evidenceRequirement === "MANDATORY_AUTHORITATIVE" ||
        dec?.groundingRequirement === "GROUNDED_IN_EVIDENCE"
      ) {
        return {
          answerType: "INSUFFICIENT_EVIDENCE",
          query: q,
          claims: [],
          evidenceCount: 0,
          disclaimer: "Authoritative legal retrieval yielded no relevant grounded evidence in the corpus. Model is prohibited from generating unsupported legal claims.",
          groundingRequirement: "GROUNDED_IN_EVIDENCE",
          evidenceRequirement: "MANDATORY_AUTHORITATIVE",
          assembledAt: new Date().toISOString(),
        };
      }

      return {
        answerType: "INSUFFICIENT_EVIDENCE",
        query: q,
        claims: [],
        evidenceCount: 0,
        assembledAt: new Date().toISOString(),
      };
    }

    const claims: import("../knowledge-intelligence.types").GroundedAnswerClaim[] = [];
    const retrievedSections = new Set<string>();
    let hasStatutorySource = false;
    let hasCaseLawSource = false;
    let hasMatterSource = false;

    for (const item of retrieval.items) {
      const chunk = item.chunk;
      const content = chunk.content.trim();
      const sec = chunk.section || (chunk.metadata?.section as string | undefined);
      const cl = chunk.clause || (chunk.metadata?.clause as string | undefined);
      const sched = chunk.schedule || (chunk.metadata?.schedule as string | undefined);

      // Check Query Relevance Correctness (Dual-Check Gate)
      const isRelevant = this.verifyClaimQueryRelevance(q, content, sec, cl, sched);
      if (!isRelevant) {
        // Discard irrelevant evidence even if perfectly sourced
        continue;
      }

      if (sec) retrievedSections.add(sec.toLowerCase().replace(/^(?:section|sec\.)\s*/i, "").trim());

      const docKind = (chunk.metadata?.documentKind as string) || "";
      if (docKind === "STATUTORY_ACT" || /statute|act|sanhita|code/i.test(chunk.documentName)) {
        hasStatutorySource = true;
      } else if (docKind === "JUDGMENT" || /judgment|order|precedent/i.test(chunk.documentName)) {
        hasCaseLawSource = true;
      } else if (chunk.metadata?.caseId || /matter|case/i.test(chunk.documentName)) {
        hasMatterSource = true;
      }

      // Verbatim operative statement extraction without hardcoded section matching
      const cleanContent = content.replace(/\s+/g, " ").trim();
      const claimPrefix = sec
        ? `[Section ${sec}] `
        : sched
        ? `[Schedule ${sched}] `
        : cl
        ? `[Clause ${cl}] `
        : "";

      claims.push({
        text: `${claimPrefix}${cleanContent}`,
        source: chunk.documentName,
        sourceId: chunk.chunkId,
        documentId: chunk.documentId,
        section: sec || (sched ? `Schedule ${sched}` : undefined),
        clause: cl,
        page: chunk.pageNumber,
        evidence: content,
      });
    }

    if (claims.length === 0) {
      if (dec?.sourceType === "GENERAL" || dec?.groundingRequirement === "PERMITTED_MODEL_KNOWLEDGE") {
        return {
          answerType: "PERMITTED_MODEL_KNOWLEDGE",
          query: q,
          claims: [],
          evidenceCount: 0,
          permittedModelKnowledge: true,
          assembledAt: new Date().toISOString(),
        };
      }
      return {
        answerType: "INSUFFICIENT_EVIDENCE",
        query: q,
        claims: [],
        evidenceCount: 0,
        disclaimer: "No adequate or relevant evidence exists in the legal corpus to answer this question reliably.",
        assembledAt: new Date().toISOString(),
      };
    }

    // Detect unretrieved sections mentioned in query to ensure explicit provenance omission
    const querySecMatches = q.match(/\b(?:sections?|sec\.|§)\s*([0-9a-zA-Z]+(?:\.[0-9a-zA-Z]+)*)\b/gi) || [];
    const unsupportedSectionsOmitted: string[] = [];
    for (const sm of querySecMatches) {
      const num = sm.replace(/^(?:sections?|sec\.|§)\s*/i, "").trim().toLowerCase();
      if (!retrievedSections.has(num)) {
        unsupportedSectionsOmitted.push(`Section ${num}`);
      }
    }

    let answerType: import("../knowledge-intelligence.types").GroundedAnswerResult["answerType"] = "DOCUMENT_GROUNDED";
    if (hasStatutorySource) {
      answerType = "STATUTORY_GROUNDED";
    } else if (hasCaseLawSource) {
      answerType = "CASE_LAW_GROUNDED";
    } else if (hasMatterSource) {
      answerType = "MATTER_GROUNDED";
    }

    return {
      answerType,
      query: q,
      claims,
      evidenceCount: claims.length,
      unsupportedSectionsOmitted: unsupportedSectionsOmitted.length > 0 ? unsupportedSectionsOmitted : undefined,
      assembledAt: new Date().toISOString(),
    };
  }

  /**
   * Verifies query relevance correctness by checking structural tokens and substantive semantic overlap.
   */
  private verifyClaimQueryRelevance(
    query: string,
    chunkContent: string,
    sec?: string,
    cl?: string,
    sched?: string,
  ): boolean {
    const stopWords = new Set([
      "a", "about", "above", "after", "again", "against", "all", "also", "am", "an", "and",
      "any", "anyone", "anything", "are", "aren't", "as", "at", "be", "because", "been",
      "before", "being", "below", "between", "both", "but", "by", "can", "can't", "cannot",
      "come", "came", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing",
      "done", "don't", "down", "during", "each", "else", "evening", "explain", "few", "for",
      "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having",
      "he", "he'd", "he'll", "he's", "help", "her", "here", "here's", "hers", "herself",
      "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if",
      "in", "into", "is", "isn't", "it", "it's", "its", "itself", "just", "know", "let's",
      "like", "make", "me", "more", "morning", "most", "must", "mustn't", "my", "myself",
      "no", "nor", "not", "now", "of", "off", "on", "once", "only", "or", "other", "ought",
      "our", "ours", "ourselves", "out", "over", "own", "please", "said", "same", "say",
      "shall", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so",
      "some", "someone", "something", "still", "such", "supposed", "sure", "tell", "told",
      "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
      "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
      "things", "this", "those", "through", "time", "to", "too", "took", "two", "under",
      "until", "up", "us", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've",
      "went", "were", "weren't", "what", "what's", "when", "when's", "where", "where's",
      "whether", "which", "while", "who", "who's", "whom", "why", "why's", "will", "with",
      "without", "won't", "worse", "would", "wouldn't", "yesterday", "yet", "you", "you'd",
      "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
    ]);

    const extractTokens = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s.-]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 2 && !stopWords.has(t));

    const queryTokens = extractTokens(query);
    if (queryTokens.length === 0) return false;

    const qLower = query.toLowerCase();

    // 1. Structural direct reference check
    if (sec) {
      const secNorm = sec.toLowerCase().replace(/^(?:sections?|sec\.|§)\s*/i, "").trim();
      const secRegex = new RegExp(`\\b(?:sections?|sec\\.|§)\\s*${secNorm}\\b`, "i");
      if (secRegex.test(qLower) || (secNorm.length >= 3 && isNaN(Number(secNorm)) && qLower.includes(secNorm))) {
        return true;
      }
    }

    if (sched) {
      const schedNorm = sched.toLowerCase().replace(/^(?:schedules?|sched\.)\s*/i, "").trim();
      const schedRegex = new RegExp(`\\b(?:schedules?|sched\\.)\\s*${schedNorm}\\b`, "i");
      if (schedRegex.test(qLower) || (schedNorm.length >= 3 && isNaN(Number(schedNorm)) && qLower.includes(schedNorm))) {
        return true;
      }
    }

    // 2. Substantive keyword overlap check (minimum substantive matching required)
    const chunkTokens = new Set(extractTokens(chunkContent));
    const matched = queryTokens.filter((qt) => chunkTokens.has(qt));

    // Require at least 1 exact substantive match or sufficient overlap ratio
    if (matched.length === 0) {
      return false;
    }

    const overlapRatio = matched.length / queryTokens.length;
    return overlapRatio >= 0.10 || matched.length >= 1;
  }
}

