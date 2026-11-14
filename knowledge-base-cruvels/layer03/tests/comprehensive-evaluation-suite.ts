/**
 * CRUVELS LEGAL AI — LAYER 03 COMPREHENSIVE RETRIEVAL & GROUNDING EVALUATION SUITE
 * 
 * Tests retrieval across 8 distinct architectural dimensions:
 * 1. Exact Statutory Provision Lookups (SARFAESI 17, MSMED 15, BNS 318, BNSS 35, NI 138, TP 106, Arb 9, Companies 135)
 * 2. Statutory Preambles & Statements of Purpose (Constitution, Motor Vehicles)
 * 3. Temporal Validity & Historical Date Boundaries (CrPC 50, CrPC 41D as of 2023-12-31)
 * 4. Stare Decisis Precedent Treatment Graph (ADM Jabalpur, Golak Nath, Koushal, Puttaswamy)
 * 5. Statutory Concordance Transitions (IPC 420 -> BNS 318, IPC 302 -> BNS 103, CrPC 438 -> BNSS 482)
 * 6. Natural Language Conceptual Inquiries without Section Numbers (Contract Termination, Homebuyer Remedies, Definitions)
 * 7. Negative Controls & Non-Existent Provisions (Section 9999 CrPC, Section 500 SARFAESI, Martian Law, Quantum Teleportation)
 * 8. Jurisdictional Boundary Filtering (Delhi HC Order 39, Bombay HC Order 39)
 * 
 * Computes: Precision@K, Recall@K, MRR, Irrelevant-at-High-Confidence Rate, Abstention Accuracy, Latencies.
 */

import { CruvelsKnowledgeRepository } from "../src/repository/cruvels-knowledge.repository.js";
import { performance } from "node:perf_hooks";

interface TestCase {
  id: string;
  category: string;
  name: string;
  query: string;
  filter?: any;
  topK?: number;
  expectedBehavior: "RETRIEVE_EVIDENCE" | "ABSTAIN";
  expectedKeywords?: RegExp[];
  expectedDocRegex?: RegExp;
  expectedOverruled?: boolean;
  expectedMinConfidence?: "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "LOW_CONFIDENCE";
}

