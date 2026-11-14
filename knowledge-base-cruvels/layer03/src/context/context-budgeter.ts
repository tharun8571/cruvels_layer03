import { Injectable } from "@nestjs/common";
import { TokenBoundarySplitterService } from "../chunking/token-boundary-splitter";
import type { ScoredRetrievalItem } from "../knowledge-intelligence.types";

export interface BudgetAllocationResult {
  selectedItems: ScoredRetrievalItem[];
  totalTokens: number;
  budgetAllocated: number;
  isTruncated: boolean;
}

export const DEFAULT_MAX_BUDGET_TOKENS = 4000;
export const MAX_ALLOWED_BUDGET_TOKENS = 16000;

@Injectable()
export class ContextBudgeterService {
  constructor(private readonly boundarySplitter: TokenBoundarySplitterService) {}

  /**
   * Selects and fits candidate retrieval items into a strict token budget.
   * Prioritizes top-ranked operative items while preventing any context window overflow.
   */
  allocateBudget(
    items: ScoredRetrievalItem[],
    maxTokens: number = DEFAULT_MAX_BUDGET_TOKENS,
  ): BudgetAllocationResult {
    const budgetLimit = Math.min(MAX_ALLOWED_BUDGET_TOKENS, Math.max(100, maxTokens));

    const selected: ScoredRetrievalItem[] = [];
    let accumulatedTokens = 0;
    let isTruncated = false;

    for (const item of items) {
      let content = item.chunk.content.trim();
      let itemTokens = item.chunk.tokenCount ?? this.boundarySplitter.estimateTokens(content);

      // If adding this entire item exceeds the budget
      if (accumulatedTokens + itemTokens > budgetLimit) {
        const remainingBudget = budgetLimit - accumulatedTokens;

        if (remainingBudget >= 60 && selected.length === 0) {
          // Truncate the first chunk if it exceeds budget alone
          content = this.truncateToTokens(content, remainingBudget);
          itemTokens = this.boundarySplitter.estimateTokens(content);
          selected.push({
            ...item,
            chunk: {
              ...item.chunk,
              content,
              tokenCount: itemTokens,
            },
          });
          accumulatedTokens += itemTokens;
          isTruncated = true;
        } else {
          isTruncated = true;
        }
        break;
      }

      selected.push(item);
      accumulatedTokens += itemTokens;
    }

    return {
      selectedItems: selected,
      totalTokens: accumulatedTokens,
      budgetAllocated: budgetLimit,
      isTruncated,
    };
  }

  private truncateToTokens(text: string, maxTokens: number): string {
    const words = text.split(/\s+/).filter(Boolean);
    const targetWordCount = Math.floor(maxTokens * 0.75);
    if (words.length <= targetWordCount) return text;
    return words.slice(0, targetWordCount).join(" ") + " ... [TRUNCATED TO CONTEXT BUDGET]";
  }
}
