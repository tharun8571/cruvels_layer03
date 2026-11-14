/**
 * CRUVELS AI — Layer 03 Central Legislation Inventory Contract
 *
 * Contract Version: 1.0.0
 *
 * Defines the structural and lifecycle model for Central Statutes,
 * Chapters, Sections, Subsections, Clauses, Provisos, Explanations,
 * Schedules, Transitional Provisions, and Amendment Lineage.
 */

import type { LegalDomain, LegalHierarchyContextV1, LegalJurisdictionCode } from "./legal-source.contract";

export interface StatutoryAmendmentRefV1 {
  amendingActNumber: string; // e.g. "Act No. 39 of 2005"
  amendingActTitle: string; // e.g. "Hindu Succession (Amendment) Act, 2005"
  year: number;
  effectiveFrom: string;
  sectionsAffected: string[];
  description: string;
}

export interface StatutorySectionV1 {
  sectionNumber: string; // e.g. "35", "41A", "6", "74", "138"
  heading: string;
  chapter?: string;
  chapterTitle?: string;
  part?: string;
  text: string;
  subsections?: Array<{
    subsectionNumber: string; // e.g. "(1)", "(2)"
    text: string;
    clauses?: Array<{
      clauseIdentifier: string; // e.g. "(a)", "(b)", "(i)"
      text: string;
    }>;
  }>;
  provisos?: string[];
  explanations?: string[];
  illustrations?: string[];
  crossReferences?: string[];
  amendmentHistory?: StatutoryAmendmentRefV1[];
  isRepealed?: boolean;
  isSubstituted?: boolean;
  isOmitted?: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  isCurrentLaw: boolean;
}

export interface CentralStatuteInventoryRecordV1 {
  statuteId: string; // e.g. "stat_bnss_2023", "stat_ica_1872"
  title: string;
  shortTitle: string;
  actNumber: string; // e.g. "Act 46 of 2023", "Act 9 of 1872"
  year: number;
  legalDomain: LegalDomain;
  jurisdiction: LegalJurisdictionCode;
  enactmentDate: string;
  commencementDate: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isCurrentLaw: boolean;
  isRepealed: boolean;
  repealedBy?: string; // e.g. "Bharatiya Nagarik Suraksha Sanhita, 2023"
  repealedStatutes?: string[]; // e.g. ["Code of Criminal Procedure, 1973 (CrPC)"]
  repealEffectiveDate?: string;
  totalSections: number;
  totalChapters: number;
  schedules?: Array<{
    scheduleNumber: string; // e.g. "First Schedule", "Second Schedule"
    heading: string;
    description: string;
  }>;
  transitionalProvisions?: string[];
  savingsClauses?: string[];
  delegatedRuleMakingPowerSections?: string[]; // e.g. ["Section 530"]
  chapters: Array<{
    chapterNumber: string;
    chapterTitle: string;
    sections: StatutorySectionV1[];
  }>;
  provenance: {
    officialSource: string;
    officialGazetteNumber?: string;
    sourceUrl: string;
    verifiedAt: string;
  };
}
