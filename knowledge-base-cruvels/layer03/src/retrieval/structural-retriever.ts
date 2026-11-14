import { Injectable } from "@nestjs/common";
import type {
  AccessContext,
  KnowledgeRetrievalQuery,
  LegalChunk,
  ScoredRetrievalItem,
} from "../knowledge-intelligence.types";
import { MetadataIndexService } from "../indexing/metadata-index";
import { TenantFilterService } from "../access/tenant-filter";
import { DocumentPermissionFilterService } from "../access/document-permission-filter";

export interface StructuralReference {
  type: "SECTION" | "ARTICLE" | "CLAUSE" | "SCHEDULE" | "ANNEXURE" | "EXHIBIT";
  identifier: string; // e.g., "8.1", "8.2", "B.1", "8", "B"
  raw: string; // e.g., "Section 8.1", "Schedule B"
}

@Injectable()
export class StructuralRetrieverService {
  constructor(
    private readonly metadataIndex: MetadataIndexService,
    private readonly tenantFilter: TenantFilterService,
    private readonly docFilter: DocumentPermissionFilterService,
  ) {}

  /**
   * Resolves exact structural references (Section 8.1, Section 8.2, Schedule B, etc.)
   * directly against indexed structural chunks before semantic retrieval.
   *
   * Priority:
   * 1. Exact structural reference
   * 2. Exact lexical match
   * 3. Metadata match
   */
  resolveStructuralReferences(
    query: string,
    access: AccessContext,
    options?: KnowledgeRetrievalQuery,
  ): ScoredRetrievalItem[] {
    const references = this.extractReferences(query);
    if (references.length === 0) return [];

    // 1. Assert tenant boundaries
    this.tenantFilter.assertTenantContext(access);

    // 2. Query candidates from metadata index for this tenant / case / document scope
    const filterParams = {
      firmId: access.firmId,
      caseId: access.caseId,
      documentIds: access.allowedDocumentIds || (access as any).documentIds || options?.filter?.documentIds || (options as any)?.retrievalScope?.documentIds,
      version: options?.filter?.versions?.[0],
      isCurrentVersion: options?.filter?.onlyCurrentVersion ?? (options?.filter?.versions?.length || (access as any).documentIds?.length || (options as any)?.retrievalScope?.documentIds?.length ? undefined : true),
    };

    const candidateChunks = this.metadataIndex.filter(filterParams);
    if (candidateChunks.length === 0) return [];

    const matchedItems: ScoredRetrievalItem[] = [];
    const matchedChunkIds = new Set<string>();

    for (const ref of references) {
      for (const chunk of candidateChunks) {
        if (matchedChunkIds.has(chunk.chunkId)) continue;

        const isMatch = this.matchesReference(ref, chunk);
        if (isMatch) {
          matchedChunkIds.add(chunk.chunkId);

          const provenance = `${chunk.documentName} [Page ${chunk.pageNumber}${
            chunk.section ? `, Section ${chunk.section}` : ""
          }${chunk.clause ? `, Clause ${chunk.clause}` : ""}, Version ${chunk.version}]`;

          matchedItems.push({
            chunk,
            denseScore: 1.0,
            sparseScore: 1.0,
            fusedScore: 1.0,
            rerankScore: 1.0,
            finalScore: 1.0,
            rank: matchedItems.length + 1,
            matchedTerms: [ref.raw],
            exactCitationMatch: true,
            provenance,
            scoreBreakdown: {
              dense: 1.0,
              sparse: 1.0,
              exactPhrase: 0.5,
              versionBoost: 0.15,
              operativeBoost: 0.1,
              boilerplatePenalty: 0,
            },
          });
        }
      }
    }

    // Security post-filter verification
    const authorized = this.docFilter.filterAuthorizedDocuments(matchedItems, access);
    return authorized;
  }

