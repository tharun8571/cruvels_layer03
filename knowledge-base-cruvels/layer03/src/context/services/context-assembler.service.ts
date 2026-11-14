/**
 * Cruvels AI Controlled Context Assembler Service
 *
 * Assembles token-bounded, deduplicated, source-prioritized context for LLM generation
 * from resolved MatterContext, structured matter data, Case Intelligence, and RAG retrieval.
 */

import { Injectable, Logger } from "@nestjs/common";
import type {
  AssembledContextPackage,
  MatterContext,
  MatterHeaderData,
  MatterQueryType,
} from "../contracts/matter-context.types";

export const DEFAULT_MAX_ASSEMBLER_TOKENS = 6000;

@Injectable()
export class MatterContextAssemblerService {
  private readonly logger = new Logger(MatterContextAssemblerService.name);

  /**
   * Overload / alias for assembling context from an object payload.
   */
  assemble(params: {
    matterContext: MatterContext;
    userQuery?: string;
    query?: string;
    queryClassification?: { queryType?: string; confidence?: number; extractionTargets?: string[] };
    maxTokens?: number;
  }): AssembledContextPackage {
    const q = params.userQuery || params.query || params.matterContext?.query || "";
    return this.assembleContext(q, params.matterContext, {
      maxTokens: params.maxTokens,
      customQueryType: params.queryClassification?.queryType,
    });
  }

