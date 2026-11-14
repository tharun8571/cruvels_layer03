/**
 * CRUVELS AI — Layer 03 Retrieval Policy Gate Service
 *
 * Implements the mandatory pre-retrieval policy gate.
 * Strictly separates context binding from knowledge requirement and retrieval policy.
 * Standalone legal questions (contextBinding: NONE) with legal knowledge requirement
 * require authoritative legal retrieval from central legal databases.
 */

import { Injectable, Logger } from "@nestjs/common";
import type { RequestUnderstandingContractV1 } from "../../01-request-understanding/contracts/request-understanding-contract.v1";
import type { RequestUnderstandingResult } from "../../01-request-understanding/request-understanding.types";
import type { TaskContractV1 } from "../../02-orchestrator/contracts/task-contract.v1";
import type { AccessContext } from "../knowledge-intelligence.types";
import type {
  EvidenceBudgetV1,
  RetrievalDecisionV1,
  RetrievalModeV1,
  RetrievalScopeV1,
  VersionPolicyV1,
} from "../contracts/retrieval-contract.v1";

@Injectable()
export class RetrievalPolicyService {
  private readonly logger = new Logger(RetrievalPolicyService.name);

  /**
   * Evaluates the retrieval policy given Layer 01 understanding and Layer 02 task context.
   */
  public evaluatePolicy(params: {
    l1Contract?: RequestUnderstandingContractV1 | RequestUnderstandingResult;
    taskContract?: TaskContractV1;
    access: AccessContext;
    overrideQuery?: string;
  }): RetrievalDecisionV1 {
    const l1 = params.l1Contract;
    const task = params.taskContract;
    const access = params.access;

    const query = params.overrideQuery || (l1 ? (l1 as any).normalizedQuery || (l1 as any).rawQuery : "") || "";
    const lower = query.toLowerCase();

    // 1. Build Scope (Authorized Universe)
    const scope: RetrievalScopeV1 = {
      tenantId: access.firmId,
      firmId: access.firmId,
      workspaceId: access.workspaceId,
      userId: access.userId,
      caseId: access.caseId,
      matterId: access.caseId,
      documentIds: access.allowedDocumentIds,
      isSuperAdmin: access.isSuperAdmin,
    };

    // 2. Extract Knowledge Requirement and Context Binding
    const knowledgeRequirement =
      (l1 as any)?.knowledgeRequirement?.type ||
      (l1 as any)?.knowledgeRequirement ||
      "GENERAL_KNOWLEDGE";

    const contextBinding =
      (l1 as any)?.contextBinding?.type ||
      (l1 as any)?.contextBinding ||
      "NONE";

    const legalIntentCategory = (l1 as any)?.intent?.category || (l1 as any)?.legalIntentCategory;
    const userGoal = (l1 as any)?.intent?.userGoal || (l1 as any)?.userGoal;
    const domain = (l1 as any)?.intent?.domain || (l1 as any)?.domain;

    // 3. Evaluate Version Policy & Temporal Aspects
    let versionPolicy: VersionPolicyV1 = "CURRENT_VERSION";
    let targetDate: string | undefined = undefined;

    if (/\b(?:compare\s+(?:versions?|v1|v2|amendments?)|across\s+versions?)\b/i.test(lower)) {
      versionPolicy = "COMPARE_VERSIONS";
    } else if (/\b(?:before\s+amendment|prior\s+version|old\s+agreement|v1\.0|version\s+1)\b/i.test(lower)) {
      versionPolicy = "SPECIFIC_VERSION";
    } else if (/\b(?:on|as\s+of|prior\s+to|at)\s+(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{4}-\d{2}-\d{2})\b/i.test(lower)) {
      versionPolicy = "VERSION_AT_DATE";
      const dateMatch = lower.match(/(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{4}-\d{2}-\d{2})/i);
      targetDate = dateMatch ? dateMatch[1] : undefined;
    }

    // 4. Hard Gate Check: Is Retrieval Required?
    // Note: contextBinding === "NONE" MUST NOT disable legal retrieval!
    const isExplicitlyDisabled = (l1 as any)?.isExecutable === false || (l1 as any)?.requiresClarification === true;
    const isGeneralKnowledge = knowledgeRequirement === "GENERAL_KNOWLEDGE" || knowledgeRequirement === "NONE" || domain === "general";
    const isToolQuery = knowledgeRequirement === "TOOL_REQUIRED" || legalIntentCategory === "TOOL_QUERY";

    if (isExplicitlyDisabled || isGeneralKnowledge || isToolQuery) {
      const skippedReason = isExplicitlyDisabled
        ? "EXPLICIT_EXECUTION_BLOCKED_OR_CLARIFICATION_REQUIRED"
        : isGeneralKnowledge
        ? "SKIPPED_GENERAL_KNOWLEDGE_QUERY"
        : "SKIPPED_REALTIME_TOOL_QUERY";

      const defaultEvidenceBudget: EvidenceBudgetV1 = {
        primaryEvidenceLimit: 0,
        contextEvidenceLimit: 0,
        maxEvidenceTokens: 0,
      };

      return {
        required: false,
        mode: "NONE",
        sourceTypes: [],
        scope,
        targets: [],
        filters: [],
        maxResults: 0,
        evidenceBudget: defaultEvidenceBudget,
        versionPolicy,
        targetDate,
        reason: `Retrieval gate blocked retrieval: ${skippedReason}. Query requires no external/authoritative evidence lookup.`,
        skippedReason,
        knowledgeRequirement,
        contextBinding,
        evidenceRequirement: "NONE",
        groundingRequirement: isGeneralKnowledge ? "PERMITTED_MODEL_KNOWLEDGE" : "TOOL_OUTPUT",
        authorityLevel: "NONE",
        isCurrentnessRequired: false,
        isEvidenceMandatory: false,
      };
    }

    // 5. Determine Retrieval Mode, Targets & Sources based on Knowledge Domain and Grounding
    let mode: RetrievalModeV1 = "HYBRID";
    const targets: string[] = [];
    let sourceTypes: string[] = [];
    let evidenceRequirement = "MANDATORY_AUTHORITATIVE";
    let groundingRequirement = "GROUNDED_IN_EVIDENCE";
    let authorityLevel = "MANDATORY_AUTHORITATIVE";
    let isCurrentnessRequired = true;
    let isEvidenceMandatory = true;

    const isStructuralTarget =
      legalIntentCategory === "DOCUMENT_EXTRACTION" ||
      /\b(?:section\s+[0-9A-Z]+(?:\.[0-9A-Z]+)*|clause\s+[0-9A-Z]+(?:\.[0-9A-Z]+)*|article\s+[0-9A-Z]+|schedule\s+[0-9A-Z]+)\b/i.test(lower);

    if (knowledgeRequirement === "DOCUMENT_GROUNDED" || contextBinding === "ACTIVE_DOCUMENT" || contextBinding === "USER_PROVIDED_DOCUMENT") {
      mode = isStructuralTarget ? "STRUCTURAL" : "HYBRID";
      sourceTypes = ["ACTIVE_CONTRACT", "USER_DOCUMENT"];
      evidenceRequirement = "MANDATORY_DOCUMENT";
      groundingRequirement = "DOCUMENT_GROUNDED";
      authorityLevel = "MANDATORY_DOCUMENT";
      if (isStructuralTarget) {
        const matches = lower.match(/\b(?:section\s+[0-9a-z]+(?:\.[0-9a-z]+)*|clause\s+[0-9a-z]+(?:\.[0-9a-z]+)*|article\s+[0-9a-z]+|schedule\s+[0-9a-z]+)\b/gi);
        if (matches) targets.push(...matches);
      }
    } else if (knowledgeRequirement === "CASE_GROUNDED" || knowledgeRequirement === "MATTER_GROUNDED" || contextBinding === "ACTIVE_MATTER") {
      mode = "HYBRID";
      sourceTypes = ["CASE_MATTER_RECORDS"];
      evidenceRequirement = "MANDATORY_MATTER";
      groundingRequirement = "MATTER_GROUNDED";
      authorityLevel = "MANDATORY_MATTER";
    } else if (legalIntentCategory === "CASE_LAW_RESEARCH" || userGoal === "case_law_research") {
      mode = "HYBRID";
      sourceTypes = ["CASE_LAW_DB", "AUTHORITATIVE_LEGAL_CORPUS"];
      evidenceRequirement = "MANDATORY_AUTHORITATIVE";
      groundingRequirement = "CASE_LAW_GROUNDED";
      authorityLevel = "MANDATORY_AUTHORITATIVE";
    } else if (legalIntentCategory === "STATUTORY_RESEARCH" || userGoal === "statute_lookup") {
      mode = "HYBRID";
      sourceTypes = ["STATUTORY_DB", "AUTHORITATIVE_LEGAL_CORPUS"];
      evidenceRequirement = "MANDATORY_AUTHORITATIVE";
      groundingRequirement = "STATUTORY_GROUNDED";
      authorityLevel = "MANDATORY_AUTHORITATIVE";
    } else {
      // Default Legal Knowledge / Legal Problem Guidance
      mode = "HYBRID";
      sourceTypes = ["STATUTORY_DB", "AUTHORITATIVE_LEGAL_CORPUS"];
      evidenceRequirement = "MANDATORY_AUTHORITATIVE";
      groundingRequirement = "GROUNDED_IN_EVIDENCE";
      authorityLevel = "MANDATORY_AUTHORITATIVE";
    }

    // 6. Calibrate Evidence Budget
    const evidenceBudget: EvidenceBudgetV1 = isStructuralTarget
      ? {
          primaryEvidenceLimit: 2,
          contextEvidenceLimit: 2,
          maxEvidenceTokens: 1500,
        }
      : {
          primaryEvidenceLimit: 5,
          contextEvidenceLimit: 4,
          maxEvidenceTokens: 4000,
        };

    return {
      required: true,
      mode,
      sourceTypes,
      scope,
      targets,
      filters: [],
      maxResults: evidenceBudget.primaryEvidenceLimit + evidenceBudget.contextEvidenceLimit,
      evidenceBudget,
      versionPolicy,
      targetDate,
      reason: `Authorized retrieval approved for ${knowledgeRequirement} using ${mode} retrieval mode (sources: ${sourceTypes.join(", ")}).`,
      knowledgeRequirement,
      contextBinding,
      evidenceRequirement,
      groundingRequirement,
      authorityLevel,
      isCurrentnessRequired,
      isEvidenceMandatory,
    };
  }
}

export { RetrievalPolicyService as RetrievalPolicyDecisionService };