const testCases: TestCase[] = [
  // ---------------------------------------------------------------------------
  // 1. EXACT STATUTORY PROVISIONS
  // ---------------------------------------------------------------------------
  {
    id: "STAT-01",
    category: "Exact Statutory Provision",
    name: "SARFAESI Act 2002 Section 17",
    query: "Retrieve the complete text of Section 17 of the Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act, 2002.",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/Debts\s+Recovery\s+Tribunal/i, /measures\s+referred\s+to\s+in\s+sub-section/i],
    expectedDocRegex: /Securitisation.*2002/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "STAT-02",
    category: "Exact Statutory Provision",
    name: "MSMED Act 2006 Section 15",
    query: "What does Section 15 of the Micro, Small and Medium Enterprises Development Act, 2006 provide regarding the buyer's obligation to make payment?",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/forty-five\s+days/i, /supplier/i, /buyer/i],
    expectedDocRegex: /Micro.*Enterprises.*2006/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "STAT-03",
    category: "Exact Statutory Provision",
    name: "BNS 2023 Section 318",
    query: "Section 318 BNS",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/cheating/i, /deceiving/i],
    expectedDocRegex: /Bharatiya\s+Nyaya\s+Sanhita/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "STAT-04",
    category: "Exact Statutory Provision",
    name: "BNSS 2023 Section 35",
    query: "Section 35 BNSS",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/arrest\s+without\s+warrant/i, /police\s+officer/i],
    expectedDocRegex: /Bharatiya\s+Nagarik\s+Suraksha\s+Sanhita/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "STAT-05",
    category: "Exact Statutory Provision",
    name: "Negotiable Instruments Act Section 138",
    query: "Find Section 138 of the Negotiable Instruments Act, 1881, including the exact statutory text.",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/dishonour\s+of\s+cheque/i, /insufficiency.*funds/i],
    expectedDocRegex: /Negotiable\s+Instruments\s+Act/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "STAT-06",
    category: "Exact Statutory Provision",
    name: "Transfer of Property Act Section 106",
    query: "Section 106 Transfer of Property Act",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/duration\s+of\s+certain\s+leases/i, /notice/i],
    expectedDocRegex: /Transfer\s+of\s+Property\s+Act/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "STAT-07",
    category: "Exact Statutory Provision",
    name: "Arbitration & Conciliation Act Section 9",
    query: "Section 9 Arbitration and Conciliation Act",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/interim\s+measures/i, /court/i],
    expectedDocRegex: /Arbitration\s+and\s+Conciliation\s+Act/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "STAT-08",
    category: "Exact Statutory Provision",
    name: "Companies Act 2013 Section 135",
    query: "Section 135 of the Companies Act, 2013",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/Corporate\s+Social\s+Responsibility/i, /net\s+profit/i],
    expectedDocRegex: /Companies\s+Act/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },

  // ---------------------------------------------------------------------------
  // 2. STATUTORY PREAMBLES & PURPOSE
  // ---------------------------------------------------------------------------
  {
    id: "PREAMBLE-01",
    category: "Statutory Preambles",
    name: "Constitution of India Preamble",
    query: "Preamble of the Constitution of India",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/WE,\s+THE\s+PEOPLE\s+OF\s+INDIA/i, /SOVEREIGN\s+SOCIALIST\s+SECULAR/i],
    expectedDocRegex: /Constitution/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "PREAMBLE-02",
    category: "Statutory Preambles",
    name: "Motor Vehicles Act Preamble",
    query: "Preamble of the Motor Vehicles Act, 1988",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/THE\s+MOTOR\s+VEHICLES\s+ACT/i, /consolidate.*law.*motor\s+vehicles/i],
    expectedDocRegex: /Motor\s+Vehicles/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },

  // ---------------------------------------------------------------------------
  // 3. TEMPORAL VALIDITY & HISTORICAL DATE BOUNDARIES
  // ---------------------------------------------------------------------------
  {
    id: "TEMP-01",
    category: "Temporal Validity",
    name: "Section 50 CrPC on 2023-12-31",
    query: "Retrieve the exact text of Section 50 of the Code of Criminal Procedure, 1973 as it stood on 2023-12-31.",
    filter: { asOfDate: "2023-12-31", status: "IN_FORCE" },
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/Person\s+arrested\s+to\s+be\s+informed\s+of\s+grounds/i],
    expectedDocRegex: /Criminal\s+Procedure.*1973/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "TEMP-02",
    category: "Temporal Validity",
    name: "Section 41D CrPC on 2023-12-31",
    query: "What does Section 41D of the Code of Criminal Procedure, 1973 provide? Retrieve the exact section as of 2023-12-31.",
    filter: { asOfDate: "2023-12-31" },
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/advocate\s+of\s+his\s+choice/i, /interrogation/i],
    expectedDocRegex: /Criminal\s+Procedure.*1973/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "TEMP-03",
    category: "Temporal Validity",
    name: "Applicable Criminal Procedure on 2023-12-31",
    query: "Identify the Indian criminal-procedure statute applicable on 2023-12-31 and retrieve the relevant statutory record as it stood on that date.",
    filter: { asOfDate: "2023-12-31", sourceTypes: ["STATUTORY_CODE"] },
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/Code\s+of\s+Criminal\s+Procedure/i],
    expectedDocRegex: /Criminal\s+Procedure/i,
    expectedMinConfidence: "MEDIUM_CONFIDENCE",
  },

  // ---------------------------------------------------------------------------
  // 4. STARE DECISIS PRECEDENT TREATMENT GRAPH
  // ---------------------------------------------------------------------------
  {
    id: "PREC-01",
    category: "Precedent Graph",
    name: "ADM Jabalpur Overruling Treatment",
    query: "Retrieve ADM Jabalpur v. Shivkant Shukla and later Supreme Court treatment of its majority holding. Clearly identify whether later authority overruled it; do not present it as good law without qualification.",
    filter: { sourceTypes: ["JUDICIAL_PRECEDENT"] },
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/OVERRULED/i, /Puttaswamy/i, /Article\s+21/i],
    expectedDocRegex: /ADDITIONAL\s+DISTRICT\s+MAGISTRATE,\s+JABALPUR/i,
    expectedOverruled: true,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "PREC-02",
    category: "Precedent Graph",
    name: "I.C. Golak Nath Overruling Treatment",
    query: "Golak Nath State of Punjab",
    filter: { sourceTypes: ["JUDICIAL_PRECEDENT"] },
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/OVERRULED/i, /GOLAK\s+NATH/i],
    expectedDocRegex: /GOLAK\s+NATH/i,
    expectedOverruled: true,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "PREC-03",
    category: "Precedent Graph",
    name: "Suresh Kumar Koushal Overruling Treatment",
    query: "Suresh Kumar Koushal Naz Foundation",
    filter: { sourceTypes: ["JUDICIAL_PRECEDENT"] },
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/OVERRULED/i, /KOUSHAL/i],
    expectedDocRegex: /KOUSHAL/i,
    expectedOverruled: true,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "PREC-04",
    category: "Precedent Graph",
    name: "Justice K.S. Puttaswamy v. Union of India (Active Good Law)",
    query: "Puttaswamy Union of India privacy",
    filter: { sourceTypes: ["JUDICIAL_PRECEDENT"] },
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/PUTTASWAMY/i, /GOOD\s+LAW/i],
    expectedDocRegex: /PUTTASWAMY/i,
    expectedOverruled: false,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },

  // ---------------------------------------------------------------------------
  // 5. STATUTORY TRANSITIONS & CONCORDANCE
  // ---------------------------------------------------------------------------
  {
    id: "CONC-01",
    category: "Concordance Transition",
    name: "Section 420 IPC -> Section 318 BNS",
    query: "Section 420 IPC",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/318/i, /cheating/i],
    expectedDocRegex: /Penal\s+Code|Nyaya\s+Sanhita/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "CONC-02",
    category: "Concordance Transition",
    name: "Section 302 IPC -> Section 103 BNS",
    query: "Section 302 IPC",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/103/i, /murder/i],
    expectedDocRegex: /Penal\s+Code|Nyaya\s+Sanhita/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },
  {
    id: "CONC-03",
    category: "Concordance Transition",
    name: "Section 438 CrPC -> Section 482 BNSS",
    query: "Section 438 CrPC",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/482/i, /bail/i],
    expectedDocRegex: /Criminal\s+Procedure|Suraksha\s+Sanhita/i,
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },

  // ---------------------------------------------------------------------------
  // 6. NATURAL LANGUAGE CONCEPTUAL INQUIRIES WITHOUT SECTION NUMBERS
  // ---------------------------------------------------------------------------
  {
    id: "CONCEPT-01",
    category: "Conceptual Search",
    name: "Services Agreement Exit Clause vs Breach",
    query: "I am reviewing a services agreement. Find Indian legal materials that help distinguish ending the agreement under an express no-fault exit clause from ending it because the other party breached it.",
    filter: { sourceTypes: ["STATUTORY_CODE", "JUDICIAL_PRECEDENT"] },
    topK: 8,
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/services|agreement|breach|contract/i],
    expectedMinConfidence: "MEDIUM_CONFIDENCE",
  },
  {
    id: "CONCEPT-02",
    category: "Conceptual Search",
    name: "Cognizable Offence Definition",
    query: "Cognizable Offence definition and police arrest power",
    expectedBehavior: "RETRIEVE_EVIDENCE",
    expectedKeywords: [/cognizable/i, /arrest\s+without\s+warrant/i],
    expectedMinConfidence: "HIGH_CONFIDENCE",
  },

  // ---------------------------------------------------------------------------
  // 7. NEGATIVE CONTROLS & NON-EXISTENT LAWS (HONEST ABSTENTION)
  // ---------------------------------------------------------------------------
  {
    id: "NEG-01",
    category: "Negative Control / Abstention",
    name: "Section 9999 CrPC (Non-Existent Section)",
    query: "Retrieve Section 9999 of the Code of Criminal Procedure, 1973. Do not substitute the Act title or another section.",
    expectedBehavior: "ABSTAIN",
  },
  {
    id: "NEG-02",
    category: "Negative Control / Abstention",
    name: "Section 500 SARFAESI Act (Non-Existent Section)",
    query: "Retrieve Section 500 of the Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act, 2002.",
    expectedBehavior: "ABSTAIN",
  },
  {
    id: "NEG-03",
    category: "Negative Control / Abstention",
    name: "Martian Commercial Code 2049 (Non-Existent Enactment)",
    query: "Retrieve Section 12 of the Martian Commercial Code 2049 regarding extraterrestrial cargo tariffs.",
    expectedBehavior: "ABSTAIN",
  },
  {
    id: "NEG-04",
    category: "Negative Control / Abstention",
    name: "Quantum Teleportation Liability Protocol (Unrelated Domain)",
    query: "Explain the inter-galactic liability protocol for quantum entanglement transport under Indian statutory law.",
    expectedBehavior: "ABSTAIN",
  },

  // ---------------------------------------------------------------------------
  // 8. JURISDICTIONAL BOUNDARY FILTERING (HONEST ABSTENTION)
  // ---------------------------------------------------------------------------
  {
    id: "JURIS-01",
    category: "Jurisdiction Constraint",
    name: "Delhi High Court Order 39 CPC Injunctions",
    query: "Find Delhi High Court decisions discussing the test for interim injunctions under Order XXXIX Rules 1 and 2 of the Code of Civil Procedure.",
    filter: { jurisdiction: "DELHI_HC", sourceTypes: ["JUDICIAL_PRECEDENT"] },
    expectedBehavior: "ABSTAIN",
  },
  {
    id: "JURIS-02",
    category: "Jurisdiction Constraint",
    name: "Bombay High Court Order 39 CPC Injunctions",
    query: "Find Bombay High Court decisions discussing the test for interim injunctions under Order XXXIX Rules 1 and 2 of the Code of Civil Procedure.",
    filter: { jurisdiction: "BOMBAY_HC", sourceTypes: ["JUDICIAL_PRECEDENT"] },
    expectedBehavior: "ABSTAIN",
  },
];

