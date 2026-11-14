/**
 * CRUVELS AI — Layer 03: Knowledge Intelligence & RAG
 *
 * Master barrel exports for Ingestion, Parsing, OCR, Hierarchy & Structure,
 * Legal Structure Chunking, Sparse & Dense Indexing, Hybrid Retrieval,
 * Multi-Tenant Security Filtering, Context Assembly, and Evaluation.
 */

// Master Types, Service, and Module
export * from "./knowledge-intelligence.types";
export * from "./knowledge-intelligence.service";
export * from "./knowledge-intelligence.module";

// Inner Architecture Submodules
export * from "./contracts";
export * from "./corpus";
export * from "./embedding";
export * from "./repository";
export * from "./ingestion";
export * from "./parsing";
export * from "./ocr";
export * from "./structure";
export * from "./chunking";
export * from "./indexing";
export * from "./retrieval";
export * from "./access";
export * from "./context";
export * from "./evaluation";

// Disambiguate duplicate exports
export { MAX_QUERY_LENGTH } from "./retrieval/vector-retrieval.service";
export type { AccessContext, RetrievalFilter } from "./knowledge-intelligence.types";

// Pipelines
export * from "./pipelines/task-a-legal-dataset.service";
export * from "./pipelines/task-b-user-document.service";
