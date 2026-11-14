/**
 * CRUVELS AI — Layer 03 Constitution Structure Detector
 *
 * Specialised AST parser for the Constitution of India.
 * Preserves Parts, Chapters, Articles, Clauses, Subclauses, Provisos, Explanations, and Schedules.
 */

import { Injectable } from "@nestjs/common";
import type {
  ConstitutionalArticleV1,
  ConstitutionalClauseV1,
  ConstitutionalHierarchyNodeV1,
} from "../contracts/constitution.contract";

@Injectable()
export class ConstitutionStructureDetector {
  /**
   * Explodes a constitutional article into hierarchical nodes for deep structural indexing.
   */
  decomposeArticle(article: ConstitutionalArticleV1): ConstitutionalHierarchyNodeV1[] {
    const nodes: ConstitutionalHierarchyNodeV1[] = [];
    const baseBreadcrumb = `Constitution of India > ${article.part}: ${article.partTitle}${article.chapter ? ` > ${article.chapter}: ${article.chapterTitle}` : ""} > Article ${article.articleNumber}`;

    // 1. Article-level root node
    nodes.push({
      nodeId: `node_const_art_${article.articleNumber}`,
      part: article.part,
      partTitle: article.partTitle,
      chapter: article.chapter,
      chapterTitle: article.chapterTitle,
      articleNumber: article.articleNumber,
      heading: article.heading,
      fullBreadcrumb: baseBreadcrumb,
      text: `Article ${article.articleNumber}. ${article.heading}\n${article.text}`,
      provenance: article.provenance,
    });

    // 2. Clause-level nodes if structured clauses exist
    if (article.clauses && article.clauses.length > 0) {
      for (const cl of article.clauses) {
        const clauseBreadcrumb = `${baseBreadcrumb} > Clause ${cl.clauseNumber}`;
        nodes.push({
          nodeId: `node_const_art_${article.articleNumber}_cl_${cl.clauseNumber.replace(/[^\w]/g, "")}`,
          part: article.part,
          partTitle: article.partTitle,
          chapter: article.chapter,
          chapterTitle: article.chapterTitle,
          articleNumber: article.articleNumber,
          clauseIdentifier: cl.clauseNumber,
          heading: `${article.heading} - Clause ${cl.clauseNumber}`,
          fullBreadcrumb: clauseBreadcrumb,
          text: `Article ${article.articleNumber}${cl.clauseNumber}: ${cl.text}`,
          provenance: article.provenance,
        });

        // 3. Subclause nodes if present
        if (cl.subclauses && cl.subclauses.length > 0) {
          for (const sub of cl.subclauses) {
            nodes.push({
              nodeId: `node_const_art_${article.articleNumber}_cl_${cl.clauseNumber.replace(/[^\w]/g, "")}_sub_${sub.subclauseIdentifier.replace(/[^\w]/g, "")}`,
              part: article.part,
              partTitle: article.partTitle,
              chapter: article.chapter,
              chapterTitle: article.chapterTitle,
              articleNumber: article.articleNumber,
              clauseIdentifier: `${cl.clauseNumber}${sub.subclauseIdentifier}`,
              heading: `${article.heading} - Clause ${cl.clauseNumber}${sub.subclauseIdentifier}`,
              fullBreadcrumb: `${clauseBreadcrumb} > Subclause ${sub.subclauseIdentifier}`,
              text: `Article ${article.articleNumber}${cl.clauseNumber}${sub.subclauseIdentifier}: ${sub.text}`,
              provenance: article.provenance,
            });
          }
        }
      }
    }

    return nodes;
  }
}
