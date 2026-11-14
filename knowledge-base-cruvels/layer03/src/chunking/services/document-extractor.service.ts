import { Injectable, Logger } from "@nestjs/common";
import { DocumentChunkSourceType } from "@prisma/client";
import { PrismaService } from "../../../../../common/prisma.service";
import type { ExtractedSourceText } from "../document-chunking.types";

@Injectable()
export class DocumentExtractorService {
  private readonly logger = new Logger(DocumentExtractorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dispatches extraction according to sourceType.
   */
  async extractSource(
    sourceType: DocumentChunkSourceType,
    sourceId: string,
  ): Promise<ExtractedSourceText> {
    switch (sourceType) {
      case DocumentChunkSourceType.CASE_DOCUMENT:
        return this.extractCaseDocument(sourceId);
      case DocumentChunkSourceType.CASE_RESOURCE:
        return this.extractCaseResource(sourceId);
      case DocumentChunkSourceType.RESEARCH_MEMO:
        return this.extractResearchMemo(sourceId);
      case DocumentChunkSourceType.KNOWLEDGE_ASSET:
        return this.extractKnowledgeAsset(sourceId);
      case DocumentChunkSourceType.KNOWLEDGE_WIKI_PAGE:
        return this.extractKnowledgeWikiPage(sourceId);
      default:
        return {
          sourceType,
          sourceId,
          firmId: null,
          caseId: null,
          documentId: null,
          rawText: "",
          metadata: {},
          skipped: true,
          skipReason: `UNSUPPORTED_SOURCE_TYPE: ${String(sourceType)}`,
        };
    }
  }

  /**
   * 1. CaseDocument Extraction
   */
  async extractCaseDocument(documentId: string): Promise<ExtractedSourceText> {
    const doc = await this.prisma.caseDocument.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      return {
        sourceType: DocumentChunkSourceType.CASE_DOCUMENT,
        sourceId: documentId,
        firmId: null,
        caseId: null,
        documentId,
        rawText: "",
        metadata: {},
        skipped: true,
        skipReason: "DOCUMENT_NOT_FOUND",
      };
    }

    if (doc.deletedAt) {
      return {
        sourceType: DocumentChunkSourceType.CASE_DOCUMENT,
        sourceId: documentId,
        firmId: doc.firmId,
        caseId: doc.caseId,
        documentId: doc.id,
        rawText: "",
        metadata: {},
        skipped: true,
        skipReason: "DOCUMENT_DELETED",
      };
    }

    if (doc.scanStatus === "quarantined" || doc.scanStatus === "infected") {
      this.logger.warn(`Skipping CaseDocument ${documentId}: infected/quarantined (${doc.scanStatus})`);
      return {
        sourceType: DocumentChunkSourceType.CASE_DOCUMENT,
        sourceId: documentId,
        firmId: doc.firmId,
        caseId: doc.caseId,
        documentId: doc.id,
        rawText: "",
        metadata: {},
        skipped: true,
        skipReason: `SECURITY_SCAN_FLAGGED: ${doc.scanStatus}`,
      };
    }

    const ocrText = (doc.ocrText || "").trim();
    if (!ocrText) {
      return {
        sourceType: DocumentChunkSourceType.CASE_DOCUMENT,
        sourceId: documentId,
        firmId: doc.firmId,
        caseId: doc.caseId,
        documentId: doc.id,
        rawText: "",
        metadata: {
          title: doc.fileName,
          fileName: doc.fileName,
          fileType: doc.fileType,
          ocrStatus: doc.ocrStatus,
        },
        skipped: true,
        skipReason: "NO_OCR_TEXT_AVAILABLE",
      };
    }

    return {
      sourceType: DocumentChunkSourceType.CASE_DOCUMENT,
      sourceId: doc.id,
      firmId: doc.firmId,
      caseId: doc.caseId,
      documentId: doc.id,
      rawText: ocrText,
      metadata: {
        title: doc.fileName,
        fileName: doc.fileName,
        fileType: doc.fileType,
        documentKind: doc.documentKind,
        tags: doc.tags,
        confidentialityLevel: doc.confidentialityLevel,
        approvalStatus: doc.approvalStatus,
        ocrStatus: doc.ocrStatus,
        ocrProvider: doc.ocrProvider,
        ocrConfidence: doc.ocrConfidence,
      },
    };
  }

