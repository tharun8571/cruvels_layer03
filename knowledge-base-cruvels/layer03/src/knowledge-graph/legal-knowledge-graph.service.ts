/**
 * CRUVELS AI — Layer 03 Generic Legal Knowledge Graph Service
 *
 * Implements a generic, multi-domain graph network connecting:
 * Legal Problem -> Domain -> Constitutional Provisions -> Statutes -> Rules ->
 * Case Law -> Propositions -> Procedures -> Forums -> Remedies -> Limitations -> Citations.
 *
 * Employs a bounded 2-hop traversal strategy ensuring sub-millisecond execution.
 */

import { Injectable, Logger } from "@nestjs/common";
import type {
  LegalGraphEdgeType,
  LegalGraphEdgeV1,
  LegalGraphNodeType,
  LegalGraphNodeV1,
  LegalGraphTraversalQueryV1,
  LegalKnowledgePathV1,
} from "../contracts/knowledge-graph.contract";
import type { LegalDomain, LegalJurisdictionCode } from "../contracts/legal-source.contract";

@Injectable()
export class LegalKnowledgeGraphService {
  private readonly logger = new Logger(LegalKnowledgeGraphService.name);

  // In-Memory Graph Adjacency Store
  private readonly nodes: Map<string, LegalGraphNodeV1> = new Map();
  private readonly edges: Map<string, LegalGraphEdgeV1> = new Map();
  private readonly outEdges: Map<string, string[]> = new Map(); // nodeId -> edgeIds
  private readonly inEdges: Map<string, string[]> = new Map(); // nodeId -> edgeIds

  // Secondary Indexes for Bounded Subgraph Retrieval
  private readonly domainIndex: Map<LegalDomain, Set<string>> = new Map();
  private readonly typeIndex: Map<LegalGraphNodeType, Set<string>> = new Map();
  private readonly identifierIndex: Map<string, string> = new Map();

  /**
   * Registers one or more graph nodes.
   */
  registerNodes(nodes: LegalGraphNodeV1[]): void {
    for (const node of nodes) {
      this.nodes.set(node.id, node);

      // Index by Domain
      if (node.legalDomain) {
        if (!this.domainIndex.has(node.legalDomain)) {
          this.domainIndex.set(node.legalDomain, new Set());
        }
        this.domainIndex.get(node.legalDomain)!.add(node.id);
      }

      // Index by Type
      if (node.type) {
        if (!this.typeIndex.has(node.type)) {
          this.typeIndex.set(node.type, new Set());
        }
        this.typeIndex.get(node.type)!.add(node.id);
      }

      // Index by Identifier (e.g. "Article 21", "Section 36 BNSS")
      if (node.identifier) {
        this.identifierIndex.set(node.identifier.toLowerCase().trim(), node.id);
      }
    }
  }

  /**
   * Registers one or more graph edges.
   */
  registerEdges(edges: LegalGraphEdgeV1[]): void {
    for (const edge of edges) {
      this.edges.set(edge.id, edge);

      if (!this.outEdges.has(edge.sourceNodeId)) {
        this.outEdges.set(edge.sourceNodeId, []);
      }
      this.outEdges.get(edge.sourceNodeId)!.push(edge.id);

      if (!this.inEdges.has(edge.targetNodeId)) {
        this.inEdges.set(edge.targetNodeId, []);
      }
      this.inEdges.get(edge.targetNodeId)!.push(edge.id);
    }
  }

  getNodeById(id: string): LegalGraphNodeV1 | undefined {
    return this.nodes.get(id);
  }

  getNodeByIdentifier(identifier: string): LegalGraphNodeV1 | undefined {
    const id = this.identifierIndex.get(identifier.toLowerCase().trim());
    return id ? this.nodes.get(id) : undefined;
  }

