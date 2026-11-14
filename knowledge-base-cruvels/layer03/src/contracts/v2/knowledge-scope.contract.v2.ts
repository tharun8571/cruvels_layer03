/**
 * Cruvels Enterprise Legal AI Platform
 * System Contract V2: Knowledge Scope & Multi-Tenant Access Boundary
 */

export const KNOWLEDGE_SCOPE_CONTRACT_VERSION = "2.0.0" as const;

export type KnowledgeSourceType =
  | "CASE_DOCUMENT"
  | "RESEARCH_MEMO"
  | "KNOWLEDGE_ASSET"
  | "KNOWLEDGE_WIKI_PAGE"
  | "STATUTORY_CODE"
  | "JUDICIAL_PRECEDENT"
  | "FIRM_TEMPLATE";

export type AuthorityTier =
  | "CONSTITUTIONAL_SUPREME_COURT"
  | "HIGH_COURT_APPELLATE"
  | "DISTRICT_SESSIONS_TRIBUNAL"
  | "STATUTORY_AUTHORITY"
  | "VERIFIED_FIRM_AUTHORITY"
  | "UNVERIFIED_GENERAL";

export interface TemporalScopeFilter {
  asOfDate?: string;
  effectiveBefore?: string;
  effectiveAfter?: string;
  includeRepealedStatutes?: boolean;
}

export interface KnowledgeScopeContractV2 {
  contractVersion: typeof KNOWLEDGE_SCOPE_CONTRACT_VERSION;
  tenantId: string;
  userId: string;
  userRole: string;
  workspaceId?: string;
  matterId?: string;
  permittedMatterIds: string[];
  documentScope: string[];
  allowedSourceTypes: KnowledgeSourceType[];
  jurisdictionScope: string[];
  authorityTiers: AuthorityTier[];
  temporalFilter?: TemporalScopeFilter;
  isolationEnforced: boolean;
  serverAuthorizationTimestamp: string;
}