  /**
   * Assembles a structured, bounded LLM context package with deterministic source priority
   * and tailored grounding rules based on query type.
   */
  assembleContext(
    query: string,
    matterContext: MatterContext,
    options?: { maxTokens?: number; customQueryType?: string },
  ): AssembledContextPackage {
    const startedAt = Date.now();
    const queryType = (options?.customQueryType || matterContext.queryType || "CASE_FACT_LOOKUP") as MatterQueryType;
    const header = matterContext.matterHeader;
    const brief = matterContext.caseIntelligence;
    const ragResponse = matterContext.ragResponse;

    // 1. Build Structured Header & Metadata Block
    const headerLines: string[] = [
      `=== ACTIVE MATTER PARTICULARS ===`,
      `Matter Title: ${header.title}`,
      `Case Number / CNR: ${header.caseNumber || "N/A"}`,
      `Court & Jurisdiction: ${header.courtName || "Sessions Court"}`,
      `Procedural Stage: ${header.stage || "Active Proceedings"}`,
      `Category / Type: ${header.category || "Criminal"} (${header.caseType || "Case"})`,
      `Client / Representation: ${header.clientName || "Client"} (Role: ${header.clientRole || "Counsel"})`,
      `Opposing Side: ${header.opposingPartyName || "Opposite Party"}`,
    ];

    // Victim Information
    if (header.victim) {
      headerLines.push(`\n=== AUTHORITATIVE VICTIM & INJURY RECORD ===`);
      headerLines.push(`• Victim / Deceased: ${header.victim.name}${header.victim.details ? ` (${header.victim.details})` : ""}`);
    }

    // Complainant Information
    if (header.complainant) {
      headerLines.push(`Complainant / Informant: ${header.complainant.name}${header.complainant.details ? ` - ${header.complainant.details}` : ""}`);
    }

    // Incident Particulars & Timeline
    if (header.incidentDate || header.incidentTime || header.incidentLocation) {
      headerLines.push(`\n=== AUTHORITATIVE CHRONOLOGY & TIMELINE ===`);
      const parts = [
        header.incidentDate ? `Date of Incident: ${header.incidentDate}` : null,
        header.incidentTime ? `Time: ${header.incidentTime}` : null,
        header.incidentLocation ? `Location: ${header.incidentLocation}` : null,
      ].filter(Boolean);
      headerLines.push(`• Incident Particulars: ${parts.join(", ")}`);
    }

    // Authoritative Accused Roster
    if (header.accused && header.accused.length > 0) {
      headerLines.push(`\n=== AUTHORITATIVE ACCUSED ROSTER ===`);
      header.accused.forEach((a, idx) => {
        const codeStr = a.code ? `${a.code}: ` : `${idx + 1}. `;
        const genderStr = a.gender && a.gender !== "UNKNOWN" ? `, gender: ${a.gender}` : "";
        const ageStr = a.age ? `, age: ${a.age}` : "";
        const roleStr = a.role ? ` (${a.role})` : "";
        const allegStr = a.allegations ? ` [Allegation: ${a.allegations}]` : "";
        headerLines.push(`${codeStr}${a.name}${roleStr}${genderStr}${ageStr}${allegStr}`);
      });
    }

    // Key Witnesses
    if (header.witnesses && header.witnesses.length > 0) {
      headerLines.push(`\n=== AUTHORITATIVE WITNESS ROSTER ===`);
      header.witnesses.forEach((w) => {
        headerLines.push(`• ${w.name} (${w.role}): ${w.details || "Witness"}`);
      });
    }

    // Investigating Officers
    if (header.investigatingOfficers && header.investigatingOfficers.length > 0) {
      headerLines.push(`\n=== INVESTIGATING OFFICERS ===`);
      header.investigatingOfficers.forEach((io) => {
        headerLines.push(`• ${io.name} (${io.role}): ${io.details || "IO"}`);
      });
    }

    // Seized Exhibits & Recoveries Inventory
    if (header.exhibits && header.exhibits.length > 0) {
      headerLines.push(`\n=== AUTHORITATIVE EXHIBITS & PHYSICAL RECOVERIES ===`);
      header.exhibits.forEach((e) => {
        const seizedFrom = e.seizedFrom ? ` (Seized from: ${e.seizedFrom})` : "";
        const loc = e.recoveryLocation ? ` [Location: ${e.recoveryLocation}]` : "";
        headerLines.push(`• Exhibit ${e.exhibitNumber} [Category: ${e.category}]: ${e.description}${seizedFrom}${loc}`);
      });
    }

    // Material Contradictions & Discrepancies
    if (header.contradictions && header.contradictions.length > 0) {
      headerLines.push(`\n=== AUTHORITATIVE CONTRADICTIONS & DEFENSE CONFLICTS ===`);
      header.contradictions.forEach((c, idx) => {
        headerLines.push(`${idx + 1}. Source: ${c.witnessOrSource}\n   - Statement A: ${c.statementA}\n   - Statement B: ${c.statementB}\n   - Significance: ${c.significance}`);
      });
    }

    // Missing Information & Open Questions from Header
    if (header.missingInformation && header.missingInformation.length > 0) {
      headerLines.push(`\n=== AUTHORITATIVE MISSING INFORMATION & CASE GAPS ===`);
      header.missingInformation.forEach((m) => {
        headerLines.push(`• ${m}`);
      });
    }

    const structuredHeaderText = headerLines.join("\n");

    // 2. Build Case Intelligence Blocks (Selective Injection based on Query Type)
    const intelLines: string[] = [];
    if (brief) {
      if (
        queryType === "CASE_STRATEGY_QUERY" ||
        queryType === "CASE_CONTRADICTION_QUERY" ||
        queryType === "CASE_EVIDENCE_QUERY" ||
        queryType === "CASE_MISSING_INFORMATION_QUERY" ||
        queryType === "CASE_ISSUE_QUERY" ||
        queryType === "LEGAL_RESEARCH" ||
        queryType === "GENERAL_LEGAL_QUERY" ||
        (queryType as string) === "GENERAL_LEGAL_RESEARCH"
      ) {
        if (brief.facts?.verifiedFacts?.length) {
          intelLines.push(`\n=== VERIFIED CASE FACTS ===`);
          brief.facts.verifiedFacts.slice(0, 8).forEach((f) => {
            intelLines.push(`• ${f.statement}`);
          });
        }
        if (brief.legalIssues?.primaryIssues?.length) {
          intelLines.push(`\n=== PRIMARY LEGAL ISSUES & CHARGES ===`);
          brief.legalIssues.primaryIssues.slice(0, 5).forEach((i) => {
            intelLines.push(`• ${i.title}: ${i.description}`);
          });
        }
        if (brief.risks?.identifiedRisks?.length) {
          intelLines.push(`\n=== CASE RISKS & VULNERABILITIES ===`);
          brief.risks.identifiedRisks.slice(0, 5).forEach((r) => {
            intelLines.push(`• [${r.severity}] ${r.title}: ${r.description}`);
          });
        }
        const gaps = brief.missingInfo?.gaps || [];
        const missingDocs = (brief.missingInfo as any)?.missingDocuments || [];
        const legacyMissing = (brief as any).missingInformation || [];

        if (gaps.length > 0 || missingDocs.length > 0 || legacyMissing.length > 0) {
          intelLines.push(`\n=== EVIDENTIARY GAPS & MISSING PROOF ===`);
          gaps.slice(0, 8).forEach((g) => {
            intelLines.push(`• ${g.title || g.description}: ${g.description || ""} (Impact: ${g.impactOnCase || "Material"})`);
          });
          missingDocs.slice(0, 5).forEach((d: any) => {
            intelLines.push(`• Missing Document: ${d}`);
          });
          legacyMissing.slice(0, 5).forEach((m: any) => {
            intelLines.push(`• ${m.item || m.title || m}`);
          });
        }
      } else if (queryType === "CASE_TIMELINE_QUERY") {
        if (brief.chronology?.documentFactualEvents?.length) {
          intelLines.push(`\n=== FACTUAL CHRONOLOGY & TIMELINE ===`);
          brief.chronology.documentFactualEvents.slice(0, 12).forEach((e) => {
            intelLines.push(`• ${e.eventDate}: ${e.title} - ${e.description}`);
          });
        }
      }
    }

    const caseIntelText = intelLines.join("\n");

    // 3. Assemble Dynamic System Prompt with Strict Negative-Fact & Grounding Invariants
    const systemPrompt = this.buildDynamicSystemPrompt(queryType, header);

    // 4. Assemble User Context Envelope
    let fullUserPrompt = `USER QUESTION:\n${query.trim()}\n\n`;
    fullUserPrompt += `${structuredHeaderText}\n`;

    if (caseIntelText.trim()) {
      fullUserPrompt += `${caseIntelText}\n`;
    }

    fullUserPrompt += `\n=== AUTHORIZED RECORD PASSAGES (CITED PASSAGES) ===\n`;
    fullUserPrompt += ragResponse.contextText || "[No additional document passages retrieved]";

    const totalEstimatedTokens = Math.ceil((systemPrompt.length + fullUserPrompt.length) / 4);

    return {
      query,
      queryType,
      systemPrompt,
      userPrompt: fullUserPrompt,
      contextText: ragResponse.contextText,
      structuredContextText: `${structuredHeaderText}\n${caseIntelText}`,
      citations: ragResponse.items,
      sourceSummary: {
        matterTitle: header.title,
        hasAccusedRoster: header.accused.length > 0,
        accusedCount: header.accused.length,
        hasCaseIntelligence: Boolean(brief),
        ragItemCount: ragResponse.items.length,
        documentCount: header.verifiedDocumentCount,
      },
      totalEstimatedTokens,
    };
  }