  /**
   * 2. CaseResource Extraction
   */
  async extractCaseResource(resourceId: string): Promise<ExtractedSourceText> {
    const res = await this.prisma.caseResource.findUnique({
      where: { id: resourceId },
    });

    if (!res) {
      return {
        sourceType: DocumentChunkSourceType.CASE_RESOURCE,
        sourceId: resourceId,
        firmId: null,
        caseId: null,
        documentId: null,
        rawText: "",
        metadata: {},
        skipped: true,
        skipReason: "RESOURCE_NOT_FOUND",
      };
    }

    if (res.deletedAt) {
      return {
        sourceType: DocumentChunkSourceType.CASE_RESOURCE,
        sourceId: resourceId,
        firmId: res.firmId,
        caseId: res.caseId,
        documentId: null,
        rawText: "",
        metadata: {},
        skipped: true,
        skipReason: "RESOURCE_DELETED",
      };
    }

    const metadata = (res.metadata && typeof res.metadata === "object" ? res.metadata : {}) as Record<string, unknown>;
    const extractedContent =
      typeof metadata.content === "string" ? metadata.content :
      typeof metadata.text === "string" ? metadata.text :
      typeof metadata.body === "string" ? metadata.body :
      typeof metadata.description === "string" ? metadata.description :
      typeof metadata.summary === "string" ? metadata.summary : "";

    const combinedText = [res.title, extractedContent].filter(Boolean).join("\n\n").trim();

    if (!combinedText) {
      return {
        sourceType: DocumentChunkSourceType.CASE_RESOURCE,
        sourceId: resourceId,
        firmId: res.firmId,
        caseId: res.caseId,
        documentId: null,
        rawText: "",
        metadata: { title: res.title, resourceType: res.resourceType },
        skipped: true,
        skipReason: "NO_RESOURCE_CONTENT_AVAILABLE",
      };
    }

    const documentId = res.externalRefType === "CaseDocument" && res.externalRefId ? res.externalRefId : null;

    return {
      sourceType: DocumentChunkSourceType.CASE_RESOURCE,
      sourceId: res.id,
      firmId: res.firmId,
      caseId: res.caseId,
      documentId,
      rawText: combinedText,
      metadata: {
        title: res.title,
        resourceType: res.resourceType,
        lifecycleState: res.lifecycleState,
        workspaceScope: res.workspaceScope,
        visibilityTier: res.visibilityTier,
        externalRefType: res.externalRefType,
        externalRefId: res.externalRefId,
      },
    };
  }

  /**
   * 3. ResearchMemo Extraction
   */
  async extractResearchMemo(memoId: string): Promise<ExtractedSourceText> {
    const memo = await this.prisma.researchMemo.findUnique({
      where: { id: memoId },
    });

    if (!memo) {
      return {
        sourceType: DocumentChunkSourceType.RESEARCH_MEMO,
        sourceId: memoId,
        firmId: null,
        caseId: null,
        documentId: null,
        rawText: "",
        metadata: {},
        skipped: true,
        skipReason: "MEMO_NOT_FOUND",
      };
    }

    if (memo.deletedAt) {
      return {
        sourceType: DocumentChunkSourceType.RESEARCH_MEMO,
        sourceId: memoId,
        firmId: memo.firmId,
        caseId: memo.caseId,
        documentId: null,
        rawText: "",
        metadata: {},
        skipped: true,
        skipReason: "MEMO_DELETED",
      };
    }

    const combinedText = [
      memo.title ? `Title: ${memo.title}` : "",
      memo.summary ? `Summary: ${memo.summary}` : "",
      memo.content || "",
    ].filter(Boolean).join("\n\n").trim();

    if (!combinedText) {
      return {
        sourceType: DocumentChunkSourceType.RESEARCH_MEMO,
        sourceId: memoId,
        firmId: memo.firmId,
        caseId: memo.caseId,
        documentId: null,
        rawText: "",
        metadata: { title: memo.title, memoType: memo.memoType },
        skipped: true,
        skipReason: "EMPTY_MEMO_CONTENT",
      };
    }

    return {
      sourceType: DocumentChunkSourceType.RESEARCH_MEMO,
      sourceId: memo.id,
      firmId: memo.firmId,
      caseId: memo.caseId,
      documentId: null,
      rawText: combinedText,
      metadata: {
        title: memo.title,
        memoType: memo.memoType,
        practiceArea: memo.practiceArea,
        jurisdiction: memo.jurisdiction,
        tags: memo.tags,
        qualityStatus: memo.qualityStatus,
        citations: memo.citations,
      },
    };
  }

