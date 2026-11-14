import { ForbiddenException, Injectable } from "@nestjs/common";
import type { AccessContext, LegalChunk } from "../knowledge-intelligence.types";

export interface TenantScopedItem {
  firmId?: string;
  chunk?: LegalChunk;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class TenantFilterService {
  /**
   * Asserts that access context has a valid firmId (tenant ID).
   */
  assertTenantContext(access: AccessContext): void {
    if (!access.firmId || typeof access.firmId !== "string" || !access.firmId.trim()) {
      throw new ForbiddenException("Tenant boundary violation: firmId is required.");
    }
  }

  /**
   * Filters a list of chunks or candidate wrappers, ensuring every item strictly matches the tenant firmId.
   * Drops any chunk that belongs to another firm/tenant.
   */
  filterByTenant<T extends TenantScopedItem>(
    items: T[],
    access: AccessContext,
  ): T[] {
    this.assertTenantContext(access);
    const targetFirm = access.firmId.trim();

    return items.filter((item) => {
      const itemFirm = (item.firmId ?? item.chunk?.metadata?.firmId ?? item.metadata?.firmId) as string | undefined;
      return itemFirm === targetFirm;
    });
  }

  /**
   * Asserts that a single chunk is authorized for this tenant.
   */
  assertChunkAuthorized(chunk: LegalChunk, access: AccessContext): void {
    this.assertTenantContext(access);
    if (chunk.metadata?.firmId && chunk.metadata.firmId !== access.firmId) {
      throw new ForbiddenException(
        `Cross-tenant access blocked: tenant '${access.firmId}' cannot access resource belonging to '${chunk.metadata.firmId}'`,
      );
    }
  }
}
