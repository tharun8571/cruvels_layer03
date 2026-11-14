/**
 * CRUVELS AI — Layer 03 Authoritative Legal Source Registry Contract
 *
 * Contract Version: 2.0.0
 *
 * Defines the canonical first-class Legal Source Registry metadata,
 * strict source hierarchy, verification lifecycles, and provenance tracking.
 */

import type { LegalJurisdictionCode } from "./legal-source.contract";

export type AuthoritativeSourceType =
  | "CONSTITUTION"
  | "CENTRAL_STATUTE"
  | "STATE_STATUTE"
  | "RULE"
  | "REGULATION"
  | "NOTIFICATION"
  | "CIRCULAR"
  | "JUDICIAL_PRECEDENT"
  | "JUDICIAL_PRECEDENT_SC"
  | "JUDICIAL_PRECEDENT_HC"
  | "PERSUASIVE_AUTHORITY"
  | "PRACTICAL_GUIDANCE"
  | "TREATY"
  | "ORDINANCE"
  | "ORDER";

export type AuthorityRanking =
  | 1 // CONSTITUTION (Highest: 1.00)
  | 2 // CENTRAL_STATUTE (0.98)
  | 3 // STATE_STATUTE (0.95 intra-state)
  | 4 // RULE (0.92)
  | 5 // REGULATION (0.90)
  | 6 // NOTIFICATION (0.88)
  | 7 // CIRCULAR (0.85)
  | 8 // JUDICIAL_PRECEDENT (0.95 SC / 0.90 HC intra-state)
  | 9 // PERSUASIVE_AUTHORITY (0.65)
  | 10; // PRACTICAL_GUIDANCE (0.60)

export interface SourceTemporalLineage {
  enactedDate?: string;
  commencementDate?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isRepealed: boolean;
  repealed?: boolean;
  repealedBy?: string;
  repealDate?: string;
  supersededBy?: string;
  amendedBy?: string[];
  versionId: string;
  parentVersionId?: string;
  isCurrentLaw: boolean;
}

export interface AuthoritativeSourceRecordV1 {
  sourceId: string;
  sourceType: AuthoritativeSourceType;
  authorityLevel?: string; // e.g. "CONSTITUTION", "PRIMARY_STATUTORY"
  authorityRanking: AuthorityRanking;
  title: string;
  shortTitle: string;
  actNumber?: string; // e.g. "Act No. 46 of 2023"
  year?: number;
  jurisdiction: LegalJurisdictionCode;
  issuingAuthority: string; // e.g. "Parliament of India", "Ministry of Home Affairs", "Supreme Court of India"
  court?: "SUPREME_COURT" | "HIGH_COURT" | "TRIBUNAL" | "SUBORDINATE_COURT";
  state?: string; // e.g. "Maharashtra", "Karnataka", "Delhi"
  temporalLineage: SourceTemporalLineage;
  language: "en" | "hi" | "mr" | "ta" | "te" | "kn" | "bn" | "gu";
  officialSource: string; // e.g. "Gazette of India", "Legislative Department", "Supreme Court Law Reports"
  officialSourceUrl: string;
  sourceHash: string; // SHA-256
  retrievedAt: string;
  verificationStatus: "VERIFIED" | "VERIFIED_PRIMARY" | "VERIFIED_SECONDARY" | "UNVERIFIED" | "DISPUTED";
  provenance: {
    publisher: string;
    curator: string;
    verifiedBy: string;
    verificationDate: string;
  };
  confidence: number; // 0.00 to 1.00
  metadata?: Record<string, unknown>;
}

export const AUTHORITY_HIERARCHY_SCORES: Record<AuthoritativeSourceType, number> = {
  CONSTITUTION: 1.00,
  CENTRAL_STATUTE: 0.98,
  STATE_STATUTE: 0.95,
  RULE: 0.92,
  REGULATION: 0.90,
  NOTIFICATION: 0.88,
  CIRCULAR: 0.85,
  JUDICIAL_PRECEDENT: 0.95, // Supreme Court binding
  JUDICIAL_PRECEDENT_SC: 0.95,
  JUDICIAL_PRECEDENT_HC: 0.80,
  PERSUASIVE_AUTHORITY: 0.65,
  PRACTICAL_GUIDANCE: 0.60,
  TREATY: 0.90,
  ORDINANCE: 0.96,
  ORDER: 0.86,
};
