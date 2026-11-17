import { Injectable } from "@nestjs/common";
import type { EvidenceCitation, LegalChunk } from "../knowledge-intelligence.types";

@Injectable()
export class CitationBuilderService {
  /**
   * Generates a standardized legal citation for a chunk.
   * e.g. "[MSA v2.0, § 8.2 at Page 4]" or "[Schedule B, § B.1 at Page 1]"
   */
  buildCitation(chunk: LegalChunk, index: number): EvidenceCitation {
    const citationNumber = index + 1;
    const citationId = `[${citationNumber}]`;

    const docName = chunk.documentName || chunk.documentId;
    const verSuffix = chunk.version ? ` v${chunk.version}` : "";
    const pagePart = `Page ${chunk.pageNumber}`;

    let secPart = "";
    if (chunk.section) {
      secPart = `, § ${chunk.section}`;
    } else if (chunk.clause) {
      secPart = `, Cl. ${chunk.clause}`;
    } else if (chunk.schedule) {
      secPart = `, Sched. ${chunk.schedule}`;
    } else if (chunk.annexure) {
      secPart = `, Annex. ${chunk.annexure}`;
    } else if (chunk.exhibit) {
      secPart = `, Exh. ${chunk.exhibit}`;
    }

    const formattedCitation = `[${docName}${verSuffix}${secPart} at ${pagePart}]`;

    return {
      citationNumber,
      citationId,
      documentId: chunk.documentId,
      documentName: docName,
      version: chunk.version,
      isCurrentVersion: chunk.isCurrentVersion,
      pageNumber: chunk.pageNumber,
      section: chunk.section,
      clause: chunk.clause,
      schedule: chunk.schedule,
      formattedCitation,
      contentHash: chunk.contentHash,
      isScanned: (chunk.ocrConfidence !== undefined && chunk.ocrConfidence < 0.8),
      ocrQualityWarning: chunk.ocrQualityWarning || (chunk.ocrConfidence !== undefined && chunk.ocrConfidence < 0.8),
    };
  }

  /**
   * Formats a collection of citations into a bibliography footer.
   */
  formatCitationList(citations: EvidenceCitation[]): string {
    if (citations.length === 0) return "";
    return citations
      .map((c) => `${c.citationId} ${c.formattedCitation} (SHA-256: ${c.contentHash.slice(0, 12)}...)`)
      .join("\n");
  }
}