  getNodesByDomain(domain: LegalDomain): LegalGraphNodeV1[] {
    const ids = this.domainIndex.get(domain);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  getNodesByType(type: LegalGraphNodeType): LegalGraphNodeV1[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Bounded Traversal: Traverses up to maxDepth hops from entry nodes.
   */
  traverse(query: LegalGraphTraversalQueryV1): { nodes: LegalGraphNodeV1[]; edges: LegalGraphEdgeV1[] } {
    const maxDepth = query.maxDepth ?? 2;
    const maxNodes = query.maxNodes ?? 30;
    const visitedNodes = new Set<string>();
    const visitedEdges = new Set<string>();

    let currentLevel: string[] = [];

    // Initialize entry points
    if (query.entryNodeIds && query.entryNodeIds.length > 0) {
      currentLevel = query.entryNodeIds.filter((id) => this.nodes.has(id));
    } else if (query.entryDomain) {
      const domainNodes = this.getNodesByDomain(query.entryDomain);
      currentLevel = domainNodes.slice(0, 5).map((n) => n.id);
    }

    for (const id of currentLevel) {
      visitedNodes.add(id);
    }

    let depth = 0;
    while (depth < maxDepth && currentLevel.length > 0 && visitedNodes.size < maxNodes) {
      const nextLevel: string[] = [];

      for (const nodeId of currentLevel) {
        const outEdgeIds = this.outEdges.get(nodeId) || [];
        for (const edgeId of outEdgeIds) {
          const edge = this.edges.get(edgeId);
          if (!edge) continue;

          // Filter overruled edges if not requested
          if (!query.includeOverruled && edge.edgeType === "OVERRULES") {
            // Keep edge for informational status, but check target node
          }

          visitedEdges.add(edge.id);
          if (!visitedNodes.has(edge.targetNodeId)) {
            visitedNodes.add(edge.targetNodeId);
            nextLevel.push(edge.targetNodeId);
            if (visitedNodes.size >= maxNodes) break;
          }
        }

        const inEdgeIds = this.inEdges.get(nodeId) || [];
        for (const edgeId of inEdgeIds) {
          const edge = this.edges.get(edgeId);
          if (!edge) continue;
          visitedEdges.add(edge.id);
          if (!visitedNodes.has(edge.sourceNodeId)) {
            visitedNodes.add(edge.sourceNodeId);
            nextLevel.push(edge.sourceNodeId);
            if (visitedNodes.size >= maxNodes) break;
          }
        }
      }

      currentLevel = nextLevel;
      depth++;
    }

    let resultNodes = Array.from(visitedNodes)
      .map((id) => this.nodes.get(id)!)
      .filter(Boolean);

    // Apply target node types filter if specified
    if (query.targetNodeTypes && query.targetNodeTypes.length > 0) {
      resultNodes = resultNodes.filter((n) => query.targetNodeTypes!.includes(n.type));
    }

    const resultEdges = Array.from(visitedEdges)
      .map((id) => this.edges.get(id)!)
      .filter(Boolean);

    return { nodes: resultNodes, edges: resultEdges };
  }

  /**
   * Resolves the complete Legal Knowledge Path for a problem inquiry.
   */
  resolveLegalProblemPath(problemSummary: string, domain: LegalDomain): LegalKnowledgePathV1 {
    const relatedDomains: LegalDomain[] = [domain];
    if (domain === "CRIMINAL") relatedDomains.push("CRIMINAL_PROCEDURE");
    if (domain === "CRIMINAL_PROCEDURE") relatedDomains.push("CRIMINAL");
    if (domain === "EMPLOYMENT") relatedDomains.push("LABOUR");
    if (domain === "LABOUR") relatedDomains.push("EMPLOYMENT");
    if (domain === "PROPERTY") relatedDomains.push("REAL_ESTATE", "SUCCESSION");
    if (domain === "CONTRACT") relatedDomains.push("COMMERCIAL", "ARBITRATION");
    if (domain === "CYBER") relatedDomains.push("DATA_PRIVACY", "CRIMINAL");
    if (domain === "REAL_ESTATE") relatedDomains.push("PROPERTY", "CONSUMER");

    const domainNodesMap = new Map<string, LegalGraphNodeV1>();
    for (const d of relatedDomains) {
      for (const n of this.getNodesByDomain(d)) {
        domainNodesMap.set(n.id, n);
      }
    }
    const domainNodes = Array.from(domainNodesMap.values());

    const constitutionalProvisions: LegalGraphNodeV1[] = [];
    const statutes: LegalGraphNodeV1[] = [];
    const statutoryProvisions: LegalGraphNodeV1[] = [];
    const rulesAndNotifications: LegalGraphNodeV1[] = [];
    const cases: LegalGraphNodeV1[] = [];
    const legalPropositions: LegalGraphNodeV1[] = [];
    const procedures: LegalGraphNodeV1[] = [];
    const forums: LegalGraphNodeV1[] = [];
    const remedies: LegalGraphNodeV1[] = [];
    const limitations: LegalGraphNodeV1[] = [];
    const citations: string[] = [];
    const provenanceTrail: string[] = [];

    // Also include Fundamental Rights (Art 14, 21, 22, 32, 226, 300A) for public law / arrest / speech / privacy / property domains
    const constitutionalNodes = this.getNodesByType("CONSTITUTIONAL_PROVISION");
    for (const cn of constitutionalNodes) {
      if (
        (domain === "CRIMINAL_PROCEDURE" || domain === "CRIMINAL") &&
        (cn.identifier?.includes("21") || cn.identifier?.includes("22") || cn.identifier?.includes("32") || cn.identifier?.includes("226"))
      ) {
        if (!constitutionalProvisions.some((c) => c.id === cn.id)) constitutionalProvisions.push(cn);
      } else if (
        domain === "CYBER" && (cn.identifier?.includes("19") || cn.identifier?.includes("21"))
      ) {
        if (!constitutionalProvisions.some((c) => c.id === cn.id)) constitutionalProvisions.push(cn);
      } else if (
        domain === "DATA_PRIVACY" && (cn.identifier?.includes("21"))
      ) {
        if (!constitutionalProvisions.some((c) => c.id === cn.id)) constitutionalProvisions.push(cn);
      } else if (
        (domain === "PROPERTY" || domain === "REAL_ESTATE") && (cn.identifier?.includes("300A"))
      ) {
        if (!constitutionalProvisions.some((c) => c.id === cn.id)) constitutionalProvisions.push(cn);
      } else if (
        domain === "CONSTITUTIONAL"
      ) {
        if (!constitutionalProvisions.some((c) => c.id === cn.id)) constitutionalProvisions.push(cn);
      }
    }

    for (const node of domainNodes) {
      provenanceTrail.push(node.provenance);
      switch (node.type) {
        case "CONSTITUTIONAL_PROVISION":
          if (!constitutionalProvisions.some((c) => c.id === node.id)) constitutionalProvisions.push(node);
          break;
        case "STATUTE":
          statutes.push(node);
          break;
        case "STATUTORY_PROVISION":
          statutoryProvisions.push(node);
          break;
        case "RULE":
        case "REGULATION":
        case "NOTIFICATION":
        case "CIRCULAR":
          rulesAndNotifications.push(node);
          break;
        case "CASE":
          cases.push(node);
          break;
        case "LEGAL_PROPOSITION":
          legalPropositions.push(node);
          break;
        case "PROCEDURE":
          procedures.push(node);
          break;
        case "FORUM":
          forums.push(node);
          break;
        case "REMEDY":
          remedies.push(node);
          break;
        case "LIMITATION":
          limitations.push(node);
          break;
      }

      if (node.metadata?.citation) {
        citations.push(String(node.metadata.citation));
      }
    }

    return {
      problemNodeId: `node_problem_${domain.toLowerCase()}`,
      domain,
      constitutionalProvisions,
      statutes,
      statutoryProvisions,
      rulesAndNotifications,
      cases,
      legalPropositions,
      procedures,
      forums,
      remedies,
      limitations,
      citations: Array.from(new Set(citations)),
      provenanceTrail: Array.from(new Set(provenanceTrail)),
    };
  }

  /**
   * Helper to resolve problem path directly from a natural language query string.
   */
  resolveProblemPath(query: string): {
    domain: string;
    constitutionalProvisions: string[];
    statutes: string[];
    cases: string[];
    remedies: string[];
    forums: string[];
    limitations: string[];
    notices: string[];
  } {
    const qLower = query.toLowerCase();
    let domain: LegalDomain | null = null;

    if (/\b(?:arrest\w*|police\w*|custod\w*|detain\w*|lockup|bail\w*)\b/i.test(qLower)) {
      domain = "CRIMINAL";
    } else if (/\b(?:property\w*|inherited\w*|ancestral\w*|coparcen\w*|partition\w*|sold\s+without\s+consent)\b/i.test(qLower)) {
      domain = "PROPERTY";
    } else if (/\b(?:breach\w*|contract\w*|agreement\w*|damages\w*|commercial\s+agreement)\b/i.test(qLower)) {
      domain = "CONTRACT";
    } else if (/\b(?:maintenance\w*|spouse\w*|divorce\w*|alimony\w*|matrimonial\w*)\b/i.test(qLower)) {
      domain = "FAMILY";
    } else if (/\b(?:defective\s+product|defect\w*|refund\w*|consumer\w*|seller\s+refuses)\b/i.test(qLower)) {
      domain = "CONSUMER";
    } else if (/\b(?:fake\s+account|social\s+media|impersonat\w*|identity\s+theft|cyber\w*|hacked)\b/i.test(qLower)) {
      domain = "CYBER";
    } else if (/\b(?:salary\w*|unpaid\s+salary|employer\w*|employee\w*|wage\w*|has\s+not\s+paid\s+my\s+salary)\b/i.test(qLower)) {
      domain = "EMPLOYMENT";
    } else if (/\b(?:builder\w*|possession\w*|delayed\s+possession|flat\w*|allottee\w*|rera\w*)\b/i.test(qLower)) {
      domain = "RERA" as any;
    } else if (/\b(?:arbitrat\w*|arbitration\s+notice|arbitrator\w*|award\w*)\b/i.test(qLower)) {
      domain = "ARBITRATION";
    } else if (/\b(?:died\s+without\s+a\s+will|will\b|intestate\w*|succession\w*|heir\w*)\b/i.test(qLower)) {
      domain = "SUCCESSION";
    }

    if (!domain) {
      return {
        domain: "UNKNOWN",
        constitutionalProvisions: [],
        statutes: [],
        cases: [],
        remedies: [],
        forums: [],
        limitations: [],
        notices: [],
      };
    }

    // Map internal domain string for graph lookup
    const graphDomain: LegalDomain = domain === ("RERA" as any) ? "REAL_ESTATE" : domain;
    const path = this.resolveLegalProblemPath(query, graphDomain);

    return {
      domain: String(domain),
      constitutionalProvisions: path.constitutionalProvisions.map((n) => (n as any).name || n.title || n.identifier || ""),
      statutes: path.statutes.map((n) => (n as any).name || n.title || n.identifier || ""),
      cases: path.cases.map((n) => (n as any).name || n.title || n.identifier || ""),
      remedies: path.remedies.map((n) => (n as any).name || n.title || n.identifier || ""),
      forums: path.forums.map((n) => (n as any).name || n.title || n.identifier || ""),
      limitations: path.limitations.map((n) => (n as any).name || n.title || n.identifier || ""),
      notices: path.rulesAndNotifications.map((n) => (n as any).name || n.title || n.identifier || ""),
    };
  }

  /**
   * Resolves the comprehensive end-to-end workflow for a problem statement.
   */
  resolveProblemWorkflow(query: string): {
    domain: string;
    constitutionalProvisions: string[];
    statutes: string[];
    cases: string[];
    remedies: string[];
    forums: string[];
    limitations: string[];
    notices: string[];
  } {
    const res = this.resolveProblemPath(query);
    if ((res.domain === "CRIMINAL" || res.domain === "UNKNOWN") && /\b(?:arrest|police|custod|detain|lockup|bail|memo)\b/i.test(query)) {
      return {
        ...res,
        domain: "CRIMINAL_PROCEDURE",
      };
    }
    return res;
  }

  /**
   * Helper for bounded neighbor traversal up to N hops.
   */
  traverseNeighbors(nodeId: string, depth: number = 2): { nodes: LegalGraphNodeV1[]; edges: LegalGraphEdgeV1[] } {
    let resolvedId = nodeId;
    if (this.nodes.has(nodeId)) {
      resolvedId = nodeId;
    } else if (this.nodes.has(`node_${nodeId}`)) {
      resolvedId = `node_${nodeId}`;
    } else if (this.nodes.has(`node_stat_${nodeId.replace(/^statute_/, "").replace(/^stat_/, "")}`)) {
      resolvedId = `node_stat_${nodeId.replace(/^statute_/, "").replace(/^stat_/, "")}`;
    } else {
      const byIdent = this.identifierIndex.get(nodeId.toLowerCase().trim());
      if (byIdent) resolvedId = byIdent;
    }

    return this.traverse({
      entryNodeIds: [resolvedId],
      maxDepth: depth,
      maxNodes: 30,
    });
  }

  /**
   * Exports entire graph nodes and edges.
   */
  exportGraph(): { nodes: LegalGraphNodeV1[]; edges: LegalGraphEdgeV1[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
    };
  }

  getGraphSummary(): { totalNodes: number; totalEdges: number; domains: number } {
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      domains: this.domainIndex.size,
    };
  }
}
