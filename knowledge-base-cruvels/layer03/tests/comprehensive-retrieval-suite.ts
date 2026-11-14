import { CruvelsKnowledgeRepository } from "../src/repository/cruvels-knowledge.repository.js";
import fs from "node:fs";
import path from "node:path";

export interface TestCaseDefinition {
  id: string;
  category: "DIRECT" | "INDIRECT" | "SCENARIO" | "PARAPHRASED" | "INVALID_SECTION";
  query: string;
  expected: {
    expectMatch: boolean;
    expectedSection?: string;
    expectedActKeywords?: string[];
    expectedConfidence?: "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "LOW_CONFIDENCE" | "NO_RELEVANT_EVIDENCE";
  };
}

export const TEST_CASES: TestCaseDefinition[] = [
  // ---------------------------------------------------------------------------
  // 1. DIRECT QUERIES (Explicit Act and Section)
  // ---------------------------------------------------------------------------
  {
    id: "DIR-01",
    category: "DIRECT",
    query: "Section 27 of The Indian Contract Act, 1872",
    expected: {
      expectMatch: true,
      expectedSection: "27",
      expectedActKeywords: ["Contract"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "DIR-02",
    category: "DIRECT",
    query: "Section 138 of Negotiable Instruments Act, 1881",
    expected: {
      expectMatch: true,
      expectedSection: "138",
      expectedActKeywords: ["Negotiable", "Instruments"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "DIR-03",
    category: "DIRECT",
    query: "Section 35 of Bharatiya Nagarik Suraksha Sanhita, 2023",
    expected: {
      expectMatch: true,
      expectedSection: "35",
      expectedActKeywords: ["Nagarik", "Suraksha"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "DIR-04",
    category: "DIRECT",
    query: "Section 9 Arbitration and Conciliation Act, 1996",
    expected: {
      expectMatch: true,
      expectedSection: "9",
      expectedActKeywords: ["Arbitration"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "DIR-05",
    category: "DIRECT",
    query: "Section 106 Transfer of Property Act, 1882",
    expected: {
      expectMatch: true,
      expectedSection: "106",
      expectedActKeywords: ["Transfer", "Property"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "DIR-06",
    category: "DIRECT",
    query: "Section 318 Bharatiya Nyaya Sanhita, 2023",
    expected: {
      expectMatch: true,
      expectedSection: "318",
      expectedActKeywords: ["Nyaya", "Sanhita"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },

  // ---------------------------------------------------------------------------
  // 2. INDIRECT QUERIES (Conceptual legal descriptions without section numbers)
  // ---------------------------------------------------------------------------
  {
    id: "IND-01",
    category: "INDIRECT",
    query: "statutory provision declaring agreements in restraint of trade to be void",
    expected: {
      expectMatch: true,
      expectedSection: "27",
      expectedActKeywords: ["Contract"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "IND-02",
    category: "INDIRECT",
    query: "statutory offence and criminal penalties for dishonour of cheque due to insufficient funds",
    expected: {
      expectMatch: true,
      expectedSection: "138",
      expectedActKeywords: ["Negotiable", "Instruments"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "IND-03",
    category: "INDIRECT",
    query: "statutory powers of police officer to arrest without an order or warrant from a magistrate",
    expected: {
      expectMatch: true,
      expectedSection: "35",
      expectedActKeywords: ["Nagarik", "Suraksha"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "IND-04",
    category: "INDIRECT",
    query: "interim measures and protection granted by court before or during arbitral proceedings",
    expected: {
      expectMatch: true,
      expectedSection: "9",
      expectedActKeywords: ["Arbitration"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "IND-05",
    category: "INDIRECT",
    query: "statutory notice requirement for termination of a monthly lease of immovable property",
    expected: {
      expectMatch: true,
      expectedSection: "106",
      expectedActKeywords: ["Transfer", "Property"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "IND-06",
    category: "INDIRECT",
    query: "statutory penal provision for cheating and dishonestly inducing delivery of property",
    expected: {
      expectMatch: true,
      expectedSection: "318",
      expectedActKeywords: ["Nyaya", "Sanhita"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },

  // ---------------------------------------------------------------------------
  // 3. SCENARIO-BASED QUERIES (Detailed factual narratives)
  // ---------------------------------------------------------------------------
  {
    id: "SCN-01",
    category: "SCENARIO",
    query: "A software engineer leaves a technology firm and joins a competitor. The former employer threatens legal action based on a clause preventing the engineer from working for any competitor in India for two years after resignation. Assess enforceability and retrieve the primary governing statutory provision.",
    expected: {
      expectMatch: true,
      expectedSection: "27",
      expectedActKeywords: ["Contract"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "SCN-02",
    category: "SCENARIO",
    query: "A wholesale supplier delivered goods against a post-dated cheque. The bank returned the cheque dishonoured with a memo stating 'insufficient funds'. The supplier issued a formal statutory notice demanding payment within 15 days, which was received but ignored. Identify the primary statutory penal provision.",
    expected: {
      expectMatch: true,
      expectedSection: "138",
      expectedActKeywords: ["Negotiable", "Instruments"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "SCN-03",
    category: "SCENARIO",
    query: "A person accused of a cognizable offence carrying up to 3 years imprisonment is threatened with immediate custodial arrest without a magistrate warrant. The police officer has not recorded reasons in writing. What statutory section governs police arrest powers?",
    expected: {
      expectMatch: true,
      expectedSection: "35",
      expectedActKeywords: ["Nagarik", "Suraksha"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "SCN-04",
    category: "SCENARIO",
    query: "A joint venture partner discovers that the co-venturer is actively attempting to sell off underlying machinery before the arbitral tribunal is formally constituted. The claimant files an urgent application before the High Court seeking interim injunction and preservation of assets. What statutory provision applies?",
    expected: {
      expectMatch: true,
      expectedSection: "9",
      expectedActKeywords: ["Arbitration"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "SCN-05",
    category: "SCENARIO",
    query: "A commercial landlord wishes to terminate a month-to-month tenancy of immovable property where no period was specified in the lease contract. What statutory notice period is required under Indian property law?",
    expected: {
      expectMatch: true,
      expectedSection: "106",
      expectedActKeywords: ["Transfer", "Property"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },

  // ---------------------------------------------------------------------------
  // 4. PARAPHRASED QUERIES (Synonyms, non-standard terminology)
  // ---------------------------------------------------------------------------
  {
    id: "PAR-01",
    category: "PARAPHRASED",
    query: "negative covenant preventing an ex-employee from practicing their lawful profession or business",
    expected: {
      expectMatch: true,
      expectedSection: "27",
      expectedActKeywords: ["Contract"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "PAR-02",
    category: "PARAPHRASED",
    query: "customer issued a payment instrument to settle an invoice but the bank refused to honour it because the account did not have enough money",
    expected: {
      expectMatch: true,
      expectedSection: "138",
      expectedActKeywords: ["Negotiable", "Instruments"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "PAR-03",
    category: "PARAPHRASED",
    query: "police officer authority to apprehend a person without court permission or arrest warrant",
    expected: {
      expectMatch: true,
      expectedSection: "35",
      expectedActKeywords: ["Nagarik", "Suraksha"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "PAR-04",
    category: "PARAPHRASED",
    query: "temporary emergency judicial protection and preservation of subject matter prior to arbitration",
    expected: {
      expectMatch: true,
      expectedSection: "9",
      expectedActKeywords: ["Arbitration"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },
  {
    id: "PAR-05",
    category: "PARAPHRASED",
    query: "fifteen days written eviction notice to tenant for month to month tenancy of immovable property",
    expected: {
      expectMatch: true,
      expectedSection: "106",
      expectedActKeywords: ["Transfer", "Property"],
      expectedConfidence: "HIGH_CONFIDENCE",
    },
  },

  // ---------------------------------------------------------------------------
  // 5. INVALID SECTION QUERIES (Hallucination traps / Non-existent sections)
  // ---------------------------------------------------------------------------
  {
    id: "INV-01",
    category: "INVALID_SECTION",
    query: "Section 99999 of the Indian Contract Act, 1872",
    expected: {
      expectMatch: false,
      expectedConfidence: "NO_RELEVANT_EVIDENCE",
    },
  },
  {
    id: "INV-02",
    category: "INVALID_SECTION",
    query: "Section 88888 of the Negotiable Instruments Act, 1881",
    expected: {
      expectMatch: false,
      expectedConfidence: "NO_RELEVANT_EVIDENCE",
    },
  },
  {
    id: "INV-03",
    category: "INVALID_SECTION",
    query: "Section 77777 of the Bharatiya Nagarik Suraksha Sanhita, 2023",
    expected: {
      expectMatch: false,
      expectedConfidence: "NO_RELEVANT_EVIDENCE",
    },
  },
  {
    id: "INV-04",
    category: "INVALID_SECTION",
    query: "Section 55555 of the Transfer of Property Act, 1882",
    expected: {
      expectMatch: false,
      expectedConfidence: "NO_RELEVANT_EVIDENCE",
    },
  },
  {
    id: "INV-05",
    category: "INVALID_SECTION",
    query: "Section 44444 of the Arbitration and Conciliation Act, 1996",
    expected: {
      expectMatch: false,
      expectedConfidence: "NO_RELEVANT_EVIDENCE",
    },
  },
];

async function runTestSuite() {
  console.log("================================================================================");
  console.log("   CRUVELS LAYER 03 — COMPREHENSIVE RETRIEVAL BENCHMARK SUITE");
  console.log("   Evaluation: Direct, Indirect, Scenario, Paraphrased, and Invalid Sections");
  console.log("================================================================================\n");

  const resultsDir = path.resolve(process.cwd(), "test-results");
  const casesDir = path.resolve(resultsDir, "test_cases");
  fs.mkdirSync(casesDir, { recursive: true });

  const repo = new CruvelsKnowledgeRepository();
  const summaryResults: any[] = [];
  let passedCount = 0;
  let totalCount = TEST_CASES.length;

  console.log(`Running ${totalCount} comprehensive test cases across 5 categories...\n`);

  for (const tc of TEST_CASES) {
    const startTime = performance.now();
    // Run retrieval
    const res = await repo.search({
      query: tc.query,
      topK: 5,
      filter: { jurisdiction: "INDIAN", status: "IN_FORCE" },
    });
    const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

    let passed = false;
    let failureReason = "";

    if (!tc.expected.expectMatch) {
      // Invalid section: must return 0 items and NO_RELEVANT_EVIDENCE
      if (res.items.length === 0 && res.confidenceState === "NO_RELEVANT_EVIDENCE") {
        passed = true;
      } else {
        failureReason = `Expected 0 items and NO_RELEVANT_EVIDENCE, but got ${res.items.length} items with ${res.confidenceState}`;
      }
    } else {
      // Valid query: check top hit
      if (res.items.length === 0) {
        failureReason = `Expected section ${tc.expected.expectedSection}, but got 0 items returned`;
      } else {
        const topHit = res.items[0];
        const sectionMatches = topHit.section === tc.expected.expectedSection;
        const actMatches = !tc.expected.expectedActKeywords || tc.expected.expectedActKeywords.every((kw) =>
          topHit.documentTitle?.toLowerCase().includes(kw.toLowerCase()) ||
          topHit.title?.toLowerCase().includes(kw.toLowerCase())
        );

        if (sectionMatches && actMatches) {
          passed = true;
        } else {
          failureReason = `Top hit mismatch: Expected Section ${tc.expected.expectedSection} (${tc.expected.expectedActKeywords?.join(" ")}), got Section ${topHit.section} (${topHit.documentTitle})`;
        }
      }
    }

    if (passed) passedCount++;

    const topHit = res.items[0] || null;
    const resultRecord = {
      testId: tc.id,
      category: tc.category,
      status: passed ? "PASS" : "FAIL",
      query: tc.query,
      latencyMs,
      expected: tc.expected,
      actual: {
        totalScanned: res.totalScanned,
        retrievedCount: res.retrievedCount,
        confidenceState: res.confidenceState,
        topHit: topHit
          ? {
              documentTitle: topHit.documentTitle,
              section: topHit.section,
              title: topHit.title,
              score: topHit.score,
              authorityLevel: topHit.authorityLevel,
              snippet: (topHit.content || "").slice(0, 150).replace(/\n/g, " "),
            }
          : null,
      },
      failureReason: failureReason || null,
    };

    summaryResults.push(resultRecord);

    // Save individual test case JSON
    const caseFilePath = path.resolve(casesDir, `${tc.id}.json`);
    fs.writeFileSync(
      caseFilePath,
      JSON.stringify(
        {
          input: {
            testId: tc.id,
            category: tc.category,
            query: tc.query,
            expected: tc.expected,
          },
          actualOutput: res,
          evaluation: {
            passed,
            latencyMs,
            failureReason: failureReason || null,
          },
        },
        null,
        2
      ),
      "utf-8"
    );

    const mark = passed ? "✅ PASS" : "❌ FAIL";
    console.log(
      `[${tc.id}] [${tc.category.padEnd(15)}] ${mark} | Latency: ${latencyMs.toString().padStart(6)} ms | Top Hit: ${
        topHit ? `${topHit.documentTitle} § ${topHit.section}` : "(No match - expected)"
      }`
    );
    if (!passed) {
      console.log(`       Reason: ${failureReason}`);
    }
  }

  // Verification Round 2: Deterministic Consistency Repeat Test on Sample of Queries
  console.log("\n--------------------------------------------------------------------------------");
  console.log("▶ CONSISTENCY & DETERMINISM VERIFICATION (Repeating 5 random test queries)...");
  console.log("--------------------------------------------------------------------------------");

  const repeatIds = ["DIR-01", "IND-02", "SCN-03", "PAR-04", "INV-01"];
  let consistencyPass = true;

  for (const id of repeatIds) {
    const tc = TEST_CASES.find((t) => t.id === id)!;
    const res1 = await repo.search({ query: tc.query, topK: 5 });
    const res2 = await repo.search({ query: tc.query, topK: 5 });

    const top1 = res1.items[0]?.section || "NONE";
    const top2 = res2.items[0]?.section || "NONE";
    const same = top1 === top2 && res1.confidenceState === res2.confidenceState && res1.items.length === res2.items.length;

    if (!same) consistencyPass = false;
    console.log(`  [Consistency] ${tc.id}: ${same ? "✅ IDENTICAL (100% Deterministic)" : "❌ DRIFT DETECTED"}`);
  }

  console.log("--------------------------------------------------------------------------------\n");

  const finalSummary = {
    suiteName: "Cruvels Layer 03 Comprehensive Retrieval Benchmark",
    timestamp: new Date().toISOString(),
    totalTests: totalCount,
    passed: passedCount,
    failed: totalCount - passedCount,
    passRate: `${Math.round((passedCount / totalCount) * 100)}%`,
    consistencyVerified: consistencyPass,
    categories: {
      DIRECT: summaryResults.filter((r) => r.category === "DIRECT" && r.status === "PASS").length + " / " + summaryResults.filter((r) => r.category === "DIRECT").length,
      INDIRECT: summaryResults.filter((r) => r.category === "INDIRECT" && r.status === "PASS").length + " / " + summaryResults.filter((r) => r.category === "INDIRECT").length,
      SCENARIO: summaryResults.filter((r) => r.category === "SCENARIO" && r.status === "PASS").length + " / " + summaryResults.filter((r) => r.category === "SCENARIO").length,
      PARAPHRASED: summaryResults.filter((r) => r.category === "PARAPHRASED" && r.status === "PASS").length + " / " + summaryResults.filter((r) => r.category === "PARAPHRASED").length,
      INVALID_SECTION: summaryResults.filter((r) => r.category === "INVALID_SECTION" && r.status === "PASS").length + " / " + summaryResults.filter((r) => r.category === "INVALID_SECTION").length,
    },
    results: summaryResults,
  };

  const summaryFilePath = path.resolve(resultsDir, "test_summary.json");
  fs.writeFileSync(summaryFilePath, JSON.stringify(finalSummary, null, 2), "utf-8");

  console.log("================================================================================");
  console.log(`   OVERALL BENCHMARK RESULT: ${passedCount}/${totalCount} PASSED (${finalSummary.passRate})`);
  console.log(`   Consistency Verification: ${consistencyPass ? "100% CONSISTENT" : "FAILED"}`);
  console.log(`   📁 Summary Saved: ${summaryFilePath}`);
  console.log(`   📁 Individual Cases Saved in: ${casesDir}`);
  console.log("================================================================================\n");

  await repo.close();

  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});

