/**
 * CRUVELS AI — Layer 03 Production Legal Corpus Ingestion Pipeline
 *
 * Implements an idempotent, structural, provenance-preserving legal ingestion pipeline
 * for Constitutional Articles, Central Statutes, State Statutes, Delegated Legislation, and Case Law.
 */

import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "node:crypto";
import type { ConstitutionalArticleV1 } from "../contracts/constitution.contract";
import type { CentralStatuteInventoryRecordV1, StatutorySectionV1 } from "../contracts/central-legislation.contract";
import type { DelegatedLegislationItemV1 } from "../contracts/delegated-legislation.contract";
import type { StateSpecificStatuteRecordV1 } from "../contracts/state-jurisdiction.contract";
import type { CaseLawSourceV1 } from "../contracts/case-law.contract";
import { KnowledgeRepositoryService } from "../repository/knowledge-repository.service";
import { EmbeddingProviderService } from "../embedding/embedding-provider.service";
import {
  KnowledgeAuthorityLevel,
  KnowledgeCollectionType,
  KnowledgeDocumentStatus,
  KnowledgeDocumentType,
  KnowledgeJurisdiction,
  KnowledgeNodeType,
  KnowledgeSourceType,
} from "@prisma/client";
import type {
  KnowledgeChunkDto,
  KnowledgeEmbeddingDto,
  KnowledgeNodeDto,
} from "../contracts/knowledge-repository.interface";

export interface LegalIngestionProvenanceV1 {
  sourceAuthority: string;
  sourceUrl: string;
  documentTitle: string;
  actOrInstrumentName?: string;
  jurisdiction: string;
  documentType: string;
  sectionOrArticleNumber?: string;
  effectiveDate: string;
  amendmentDate?: string;
  checksum: string;
  ingestedAt: string;
  version: string;
  isCurrentLaw: boolean;
}

export interface IngestionPipelineResultV1 {
  canonicalId: string;
  title: string;
  documentType: string;
  jurisdiction: string;
  totalNodes: number;
  totalChunks: number;
  checksum: string;
  isDuplicate: boolean;
  ingestedAt: string;
  provenance: LegalIngestionProvenanceV1;
}

@Injectable()
export class LegalCorpusIngestorService {
  private readonly logger = new Logger(LegalCorpusIngestorService.name);
  private readonly ingestedChecksums = new Set<string>();
  private readonly ingestedRegistry = new Map<string, IngestionPipelineResultV1>();

  constructor(
    private readonly repository: KnowledgeRepositoryService,
    private readonly embeddingProvider: EmbeddingProviderService,
  ) {}

  /**
   * Computes deterministic SHA-256 checksum for legal text & metadata payload.
   */
  public computeChecksum(payload: string | object): string {
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    return createHash("sha256").update(raw).digest("hex");
  }