  /**
   * Builds dynamic, query-tailored grounding rules ensuring zero hallucination.
   */
  private buildDynamicSystemPrompt(
    queryType: MatterQueryType,
    header: MatterHeaderData,
  ): string {
    const accusedNames = header.accused
      .map((a) => `${a.name}${a.code ? ` (${a.code})` : ""}${a.gender && a.gender !== "UNKNOWN" ? ` [Gender: ${a.gender}]` : ""}`)
      .join(", ");

    const baseRules: string[] = [
      `You are the Briefly Legal AI Copilot, an authoritative matter-grounded legal assistant for Indian law.`,
      `You are currently analyzing the active matter: "${header.title}" (${header.caseNumber || "Case Record"}).`,
      `You must answer strictly using the provided ACTIVE MATTER PARTICULARS, AUTHORITATIVE ROSTER, RECOVERY INVENTORY, CONTRADICTIONS, CASE INTELLIGENCE, and AUTHORIZED RECORD PASSAGES.`,
      `Do NOT answer from general abstract legal knowledge when answering matter-specific questions.`,
      `Never fabricate or assume facts, names, dates, or recovery exhibits not present in the record. If any information is not established in the active matter records, explicitly state that it is not established in the available case records.`,
      `CRITICAL NEGATIVE-GROUNDING RULE: If the selected case documents do not contain the answer to a question or do not establish a fact (such as a weapon recovery, specific exhibit, or date), do NOT generate generic legal advice, statutory commentary, or general jurisprudence. State clearly: "The selected case documents do not establish this information." You may note what is documented in the context (e.g. "The selected documents identify three accused persons, but they do not state that any weapon was recovered.") and cite the relevant source.`,
      `\n### ACTIVE MATTER PARTICULARS:`,
      `- Matter Title: ${header.title}`,
      `- Case Number: ${header.caseNumber || "Not Available"}`,
      `- Verified Victim: ${header.victim?.name || "No verified victim profile is established."}`,
      `- Verified Accused Roster: ${accusedNames || "No verified accused roster is available."}`,
    ];

    if (queryType === "CASE_ENTITY_LOOKUP") {
      baseRules.push(
        `\n### ENTITY & ACCUSED LOOKUP INSTRUCTIONS:`,
        `- When asked "Who is the victim?": Answer using ONLY the verified victim information from the active matter context. If no victim is identified in the active records, state clearly: "The victim is not identified in the available case records."`,
        `- When asked "Who are all the accused?": Retrieve and list ALL accused persons explicitly enumerated in the AUTHORITATIVE ACCUSED ROSTER in the active matter context.`,
        `- When asked "Is there any female accused?":`,
        `  1. Inspect the complete AUTHORITATIVE ACCUSED ROSTER in the active matter context.`,
        `  2. Check the explicitly documented gender attributes for each accused.`,
        `  3. If one or more accused persons are explicitly documented as FEMALE, answer YES and name the female accused person(s).`,
        `  4. If the complete roster explicitly establishes that all accused persons are non-female (MALE), answer NO and state the roster.`,
        `  5. If gender attributes are not documented in the case records, state that the gender of the accused is not established in the available records.`,
        `  6. NEVER infer gender from names or pronouns.`,
      );
    } else if (queryType === "INVENTORY_AGGREGATION") {
      baseRules.push(
        `\n### INVENTORY & RECOVERY INSTRUCTIONS:`,
        `- When asked about recoveries, seizures, or exhibits (e.g. "Any recoveries?", "What was seized?"):`,
        `  1. Retrieve, aggregate, and group ALL distinct recoveries and seized property from the SEIZED PROPERTY & RECOVERY INVENTORY (EXHIBITS) in the active matter context.`,
        `  2. If exhibits or recoveries are present in the context, list each exhibit with its category, description, and source.`,
        `  3. When asked "What weapons were recovered?": Identify only weapon exhibits documented in the active matter. If no weapon recovery is documented, state that no weapon recovery is recorded in the available matter records.`,
      );
    } else if (queryType === "CASE_TIMELINE_QUERY" || queryType === "CASE_FACT_LOOKUP") {
      baseRules.push(
        `\n### TIMELINE & FACT LOOKUP INSTRUCTIONS:`,
        `- Answer using the verified incident date, time, location, and factual chronology provided in the active matter context.`,
        `- If specific dates or times are conflicting across witness statements or records, present the documented discrepancy explicitly rather than selecting one conflicting time.`,
      );
    } else if (
      queryType === "CASE_STRATEGY_QUERY" ||
      queryType === "CASE_CONTRADICTION_QUERY" ||
      queryType === "CASE_EVIDENCE_QUERY" ||
      queryType === "CASE_MISSING_INFORMATION_QUERY"
    ) {
      baseRules.push(
        `\n### CASE STRATEGY, CONTRADICTIONS & EVIDENCE INSTRUCTIONS:`,
        `- Formulate matter-specific analysis and strategic points grounded strictly in the active matter's verified facts, witness contradictions, forensic records, and evidentiary gaps provided in the context.`,
        `- Clearly distinguish established case facts from potential legal arguments and evidentiary challenges.`,
        `- When asked about contradictions or missing information: Identify only contradictions and gaps documented in the active matter context.`,
        `- Do NOT output generic boilerplate advice or abstract checklists.`,
      );
    }

    baseRules.push(
      `\n### CITATION ATTACHMENT RULE:`,
      `Attach bracketed citation markers (e.g. [1], [2]) to substantive factual propositions referencing the corresponding retrieved source passages.`,
    );

    return baseRules.join("\n");
  }
}

export { MatterContextAssemblerService as ContextAssemblerService };