async function runEvaluation() {
  console.log("================================================================================");
  console.log("   CRUVELS LEGAL AI — LAYER 03 COMPREHENSIVE ARCHITECTURAL EVALUATION SUITE");
  console.log("   Database: localhost:55440/kb_cruvels (PostgreSQL)");
  console.log(`   Total Scenarios: ${testCases.length}`);
  console.log("================================================================================\n");

  const repo = new CruvelsKnowledgeRepository();

  let totalTests = testCases.length;
  let passedTests = 0;
  let positiveQueries = 0;
  let negativeQueries = 0;
  let correctAbstentions = 0;
  let irrelevantAtHighConfidence = 0;
  let totalReciprocalRank = 0;
  let totalPrecisionAtK = 0;
  let totalRecallAtK = 0;
  let latencies: number[] = [];

  const resultsByCategory: Record<string, { total: number; passed: number }> = {};

  try {
    for (const testCase of testCases) {
      if (!resultsByCategory[testCase.category]) {
        resultsByCategory[testCase.category] = { total: 0, passed: 0 };
      }
      resultsByCategory[testCase.category].total++;

      const isPositive = testCase.expectedBehavior === "RETRIEVE_EVIDENCE";
      if (isPositive) positiveQueries++;
      else negativeQueries++;

      const t0 = performance.now();
      const res = await repo.search({
        query: testCase.query,
        access: { firmId: "eval-firm", caseId: "eval-case", userId: "eval-user" },
        topK: testCase.topK || 5,
        filter: testCase.filter,
      });
      const elapsed = Math.round((performance.now() - t0) * 100) / 100;
      latencies.push(elapsed);

      let testPassed = false;
      let failureReason = "";

      if (testCase.expectedBehavior === "ABSTAIN") {
        // Must abstain: items should be empty or top relevance < 0.35, and confidence NO_RELEVANT_EVIDENCE
        const correctlyAbstained =
          res.items.length === 0 && res.confidenceState === "NO_RELEVANT_EVIDENCE";
        if (correctlyAbstained) {
          testPassed = true;
          correctAbstentions++;
        } else {
          testPassed = false;
          failureReason = `Failed to abstain! Returned ${res.items.length} items with confidence ${res.confidenceState}.`;
          if (res.confidenceState === "HIGH_CONFIDENCE") {
            irrelevantAtHighConfidence++;
          }
        }
      } else {
        // Positive test: must return grounded evidence
        if (res.items.length === 0) {
          testPassed = false;
          failureReason = `Expected evidence, but returned 0 items (${res.confidenceState}).`;
        } else {
          const topHit = res.items[0];

          // Check document title regex if specified
          const docMatch = testCase.expectedDocRegex
            ? testCase.expectedDocRegex.test(topHit.documentTitle)
            : true;

          // Check keywords in topHit content
          const keywordsMatch = testCase.expectedKeywords
            ? testCase.expectedKeywords.every((kw) => kw.test(topHit.content))
            : true;

          // Check overruled flag if specified
          const overruledMatch =
            testCase.expectedOverruled !== undefined
              ? (topHit.metadata as any)?.isOverruled === testCase.expectedOverruled
              : true;

          // Check confidence calibration
          const confLevelMap: Record<string, number> = {
            HIGH_CONFIDENCE: 3,
            MEDIUM_CONFIDENCE: 2,
            LOW_CONFIDENCE: 1,
            NO_RELEVANT_EVIDENCE: 0,
          };
          const expectedConfNum = confLevelMap[testCase.expectedMinConfidence || "LOW_CONFIDENCE"];
          const actualConfNum = confLevelMap[res.confidenceState] || 0;
          const confMatch = actualConfNum >= expectedConfNum;

          if (docMatch && keywordsMatch && overruledMatch && confMatch) {
            testPassed = true;

            // Reciprocal Rank calculation (rank 1 hit = 1.0)
            totalReciprocalRank += 1.0;
            totalPrecisionAtK += 1.0;
            totalRecallAtK += 1.0;
          } else {
            testPassed = false;
            failureReason = `Mismatch: docMatch=${docMatch}, kwMatch=${keywordsMatch}, overruledMatch=${overruledMatch}, confMatch=${confMatch} (${res.confidenceState} vs ${testCase.expectedMinConfidence})`;
          }
        }
      }

      if (testPassed) {
        passedTests++;
        resultsByCategory[testCase.category].passed++;
        console.log(`  ✅ [${testCase.id}] ${testCase.name} (${elapsed} ms)`);
      } else {
        console.log(`  ❌ [${testCase.id}] ${testCase.name} (${elapsed} ms)`);
        console.log(`     Reason: ${failureReason}`);
      }
    }

    // Metric Computations
    const mrr = Math.round((totalReciprocalRank / positiveQueries) * 100) / 100;
    const precisionAt1 = Math.round((totalPrecisionAtK / positiveQueries) * 100) / 100;
    const recallAt1 = Math.round((totalRecallAtK / positiveQueries) * 100) / 100;
    const abstentionAccuracy = Math.round((correctAbstentions / negativeQueries) * 100) / 100;
    const irrelevantAtHighConfRate = Math.round((irrelevantAtHighConfidence / totalTests) * 100) / 100;

    latencies.sort((a, b) => a - b);
    const avgLatency = Math.round((latencies.reduce((a, b) => a + b, 0) / latencies.length) * 100) / 100;
    const p50 = Math.round(latencies[Math.floor(latencies.length * 0.5)] * 100) / 100;
    const p95 = Math.round(latencies[Math.floor(latencies.length * 0.95)] * 100) / 100;

    console.log("\n================================================================================");
    console.log("   EVALUATION RESULTS BY CATEGORY");
    console.log("================================================================================");
    for (const [cat, stats] of Object.entries(resultsByCategory)) {
      const pct = Math.round((stats.passed / stats.total) * 100);
      console.log(`  - ${cat.padEnd(35)}: ${stats.passed}/${stats.total} passed (${pct}%)`);
    }

    console.log("\n================================================================================");
    console.log("   GLOBAL RETRIEVAL & CALIBRATION METRICS");
    console.log("================================================================================");
    console.log(`  • Overall Accuracy                : ${passedTests}/${totalTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log(`  • Precision@1 (Positive Queries)   : ${(precisionAt1 * 100).toFixed(1)}%`);
    console.log(`  • Recall@1 (Positive Queries)      : ${(recallAt1 * 100).toFixed(1)}%`);
    console.log(`  • Mean Reciprocal Rank (MRR)       : ${mrr.toFixed(3)}`);
    console.log(`  • Negative Control Abstention Rate : ${(abstentionAccuracy * 100).toFixed(1)}% (${correctAbstentions}/${negativeQueries})`);
    console.log(`  • Irrelevant at High Confidence    : ${(irrelevantAtHighConfRate * 100).toFixed(1)}% (${irrelevantAtHighConfidence}/${totalTests})`);
    console.log(`  • Latency Distribution             : avg=${avgLatency}ms | p50=${p50}ms | p95=${p95}ms`);
    console.log("================================================================================\n");

  } finally {
    await repo.close();
  }
}

runEvaluation().catch((err) => {
  console.error("Evaluation error:", err);
  process.exit(1);
});
