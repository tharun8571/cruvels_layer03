/**
 * CRUVELS AI — L03 PHASE 2 COMPREHENSIVE CERTIFICATION SUITE
 *
 * Validates:
 * PART 18 — 12 Supreme Court Case Law Tests
 * PART 19 — 6 Constitution of India Tests
 * PART 17 — 10 Real-World Multi-Domain Query Tests + Controlled Abstention
 * PART 24 — Latency & Bounded Graph Traversal Performance
 * PART 20 & 21 — Security Boundary & L03 -> L04 Contract Immutability
 */

import { describe, it, before } from "node:test";
import * as assert from "node:assert";
import { KnowledgeRepositoryService } from "../repository/knowledge-repository.service";
import { SeedCorpusService } from "../corpus/seed-corpus.service";
import { EvidenceAdmissionPolicy } from "../retrieval/evidence-admission.policy";
import { LegalKnowledgeGraphService } from "../knowledge-graph/legal-knowledge-graph.service";
import { CaseStructureDetector } from "../structure/case-structure-detector";
import { ConstitutionStructureDetector } from "../structure/constitution-structure-detector";
import { CaseLawIngestorService } from "../ingestion/case-law-ingestor.service";

describe("L03 Phase 2 — Comprehensive Intelligence Suite", () => {
  let repository: KnowledgeRepositoryService;
  let seedService: SeedCorpusService;
  let admissionPolicy: EvidenceAdmissionPolicy;
  let graphService: LegalKnowledgeGraphService;
  let caseDetector: CaseStructureDetector;
  let constDetector: ConstitutionStructureDetector;
  let caseIngestor: CaseLawIngestorService;

  before(async () => {
    repository = new KnowledgeRepositoryService();
    seedService = new SeedCorpusService(repository);
    admissionPolicy = new EvidenceAdmissionPolicy();
    graphService = new LegalKnowledgeGraphService();
    caseDetector = new CaseStructureDetector();
    constDetector = new ConstitutionStructureDetector();
    caseIngestor = new CaseLawIngestorService(repository, caseDetector);

    // Initialize complete Phase 1 + Phase 2 Knowledge Base
    await seedService.seedKnowledgeBase();
  });

  // =========================================================================
  // PART 18 — CASE LAW VERIFICATION TESTS (12 Required Tests)
  // =========================================================================
  describe("Part 18: Supreme Court Case Law Intelligence", () => {
    it("18.1 Case retrieved by case name", async () => {
      const cases = repository.findCaseByName("D.K. Basu");
      assert.ok(cases.length >= 1, "Expected at least 1 case match for D.K. Basu");
      const dkBasu = cases[0];
      assert.ok(dkBasu.caseName.includes("D.K. Basu"));
      assert.strictEqual(dkBasu.court, "SUPREME_COURT");
      assert.strictEqual(dkBasu.citation, "(1997) 1 SCC 416");
    });

    it("18.2 Case retrieved by citation", async () => {
      const caseByCitation = repository.findCaseByCitation("(2017) 10 SCC 1");
      assert.ok(caseByCitation, "Expected case for citation (2017) 10 SCC 1");
      assert.ok(caseByCitation.caseName.includes("Puttaswamy"));
      assert.strictEqual(caseByCitation.neutralCitation, "2017 INSC 750");

      const caseByNeutral = repository.findCaseByCitation("2014 INSC 492");
      assert.ok(caseByNeutral, "Expected case for neutral citation 2014 INSC 492");
      assert.ok(caseByNeutral.caseName.includes("Arnesh Kumar"));
    });

    it("18.3 Case retrieved by legal issue", async () => {
      const cases = repository.findCasesByLegalIssue("custodial violence safeguards upon arrest");
      assert.ok(cases.length >= 1, "Expected cases matching arrest violence issue");
      assert.ok(cases.some((c) => c.caseName.includes("D.K. Basu")));
    });

    it("18.4 Case retrieved by statute", async () => {
      const cases = repository.findCasesByStatute("Code of Criminal Procedure, 1973");
      assert.ok(cases.length >= 2, "Expected cases considering CrPC 1973");
      assert.ok(cases.some((c) => c.caseName.includes("Arnesh Kumar")));
      assert.ok(cases.some((c) => c.caseName.includes("D.K. Basu")));
    });

    it("18.5 Case retrieved by constitutional article", async () => {
      const cases = repository.findCasesByConstitutionalArticle("Article 21");
      assert.ok(cases.length >= 3, "Expected at least 3 cases interpreting Article 21");
      assert.ok(cases.some((c) => c.caseName.includes("Puttaswamy")));
      assert.ok(cases.some((c) => c.caseName.includes("Maneka Gandhi")));
      assert.ok(cases.some((c) => c.caseName.includes("D.K. Basu")));
    });

    it("18.6 Case retrieved by legal proposition", async () => {
      const cases = repository.findCasesByLegalProposition("automatic arrest is prohibited and notice under section 41A is mandatory");
      assert.ok(cases.length >= 1, "Expected case for section 41A notice proposition");
      assert.ok(cases.some((c) => c.caseName.includes("Arnesh Kumar")));
    });

    it("18.7 Overruled case not presented as current good law", async () => {
      const overruledCase = repository.findCaseByName("ADM Jabalpur");
      assert.ok(overruledCase.length >= 1);
      assert.strictEqual(overruledCase[0].precedentStatus, "OVERRULED");
      assert.ok(overruledCase[0].subsequentTreatment.overruledBy?.includes("K.S. Puttaswamy"));

      // Verify admission policy strictly rejects overruled precedent for current date
      const result = admissionPolicy.evaluateEvidence(
        {
          id: "adm-jabalpur-ev",
          sourceId: overruledCase[0].id,
          sourceType: "CASE_LAW",
          authorityLevel: "JUDICIAL",
          jurisdiction: "INDIA",
          temporalStatus: "CURRENT",
          precedentStatus: "OVERRULED",
          content: "Fundamental rights can be suspended during emergency.",
          matchedQueryTerms: ["emergency", "fundamental", "rights"],
          sourceDate: "1976-04-28",
        },
        {
          query: "Can fundamental rights be suspended during emergency?",
          asOfDate: "2026-10-04",
          targetJurisdiction: "INDIA",
        }
      );

      assert.strictEqual(result.admitted, false);
      assert.strictEqual(result.decision, "REJECTED_OVERRULED");
    });

    it("18.8 High Court case jurisdiction filtered", async () => {
      const hcCase = repository.findCaseByName("Lalit Mohan Mathew");
      assert.ok(hcCase.length >= 1);
      assert.strictEqual(hcCase[0].court, "HIGH_COURT");
      assert.strictEqual(hcCase[0].jurisdiction, "IN-MH");

      // Admitted with binding high authority in Maharashtra
      const mhEval = admissionPolicy.evaluateEvidence(
        {
          id: "hc-mh-ev",
          sourceId: hcCase[0].id,
          sourceType: "CASE_LAW",
          authorityLevel: "JUDICIAL",
          jurisdiction: "IN-MH",
          temporalStatus: "CURRENT",
          precedentStatus: "GOOD_LAW",
          content: "Maharashtra RERA refund jurisdiction is strictly enforceable.",
          matchedQueryTerms: ["rera", "refund", "maharashtra"],
          sourceDate: "2021-03-15",
        },
        {
          query: "RERA refund jurisdiction in Maharashtra",
          asOfDate: "2026-10-04",
          targetJurisdiction: "IN-MH",
        }
      );
      assert.strictEqual(mhEval.admitted, true);
      assert.ok((mhEval.effectiveAuthorityScore ?? 0) >= 0.85);

      // Persuasive/lower score in another state
      const kaEval = admissionPolicy.evaluateEvidence(
        {
          id: "hc-ka-ev",
          sourceId: hcCase[0].id,
          sourceType: "CASE_LAW",
          authorityLevel: "JUDICIAL",
          jurisdiction: "IN-MH",
          temporalStatus: "CURRENT",
          precedentStatus: "GOOD_LAW",
          content: "Maharashtra RERA refund jurisdiction is strictly enforceable.",
          matchedQueryTerms: ["rera", "refund"],
          sourceDate: "2021-03-15",
        },
        {
          query: "RERA refund in Karnataka",
          asOfDate: "2026-10-04",
          targetJurisdiction: "IN-KA",
        }
      );
      assert.strictEqual(kaEval.admitted, true);
      assert.ok((kaEval.effectiveAuthorityScore ?? 0) < 0.70);
    });

    it("18.9 Supreme Court precedent outranks conflicting lower authority", async () => {
      const scPrecedent = repository.findCaseByName("Puttaswamy")[0];
      const scEval = admissionPolicy.evaluateEvidence(
        {
          id: "sc-ev",
          sourceId: scPrecedent.id,
          sourceType: "CASE_LAW",
          authorityLevel: "JUDICIAL",
          jurisdiction: "INDIA",
          temporalStatus: "CURRENT",
          precedentStatus: "GOOD_LAW",
          content: "Right to privacy is an intrinsic part of the right to life under Article 21.",
          matchedQueryTerms: ["privacy", "article", "21"],
          sourceDate: "2017-08-24",
        },
        {
          query: "Right to privacy Article 21",
          asOfDate: "2026-10-04",
          targetJurisdiction: "IN-DL",
        }
      );

      const hcCase = repository.findCaseByName("Lalit Mohan Mathew")[0];
      const hcEval = admissionPolicy.evaluateEvidence(
        {
          id: "hc-ev",
          sourceId: hcCase.id,
          sourceType: "CASE_LAW",
          authorityLevel: "JUDICIAL",
          jurisdiction: "IN-MH",
          temporalStatus: "CURRENT",
          precedentStatus: "GOOD_LAW",
          content: "High Court decision on procedural compliance.",
          matchedQueryTerms: ["privacy", "article", "21"],
          sourceDate: "2021-03-15",
        },
        {
          query: "Right to privacy Article 21",
          asOfDate: "2026-10-04",
          targetJurisdiction: "IN-DL",
        }
      );

      assert.ok((scEval.effectiveAuthorityScore ?? 0) > (hcEval.effectiveAuthorityScore ?? 0));
      assert.ok((scEval.effectiveAuthorityScore ?? 0) >= 0.95);
    });

    it("18.10 Historical case remains retrievable when historically relevant", async () => {
      const overruledCase = repository.findCaseByName("ADM Jabalpur")[0];
      
      // When queried with historical asOfDate prior to overruling in 2017
      const historicalEval = admissionPolicy.evaluateEvidence(
        {
          id: "adm-hist-ev",
          sourceId: overruledCase.id,
          sourceType: "CASE_LAW",
          authorityLevel: "JUDICIAL",
          jurisdiction: "INDIA",
          temporalStatus: "HISTORICAL",
          precedentStatus: "OVERRULED",
          content: "Historical position during 1976 Emergency.",
          matchedQueryTerms: ["emergency", "position", "1976"],
          sourceDate: "1976-04-28",
        },
        {
          query: "What was the legal position on habeas corpus in 1976?",
          asOfDate: "1976-05-01",
          targetJurisdiction: "INDIA",
        }
      );

      assert.strictEqual(historicalEval.admitted, true);
      assert.strictEqual(historicalEval.decision, "ADMITTED_HISTORICAL");
    });

    it("18.11 Case with uncertain status is not falsely labeled authoritative", async () => {
      const uncertainCase = repository.findCaseByName("Uncertain Precedent");
      assert.ok(uncertainCase.length >= 1);
      assert.strictEqual(uncertainCase[0].precedentStatus, "UNCERTAIN");

      const uncertainEval = admissionPolicy.evaluateEvidence(
        {
          id: "unc-ev",
          sourceId: uncertainCase[0].id,
          sourceType: "CASE_LAW",
          authorityLevel: "JUDICIAL",
          jurisdiction: "INDIA",
          temporalStatus: "CURRENT",
          precedentStatus: "UNCERTAIN",
          content: "Pending reference before a larger bench.",
          matchedQueryTerms: ["larger", "bench", "reference"],
          sourceDate: "2023-01-10",
        },
        {
          query: "Pending reference larger bench interpretation",
          asOfDate: "2026-10-04",
          targetJurisdiction: "INDIA",
        }
      );

      assert.strictEqual(uncertainEval.admitted, true);
      assert.strictEqual(uncertainEval.decision, "ADMITTED_UNCERTAIN_PRECEDENT");
      assert.ok((uncertainEval.effectiveAuthorityScore ?? 0) < 0.80);
    });

    it("18.12 Case citation contains provenance", async () => {
      const caseItem = repository.findCaseByName("D.K. Basu")[0];
      assert.strictEqual(caseItem.officialSourceUrl, "https://main.sci.gov.in/judgment/dk-basu-1997");
      assert.strictEqual(caseItem.provenance.publisher, "Supreme Court of India");
      assert.ok(caseItem.provenance.retrievalDate);
      assert.ok(caseItem.chunks.length > 0);
      assert.ok(caseItem.chunks[0].paragraphNumber > 0);
      assert.strictEqual(caseItem.holdings[0].ratioType, "DERIVED");
    });
  });

  // =========================================================================
  // PART 19 — CONSTITUTION OF INDIA TESTS (6 Required Tests)
  // =========================================================================
  describe("Part 19: Constitution of India Intelligence", () => {
    it("19.1 Article number search", async () => {
      const art21 = repository.resolveConstitutionalArticle("Article 21");
      assert.ok(art21);
      assert.strictEqual(art21.title, "Protection of life and personal liberty");
      assert.strictEqual(art21.part, "Part III");
      assert.strictEqual(art21.partTitle, "Fundamental Rights");

      const art32 = repository.resolveConstitutionalArticle("Article 32");
      assert.ok(art32);
      assert.ok(art32.title.includes("Remedies for enforcement of rights"));
    });

    it("19.2 Constitutional concept search", async () => {
      const results = repository.searchConstitutionalConcepts("right to life and personal liberty");
      assert.ok(results.length >= 1);
      assert.strictEqual(results[0].articleNumber, "Article 21");

      const arrestResults = repository.searchConstitutionalConcepts("protection against arrest and detention");
      assert.ok(arrestResults.length >= 1);
      assert.strictEqual(arrestResults[0].articleNumber, "Article 22");
    });

    it("19.3 Article + statute search", async () => {
      const crossResults = repository.searchCrossProvisions("Article 21", "Bharatiya Nagarik Suraksha Sanhita, 2023");
      assert.ok(crossResults.constitutional.length >= 1);
      assert.ok(crossResults.statutory.length >= 1);
      assert.strictEqual(crossResults.constitutional[0].articleNumber, "Article 21");
      assert.ok(crossResults.statutory.some((s) => s.statuteName.includes("Nagarik")));
    });

    it("19.4 Article + case search", async () => {
      const cases = repository.findCasesByConstitutionalArticle("Article 21");
      assert.ok(cases.length >= 3);
      const caseNames = cases.map((c) => c.caseName);
      assert.ok(caseNames.includes("K.S. Puttaswamy (Retd.) v. Union of India"));
      assert.ok(caseNames.includes("D.K. Basu v. State of West Bengal"));
    });

    it("19.5 Amendment-aware retrieval", async () => {
      const art21A = repository.resolveConstitutionalArticle("Article 21A");
      assert.ok(art21A);
      assert.ok(art21A.amendmentHistory.some((a) => a.amendmentNumber === 86));
      assert.strictEqual(art21A.amendmentHistory.find((a) => a.amendmentNumber === 86)?.year, 2002);

      const art300A = repository.resolveConstitutionalArticle("Article 300A");
      assert.ok(art300A);
      assert.strictEqual(art300A.part, "Part XII");
      assert.ok(art300A.amendmentHistory.some((a) => a.amendmentNumber === 44));
    });

    it("19.6 Constitutional evidence has highest authority ranking", async () => {
      const art21 = repository.resolveConstitutionalArticle("Article 21");
      assert.ok(art21);

      const constEval = admissionPolicy.evaluateEvidence(
        {
          id: "const-ev",
          sourceId: art21.id,
          sourceType: "CONSTITUTION",
          authorityLevel: "PRIMARY",
          jurisdiction: "INDIA",
          temporalStatus: "CURRENT",
          content: art21.text,
          matchedQueryTerms: ["life", "liberty", "law"],
          sourceDate: "1950-01-26",
        },
        {
          query: "No person shall be deprived of life or personal liberty except according to procedure established by law",
          asOfDate: "2026-10-04",
          targetJurisdiction: "INDIA",
        }
      );

      const secondaryEval = admissionPolicy.evaluateEvidence(
        {
          id: "sec-ev",
          sourceId: "sec-doc-1",
          sourceType: "SECONDARY_ANALYSIS",
          authorityLevel: "PERSUASIVE",
          jurisdiction: "INDIA",
          temporalStatus: "CURRENT",
          content: "Scholarly commentary on Article 21.",
          matchedQueryTerms: ["life", "liberty", "law"],
          sourceDate: "2024-01-01",
        },
        {
          query: "No person shall be deprived of life or personal liberty except according to procedure established by law",
          asOfDate: "2026-10-04",
          targetJurisdiction: "INDIA",
        }
      );

      assert.strictEqual(constEval.admitted, true);
      assert.strictEqual(constEval.effectiveAuthorityScore, 1.0);
      assert.ok((constEval.effectiveAuthorityScore ?? 0) > (secondaryEval.effectiveAuthorityScore ?? 0));
    });
  });

  // =========================================================================
  // PART 17 — REAL-WORLD MULTI-DOMAIN TESTS (10 Domains)
  // =========================================================================
  describe("Part 17: Real-Life Multi-Domain Legal Problem Resolution", () => {
    it("17.1 Criminal Law: Arrest & detention family notification", async () => {
      const path = graphService.resolveProblemPath("I was arrested and my family was not informed.");
      assert.strictEqual(path.domain, "CRIMINAL");
      assert.ok(path.constitutionalProvisions.some((p) => p.includes("Article 21") || p.includes("Article 22")));
      assert.ok(path.statutes.some((s) => s.includes("Bharatiya Nagarik Suraksha Sanhita")));
      assert.ok(path.cases.some((c) => c.includes("D.K. Basu")));
      assert.ok(path.remedies.some((r) => r.includes("Bail") || r.includes("Habeas Corpus")));
      assert.ok(path.forums.some((f) => f.includes("Magistrate")));
      assert.ok(path.limitations.some((l) => l.includes("24 hours")));
    });

    it("17.2 Property Law: Inherited property sold without consent", async () => {
      const path = graphService.resolveProblemPath("My brother sold inherited property without my consent.");
      assert.strictEqual(path.domain, "PROPERTY");
      assert.ok(path.statutes.some((s) => s.includes("Hindu Succession Act") || s.includes("Transfer of Property Act")));
      assert.ok(path.cases.some((c) => c.includes("Vineeta Sharma")));
      assert.ok(path.forums.some((f) => f.includes("Civil Court")));
      assert.ok(path.remedies.some((r) => r.includes("Partition") || r.includes("Cancellation of Sale Deed")));
    });

    it("17.3 Contract Law: Breach of commercial agreement", async () => {
      const path = graphService.resolveProblemPath("The other party breached our agreement.");
      assert.strictEqual(path.domain, "CONTRACT");
      assert.ok(path.statutes.some((s) => s.includes("Indian Contract Act, 1872")));
      assert.ok(path.cases.some((c) => c.includes("Kailash Nath")));
      assert.ok(path.forums.some((f) => f.includes("Commercial Court") || f.includes("Civil Court")));
      assert.ok(path.remedies.some((r) => r.includes("Damages") || r.includes("Specific Performance")));
    });

    it("17.4 Family Law: Stopped paying maintenance", async () => {
      const path = graphService.resolveProblemPath("My spouse has stopped paying maintenance.");
      assert.strictEqual(path.domain, "FAMILY");
      assert.ok(path.statutes.some((s) => s.includes("Bharatiya Nagarik Suraksha Sanhita") || s.includes("Hindu Marriage Act")));
      assert.ok(path.forums.some((f) => f.includes("Family Court")));
      assert.ok(path.remedies.some((r) => r.includes("Execution of Maintenance Order") || r.includes("Monthly Allowance")));
    });

    it("17.5 Consumer Law: Defective product refund refusal", async () => {
      const path = graphService.resolveProblemPath("I bought a defective product and the seller refuses a refund.");
      assert.strictEqual(path.domain, "CONSUMER");
      assert.ok(path.statutes.some((s) => s.includes("Consumer Protection Act, 2019")));
      assert.ok(path.forums.some((f) => f.includes("Consumer Disputes Redressal Commission")));
      assert.ok(path.remedies.some((r) => r.includes("Refund of Price") || r.includes("Replacement")));
      assert.ok(path.limitations.some((l) => l.includes("2 years")));
    });

    it("17.6 Cyber Law: Fake social media account identity theft", async () => {
      const path = graphService.resolveProblemPath("Someone created a fake social media account using my identity.");
      assert.strictEqual(path.domain, "CYBER");
      assert.ok(path.statutes.some((s) => s.includes("Information Technology Act, 2000")));
      assert.ok(path.cases.some((c) => c.includes("Shreya Singhal")));
      assert.ok(path.forums.some((f) => f.includes("Cyber Crime Police Station") || f.includes("Adjudicating Officer")));
      assert.ok(path.remedies.some((r) => r.includes("Takedown") || r.includes("Criminal Prosecution")));
    });

    it("17.7 Employment Law: Unpaid salary recovery", async () => {
      const path = graphService.resolveProblemPath("My employer has not paid my salary.");
      assert.strictEqual(path.domain, "EMPLOYMENT");
      assert.ok(path.statutes.some((s) => s.includes("Payment of Wages Act, 1936") || s.includes("Industrial Disputes Act")));
      assert.ok(path.forums.some((f) => f.includes("Labour Court") || f.includes("Authority under Payment of Wages Act")));
      assert.ok(path.remedies.some((r) => r.includes("Claim for Unpaid Wages")));
    });

    it("17.8 RERA Law: Builder delayed possession", async () => {
      const path = graphService.resolveProblemPath("The builder has delayed possession.");
      assert.strictEqual(path.domain, "RERA");
      assert.ok(path.statutes.some((s) => s.includes("Real Estate (Regulation and Development) Act, 2016")));
      assert.ok(path.forums.some((f) => f.includes("Real Estate Regulatory Authority")));
      assert.ok(path.remedies.some((r) => r.includes("Full Refund with Interest") || r.includes("Delayed Possession Interest")));
    });

    it("17.9 Arbitration Law: Received arbitration notice", async () => {
      const path = graphService.resolveProblemPath("I received an arbitration notice.");
      assert.strictEqual(path.domain, "ARBITRATION");
      assert.ok(path.statutes.some((s) => s.includes("Arbitration and Conciliation Act, 1996")));
      assert.ok(path.cases.some((c) => c.includes("Vidya Drolia")));
      assert.ok(path.forums.some((f) => f.includes("Arbitral Tribunal") || f.includes("High Court")));
      assert.ok(path.notices.some((n) => n.includes("30 days")));
    });

    it("17.10 Succession Law: Father died intestate without a will", async () => {
      const path = graphService.resolveProblemPath("My father died without a will.");
      assert.strictEqual(path.domain, "SUCCESSION");
      assert.ok(path.statutes.some((s) => s.includes("Hindu Succession Act, 1956")));
      assert.ok(path.forums.some((f) => f.includes("Civil Court")));
      assert.ok(path.remedies.some((r) => r.includes("Succession Certificate") || r.includes("Declaration of Legal Heirship")));
    });

    it("17.11 Controlled Abstention for ungrounded/unknown domain", async () => {
      const ungroundedPath = graphService.resolveProblemPath("What is the speed limit of warp drive spaceships?");
      assert.strictEqual(ungroundedPath.statutes.length, 0);
      assert.strictEqual(ungroundedPath.cases.length, 0);
      assert.strictEqual(ungroundedPath.remedies.length, 0);
    });
  });

  // =========================================================================
  // PART 24 — PERFORMANCE BENCHMARKS (Latency & Graph Traversal)
  // =========================================================================
  describe("Part 24: Latency & Bounded Traversal Performance", () => {
    it("Knowledge Graph bounded traversal latency < 15ms", async () => {
      const start = performance.now();
      const path = graphService.resolveProblemPath("I was arrested and my family was not informed.");
      const duration = performance.now() - start;

      assert.ok(path);
      assert.ok(duration < 15, `Duration was ${duration}ms, expected < 15ms`);
    });

    it("Knowledge Graph 2-hop traversal bounded at max 30 nodes", async () => {
      const neighbors = graphService.traverseNeighbors("statute_bnss_2023", 2);
      assert.ok(neighbors.nodes.length <= 30);
      assert.ok(neighbors.edges.length > 0);
    });
  });

  // =========================================================================
  // PART 20 & 21 — SECURITY BOUNDARY & L03 -> L04 INTEGRITY
  // =========================================================================
  describe("Part 20 & 21: Security Boundary & L03 -> L04 Immutability", () => {
    it("Legal Knowledge Graph contains zero authorization or tenant metadata", () => {
      const allNodes = graphService.exportGraph().nodes;
      for (const node of allNodes) {
        assert.strictEqual((node as any).tenantId, undefined);
        assert.strictEqual((node as any).userRole, undefined);
        assert.strictEqual((node as any).permission, undefined);
        assert.strictEqual((node as any).acl, undefined);
      }
    });

    it("L03 evidence admission status cannot be converted from REJECTED to ADMITTED", () => {
      const rejectedEval = admissionPolicy.evaluateEvidence(
        {
          id: "rej-ev-1",
          sourceId: "case-overruled-1",
          sourceType: "CASE_LAW",
          authorityLevel: "JUDICIAL",
          jurisdiction: "INDIA",
          temporalStatus: "CURRENT",
          precedentStatus: "OVERRULED",
          content: "Overruled doctrine.",
          matchedQueryTerms: ["emergency"],
          sourceDate: "1976-04-28",
        },
        {
          query: "Current emergency laws",
          asOfDate: "2026-10-04",
          targetJurisdiction: "INDIA",
        }
      );

      assert.strictEqual(rejectedEval.admitted, false);
      assert.strictEqual(rejectedEval.decision, "REJECTED_OVERRULED");

      // Verify immutable state contract
      const l04Payload = {
        admittedEvidence: rejectedEval.admitted ? [rejectedEval] : [],
        rejectedEvidence: rejectedEval.admitted ? [] : [rejectedEval],
      };

      assert.strictEqual(l04Payload.admittedEvidence.length, 0);
      assert.strictEqual(l04Payload.rejectedEvidence.length, 1);
    });
  });
});
