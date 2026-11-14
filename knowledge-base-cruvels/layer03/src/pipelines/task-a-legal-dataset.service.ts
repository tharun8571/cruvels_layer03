import { Injectable, Logger } from "@nestjs/common";
import { DocumentChunkSourceType } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma.service";

export interface LegalDatasetItem {
  type: "JUDGMENT" | "ACT" | "REGULATION" | "SECTION";
  title: string;
  court?: string;
  bench?: string;
  date?: string;
  citation?: string;
  actsApplied?: string[];
  sectionsApplied?: string[];
  content: string;
  ratioDecidendi?: string;
  obiterDicta?: string;
  jurisdiction?: string;
}

export interface LegalDatasetProcessingResult {
  sourceId: string;
  title: string;
  entitiesExtracted: {
    acts: string[];
    sections: string[];
    courts: string[];
    judges: string[];
    citations: string[];
  };
  chunkCount: number;
  indexedAt: string;
}

/**
 * Task A Pipeline — Legal Dataset -> Structured DB -> General Legal Knowledge Base.
 * Designed for modular extension and iterative development by interns/engineers.
 */
@Injectable()
export class TaskALegalDatasetService {
  private readonly logger = new Logger(TaskALegalDatasetService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parses, cleans, extracts entities, and prepares structured legal dataset documents.
   */
  async processLegalDatasetItem(item: LegalDatasetItem): Promise<LegalDatasetProcessingResult> {
    this.logger.log(`Processing Legal Dataset item: ${item.title} (${item.type})`);

    // 1. Entity Extraction Heuristics (acts, sections, citations)
    const actMatches = item.content.match(/(?:The\s+)?([A-Z][A-Za-z\s]+Act(?:,\s*\d{4})?)/g) || [];
    const sectionMatches = item.content.match(/Section\s+\d+[A-Za-z]*/gi) || [];
    const citationMatches = item.content.match(/\b(?:\d{4}\s+SCC\s+\d+|\d{4}\s+AIR\s+[A-Z\s]+\d+)\b/g) || [];

    const entities = {
      acts: Array.from(new Set([...(item.actsApplied || []), ...actMatches])).slice(0, 10),
      sections: Array.from(new Set([...(item.sectionsApplied || []), ...sectionMatches])).slice(0, 15),
      courts: item.court ? [item.court] : [],
      judges: item.bench ? [item.bench] : [],
      citations: Array.from(new Set([...(item.citation ? [item.citation] : []), ...citationMatches])).slice(0, 10),
    };

    return {
      sourceId: `dataset-${Date.now()}`,
      title: item.title,
      entitiesExtracted: entities,
      chunkCount: Math.ceil(item.content.length / 800),
      indexedAt: new Date().toISOString(),
    };
  }
}