  /**
   * Extracts structural references from the query.
   */
  public extractReferences(query: string): StructuralReference[] {
    const q = query.trim();
    const refs: StructuralReference[] = [];
    const seen = new Set<string>();

    // 1. Conjoined lists e.g. "Sections 8.1 and 8.2" or "Sections 8.1, 8.2, and 8.3"
    const conjoinedSecRegex = /\b(?:sections?|sec\.?|s\.|§)\s+([0-9]+(?:\.[0-9A-Za-z]+)*|[A-Z]\.[0-9]+(?:\.[0-9]+)*)(?:\s*(?:,|and|&)\s*(?:sections?|sec\.?|s\.|§)?\s*([0-9]+(?:\.[0-9A-Za-z]+)*|[A-Z]\.[0-9]+(?:\.[0-9]+)*))*/gi;
    let cm: RegExpExecArray | null;
    while ((cm = conjoinedSecRegex.exec(q)) !== null) {
      const nums = cm[0].match(/(?:[0-9]+(?:\.[0-9A-Za-z]+)*|[A-Z]\.[0-9]+(?:\.[0-9]+)*)/g) || [];
      for (const num of nums) {
        if (/^(?:and|or|sec|section|s)$/i.test(num)) continue;
        const key = `SEC:${num.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          refs.push({ type: "SECTION", identifier: num, raw: `Section ${num}` });
        }
      }
    }

    // 2. Sections (multi-level decimals: 8.1, 8.2.1, B.1, 14.1.2)
    const secRegex = /\b(?:sections?|sec\.|§)\s*([0-9]+(?:\.[0-9A-Za-z]+)*|[A-Z]\.[0-9]+(?:\.[0-9]+)*)\b/gi;
    let m: RegExpExecArray | null;
    while ((m = secRegex.exec(q)) !== null) {
      const id = m[1].trim();
      const key = `SEC:${id.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        refs.push({ type: "SECTION", identifier: id, raw: `Section ${id}` });
      }
    }

    // 2. Clauses
    const clRegex = /\b(?:clauses?|cl\.)\s*([0-9a-zA-Z]+(?:\.[0-9a-zA-Z]+)*(?:\([a-z0-9]+\))*)\b/gi;
    while ((m = clRegex.exec(q)) !== null) {
      const id = m[1].trim();
      const key = `CL:${id.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        refs.push({ type: "CLAUSE", identifier: id, raw: `Clause ${id}` });
      }
    }

    // 3. Articles
    const artRegex = /\b(?:articles?|art\.)\s*([0-9IVXLCDM]+|[A-Z])\b/gi;
    while ((m = artRegex.exec(q)) !== null) {
      const id = m[1].trim();
      const key = `ART:${id.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        refs.push({ type: "ARTICLE", identifier: id, raw: `Article ${id}` });
      }
    }

    // 4. Schedules
    const schedRegex = /\b(?:schedules?|sched\.)\s*([A-Z0-9]+)\b/gi;
    while ((m = schedRegex.exec(q)) !== null) {
      const id = m[1].trim();
      const key = `SCH:${id.toUpperCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        refs.push({ type: "SCHEDULE", identifier: id, raw: `Schedule ${id}` });
      }
    }

    return refs;
  }

  private matchesReference(ref: StructuralReference, chunk: LegalChunk): boolean {
    const refId = ref.identifier.toLowerCase();

    switch (ref.type) {
      case "SECTION": {
        if (chunk.section) {
          const chunkSec = chunk.section.toLowerCase().replace(/^(?:section|sec\.)\s*/i, "").trim();
          if (chunkSec === refId || chunkSec.startsWith(refId + ".") || refId.startsWith(chunkSec + ".")) {
            return true;
          }
        }
        // Check content header
        const secHeaderRegex = new RegExp(
          `\\b(?:section|sec\\.|§)\\s*${ref.identifier.replace(".", "\\.")}\\b`,
          "i"
        );
        return secHeaderRegex.test(chunk.content);
      }

      case "CLAUSE": {
        if (chunk.clause) {
          const chunkCl = chunk.clause.toLowerCase().replace(/^(?:clause|cl\.)\s*/i, "").trim();
          if (chunkCl === refId || chunkCl.startsWith(refId + ".")) {
            return true;
          }
        }
        const clHeaderRegex = new RegExp(
          `\\b(?:clause|cl\\.)\\s*${ref.identifier.replace(".", "\\.")}\\b`,
          "i"
        );
        return clHeaderRegex.test(chunk.content);
      }

      case "ARTICLE": {
        if (chunk.article) {
          const chunkArt = chunk.article.toLowerCase().replace(/^(?:article|art\.)\s*/i, "").trim();
          if (chunkArt === refId) return true;
        }
        const artHeaderRegex = new RegExp(
          `\\b(?:article|art\\.)\s*${ref.identifier}\\b`,
          "i"
        );
        return artHeaderRegex.test(chunk.content);
      }

      case "SCHEDULE": {
        if (chunk.schedule) {
          const chunkSched = chunk.schedule.toUpperCase().replace(/^SCHEDULE\s+/i, "").trim();
          if (chunkSched === ref.identifier.toUpperCase()) return true;
        }
        const schedHeaderRegex = new RegExp(
          `\\b(?:schedule)\\s+${ref.identifier}\\b`,
          "i"
        );
        return schedHeaderRegex.test(chunk.content);
      }

      default:
        return false;
    }
  }
}
