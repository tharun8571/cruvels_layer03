import { CruvelsKnowledgeRepository } from "./repository/cruvels-knowledge.repository.js";
import fs from "node:fs";

async function main() {
  let raw = "";
  let outputPath: string | null = null;
  const args = process.argv.slice(2);
  let inputFile: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out" && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (!inputFile) {
      inputFile = args[i];
    }
  }

  if (inputFile) {
    if (fs.existsSync(inputFile)) {
      raw = fs.readFileSync(inputFile, "utf-8").trim();
    } else {
      raw = inputFile;
    }
  } else {
    // Read from stdin if piped or redirected
    try {
      raw = fs.readFileSync(0, "utf-8").trim();
    } catch {
      raw = "";
    }
  }

  let input: any;
  if (raw) {
    try {
      input = JSON.parse(raw);
    } catch {
      input = { query: raw };
    }
  } else {
    input = {
      query: "Retrieve the exact text of Section 50 of the Code of Criminal Procedure, 1973 as it stood on 2023-12-31. Return that provision, not merely the Act title.",
      access: {
        firmId: "qa-firm-001",
        caseId: "qa-matter-01",
        userId: "qa-user-01",
        roles: ["ASSOCIATE"],
        workspaceId: "qa-workspace-01",
      },
      topK: 5,
      filter: {
        jurisdiction: "INDIAN",
        asOfDate: "2023-12-31",
        status: "IN_FORCE",
        sourceTypes: ["STATUTORY_CODE"],
      },
    };
  }

  const repo = new CruvelsKnowledgeRepository();
  try {
    const res = await repo.search(input);
    const jsonOutput = JSON.stringify(res, null, 2);
    if (outputPath) {
      fs.writeFileSync(outputPath, jsonOutput, "utf-8");
      console.log(`Saved output to ${outputPath}`);
    } else {
      console.log(jsonOutput);
    }
  } finally {
    await repo.close();
  }
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