  /**
   * 4. KnowledgeAsset Extraction
   */
  async extractKnowledgeAsset(assetId: string): Promise<ExtractedSourceText> {
    const asset = await this.prisma.knowledgeAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return {
        sourceType: DocumentChunkSourceType.KNOWLEDGE_ASSET,
        sourceId: assetId,
        firmId: null,
        caseId: null,
        documentId: null,
        rawText: "",
        metadata: {},
        skipped: true,
        skipReason: "ASSET_NOT_FOUND",
      };
    }

    if (asset.deletedAt) {
      return {
        sourceType: DocumentChunkSourceType.KNOWLEDGE_ASSET,
        sourceId: assetId,
        firmId: asset.firmId,
        caseId: asset.caseId,
        documentId: asset.documentId,
        rawText: "",
        metadata: {},
        skipped: true,
        skipReason: "ASSET_DELETED",
      };
    }

    const combinedText = [
      asset.title ? `Title: ${asset.title}` : "",
      asset.description ? `Description: ${asset.description}` : "",
      asset.content || "",
    ].filter(Boolean).join("\n\n").trim();

    if (!combinedText) {
      return {
        sourceType: DocumentChunkSourceType.KNOWLEDGE_ASSET,
        sourceId: assetId,
        firmId: asset.firmId,
        caseId: asset.caseId,
        documentId: asset.documentId,
        rawText: "",
        metadata: { title: asset.title, assetType: asset.assetType },
        skipped: true,
        skipReason: "EMPTY_ASSET_CONTENT",
      };
    }

    return {
      sourceType: DocumentChunkSourceType.KNOWLEDGE_ASSET,
      sourceId: asset.id,
      firmId: asset.firmId,
      caseId: asset.caseId,
      documentId: asset.documentId,
      rawText: combinedText,
      metadata: {
        title: asset.title,
        assetType: asset.assetType,
        practiceArea: asset.practiceArea,
        jurisdiction: asset.jurisdiction,
        tags: asset.tags,
        qualityStatus: asset.qualityStatus,
        departmentId: asset.departmentId,
      },
    };
  }

  /**
   * 5. KnowledgeWikiPage Extraction
   */
  async extractKnowledgeWikiPage(wikiId: string): Promise<ExtractedSourceText> {
    const wiki = await this.prisma.knowledgeWikiPage.findUnique({
      where: { id: wikiId },
    });

    if (!wiki) {
      return {
        sourceType: DocumentChunkSourceType.KNOWLEDGE_WIKI_PAGE,
        sourceId: wikiId,
        firmId: null,
        caseId: null,
        documentId: null,
        rawText: "",
        metadata: {},
        skipped: true,
        skipReason: "WIKI_PAGE_NOT_FOUND",
      };
    }

    if (wiki.deletedAt) {
      return {
        sourceType: DocumentChunkSourceType.KNOWLEDGE_WIKI_PAGE,
        sourceId: wikiId,
        firmId: wiki.firmId,
        caseId: null,
        documentId: null,
        rawText: "",
        metadata: {},
        skipped: true,
        skipReason: "WIKI_PAGE_DELETED",
      };
    }

    const combinedText = [
      wiki.title ? `Title: ${wiki.title}` : "",
      wiki.content || "",
    ].filter(Boolean).join("\n\n").trim();

    if (!combinedText) {
      return {
        sourceType: DocumentChunkSourceType.KNOWLEDGE_WIKI_PAGE,
        sourceId: wikiId,
        firmId: wiki.firmId,
        caseId: null,
        documentId: null,
        rawText: "",
        metadata: { title: wiki.title, pageType: wiki.pageType },
        skipped: true,
        skipReason: "EMPTY_WIKI_CONTENT",
      };
    }

    return {
      sourceType: DocumentChunkSourceType.KNOWLEDGE_WIKI_PAGE,
      sourceId: wiki.id,
      firmId: wiki.firmId,
      caseId: null,
      documentId: null,
      rawText: combinedText,
      metadata: {
        title: wiki.title,
        pageType: wiki.pageType,
        practiceArea: wiki.practiceArea,
        tags: wiki.tags,
        qualityStatus: wiki.qualityStatus,
        departmentId: wiki.departmentId,
      },
    };
  }
}
