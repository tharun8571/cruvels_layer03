import { Injectable } from "@nestjs/common";
import type { AccessContext, LegalChunk } from "../knowledge-intelligence.types";

export interface MatterScopedItem {
  caseId?: string | null;
  chunk?: LegalChunk;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MatterFilterService {
  /**
   * Strictly filters candidates by case/matter boundary (caseId).
   */
  filterByMatter<T extends MatterScopedItem>(
    items: T[],
    access: AccessContext,
  ): T[] {
    if (!access.caseId) {
      return items;
    }

    const targetCaseId = access.caseId.trim();

    return items.filter((item) => {
      const itemCaseId = (item.caseId ?? item.chunk?.metadata?.caseId ?? item.metadata?.caseId) as string | undefined;
      return !itemCaseId || itemCaseId === targetCaseId;
    });
  }
}
