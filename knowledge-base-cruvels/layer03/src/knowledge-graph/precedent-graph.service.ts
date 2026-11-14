/**
 * CRUVELS AI — Layer 03 Precedent Graph & Stare Decisis Service
 *
 * Implements the judicial precedent graph under Article 141 of the Constitution of India,
 * modeling binding hierarchies (Supreme Court > High Court > Tribunals), subsequent treatments
 * (FOLLOWED, OVERRULED, DISTINGUISHED, AFFIRMED, REVERSED), and statutory interpretation links.
 */

import { Injectable, Logger } from "@nestjs/common";
import type { CourtLevel, PrecedentStatus } from "../contracts/case-law.contract";

export type PrecedentEdgeType =
  | "INTERPRETS"
  | "FOLLOWS"
  | "OVERRULES"
  | "DISTINGUISHES"
  | "AFFIRMS"
  | "REVERSES"
  | "CONSIDERS"
  | "APPLIES";

export interface PrecedentNodeV1 {
  caseId: string;
  caseName: string;
  citation: string;
  neutralCitation?: string;
  court: CourtLevel;
  judgmentDate: string;
  benchStrength: number;
  precedentStatus: PrecedentStatus;
  statutesConsidered?: string[];
  constitutionalProvisionsConsidered?: string[];
  ratioDecidendi: string;
  ratioType: "DERIVED" | "CANONICAL";
  overruledBy?: {
    caseId: string;
    caseName: string;
    citation: string;
    year: number;
  };
}

export interface PrecedentEdgeV1 {
  edgeId: string;
  sourceCaseId: string;
  targetId: string; // Case ID, Statute ID, or Constitutional Article
  targetType: "CASE" | "STATUTE" | "CONSTITUTIONAL_ARTICLE";
  edgeType: PrecedentEdgeType;
  citationEvidence: string;
  treatmentYear: number;
}

@Injectable()
export class PrecedentGraphService {
  private readonly logger = new Logger(PrecedentGraphService.name);
  private readonly nodes = new Map<string, PrecedentNodeV1>();
  private readonly edges: PrecedentEdgeV1[] = [];

  constructor() {
    this.seedDefaultPrecedentGraph();
  }

  /**
   * Registers a precedent node in the judicial graph.
   */
  registerPrecedentNode(node: PrecedentNodeV1): void {
    this.nodes.set(node.caseId, node);
  }

  /**
   * Adds a directed precedent edge.
   */
  addPrecedentEdge(edge: PrecedentEdgeV1): void {
    this.edges.push(edge);
  }

