/**
 * CRUVELS AI — Layer 03 Canonical Legal Source Model & Legal Hierarchy Contract (V1)
 *
 * Contract Version: 1.0.0 (IMMUTABLE)
 *
 * Defines the canonical legal source metadata, legal taxonomy, hierarchical document structure,
 * temporal validity lifecycle, and provenance contracts for production legal intelligence.
 */

export type LegalSourceType =
  | "CONSTITUTION"
  | "STATUTE"
  | "ACT"
  | "CODE"
  | "RULE"
  | "REGULATION"
  | "NOTIFICATION"
  | "CIRCULAR"
  | "ORDER"
  | "JUDGMENT"
  | "CASE_LAW"
  | "TREATY"
  | "GUIDELINE"
  | "HISTORICAL_LAW"
  | "CASE_DOCUMENT"
  | "PRIVATE_DOCUMENT"
  | "USER_DOCUMENT";

export type LegalDomain =
  | "CONSTITUTIONAL"
  | "CRIMINAL"
  | "CRIMINAL_PROCEDURE"
  | "CIVIL_PROCEDURE"
  | "CONTRACT"
  | "PROPERTY"
  | "FAMILY"
  | "SUCCESSION"
  | "CORPORATE"
  | "COMMERCIAL"
  | "CORPORATE_COMMERCIAL"
  | "LABOUR"
  | "EMPLOYMENT"
  | "LABOUR_EMPLOYMENT"
  | "TAX"
  | "INTELLECTUAL_PROPERTY"
  | "CYBER"
  | "DATA_PRIVACY"
  | "DATA_PROTECTION"
  | "CONSUMER"
  | "INSOLVENCY"
  | "ARBITRATION"
  | "ADMINISTRATIVE"
  | "ADMINISTRATIVE_LAW"
  | "ENVIRONMENT"
  | "ENVIRONMENTAL"
  | "BANKING"
  | "BANKING_FINANCE"
  | "SECURITIES"
  | "REAL_ESTATE"
  | "MOTOR_VEHICLE"
  | "EVIDENCE"
  | "HUMAN_RIGHTS"
  | "CUSTOMS_FOREIGN_TRADE"
  | "COMPETITION"
  | "CHILD_JUVENILE"
  | "SC_ST_SOCIAL"
  | "SENIOR_CITIZEN"
  | "DISABILITY"
  | "ELECTION"
  | "EDUCATION"
  | "HEALTHCARE"
  | "SERVICE_LAW"
  | "GENERAL";

export type LegalAuthorityLevel =
  | "CONSTITUTIONAL"
  | "OFFICIAL_PRIMARY"
  | "MANDATORY_STATUTORY"
  | "BINDING_PRECEDENT"
  | "PERSUASIVE_PRECEDENT"
  | "COURT_DECISION"
  | "OFFICIAL_GOVERNMENT"
  | "VERIFIED_FIRM_SOURCE"
  | "SECONDARY_LEGAL"
  | "GENERAL_REFERENCE"
  | "USER_DOCUMENT"
  | "UNVERIFIED";

export type TemporalValidityStatus =
  | "CURRENT"
  | "IN_FORCE"
  | "HISTORICAL"
  | "REPEALED"
  | "SUPERSEDED"
  | "AMENDED"
  | "PARTIALLY_REPEALED"
  | "FUTURE_EFFECTIVE"
  | "UNKNOWN";

export type LegalJurisdictionCode =
  | "INDIAN"
  | "INDIA"
  | "IN-DL"
  | "IN-MH"
  | "IN-KA"
  | "IN-TN"
  | "IN-WB"
  | "IN-UP"
  | "US"
  | "UK"
  | "EU"
  | "INTERNATIONAL"
  | "UNKNOWN"
  | (string & {});

export type LegalHierarchyLevel =
  | "DOCUMENT"
  | "PART"
  | "CHAPTER"
  | "ARTICLE"
  | "SECTION"
  | "SUBSECTION"
  | "CLAUSE"
  | "SUBCLAUSE"
  | "SCHEDULE"
  | "ANNEXURE"
  | "EXHIBIT"
  | "PARAGRAPH"
  | "EXPLANATION"
  | "PROVISO"
  | "ILLUSTRATION"
  | "TABLE";

export interface LegalHierarchyContextV1 {
  documentTitle: string;
  part?: string;
  chapter?: string;
  section?: string;
  subsection?: string;
  article?: string;
  clause?: string;
  subclause?: string;
  schedule?: string;
  heading?: string;
  parentIdentifier?: string;
  fullBreadcrumb: string; // e.g. "Arbitration and Conciliation Act, 1996 > Chapter II > Section 8 > Subsection (1)"
}

export interface LegalHierarchyNodeV1 {
  nodeId: string;
  documentId: string;
  versionId: string;
  parentNodeId?: string;
  level: LegalHierarchyLevel;
  identifier: string; // e.g., "Section 8", "Article 21", "8.2(a)", "Schedule B"
  title?: string;
  orderIndex: number;
  depth: number;
  startPage: number;
  endPage: number;
  text: string;
  textHash: string;
  hierarchyContext: LegalHierarchyContextV1;
  metadata?: Record<string, unknown>;
}

export interface LegalSourceV1 {
  schemaVersion: "1.0.0";
  sourceId: string;
  sourceType: LegalSourceType;
  title: string;
  shortTitle?: string;
  jurisdiction: LegalJurisdictionCode;
  country: string;
  state?: string;
  legalDomain: LegalDomain;
  issuingAuthority?: string;
  authorityLevel: LegalAuthorityLevel;
  citation?: string;
  publicationDate?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  status: TemporalValidityStatus;
  supersedes?: string[];
  supersededBy?: string[];
  amendedBy?: string[];
  sourceUrl?: string;
  provenance: string;
  version: string;
  checksum: string;
  ingestionTimestamp: string;
  metadata?: Record<string, unknown>;
}

export interface LegalChunkV1 {
  chunkId: string;
  citationId: string; // e.g. "[1]"
  sourceId: string;
  documentId: string;
  documentTitle: string;
  version: string;
  versionId: string;
  isCurrentVersion: boolean;
  pageNumber: number;
  pageEndNumber: number;
  hierarchy: LegalHierarchyContextV1;
  structuralUnit: LegalHierarchyLevel;
  section?: string;
  clause?: string;
  article?: string;
  schedule?: string;
  content: string;
  rawSourceText: string;
  startOffset: number;
  endOffset: number;
  tokenCount: number;
  characterCount: number;
  contentHash: string;
  isOperativeClause: boolean;
  isTable: boolean;
  legalDomain: LegalDomain;
  authorityLevel: LegalAuthorityLevel;
  jurisdiction: LegalJurisdictionCode;
  temporalStatus: TemporalValidityStatus;
  provenance: string;
  metadata: Record<string, unknown>;
}

/**
 * Validates whether an object strictly conforms to LegalSourceV1
 */
export function validateLegalSourceV1(source: unknown): source is LegalSourceV1 {
  if (!source || typeof source !== "object") return false;
  const s = source as Record<string, any>;
  return (
    s.schemaVersion === "1.0.0" &&
    typeof s.sourceId === "string" &&
    typeof s.title === "string" &&
    typeof s.sourceType === "string" &&
    typeof s.jurisdiction === "string" &&
    typeof s.authorityLevel === "string" &&
    typeof s.status === "string" &&
    typeof s.checksum === "string"
  );
}
