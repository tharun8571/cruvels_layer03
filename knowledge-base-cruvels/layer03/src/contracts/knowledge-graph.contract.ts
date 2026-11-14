/**
 * CRUVELS AI — Layer 03 Generic Legal Knowledge Graph Contract (V1)
 *
 * Contract Version: 1.0.0
 *
 * Defines first-class primitives for nodes, edges, provenance-backed relations,
 * and graph traversal across Constitutional Law, Statutes, Rules, Case Precedents,
 * Procedures, Forums, Remedies, and Limitations.
 */

import type { LegalAuthorityLevel, LegalDomain, LegalJurisdictionCode } from "./legal-source.contract";

export type LegalGraphNodeType =
  | "LEGAL_PROBLEM"
  | "LEGAL_DOMAIN"
  | "CONSTITUTIONAL_PROVISION"
  | "STATUTE"
  | "STATUTORY_PROVISION"
  | "RULE"
  | "REGULATION"
  | "NOTIFICATION"
  | "CIRCULAR"
  | "CASE"
  | "LEGAL_ISSUE"
  | "LEGAL_PROPOSITION"
  | "PROCEDURE"
  | "FORUM"
  | "REMEDY"
  | "LIMITATION"
  | "JURISDICTION"
  | "DOCUMENT_TYPE";

export type LegalGraphEdgeType =
  | "HAS_PROVISION"
  | "INTERPRETS"
  | "APPLIES"
  | "CONSIDERS"
  | "IMPLEMENTS"
  | "RELATED_TO"
  | "AMENDS"
  | "REPEALS"
  | "SUPERSEDES"
  | "SUPERSEDED_BY"
  | "FOLLOWS"
  | "DISTINGUISHES"
  | "OVERRULES"
  | "AFFIRMS"
  | "REVERSES"
  | "SUPPORTS"
  | "REQUIRES"
  | "AVAILABLE_BEFORE"
  | "LIMITED_BY"
  | "GOVERNED_BY"
  | "STATUTE_IMPLEMENTS_CONSTITUTIONAL_RIGHT"
  | "CASE_INTERPRETS_CONSTITUTIONAL_PROVISION"
  | "CASE_APPLIES_STATUTE"
  | "CASE_CONSIDERS_STATUTE"
  | "STATUTE_RELATED_TO_STATUTE"
  | "RULE_SUPPORTS_STATUTE"
  | "RULE_MODIFIES_PROCEDURE_FOR_STATUTE"
  | "PROVISION_RELATED_TO_PROVISION"
  | "CASE_FOLLOWS_CASE"
  | "CASE_DISTINGUISHES_CASE"
  | "CASE_OVERRULES_CASE"
  | "CASE_AFFIRMS_CASE"
  | "CASE_REVERSES_CASE"
  | "CASE_CONSIDERS_PROVISION";

export interface LegalGraphNodeV1 {
  id: string;
  type: LegalGraphNodeType;
  label: string;
  identifier?: string; // e.g. "Article 21", "Section 36 BNSS", "D.K. Basu"
  title: string;
  legalDomain: LegalDomain;
  jurisdiction: LegalJurisdictionCode;
  authorityLevel?: LegalAuthorityLevel;
  description?: string;
  summary?: string;
  sourceId?: string;
  documentId?: string;
  nodeId?: string;
  chunkId?: string;
  provenance: string;
  metadata?: Record<string, unknown>;
}

export interface LegalGraphEdgeV1 {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: LegalGraphEdgeType;
  description?: string;
  weight?: number; // 0.0 - 1.0
  isDirectPrecedent?: boolean;
  isStatutoryBasis?: boolean;
  provenance: string;
  metadata?: Record<string, unknown>;
}

export interface LegalKnowledgePathV1 {
  problemNodeId: string;
  domain: LegalDomain;
  constitutionalProvisions: LegalGraphNodeV1[];
  statutes: LegalGraphNodeV1[];
  statutoryProvisions: LegalGraphNodeV1[];
  rulesAndNotifications: LegalGraphNodeV1[];
  cases: LegalGraphNodeV1[];
  legalPropositions: LegalGraphNodeV1[];
  procedures: LegalGraphNodeV1[];
  forums: LegalGraphNodeV1[];
  remedies: LegalGraphNodeV1[];
  limitations: LegalGraphNodeV1[];
  citations: string[];
  provenanceTrail: string[];
}

export interface LegalGraphTraversalQueryV1 {
  entryNodeIds?: string[];
  entryDomain?: LegalDomain;
  entryProblemText?: string;
  targetNodeTypes?: LegalGraphNodeType[];
  maxDepth?: number; // default: 2 (bounded)
  maxNodes?: number; // default: 25
  includeOverruled?: boolean; // default: false
  asOfDate?: string;
  jurisdiction?: LegalJurisdictionCode;
}
