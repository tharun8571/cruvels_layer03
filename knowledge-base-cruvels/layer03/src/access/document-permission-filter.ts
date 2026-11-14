import { ForbiddenException, Injectable } from "@nestjs/common";
import type { AccessContext, LegalChunk, ScoredRetrievalItem } from "../knowledge-intelligence.types";

export interface DocScopedItem {
  documentId?: string;
  chunk?: LegalChunk;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class DocumentPermissionFilterService {
  /**
   * Filters chunks or retrieved items against explicit document permissions and allowed document IDs.
   * MUST execute before any evidence reaches downstream models or context envelopes.
   */
  filterAuthorizedDocuments<T extends DocScopedItem>(
    items: T[],
    access: AccessContext,
  ): T[] {
    const allowed = access.allowedDocumentIds || (access as any).documentIds;
    if (!allowed || allowed.length === 0) {
      return items;
    }

    const allowedSet = new Set(allowed);

    return items.filter((item) => {
      const docId = item.documentId || item.chunk?.documentId || (item.metadata?.documentId as string);
      if (!docId) return false;
      return allowedSet.has(docId);
    });
  }

  /**
   * Validates that all items in an assembled evidence list are strictly authorized.
   * Throws ForbiddenException on any violation.
   */
  assertAllItemsAuthorized(items: ScoredRetrievalItem[], access: AccessContext): void {
    const allowed = access.allowedDocumentIds || (access as any).documentIds;
    if (allowed && allowed.length > 0) {
      const allowedSet = new Set(allowed);
      for (const item of items) {
        if (!allowedSet.has(item.chunk.documentId)) {
          throw new ForbiddenException(
            `Unauthorized document access: document '${item.chunk.documentId}' is not in allowed document scope.`,
          );
        }
      }
    }
  }
}
