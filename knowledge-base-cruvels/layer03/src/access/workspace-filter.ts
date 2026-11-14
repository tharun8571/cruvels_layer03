import { Injectable } from "@nestjs/common";
import type { AccessContext } from "../knowledge-intelligence.types";

@Injectable()
export class WorkspaceFilterService {
  /**
   * Filters items by workspace boundary if workspaceId is specified.
   */
  filterByWorkspace<T extends { metadata?: Record<string, unknown> }>(
    items: T[],
    access: AccessContext,
  ): T[] {
    if (!access.workspaceId) {
      return items;
    }

    return items.filter((item) => {
      const itemWorkspace = item.metadata?.workspaceId as string | undefined;
      return !itemWorkspace || itemWorkspace === access.workspaceId;
    });
  }
}
