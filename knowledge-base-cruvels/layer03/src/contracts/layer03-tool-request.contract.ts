/**
 * CRUVELS AI — Layer 03 to Layer 04 Tool Request Contract (V1)
 *
 * Contract Version: 1.0.0 (IMMUTABLE)
 *
 * Represents structured evidence and retrieval provenance when Layer 03
 * causes, recommends, or contributes to a Layer 04 tool execution.
 *
 * MANDATORY SECURITY INVARIANT (P1 Hardening):
 * Layer 03 evidence provenance is NOT authorization.
 * "Document X is relevant in L03" does NOT imply Layer 04 may access Document X.
 * Layer 04 MUST independently enforce firm membership, matter boundary,
 * document permissions, and quarantine checks before execution.
 */

export interface Layer03CitationMetadata {
  sourceId?: string;
  sourceType?: string;
  actName?: string;
  sectionNumber?: string;
  title?: string;
  pageNumber?: number;
  paragraphIndex?: number;
  uri?: string;
}

export interface Layer03ToolRequestScope {
  firmId: string;
  caseId?: string;
  workspaceId?: string;
  userId?: string;
}

export interface Layer03ToolRequestContractV1 {
  /** Contract Schema Version */
  schemaVersion: "1.0.0";

  /** Global correlation request ID */
  requestId: string;

  /** Layer 03 Retrieval correlation ID */
  retrievalRequestId?: string;

  /** Evidence envelope correlation ID from L03 */
  evidenceEnvelopeId?: string;

  /** Specific evidence IDs supporting this tool invocation */
  evidenceIds?: string[];

  /** Document IDs retrieved or referenced in Layer 03 */
  documentIds?: string[];

  /** Chunk IDs retrieved in Layer 03 */
  chunkIds?: string[];

  /** Citation metadata extracted during L03 retrieval */
  citationMetadata?: Layer03CitationMetadata;

  /** Knowledge source type (e.g. "CASE_DOCUMENT", "BARE_ACT", "PRECEDENT", "REGULATORY") */
  sourceType?: string;

  /** Originating Layer 02 capability (e.g. "LEGAL_RESEARCH", "CASE_INTELLIGENCE") */
  originatingCapability?: string;

  /** Originating task identifier or name */
  originatingTask?: string;

  /** Canonical requested Layer 04 tool operation (e.g. "lookup_bare_act_section", "create_note") */
  requestedOperation: string;

  /** Target tenant/matter scope for the requested tool operation */
  requestedScope: Layer03ToolRequestScope;

  /** Suggested argument payload derived from Layer 03 knowledge */
  suggestedArguments?: Record<string, unknown>;

  /** ISO timestamp of request creation */
  createdAt?: string;
}

/**
 * Type guard for Layer03ToolRequestContractV1
 */
export function isLayer03ToolRequestV1(obj: unknown): obj is Layer03ToolRequestContractV1 {
  if (!obj || typeof obj !== "object") return false;
  const req = obj as Record<string, any>;
  return (
    req.schemaVersion === "1.0.0" &&
    typeof req.requestId === "string" &&
    typeof req.requestedOperation === "string" &&
    req.requestedScope !== undefined &&
    typeof req.requestedScope === "object" &&
    typeof req.requestedScope.firmId === "string"
  );
}
