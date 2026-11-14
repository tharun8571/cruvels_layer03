/**
 * CRUVELS LEGAL AI — LAYER 03 INTERACTIVE QUERY CLI
 *
 * Direct terminal tool to query the Cruvels Canonical Knowledge Base (PostgreSQL localhost:55440)
 * using Layer 03 Retrieval, Stare Decisis Treatment Graph, and Evidence Envelope formulation.
 *
 * Usage:
 *   npm run query "Section 318 Bharatiya Nyaya Sanhita"
 *   npm run query "ADM Jabalpur"
 *   npm run query "Section 438 CrPC"
 */

import { CruvelsKnowledgeRepository } from "./repository/cruvels-knowledge.repository.js";

async function main() {
  const queryArg = process.argv.slice(2).join(" ").trim();
  const query = queryArg || "Section 318 Bharatiya Nyaya Sanhita";

  console.log("\n================================================================================");
  console.log("   CRUVELS LEGAL AI — LAYER 03 RETRIEVAL ENGINE");
  console.log("   Truth of Source: PostgreSQL Database (kb_cruvels @ localhost:55440)");
  console.log("================================================================================");
  console.log(`🔍 Query: "${query}"\n`);

  const repo = new CruvelsKnowledgeRepository();

  try {
    const start = performance.now();
    const envelope = await repo.retrieveEvidence({ query, topK: 5 });
    const latency = Math.round((performance.now() - start) * 100) / 100;

    console.log(`⏱  Retrieved ${envelope.length} evidence items in ${latency} ms\n`);

    envelope.forEach((item, index) => {
      console.log(`────────────────────────────────────────────────────────────────────────────────`);
      console.log(`[Item #${index + 1}] ${item.title}`);
      console.log(`  • Evidence ID     : ${item.evidenceId}`);
      console.log(`  • Authority Level : ${item.authorityLevel} (Weight: ${item.authorityScore}x)`);
      console.log(`  • Retrieval Method: ${item.retrievalMethod}`);
      console.log(`  • SHA-256 Hash    : ${item.textHash}`);
      console.log(`  • Operative Law   : ${item.isOperative ? "YES" : "NO"}`);

      if (item.metadata.isOverruled) {
        console.log(`  ⚠️  STATUS          : OVERRULED PRECEDENT (NOT GOOD LAW)`);
      } else if (item.metadata.goodLaw) {
        console.log(`  ⚖️  STATUS          : ACTIVE GOOD LAW`);
      }

      console.log(`\n  Content Preview:`);
      const lines = item.content.split("\n").slice(0, 8);
      lines.forEach((line) => console.log(`    ${line}`));
      if (item.content.split("\n").length > 8) {
        console.log(`    ... [truncated ${item.content.length - 300} bytes]`);
      }
      console.log();
    });

    console.log("================================================================================\n");
  } finally {
    await repo.close();
  }
}

main().catch((err) => {
  console.error("Query execution error:", err);
  process.exit(1);
});
