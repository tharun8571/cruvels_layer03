import { Injectable } from "@nestjs/common";
import type { LegalChunk, LegalDocumentKind, LegalStructuralUnitType } from "../knowledge-intelligence.types";

export interface MetadataFilterParams {
  firmId: string;
  caseId?: string;
  documentIds?: string[];
  version?: string;
  isCurrentVersion?: boolean;
  documentKind?: LegalDocumentKind;
  structuralUnits?: LegalStructuralUnitType[];
  section?: string;
  isOperativeOnly?: boolean;
}

@Injectable()
export class MetadataIndexService {
  private readonly chunkStore = new Map<string, LegalChunk>();
  private readonly byFirm = new Map<string, Set<string>>();
  private readonly byCase = new Map<string, Set<string>>();
  private readonly byDoc = new Map<string, Set<string>>();
  private readonly byVersion = new Map<string, Set<string>>();

  /**
   * Indexes a LegalChunk and updates metadata inverted indexes.
   */
  indexChunk(chunk: LegalChunk, firmId: string, caseId?: string): void {
    this.removeChunk(chunk.chunkId);

    this.chunkStore.set(chunk.chunkId, chunk);

    // Firm index
    if (!this.byFirm.has(firmId)) this.byFirm.set(firmId, new Set());
    this.byFirm.get(firmId)!.add(chunk.chunkId);

    // Case index
    if (caseId) {
      if (!this.byCase.has(caseId)) this.byCase.set(caseId, new Set());
      this.byCase.get(caseId)!.add(chunk.chunkId);
    }

    // Doc index
    if (!this.byDoc.has(chunk.documentId)) this.byDoc.set(chunk.documentId, new Set());
    this.byDoc.get(chunk.documentId)!.add(chunk.chunkId);

    // Version index
    const vKey = `${chunk.documentId}:${chunk.version}`;
    if (!this.byVersion.has(vKey)) this.byVersion.set(vKey, new Set());
    this.byVersion.get(vKey)!.add(chunk.chunkId);
  }

  removeChunk(chunkId: string): void {
    const chunk = this.chunkStore.get(chunkId);
    if (!chunk) return;

    this.chunkStore.delete(chunkId);

    for (const set of this.byFirm.values()) set.delete(chunkId);
    for (const set of this.byCase.values()) set.delete(chunkId);
    for (const set of this.byDoc.values()) set.delete(chunkId);
    for (const set of this.byVersion.values()) set.delete(chunkId);
  }

  /**
   * Fast candidate pre-filtering.
   */
  filter(params: MetadataFilterParams): LegalChunk[] {
    const firmSet = this.byFirm.get(params.firmId);
    if (!firmSet || firmSet.size === 0) return [];

    let candidateIds = Array.from(firmSet);

    if (params.caseId) {
      const caseSet = this.byCase.get(params.caseId);
      if (!caseSet) return [];
      candidateIds = candidateIds.filter((id) => caseSet.has(id));
    }

    if (params.documentIds && params.documentIds.length > 0) {
      const docAllow = new Set<string>();
      for (const dId of params.documentIds) {
        const dSet = this.byDoc.get(dId);
        if (dSet) {
          for (const id of dSet) docAllow.add(id);
        }
      }
      candidateIds = candidateIds.filter((id) => docAllow.has(id));
    }

    const results: LegalChunk[] = [];
    for (const id of candidateIds) {
      const chunk = this.chunkStore.get(id);
      if (!chunk) continue;

      if (params.version && chunk.version !== params.version) continue;
      if (params.isCurrentVersion !== undefined && chunk.isCurrentVersion !== params.isCurrentVersion) continue;
      if (params.structuralUnits && !params.structuralUnits.includes(chunk.structuralUnit)) continue;
      if (params.section && chunk.section !== params.section) continue;
      if (params.isOperativeOnly && !chunk.isOperativeClause) continue;

      results.push(chunk);
    }

    return results;
  }

  getChunk(chunkId: string): LegalChunk | undefined {
    return this.chunkStore.get(chunkId);
  }

  clear(): void {
    this.chunkStore.clear();
    this.byFirm.clear();
    this.byCase.clear();
    this.byDoc.clear();
    this.byVersion.clear();
  }
}