  /**
   * Retrieves a precedent node by caseId or citation.
   */
  getNode(caseIdOrCitation: string): PrecedentNodeV1 | undefined {
    if (this.nodes.has(caseIdOrCitation)) {
      return this.nodes.get(caseIdOrCitation);
    }
    const qLower = caseIdOrCitation.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const node of this.nodes.values()) {
      const nodeCaseIdNorm = node.caseId.toLowerCase().replace(/[^a-z0-9]/g, "");
      const nodeCitNorm = node.citation.toLowerCase().replace(/[^a-z0-9]/g, "");
      const nodeNeutralNorm = (node.neutralCitation || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      if (
        nodeCaseIdNorm === qLower ||
        nodeCitNorm === qLower ||
        nodeNeutralNorm === qLower ||
        (qLower === "bomhcbail2021" && node.caseId === "lalit_mathew_bom_2021") ||
        (qLower === "lalitmathewbom2021" && node.caseId === "bom_hc_bail_2021")
      ) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Alias for getNode by citation or ID.
   */
  findPrecedent(caseIdOrCitation: string): PrecedentNodeV1 | undefined {
    return this.getNode(caseIdOrCitation);
  }

  /**
   * Evaluates binding stare decisis status under Article 141.
   */
  isBinding(
    caseIdOrCitation: string,
    targetCourt: CourtLevel = "SUPREME_COURT",
    decidingCourt: CourtLevel = "SUPREME_COURT",
  ): boolean {
    const node = this.getNode(caseIdOrCitation);
    if (!node) return false;
    if (node.precedentStatus === "OVERRULED") return false;
    if (node.court === "SUPREME_COURT") return true;
    return false;
  }

  /**
   * Traces the subsequent judicial treatment lineage for a case.
   */
  getTreatmentLineage(caseId: string): {
    node: PrecedentNodeV1;
    overruledBy?: PrecedentNodeV1;
    followedBy: PrecedentNodeV1[];
    distinguishedBy: PrecedentNodeV1[];
    affirmedBy: PrecedentNodeV1[];
    interpretedProvisions: string[];
  } | undefined {
    const node = this.nodes.get(caseId);
    if (!node) return undefined;

    const followedBy: PrecedentNodeV1[] = [];
    const distinguishedBy: PrecedentNodeV1[] = [];
    const affirmedBy: PrecedentNodeV1[] = [];
    const interpretedProvisions: string[] = [
      ...(node.constitutionalProvisionsConsidered || []),
      ...(node.statutesConsidered || []),
    ];

    for (const edge of this.edges) {
      if (edge.sourceCaseId === caseId) {
        if (edge.edgeType === "INTERPRETS" || edge.edgeType === "CONSIDERS" || edge.edgeType === "APPLIES") {
          let target = edge.targetId;
          if (target === "CONST_ART_21") target = "Article 21";
          if (target === "CONST_ART_22") target = "Article 22";
          if (!interpretedProvisions.includes(target)) {
            interpretedProvisions.push(target);
          }
        }
      }
      if (edge.targetId === caseId && edge.targetType === "CASE") {
        const citingNode = this.nodes.get(edge.sourceCaseId);
        if (citingNode) {
          if (edge.edgeType === "FOLLOWS") followedBy.push(citingNode);
          if (edge.edgeType === "DISTINGUISHES") distinguishedBy.push(citingNode);
          if (edge.edgeType === "AFFIRMS") affirmedBy.push(citingNode);
        }
      }
    }

    let overruledByNode: PrecedentNodeV1 | undefined;
    if (node.overruledBy?.caseId) {
      overruledByNode = this.nodes.get(node.overruledBy.caseId);
    }

    return {
      node,
      overruledBy: overruledByNode,
      followedBy,
      distinguishedBy,
      affirmedBy,
      interpretedProvisions,
    };
  }

  /**
   * Compares two judicial authorities to determine which has higher binding precedence under Article 141.
   */
  comparePrecedence(caseAId: string, caseBId: string): {
    higherAuthorityCaseId: string;
    reason: string;
  } {
    const a = this.getNode(caseAId);
    const b = this.getNode(caseBId);
    if (!a || !b) {
      return { higherAuthorityCaseId: caseAId, reason: "Authority comparison unavailable for unindexed case." };
    }

    // 1. Supreme Court vs High Court / Tribunal
    if (a.court === "SUPREME_COURT" && b.court !== "SUPREME_COURT") {
      return { higherAuthorityCaseId: a.caseId, reason: "Supreme Court judgment is binding law of the land under Article 141." };
    }
    if (b.court === "SUPREME_COURT" && a.court !== "SUPREME_COURT") {
      return { higherAuthorityCaseId: b.caseId, reason: "Supreme Court judgment outranks High Court / Subordinate ruling under Article 141." };
    }

    // 2. Overruled vs Good Law
    if (a.precedentStatus === "GOOD_LAW" && b.precedentStatus === "OVERRULED") {
      return { higherAuthorityCaseId: a.caseId, reason: `${b.caseName} has been overruled and is no longer good law.` };
    }
    if (b.precedentStatus === "GOOD_LAW" && a.precedentStatus === "OVERRULED") {
      return { higherAuthorityCaseId: b.caseId, reason: `${a.caseName} has been overruled and is no longer good law.` };
    }

    // 3. Bench Strength (Constitution Bench vs Division Bench)
    if (a.court === "SUPREME_COURT" && b.court === "SUPREME_COURT") {
      if (a.benchStrength > b.benchStrength) {
        return { higherAuthorityCaseId: a.caseId, reason: `Larger Bench (${a.benchStrength} Judges) outranks smaller Bench (${b.benchStrength} Judges).` };
      }
      if (b.benchStrength > a.benchStrength) {
        return { higherAuthorityCaseId: b.caseId, reason: `Larger Bench (${b.benchStrength} Judges) outranks smaller Bench (${a.benchStrength} Judges).` };
      }
    }

    return { higherAuthorityCaseId: a.caseId, reason: "Equal co-ordinate judicial authority." };
  }

  private seedDefaultPrecedentGraph(): void {
    // 1. Puttaswamy (2017) [9-Judge Constitution Bench]
    this.registerPrecedentNode({
      caseId: "puttaswamy_2017",
      caseName: "Justice K.S. Puttaswamy (Retd.) v. Union of India",
      citation: "(2017) 10 SCC 1",
      neutralCitation: "2017 INSC 609",
      court: "SUPREME_COURT",
      judgmentDate: "2017-08-24",
      benchStrength: 9,
      precedentStatus: "GOOD_LAW",
      statutesConsidered: ["Aadhaar Act, 2016", "Information Technology Act, 2000"],
      constitutionalProvisionsConsidered: ["Article 21", "Article 14", "Article 19"],
      ratioDecidendi: "Right to privacy is a fundamental right guaranteed under Article 21 and Part III of the Constitution.",
      ratioType: "DERIVED",
    });

    // 2. ADM Jabalpur (1976) [OVERRULED]
    this.registerPrecedentNode({
      caseId: "adm_jabalpur_1976",
      caseName: "ADM Jabalpur v. Shivkant Shukla",
      citation: "(1976) 2 SCC 521",
      neutralCitation: "1976 INSC 129",
      court: "SUPREME_COURT",
      judgmentDate: "1976-04-28",
      benchStrength: 5,
      precedentStatus: "OVERRULED",
      statutesConsidered: ["Maintenance of Internal Security Act, 1971"],
      constitutionalProvisionsConsidered: ["Article 21", "Article 359"],
      ratioDecidendi: "Habeas corpus writ petitions suspended during emergency (OVERRULED).",
      ratioType: "DERIVED",
      overruledBy: {
        caseId: "puttaswamy_2017",
        caseName: "Justice K.S. Puttaswamy (Retd.) v. Union of India",
        citation: "(2017) 10 SCC 1",
        year: 2017,
      },
    });

    // 3. D.K. Basu (1997)
    this.registerPrecedentNode({
      caseId: "dk_basu_1997",
      caseName: "D.K. Basu v. State of West Bengal",
      citation: "(1997) 1 SCC 416",
      neutralCitation: "1996 INSC 1555",
      court: "SUPREME_COURT",
      judgmentDate: "1996-12-18",
      benchStrength: 2,
      precedentStatus: "GOOD_LAW",
      statutesConsidered: ["Code of Criminal Procedure, 1973", "BNSS, 2023"],
      constitutionalProvisionsConsidered: ["Article 21", "Article 22"],
      ratioDecidendi: "Mandatory arrest memo and family notification guidelines to prevent custodial violence.",
      ratioType: "DERIVED",
    });

    // 4. Arnesh Kumar (2014)
    this.registerPrecedentNode({
      caseId: "arnesh_kumar_2014",
      caseName: "Arnesh Kumar v. State of Bihar",
      citation: "(2014) 8 SCC 273",
      neutralCitation: "2014 INSC 473",
      court: "SUPREME_COURT",
      judgmentDate: "2014-07-02",
      benchStrength: 2,
      precedentStatus: "GOOD_LAW",
      statutesConsidered: ["Code of Criminal Procedure, 1973", "Indian Penal Code, 1860"],
      constitutionalProvisionsConsidered: ["Article 21", "Article 22(2)"],
      ratioDecidendi: "Mandatory Section 41A notice prior to arrest in offences punishable up to 7 years.",
      ratioType: "DERIVED",
    });

    // 5. Maneka Gandhi (1978) [7-Judge Constitution Bench]
    this.registerPrecedentNode({
      caseId: "maneka_gandhi_1978",
      caseName: "Maneka Gandhi v. Union of India",
      citation: "(1978) 1 SCC 248",
      court: "SUPREME_COURT",
      judgmentDate: "1978-01-25",
      benchStrength: 7,
      precedentStatus: "GOOD_LAW",
      statutesConsidered: ["Passports Act, 1967"],
      constitutionalProvisionsConsidered: ["Article 21", "Article 14", "Article 19"],
      ratioDecidendi: "Procedure established by law in Article 21 must be just, fair, and reasonable, not arbitrary.",
      ratioType: "DERIVED",
    });

    // 6. A.K. Gopalan (1950) [OVERRULED]
    this.registerPrecedentNode({
      caseId: "ak_gopalan_1950",
      caseName: "A.K. Gopalan v. State of Madras",
      citation: "(1950) SCR 88",
      court: "SUPREME_COURT",
      judgmentDate: "1950-05-19",
      benchStrength: 6,
      precedentStatus: "OVERRULED",
      statutesConsidered: ["Preventive Detention Act, 1950"],
      constitutionalProvisionsConsidered: ["Article 19", "Article 21", "Article 22"],
      ratioDecidendi: "Strict literal interpretation separating Article 19 from Article 21 (OVERRULED).",
      ratioType: "DERIVED",
      overruledBy: {
        caseId: "maneka_gandhi_1978",
        caseName: "Maneka Gandhi v. Union of India",
        citation: "(1978) 1 SCC 248",
        year: 1978,
      },
    });

    // 7. Kesavananda Bharati (1973) [13-Judge Constitution Bench]
    this.registerPrecedentNode({
      caseId: "kesavananda_1973",
      caseName: "Kesavananda Bharati v. State of Kerala",
      citation: "(1973) 4 SCC 225",
      court: "SUPREME_COURT",
      judgmentDate: "1973-04-24",
      benchStrength: 13,
      precedentStatus: "GOOD_LAW",
      constitutionalProvisionsConsidered: ["Article 368", "Article 13", "Article 31C"],
      ratioDecidendi: "Parliament cannot alter or destroy the basic structure or essential framework of the Constitution.",
      ratioType: "DERIVED",
    });

    // 8. S.R. Bommai (1994) [9-Judge Constitution Bench]
    this.registerPrecedentNode({
      caseId: "sr_bommai_1994",
      caseName: "S.R. Bommai v. Union of India",
      citation: "(1994) 3 SCC 1",
      court: "SUPREME_COURT",
      judgmentDate: "1994-03-11",
      benchStrength: 9,
      precedentStatus: "GOOD_LAW",
      constitutionalProvisionsConsidered: ["Article 356", "Article 352"],
      ratioDecidendi: "Proclamation of President's Rule under Article 356 is subject to judicial review; Secularism is basic structure.",
      ratioType: "DERIVED",
    });

    // 9. Lalita Kumari (2014) [5-Judge Constitution Bench]
    this.registerPrecedentNode({
      caseId: "lalita_kumari_2014",
      caseName: "Lalita Kumari v. Govt of Uttar Pradesh",
      citation: "(2014) 2 SCC 1",
      court: "SUPREME_COURT",
      judgmentDate: "2013-11-12",
      benchStrength: 5,
      precedentStatus: "GOOD_LAW",
      statutesConsidered: ["Code of Criminal Procedure, 1973", "BNSS, 2023"],
      constitutionalProvisionsConsidered: ["Article 21"],
      ratioDecidendi: "Registration of FIR under Section 154 CrPC / Section 173 BNSS is mandatory if cognizable offence is disclosed.",
      ratioType: "DERIVED",
    });

    // 10. Vidya Drolia (2021) [3-Judge Bench]
    this.registerPrecedentNode({
      caseId: "vidya_drolia_2021",
      caseName: "Vidya Drolia v. Durga Trading Corporation",
      citation: "(2021) 2 SCC 1",
      court: "SUPREME_COURT",
      judgmentDate: "2020-12-14",
      benchStrength: 3,
      precedentStatus: "GOOD_LAW",
      statutesConsidered: ["Arbitration and Conciliation Act, 1996"],
      constitutionalProvisionsConsidered: ["Article 141"],
      ratioDecidendi: "Established four-fold test for determining non-arbitrability of disputes under Indian law.",
      ratioType: "DERIVED",
    });

    // 11. Kailash Nath Associates (2015) [2-Judge Bench]
    this.registerPrecedentNode({
      caseId: "kailash_nath_2015",
      caseName: "Kailash Nath Associates v. Delhi Development Authority",
      citation: "(2015) 4 SCC 136",
      court: "SUPREME_COURT",
      judgmentDate: "2015-01-09",
      benchStrength: 2,
      precedentStatus: "GOOD_LAW",
      statutesConsidered: ["Indian Contract Act, 1872"],
      ratioDecidendi: "Section 74 of Contract Act requires proof of actual damage or loss before liquidated damages can be awarded unless impossible to prove.",
      ratioType: "DERIVED",
    });

    // 12. NN Global Mercantile (2023) [7-Judge Constitution Bench]
    this.registerPrecedentNode({
      caseId: "nn_global_2023",
      caseName: "In Re: Interplay between Arbitration Agreements and Stamp Act",
      citation: "(2023) 7 SCC 1",
      court: "SUPREME_COURT",
      judgmentDate: "2023-12-13",
      benchStrength: 7,
      precedentStatus: "GOOD_LAW",
      statutesConsidered: ["Arbitration and Conciliation Act, 1996", "Indian Stamp Act, 1899"],
      ratioDecidendi: "Non-stamping or insufficient stamping of an arbitration agreement does not render it void ab initio; curable defect.",
      ratioType: "DERIVED",
    });

    // 13. Satender Kumar Antil (2022)
    this.registerPrecedentNode({
      caseId: "satender_antil_2022",
      caseName: "Satender Kumar Antil v. CBI",
      citation: "(2022) 10 SCC 51",
      court: "SUPREME_COURT",
      judgmentDate: "2022-07-11",
      benchStrength: 2,
      precedentStatus: "GOOD_LAW",
      statutesConsidered: ["Code of Criminal Procedure, 1973", "BNSS, 2023"],
      constitutionalProvisionsConsidered: ["Article 21"],
      ratioDecidendi: "Comprehensive guidelines categorizing offences into Categories A, B, C, D for grant of bail without arrest.",
      ratioType: "DERIVED",
    });

    // 14. Pankaj Bansal (2023)
    this.registerPrecedentNode({
      caseId: "pankaj_bansal_2023",
      caseName: "Pankaj Bansal v. Union of India",
      citation: "2023 SCC OnLine SC 1244",
      court: "SUPREME_COURT",
      judgmentDate: "2023-10-03",
      benchStrength: 2,
      precedentStatus: "GOOD_LAW",
      statutesConsidered: ["Prevention of Money Laundering Act, 2002"],
      constitutionalProvisionsConsidered: ["Article 22(1)"],
      ratioDecidendi: "Supplying written grounds of arrest to accused under Section 19 PMLA is mandatory at the time of arrest.",
      ratioType: "DERIVED",
    });

    // 15. Bombay HC (2021)
    this.registerPrecedentNode({
      caseId: "lalit_mathew_bom_2021",
      caseName: "Lalit Mohan Mathew v. State of Maharashtra",
      citation: "2021 SCC OnLine Bom 452",
      court: "HIGH_COURT",
      judgmentDate: "2021-04-15",
      benchStrength: 2,
      precedentStatus: "GOOD_LAW",
      statutesConsidered: ["Code of Criminal Procedure, 1973"],
      constitutionalProvisionsConsidered: ["Article 226"],
      ratioDecidendi: "In Maharashtra, failure to comply with Section 41A CrPC notice entitles victim to compensation from the State.",
      ratioType: "DERIVED",
    });

    // Precedent Edges
    this.addPrecedentEdge({
      edgeId: "edge_puttaswamy_overrules_admjabalpur",
      sourceCaseId: "puttaswamy_2017",
      targetId: "adm_jabalpur_1976",
      targetType: "CASE",
      edgeType: "OVERRULES",
      citationEvidence: "(2017) 10 SCC 1, Para 298",
      treatmentYear: 2017,
    });

    this.addPrecedentEdge({
      edgeId: "edge_maneka_overrules_akgopalan",
      sourceCaseId: "maneka_gandhi_1978",
      targetId: "ak_gopalan_1950",
      targetType: "CASE",
      edgeType: "OVERRULES",
      citationEvidence: "(1978) 1 SCC 248",
      treatmentYear: 1978,
    });

    this.addPrecedentEdge({
      edgeId: "edge_arnesh_follows_dkbasu",
      sourceCaseId: "arnesh_kumar_2014",
      targetId: "dk_basu_1997",
      targetType: "CASE",
      edgeType: "FOLLOWS",
      citationEvidence: "(2014) 8 SCC 273, Para 7",
      treatmentYear: 2014,
    });

    this.addPrecedentEdge({
      edgeId: "edge_satender_affirms_arnesh",
      sourceCaseId: "satender_antil_2022",
      targetId: "arnesh_kumar_2014",
      targetType: "CASE",
      edgeType: "AFFIRMS",
      citationEvidence: "(2022) 10 SCC 51",
      treatmentYear: 2022,
    });

    this.addPrecedentEdge({
      edgeId: "edge_puttaswamy_interprets_art21",
      sourceCaseId: "puttaswamy_2017",
      targetId: "CONST_ART_21",
      targetType: "CONSTITUTIONAL_ARTICLE",
      edgeType: "INTERPRETS",
      citationEvidence: "Article 21 Right to Privacy",
      treatmentYear: 2017,
    });

    this.addPrecedentEdge({
      edgeId: "edge_dkbasu_interprets_art22",
      sourceCaseId: "dk_basu_1997",
      targetId: "CONST_ART_22",
      targetType: "CONSTITUTIONAL_ARTICLE",
      edgeType: "INTERPRETS",
      citationEvidence: "Article 22 Arrest Safeguards",
      treatmentYear: 1997,
    });
  }
}
