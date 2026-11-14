/**
 * Cruvels AI Matter Context & Context Assembly Contracts
 *
 * Defines contracts for multi-tier matter context resolution (Structured Matter Data,
 * Case Intelligence, Multi-Query RAG) and query-adaptive context assembly.
 */

import type { DocumentChunkSourceType } from "@prisma/client";
import type { JwtUser } from "../../../../../common/auth.types";
import type { CaseIntelligenceBrief } from "../../../../case-intelligence/case-intelligence.types";
import type { RagContextItem, RagContextResponse } from "../rag-context.types";

export type MatterQueryType =
  | "CASE_ENTITY_LOOKUP"
  | "CASE_FACT_LOOKUP"
  | "INVENTORY_AGGREGATION"
  | "CASE_TIMELINE_QUERY"
  | "CASE_EVIDENCE_QUERY"
  | "CASE_CONTRADICTION_QUERY"
  | "CASE_STRATEGY_QUERY"
  | "CASE_MISSING_INFORMATION_QUERY"
  | "CASE_ISSUE_QUERY"
  | "CASE_RISK_QUERY"
  | "DOCUMENT_QA"
  | "LEGAL_RESEARCH"
  | "GENERAL_LEGAL_QUERY";

export interface MatterAccusedPerson {
  accusedId?: string;
  code?: string; // e.g. "A1", "A2", "A3"
  name: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | string;
  age?: number;
  role?: string;
  allegations?: string;
  arrestStatus?: string;
}

export interface MatterPartyEntity {
  name: string;
  role: string;
  details?: string;
  contactInfo?: string;
}

export interface MatterExhibitItem {
  exhibitNumber: string;
  category: "WEAPON" | "CASH" | "VEHICLE" | "DOCUMENT" | "DIGITAL_MEDIA" | "OTHER";
  description: string;
  seizedFrom?: string;
  recoveryLocation?: string;
  recoveryDate?: string;
  recoveryWitnesses?: string[];
  disputedStatus?: string;
}

export interface MatterContradictionItem {
  witnessOrSource: string;
  statementA: string;
  statementB: string;
  significance: string;
}

export interface MatterHeaderData {
  caseId: string;
  firmId: string;
  title: string;
  caseNumber?: string;
  cnr?: string;
  courtName?: string;
  category?: string;
  caseType?: string;
  stage?: string;
  clientName?: string;
  clientRole?: string;
  opposingPartyName?: string;
  assignedLawyerName?: string;
  victim?: MatterPartyEntity;
  complainant?: MatterPartyEntity;
  incidentDate?: string;
  incidentTime?: string;
  incidentLocation?: string;
  accused: MatterAccusedPerson[];
  witnesses: MatterPartyEntity[];
  investigatingOfficers: MatterPartyEntity[];
  judges: MatterPartyEntity[];
  exhibits: MatterExhibitItem[];
  contradictions: MatterContradictionItem[];
  missingInformation?: string[];
  verifiedDocumentCount: number;
}

export type AiContextScopeMode = "CURRENT_MATTER" | "EXPLICIT_SELECTION" | "GLOBAL_RESEARCH";

export interface AiContextSelection {
  mode?: AiContextScopeMode;
  matterIds?: string[];
  folderIds?: string[];
  documentIds?: string[];
}

export interface ResolveMatterContextParams {
  query: string;
  user: JwtUser;
  firmId: string;
  caseId: string;
  queryType?: MatterQueryType | string;
  documentId?: string;
  documentIds?: string[];
  contextSelection?: AiContextSelection;
  topK?: number;
  maxTokens?: number;
  includeCaseIntelligence?: boolean;
}

export interface MatterContext {
  caseId: string;
  firmId: string;
  query: string;
  queryType: MatterQueryType | string;
  matterHeader: MatterHeaderData;
  caseIntelligence?: CaseIntelligenceBrief | null;
  ragResponse: RagContextResponse;
  relevantDocuments: Array<{ id: string; fileName: string; fileType?: string; documentKind?: string }>;
  resolvedAt: string;
}

export interface AssembledContextPackage {
  query: string;
  queryType: MatterQueryType | string;
  systemPrompt: string;
  userPrompt: string;
  contextText: string;
  structuredContextText: string;
  citations: RagContextItem[];
  sourceSummary: {
    matterTitle: string;
    hasAccusedRoster: boolean;
    accusedCount: number;
    hasCaseIntelligence: boolean;
    ragItemCount: number;
    documentCount: number;
  };
  totalEstimatedTokens: number;
}