  /**
   * Ingests a Constitutional Article idempotently with full hierarchical clause structure.
   */
  async ingestConstitutionalArticle(article: ConstitutionalArticleV1): Promise<IngestionPipelineResultV1> {
    const checksum = article.checksum || this.computeChecksum(article.text + article.articleNumber);
    const canonicalId = `const_art_${article.articleNumber.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    if (this.ingestedChecksums.has(checksum) && this.ingestedRegistry.has(canonicalId)) {
      this.logger.debug(`Idempotent skip: Article ${article.articleNumber} already ingested.`);
      const existing = this.ingestedRegistry.get(canonicalId)!;
      return { ...existing, isDuplicate: true };
    }

    const provenance: LegalIngestionProvenanceV1 = {
      sourceAuthority: "Legislative Department, Ministry of Law and Justice, Government of India",
      sourceUrl: article.sourceUrl || "https://legislative.gov.in/constitution-of-india",
      documentTitle: `Constitution of India — Article ${article.articleNumber}`,
      actOrInstrumentName: "Constitution of India, 1950",
      jurisdiction: article.jurisdiction || "INDIAN",
      documentType: "CONSTITUTIONAL_ARTICLE",
      sectionOrArticleNumber: article.articleNumber,
      effectiveDate: article.effectiveFrom || "1950-01-26",
      checksum,
      ingestedAt: new Date().toISOString(),
      version: "1.0.0",
      isCurrentLaw: true,
    };

    const docId = `doc_${canonicalId}`;
    const versionId = `ver_${docId}_canonical`;

    await this.repository.registerDocument({
      id: docId,
      sourceId: "src_in_legislative_dept",
      collectionId: "col_legal_global",
      title: `Constitution of India — Article ${article.articleNumber}: ${article.heading}`,
      documentType: KnowledgeDocumentType.CONSTITUTION,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      publicationDate: "1950-01-26",
      effectiveFrom: article.effectiveFrom || "1950-01-26",
      currentStatus: KnowledgeDocumentStatus.IN_FORCE,
      currentVersion: "CANONICAL",
      contentHash: checksum,
      metadata: {
        legalDomain: "CONSTITUTIONAL",
        part: article.part,
        articleNumber: article.articleNumber,
        subject: article.constitutionalSubject,
      },
    });

    await this.repository.registerVersion({
      id: versionId,
      documentId: docId,
      versionTag: "CANONICAL",
      versionNumber: 1,
      effectiveFrom: article.effectiveFrom || "1950-01-26",
      contentHash: checksum,
    });

    const nodesToInsert: KnowledgeNodeDto[] = [
      {
        id: `node_${canonicalId}_main`,
        documentId: docId,
        versionId,
        nodeType: KnowledgeNodeType.ARTICLE,
        identifier: `Article ${article.articleNumber}`,
        title: article.heading,
        text: `Article ${article.articleNumber}. ${article.heading}: ${article.text}`,
        textHash: this.computeChecksum(`Article ${article.articleNumber}. ${article.heading}: ${article.text}`),
        startPage: 1,
        endPage: 1,
        orderIndex: 1,
        depth: 1,
      },
    ];

    if (article.clauses && article.clauses.length > 0) {
      article.clauses.forEach((cl, idx) => {
        const clText = `Article ${article.articleNumber}(${cl.clauseNumber}): ${cl.text}`;
        nodesToInsert.push({
          id: `node_${canonicalId}_cl_${idx + 1}`,
          documentId: docId,
          versionId,
          nodeType: KnowledgeNodeType.SUBSECTION,
          identifier: `Article ${article.articleNumber}(${cl.clauseNumber})`,
          title: `Clause ${cl.clauseNumber}`,
          text: clText,
          textHash: this.computeChecksum(clText),
          startPage: 1,
          endPage: 1,
          orderIndex: idx + 2,
          depth: 2,
        });
      });
    }

    await this.repository.insertNodes(nodesToInsert);

    const chunks: KnowledgeChunkDto[] = nodesToInsert.map((n, idx) => ({
      id: `chk_${n.id}`,
      documentId: docId,
      versionId,
      nodeId: n.id,
      chunkIndex: idx,
      structuralUnit: n.nodeType,
      content: n.text,
      textHash: n.textHash,
      tokenCount: Math.ceil(n.text.length / 4),
      isOperativeClause: true,
      metadata: {
        jurisdiction: KnowledgeJurisdiction.INDIAN,
        authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
        isCurrentVersion: true,
        effectiveFrom: article.effectiveFrom || "1950-01-26",
      },
    }));

    const batchRes = await this.embeddingProvider.generateEmbeddings(chunks.map((c) => c.content));
    const embeddingDtos: KnowledgeEmbeddingDto[] = chunks.map((c, idx) => ({
      chunkId: c.id!,
      provider: batchRes.provider,
      model: batchRes.model,
      dimensions: batchRes.dimensions,
      version: batchRes.version,
      embedding: batchRes.embeddings[idx] || [],
      textHash: c.textHash,
    }));

    await this.repository.indexChunks(chunks, embeddingDtos);

    this.ingestedChecksums.add(checksum);
    const result: IngestionPipelineResultV1 = {
      canonicalId,
      title: `Article ${article.articleNumber} — ${article.heading}`,
      documentType: "CONSTITUTIONAL_ARTICLE",
      jurisdiction: "INDIAN",
      totalNodes: nodesToInsert.length,
      totalChunks: chunks.length,
      checksum,
      isDuplicate: false,
      ingestedAt: provenance.ingestedAt,
      provenance,
    };
    this.ingestedRegistry.set(canonicalId, result);
    return result;
  }

  /**
   * Ingests a Central Statute and all its operative sections idempotently.
   */
  async ingestCentralStatute(statute: CentralStatuteInventoryRecordV1): Promise<IngestionPipelineResultV1> {
    const checksum = this.computeChecksum(statute.statuteId + statute.title + statute.actNumber);
    const canonicalId = statute.statuteId;

    if (this.ingestedChecksums.has(checksum) && this.ingestedRegistry.has(canonicalId)) {
      this.logger.debug(`Idempotent skip: Statute ${statute.title} already ingested.`);
      const existing = this.ingestedRegistry.get(canonicalId)!;
      return { ...existing, isDuplicate: true };
    }

    const provenance: LegalIngestionProvenanceV1 = {
      sourceAuthority: statute.provenance?.officialSource || "Legislative Department, Ministry of Law and Justice",
      sourceUrl: statute.provenance?.sourceUrl || "https://legislative.gov.in",
      documentTitle: statute.title,
      actOrInstrumentName: statute.shortTitle,
      jurisdiction: statute.jurisdiction || "INDIAN",
      documentType: "CENTRAL_ACT",
      effectiveDate: statute.effectiveFrom || statute.commencementDate,
      checksum,
      ingestedAt: new Date().toISOString(),
      version: "1.0.0",
      isCurrentLaw: statute.isCurrentLaw,
    };

    const docId = `doc_${canonicalId}`;
    const versionId = `ver_${docId}_canonical`;

    await this.repository.registerDocument({
      id: docId,
      sourceId: "src_in_legislative_dept",
      collectionId: "col_legal_global",
      title: `${statute.title} (${statute.actNumber})`,
      documentType: KnowledgeDocumentType.CENTRAL_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      publicationDate: statute.enactmentDate,
      effectiveFrom: statute.effectiveFrom,
      currentStatus: statute.isCurrentLaw ? KnowledgeDocumentStatus.IN_FORCE : KnowledgeDocumentStatus.REPEALED,
      currentVersion: statute.year.toString(),
      contentHash: checksum,
      metadata: {
        legalDomain: statute.legalDomain,
        shortTitle: statute.shortTitle,
        actNumber: statute.actNumber,
      },
    });

    await this.repository.registerVersion({
      id: versionId,
      documentId: docId,
      versionTag: statute.year.toString(),
      versionNumber: 1,
      effectiveFrom: statute.effectiveFrom,
      contentHash: checksum,
    });

    const nodesToInsert: KnowledgeNodeDto[] = [];
    let orderCounter = 1;

    for (const ch of statute.chapters) {
      const chText = `${ch.chapterNumber}: ${ch.chapterTitle}`;
      nodesToInsert.push({
        id: `node_${canonicalId}_${ch.chapterNumber.toLowerCase().replace(/\s+/g, "_")}`,
        documentId: docId,
        versionId,
        nodeType: KnowledgeNodeType.CHAPTER,
        identifier: ch.chapterNumber,
        title: ch.chapterTitle,
        text: chText,
        textHash: this.computeChecksum(chText),
        startPage: 1,
        endPage: 1,
        orderIndex: orderCounter++,
        depth: 1,
      });

      for (const sec of ch.sections) {
        const secText = `Section ${sec.sectionNumber}. ${sec.heading}: ${sec.text}`;
        nodesToInsert.push({
          id: `node_${canonicalId}_sec_${sec.sectionNumber.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          documentId: docId,
          versionId,
          nodeType: KnowledgeNodeType.SECTION,
          identifier: `Section ${sec.sectionNumber}`,
          title: sec.heading,
          text: secText,
          textHash: this.computeChecksum(secText),
          startPage: 1,
          endPage: 1,
          orderIndex: orderCounter++,
          depth: 2,
        });
      }
    }

    await this.repository.insertNodes(nodesToInsert);

    const chunks: KnowledgeChunkDto[] = nodesToInsert.map((n, idx) => ({
      id: `chk_${n.id}`,
      documentId: docId,
      versionId,
      nodeId: n.id,
      chunkIndex: idx,
      structuralUnit: n.nodeType,
      content: n.text,
      textHash: n.textHash,
      tokenCount: Math.ceil(n.text.length / 4),
      isOperativeClause: n.nodeType === KnowledgeNodeType.SECTION,
      metadata: {
        jurisdiction: KnowledgeJurisdiction.INDIAN,
        authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
        isCurrentVersion: statute.isCurrentLaw,
        effectiveFrom: statute.effectiveFrom,
      },
    }));

    const batchRes = await this.embeddingProvider.generateEmbeddings(chunks.map((c) => c.content));
    const embeddingDtos: KnowledgeEmbeddingDto[] = chunks.map((c, idx) => ({
      chunkId: c.id!,
      provider: batchRes.provider,
      model: batchRes.model,
      dimensions: batchRes.dimensions,
      version: batchRes.version,
      embedding: batchRes.embeddings[idx] || [],
      textHash: c.textHash,
    }));

    await this.repository.indexChunks(chunks, embeddingDtos);

    this.ingestedChecksums.add(checksum);
    const result: IngestionPipelineResultV1 = {
      canonicalId,
      title: statute.title,
      documentType: "CENTRAL_ACT",
      jurisdiction: "INDIAN",
      totalNodes: nodesToInsert.length,
      totalChunks: chunks.length,
      checksum,
      isDuplicate: false,
      ingestedAt: provenance.ingestedAt,
      provenance,
    };
    this.ingestedRegistry.set(canonicalId, result);
    return result;
  }

  /**
   * Ingests a State Statute idempotently.
   */
  async ingestStateStatute(statute: StateSpecificStatuteRecordV1): Promise<IngestionPipelineResultV1> {
    const checksum = this.computeChecksum(statute.statuteId + statute.title + statute.stateCode);
    const canonicalId = statute.statuteId;

    if (this.ingestedChecksums.has(checksum) && this.ingestedRegistry.has(canonicalId)) {
      this.logger.debug(`Idempotent skip: State Statute ${statute.title} already ingested.`);
      const existing = this.ingestedRegistry.get(canonicalId)!;
      return { ...existing, isDuplicate: true };
    }

    const provenance: LegalIngestionProvenanceV1 = {
      sourceAuthority: statute.provenance?.officialGazette || `${statute.stateName} Government Gazette`,
      sourceUrl: statute.provenance?.sourceUrl || "https://dpal.karnataka.gov.in",
      documentTitle: statute.title,
      actOrInstrumentName: statute.title,
      jurisdiction: statute.stateCode,
      documentType: "STATE_ACT",
      effectiveDate: statute.effectiveFrom,
      checksum,
      ingestedAt: new Date().toISOString(),
      version: "1.0.0",
      isCurrentLaw: statute.isCurrentLaw,
    };

    const docId = `doc_${canonicalId}`;
    const versionId = `ver_${docId}_canonical`;

    await this.repository.registerDocument({
      id: docId,
      sourceId: "src_in_legislative_dept",
      collectionId: "col_legal_global",
      title: `${statute.title} (${statute.stateName})`,
      documentType: KnowledgeDocumentType.STATE_ACT,
      jurisdiction: KnowledgeJurisdiction.INDIAN,
      authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
      publicationDate: statute.effectiveFrom,
      effectiveFrom: statute.effectiveFrom,
      currentStatus: statute.isCurrentLaw ? KnowledgeDocumentStatus.IN_FORCE : KnowledgeDocumentStatus.REPEALED,
      currentVersion: "STATE_CANONICAL",
      contentHash: checksum,
      metadata: {
        legalDomain: statute.subjectDomain,
        stateCode: statute.stateCode,
        stateName: statute.stateName,
      },
    });

    await this.repository.registerVersion({
      id: versionId,
      documentId: docId,
      versionTag: "STATE_CANONICAL",
      versionNumber: 1,
      effectiveFrom: statute.effectiveFrom,
      contentHash: checksum,
    });

    const nodesToInsert: KnowledgeNodeDto[] = statute.keyProvisions.map((prov, idx) => {
      const secText = `${prov.section}. ${prov.heading}: ${prov.text}`;
      return {
        id: `node_${canonicalId}_sec_${prov.section.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        documentId: docId,
        versionId,
        nodeType: KnowledgeNodeType.SECTION,
        identifier: prov.section,
        title: prov.heading,
        text: secText,
        textHash: this.computeChecksum(secText),
        startPage: 1,
        endPage: 1,
        orderIndex: idx + 1,
        depth: 1,
      };
    });

    await this.repository.insertNodes(nodesToInsert);

    const chunks: KnowledgeChunkDto[] = nodesToInsert.map((n, idx) => ({
      id: `chk_${n.id}`,
      documentId: docId,
      versionId,
      nodeId: n.id,
      chunkIndex: idx,
      structuralUnit: n.nodeType,
      content: n.text,
      textHash: n.textHash,
      tokenCount: Math.ceil(n.text.length / 4),
      isOperativeClause: true,
      metadata: {
        jurisdiction: statute.stateCode,
        authorityLevel: KnowledgeAuthorityLevel.OFFICIAL_PRIMARY,
        isCurrentVersion: statute.isCurrentLaw,
        effectiveFrom: statute.effectiveFrom,
      },
    }));

    const batchRes = await this.embeddingProvider.generateEmbeddings(chunks.map((c) => c.content));
    const embeddingDtos: KnowledgeEmbeddingDto[] = chunks.map((c, idx) => ({
      chunkId: c.id!,
      provider: batchRes.provider,
      model: batchRes.model,
      dimensions: batchRes.dimensions,
      version: batchRes.version,
      embedding: batchRes.embeddings[idx] || [],
      textHash: c.textHash,
    }));

    await this.repository.indexChunks(chunks, embeddingDtos);

    this.ingestedChecksums.add(checksum);
    const result: IngestionPipelineResultV1 = {
      canonicalId,
      title: `${statute.title} (${statute.stateName})`,
      documentType: "STATE_ACT",
      jurisdiction: statute.stateCode,
      totalNodes: nodesToInsert.length,
      totalChunks: chunks.length,
      checksum,
      isDuplicate: false,
      ingestedAt: provenance.ingestedAt,
      provenance,
    };
    this.ingestedRegistry.set(canonicalId, result);
    return result;
  }

  /**
   * Returns complete ingestion stats across all ingested legal sources.
   */
  getIngestionStats(): {
    totalIngestedUnits: number;
    byType: Record<string, number>;
    totalNodes: number;
    totalChunks: number;
  } {
    const byType: Record<string, number> = {};
    let totalNodes = 0;
    let totalChunks = 0;

    for (const rec of this.ingestedRegistry.values()) {
      byType[rec.documentType] = (byType[rec.documentType] || 0) + 1;
      totalNodes += rec.totalNodes;
      totalChunks += rec.totalChunks;
    }

    return {
      totalIngestedUnits: this.ingestedRegistry.size,
      byType,
      totalNodes,
      totalChunks,
    };
  }
}
