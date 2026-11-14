/**
 * CRUVELS AI — Layer 03 Evidence Admission Policy Gate (Phase 2 Enhanced)
 *
 * Enforces strict multi-dimensional legal evidence admission.
 * Decouples raw lexical/dense candidate generation from legal evidence adequacy.
 *
 * MANDATORY PRODUCTION INVARIANTS:
 * 1. HIGH_RETRIEVAL_SCORE != HIGH_EVIDENCE_CONFIDENCE.
 * 2. An item becomes OPERATIVE evidence ONLY if:
 *    - Domain compatible with the legal problem
 *    - Substantively relevant to actual query intent without stopword pollution
 *    - Within authorized tenant / matter / document boundary
 *    - Of appropriate legal authority level
 *    - Temporally valid (not superseded/repealed or OVERRULED unless historical law requested)
 *    - Jurisdictionally applicable (state High Court vs national Supreme Court)
 *    - Sufficiently complete to ground a legal answer
 * 3. Weak / stale / unverified / cross-domain / overruled candidates are rejected:
 *    - REJECTED_IRRELEVANT
 *    - REJECTED_SCOPE
 *    - REJECTED_AUTHORITY
 *    - REJECTED_STALE
 *    - REJECTED_OVERRULED
 *    - REJECTED_JURISDICTION
 *    - INSUFFICIENT_EVIDENCE
 */

import { Injectable, Logger } from "@nestjs/common";
import type { KnowledgeAuthorityLevel, KnowledgeJurisdiction } from "@prisma/client";
import type {
  KnowledgeEvidenceDto,
  KnowledgeSearchQuery,
} from "../contracts/knowledge-repository.interface";
import type {
  LegalAuthorityLevel,
  LegalDomain,
  LegalJurisdictionCode,
} from "../contracts/legal-source.contract";
import type { PrecedentStatus } from "../contracts/case-law.contract";

export type EvidenceAdmissionStatus =
  | "OPERATIVE"
  | "REJECTED_IRRELEVANT"
  | "REJECTED_SCOPE"
  | "REJECTED_AUTHORITY"
  | "REJECTED_STALE"
  | "REJECTED_OVERRULED"
  | "REJECTED_JURISDICTION"
  | "INSUFFICIENT_EVIDENCE";

export interface EvaluatedEvidenceItem extends Omit<Partial<KnowledgeEvidenceDto>, "authorityLevel" | "jurisdiction"> {
  chunkId?: string;
  documentId?: string;
  title?: string;
  section?: string;
  exactText?: string;
  content?: string;
  authorityLevel?: LegalAuthorityLevel | KnowledgeAuthorityLevel | string;
  jurisdiction?: LegalJurisdictionCode | KnowledgeJurisdiction | string;
  retrievalScore?: number;
  finalScore?: number;
  legalDomain?: LegalDomain;
  precedentStatus?: PrecedentStatus;
  admissionStatus: EvidenceAdmissionStatus;
  rejectionReason?: string;
  metrics: {
    retrievalScore: number; // Raw BM25 + Dense + RRF score
    semanticRelevance: number; // Substantive semantic alignment
    domainRelevance: number; // Legal domain alignment
    authorityScore: number; // Weight from official/primary legal status
    scopeMatch: boolean; // Confirmed tenant/matter/doc boundary
    temporalMatch: boolean; // Confirmed date/version validity
    jurisdictionMatch: boolean; // Confirmed country/jurisdiction applicability
    evidenceAdequacy: number; // Composite information sufficiency
  };
}

export interface EvidenceAdmissionResult {
  operativeEvidence: EvaluatedEvidenceItem[];
  rejectedEvidence: EvaluatedEvidenceItem[];
  confidenceState: "HIGH" | "MEDIUM" | "LOW" | "NO_RELEVANT_EVIDENCE" | "JURISDICTION_REQUIRED";
  overallAdequacyScore: number;
  admittedCount: number;
  rejectedCount: number;
  rationale: string;
}

// Substantive legal domain vocabularies for generic taxonomy evaluation
const DOMAIN_VOCABULARIES: Record<LegalDomain, RegExp> = {
  CRIMINAL_PROCEDURE: /\b(?:arrest\w*|custod\w*|detain\w*|detention|police\s+station|fir\b|first\s+information\s+report|bail\b|remand|magistrate|warrant\b|summons\b|interrogat\w*|investigat\w*|lockup|jail\b|crpc\b|bnss\b|charge\s*sheet|search\s+and\s+seizure|handcuff\w*|accused|custodial|grounds\s+of\s+arrest|memo\s+of\s+arrest|d\.?k\.?\s*basu|arnesh\s+kumar|satender\s+kumar\s+antil|pankaj\s+bansal)\b/i,
  CRIMINAL: /\b(?:theft|cheating|fraud\w*|forgery|defamat\w*|extortion|assault|homicide|murder|ipc\b|bns\b|penal|offence|criminal\s+misappropriation|criminal\s+breach\s+of\s+trust|punishment|imprisonment|culpable\s+homicide)\b/i,
  CYBER: /\b(?:fake\s+account|impersonat\w*|social\s+media|instagram|facebook|twitter|profile|photos\b|stolen\s+photos|identity\s+theft|hacking|hacked|cyber\s+crime|cyber\s+stalking|cyber\s+bullying|it\s+act|phishing|deepfake|computer\s+resource|online\s+harassment|information\s+technology|shreya\s+singhal|section\s+66c|section\s+66d|section\s+66a)\b/i,
  DATA_PRIVACY: /\b(?:personal\s+data|data\s+principal|data\s+fiduciary|data\s+processor|consent|dpdp|gdpr|data\s+breach|privacy\s+notice|right\s+to\s+privacy|surveillance|biometric|puttaswamy)\b/i,
  CONTRACT: /\b(?:contract\w*|agreement\w*|breach\w*|damages|consideration|promisor|promisee|rescission|performance\s+of\s+contract|indemnity|indemnif\w*|liability|default\w*|payment\s+obligation|liquidated\s+damages|unpaid|refuses\s+to\s+pay|milestone|non-compete|restraint\s+of\s+trade|mou\b|nda\b|msa\b|sla\b|commercial\s+lease|termination\w*|notice\s+period|kailash\s+nath|section\s+73|section\s+74)\b/i,
  ARBITRATION: /\b(?:dispute\s+resolution|arbitrat\w*|arbitrator\w*|arbitral\s+tribunal|arbitral\s+award|section\s+7|section\s+8|section\s+9|section\s+11|section\s+34|setting\s+aside\s+award|interim\s+measures|arbitrability|arbitration\s+agreement|statutory\s+limitation|limitation\s+period|vidya\s+drolia)\b/i,
  CIVIL_PROCEDURE: /\b(?:cpc\b|civil\s+procedure|plaint\b|written\s+statement|injunction|execution\s+of\s+decree|limitation\s+act|limitation\s+period|statutory\s+limitation|jurisdiction\s+of\s+civil\s+court|summary\s+suit)\b/i,
  CUSTOMS_FOREIGN_TRADE: /\b(?:import\w*|export\w*|customs\b|customs\s+duty|tariff|dgft|foreign\s+trade|homologation|vehicle\s+import|car\s+import|cbu\b|skd\b|ckd\b|cbic|import\s+policy|port\s+of\s+entry|demurrage|bill\s+of\s+entry)\b/i,
  CONSTITUTIONAL: /\b(?:constitution\b|fundamental\s+right\w*|article\s+14|article\s+19|article\s+20|article\s+21|article\s+21a|article\s+22|article\s+32|article\s+136|article\s+141|article\s+142|article\s+226|article\s+227|article\s+300a|article\s+311|article\s+368|writ\b|habeas\s+corpus|mandamus|basic\s+structure|equality\s+before\s+law|personal\s+liberty|due\s+process|slp\b|special\s+leave\s+petition|freedom\s+of\s+speech|freedom\s+of\s+expression|kesavananda|maneka\s+gandhi|shayara\s+bano|puttaswamy)\b/i,
  PROPERTY: /\b(?:property\b|immovable\s+property|real\s+estate|property\s+law|lease\b|tenancy\b|tenant\b|landlord\b|rent\b|eviction|title\s+deed|conveyance|easement|rera\b|possession\s+of\s+property|mortgage\b|ancestral\s+property|joint\s+property|sale\s+deed|coparcen\w*|builder\s+delayed|delayed\s+possession)\b/i,
  FAMILY: /\b(?:marriage|divorce|maintenance|custody\s+of\s+child|alimony|matrimonial|hindu\s+marriage|special\s+marriage|domestic\s+violence|talaq|triple\s+talaq|shayara\s+bano|section\s+125|section\s+144\s+bnss)\b/i,
  SUCCESSION: /\b(?:will\b|probate|testamentary|inherit\w*|succession|executor|heir\w*|intestate|letters\s+of\s+administration|ancestral|coparcenar\w*|joint\s+family|partition|hindu\s+succession|vineeta\s+sharma|died\s+without\s+a\s+will)\b/i,
  CORPORATE: /\b(?:companies\s+act|board\s+of\s+directors|shareholder\w*|merger|acquisition|director\s+fiduciary|annual\s+general\s+meeting|internal\s+audit|roc\b|nclt\b|incorporation|csr\b|corporate\s+social\s+responsibility|related\s+party|oppression|mismanagement|section\s+135|section\s+188|section\s+241|section\s+242)\b/i,
  COMMERCIAL: /\b(?:dispute\s+resolution|commercial\s+dispute|commercial\s+court|sale\s+of\s+goods|negotiable\s+instruments|cheque\s+bounc\w*|cheque\b|dishonou?r\s+of\s+cheque|insufficient\s+funds|statutory\s+demand\s+notice|ni\s+act|section\s+138|promissory\s+note|bank\s+guarantee|letter\s+of\s+credit)\b/i,
  LABOUR: /\b(?:employment|workman|industrial\s+dispute|gratuity|provident\s+fund|termination\s+of\s+employment|severance|retrenchment|posh\b|factory\s+act|unpaid\s+salary|salary\b|wages\b)\b/i,
  EMPLOYMENT: /\b(?:employment|employee|employer|wage|salary|severance|non-compete|notice\s+period|disciplinary\s+action|unpaid\s+salary|has\s+not\s+paid\s+my\s+salary)\b/i,
  TAX: /\b(?:income\s+tax|gst\b|goods\s+and\s+services\s+tax|customs\s+duty|excise|tds\b|assessment\s+year|advance\s+tax|it\s+appellate\s+tribunal|itat\b)\b/i,
  REAL_ESTATE: /\b(?:rera\b|builder\b|possession\b|delayed\s+possession|allottee\b|promoter\b|builder\s+buyer\s+agreement|interest\s+on\s+delay|flat\b|apartment\b)\b/i,
  CONSUMER: /\b(?:consumer\b|defective\s+product|defect\b|deficiency\s+in\s+service|consumer\s+forum|consumer\s+protection|dcdrc\b|seller\s+refuses\s+a\s+refund|refund\b|replacement\b|warranty\b)\b/i,
  INSOLVENCY: /\b(?:ibc\b|insolvency|bankruptcy|cirp\b|nclt\b|resolution\s+plan|operational\s+creditor|financial\s+creditor|default\b)\b/i,
  INTELLECTUAL_PROPERTY: /\b(?:trademark|copyright|patent|infringement|passing\s+off|intellectual\s+property|design\s+act)\b/i,
  MOTOR_VEHICLE: /\b(?:motor\s+vehicle|accident|claim\b|mact\b|driving\s+licence|insurance\s+claim)\b/i,
  EVIDENCE: /\b(?:evidence\b|admissibility|confession|expert\s+opinion|burden\s+of\s+proof|bsa\b|iea\b)\b/i,
  HUMAN_RIGHTS: /\b(?:human\s+rights|nhrc|custodial\s+violence|torture\b|arbitrary\s+detention)\b/i,
  CORPORATE_COMMERCIAL: /\b(?:companies\s+act|board\s+of\s+directors|shareholder\w*|merger|acquisition|internal\s+audit|roc\b|nclt\b|incorporation|csr\b|commercial\s+dispute)\b/i,
  LABOUR_EMPLOYMENT: /\b(?:employment|workman|industrial\s+dispute|gratuity|provident\s+fund|termination\s+of\s+employment|severance|retrenchment|posh\b|unpaid\s+salary)\b/i,
  DATA_PROTECTION: /\b(?:personal\s+data|data\s+principal|data\s+fiduciary|data\s+processor|consent|dpdp|gdpr|data\s+breach|privacy\s+notice)\b/i,
  ADMINISTRATIVE_LAW: /\b(?:natural\s+justice|audi\s+alteram\s+partem|quasi-judicial|administrative\s+action|speaking\s+order|reasoned\s+order|central\s+administrative\s+tribunal|cat\b|article\s+311)\b/i,
  ENVIRONMENT: /\b(?:environment\b|ngt\b|pollution|eia\b|hazardous\s+waste|sustainable\s+development|national\s+green\s+tribunal)\b/i,
  BANKING_FINANCE: /\b(?:sarfaesi\b|drt\b|npa\b|banking\s+regulation|rbi\b|loan\s+default|security\s+interest|cheque\s+bounc\w*|section\s+138|negotiable\s+instruments)\b/i,
  COMPETITION: /\b(?:competition\s+commission|cci\b|anti-competitive|cartel|abuse\s+of\s+dominant\s+position|predatory\s+pricing|combination\b)\b/i,
  CHILD_JUVENILE: /\b(?:pocso|child\s+abuse|sexual\s+offence\s+against\s+children|juvenile\s+justice|child\s+welfare|special\s+juvenile\s+police)\b/i,
  SC_ST_SOCIAL: /\b(?:atrocities|scheduled\s+caste|scheduled\s+tribe|poa\s+act|special\s+court|caste\s+insult|untouchability)\b/i,
  SENIOR_CITIZEN: /\b(?:senior\s+citizen|maintenance\s+of\s+parents|welfare\s+of\s+parents|gift\s+transfer\s+revocation|section\s+23)\b/i,
  DISABILITY: /\b(?:person\s+with\s+disability|rpwd|pwd\b|reasonable\s+accommodation|accessibility|equal\s+opportunity)\b/i,
  ELECTION: /\b(?:election\s+commission|representation\s+of\s+the\s+people|rpa\b|corrupt\s+practice|electoral\s+offence|disqualification)\b/i,
  EDUCATION: /\b(?:right\s+to\s+education|rte\b|admission\s+quota|compulsory\s+education|school\s+management)\b/i,
  HEALTHCARE: /\b(?:clinical\s+establishments|medical\s+negligence|medical\s+council|nmc\b|hospital\s+compliance)\b/i,
  SERVICE_LAW: /\b(?:service\s+law|recruitment|promotion|pension|disciplinary\s+proceedings|administrative\s+tribunals?\s+act|central\s+administrative\s+tribunal|cat\b|article\s+311|compulsory\s+retirement|civil\s+services?)\b/i,
  ADMINISTRATIVE: /\b(?:natural\s+justice|audi\s+alteram\s+partem|quasi-judicial|administrative\s+action|speaking\s+order|reasoned\s+order|central\s+administrative\s+tribunal|cat\b|article\s+311)\b/i,
  ENVIRONMENTAL: /\b(?:environment\b|ngt\b|pollution|eia\b|hazardous\s+waste|sustainable\s+development|national\s+green\s+tribunal)\b/i,
  BANKING: /\b(?:sarfaesi\b|drt\b|npa\b|banking\s+regulation|rbi\b|loan\s+default|security\s+interest|cheque\s+bounc\w*|section\s+138|negotiable\s+instruments)\b/i,
  SECURITIES: /\b(?:sebi\b|insider\s+trading|securities\s+and\s+exchange|sat\b|listing\s+obligations|lodr\b|takeover\s+code)\b/i,
  GENERAL: /.*/i,
};

@Injectable()
export class EvidenceAdmissionPolicy {
  private readonly logger = new Logger(EvidenceAdmissionPolicy.name);

  /**
   * Infers the expected legal domain(s) from a user query string.
   */
  inferQueryLegalDomains(query: string): LegalDomain[] {
    const matchedDomains: LegalDomain[] = [];
    const trimmed = query.trim();

    for (const [domain, regex] of Object.entries(DOMAIN_VOCABULARIES)) {
      if (domain === "GENERAL") continue;
      if (regex.test(trimmed)) {
        matchedDomains.push(domain as LegalDomain);
      }
    }

    return matchedDomains.length > 0 ? matchedDomains : ["GENERAL"];
  }

  /**
   * Infers the legal domain of an evidence item based on metadata or textual cues.
   */
  inferItemLegalDomain(item: Partial<KnowledgeEvidenceDto> & { legalDomain?: LegalDomain }): LegalDomain {
    if (item.legalDomain) return item.legalDomain;
    const provDomain = (item as any).provenance?.legalDomain || (item.provenanceChain as any)?.legalDomain;
    if (provDomain) return provDomain as LegalDomain;

    const text = `${item.title || (item as any).documentTitle || ""} ${item.section || ""} ${(item as any).content || item.exactText || ""} ${(item as any).matchedQueryTerms?.join(" ") || ""}`.toLowerCase();
    if (text.includes("habeas corpus") || text.includes("emergency") || text.includes("constitution") || text.includes("fundamental rights") || text.includes("adm jabalpur") || text.includes("article 21") || text.includes("privacy")) return "CONSTITUTIONAL";
    if (text.includes("nagarik suraksha") || text.includes("crpc") || text.includes("arrest") || text.includes("d.k. basu") || text.includes("arnesh kumar")) return "CRIMINAL_PROCEDURE";
    if (text.includes("nyaya sanhita") || text.includes("penal code") || text.includes("ipc")) return "CRIMINAL";
    if (text.includes("information technology") || text.includes("it act") || text.includes("cyber") || text.includes("shreya singhal")) return "CYBER";
    if (text.includes("contract") || text.includes("kailash nath") || text.includes("agreement")) return "CONTRACT";
    if (text.includes("arbitration") || text.includes("vidya drolia")) return "ARBITRATION";
    if (text.includes("transfer of property") || text.includes("tpa") || text.includes("commercial lease") || text.includes("possession")) return "PROPERTY";
    if (text.includes("rera") || text.includes("builder")) return "REAL_ESTATE";
    if (text.includes("consumer protection") || text.includes("defective product") || text.includes("refund")) return "CONSUMER";
    if (text.includes("hindu succession") || text.includes("vineeta sharma") || text.includes("will") || text.includes("inheritance")) return "SUCCESSION";
    if (text.includes("hindu marriage") || text.includes("divorce") || text.includes("maintenance") || text.includes("shayara bano")) return "FAMILY";
    if (text.includes("payment of wages") || text.includes("gratuity") || text.includes("salary") || text.includes("industrial dispute") || text.includes("employer")) return "EMPLOYMENT";
    if (text.includes("customs") || text.includes("dgft") || text.includes("vehicle import")) return "CUSTOMS_FOREIGN_TRADE";
    if (text.includes("data protection") || text.includes("dpdp")) return "DATA_PRIVACY";
    if (text.includes("companies act") || text.includes("csr")) return "CORPORATE";

    return "GENERAL";
  }

  /**
   * Primary Entrypoint: Evaluates an array of raw candidate items against the 7 mandatory gates.
   */
  evaluateCandidates(
    query: KnowledgeSearchQuery,
    candidates: Array<Partial<KnowledgeEvidenceDto> & {
      exactStructuralMatch?: boolean;
      exactCitationMatch?: boolean;
      fusedScore?: number;
      finalScore?: number;
      legalDomain?: LegalDomain;
      precedentStatus?: PrecedentStatus;
      court?: string;
      state?: string;
      content?: string;
      authorityLevel?: any;
    }>,
  ): EvidenceAdmissionResult {
    const operativeEvidence: EvaluatedEvidenceItem[] = [];
    const rejectedEvidence: EvaluatedEvidenceItem[] = [];

    const queryLower = query.query.toLowerCase().trim();
    const queryDomains = this.inferQueryLegalDomains(query.query);
    const hasSpecificQueryDomain = queryDomains.length > 0 && !queryDomains.includes("GENERAL");
    const asOfDateStr = query.filter?.asOfDate ? String(query.filter.asOfDate) : undefined;
    const isHistoricalRequested = Boolean(
      asOfDateStr && new Date(asOfDateStr).getFullYear() < 2024
    );

    // Stop words to remove from substantive query overlap
    const STOP_WORDS = new Set([
      "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
      "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
      "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
      "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
      "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
      "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
      "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
      "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
      "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
      "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
      "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
      "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
      "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
      "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
      "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
      "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what",
      "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
      "whom", "why", "why's", "will", "with", "without", "won't", "would", "wouldn't",
      "give", "show", "describe", "need", "want", "mean", "state", "states",
      "regarding", "concerning", "applicable", "related", "matter", "matters",
      "provision", "provisions", "rule", "rules", "said", "done", "india", "indian", "law", "laws", "act", "acts",
      "legal", "statute", "statutes", "order", "orders", "section", "sections", "clause", "clauses", "article", "articles",
      "court", "courts", "told", "tell", "taking", "taken", "took"
    ]);

    const queryTokens = queryLower
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t: string) => t.length >= 3 && !STOP_WORDS.has(t));

    for (const item of candidates) {
      const text = `${item.title || (item as any).documentTitle || ""} ${item.section || ""} ${item.exactText || item.content || ""}`;
      const contentLower = text.toLowerCase();
      const itemDomain = this.inferItemLegalDomain(item);

      // Extract precedent status and court level if case law
      const precedentStatus: PrecedentStatus | undefined =
        (item as any).precedentStatus ||
        ((item as any).metadata as any)?.precedentStatus ||
        (item.provenanceChain as any)?.precedentStatus ||
        ((item.provenanceChain as any)?.caseLaw?.precedentStatus);

      const court: string | undefined =
        (item as any).court ||
        ((item as any).metadata as any)?.court ||
        (item.provenanceChain as any)?.court ||
        ((item.provenanceChain as any)?.caseLaw?.court);

      const state: string | undefined =
        (item as any).state ||
        ((item as any).metadata as any)?.state ||
        (item.provenanceChain as any)?.state;

      // Dimension 1: Retrieval Score (Raw candidate score)
      const retrievalScore = item.finalScore ?? item.retrievalScore ?? item.fusedScore ?? 0.5;

      // Dimension 2: Semantic Relevance (Substantive token overlap without generic stop words)
      let semanticRelevance = 0.0;
      const contentWords = new Set(
        contentLower
          .replace(/[^\w\s]/g, " ")
          .split(/\s+/)
          .filter(Boolean)
      );

      const matchedTokens = queryTokens.filter((t: string) => {
        if (contentWords.has(t)) return true;
        if (contentWords.has(t + "s")) return true;
        if (t.endsWith("s") && contentWords.has(t.slice(0, -1))) return true;
        if (t.length >= 6) {
          const stem = t.slice(0, 5);
          for (const word of contentWords) {
            if (word.startsWith(stem) && Math.abs(word.length - t.length) <= 4) return true;
          }
        }
        return false;
      });
      const tokenOverlap = queryTokens.length > 0 ? matchedTokens.length / queryTokens.length : 0;

      if (item.exactStructuralMatch) {
        semanticRelevance = 1.0;
      } else if (item.exactCitationMatch) {
        semanticRelevance = 0.95;
      } else if (tokenOverlap >= 0.50) {
        semanticRelevance = Math.min(1.0, 0.50 + tokenOverlap * 0.50);
      } else if (tokenOverlap >= 0.35 && matchedTokens.length >= 2) {
        semanticRelevance = 0.45;
      } else if (tokenOverlap >= 0.25 && queryTokens.length <= 3) {
        semanticRelevance = 0.35;
      } else {
        semanticRelevance = 0.05; // Insignificant incidental overlap
      }

      // Dimension 3: Legal Domain Relevance Gate
      let domainRelevance = 0.5;
      let domainMatch = true;
      if (hasSpecificQueryDomain) {
        const isDomainMatch = queryDomains.includes(itemDomain);
        if (isDomainMatch) {
          domainRelevance = 1.0;
        } else if (itemDomain === "CONSTITUTIONAL" && (
          queryDomains.includes("CRIMINAL_PROCEDURE") ||
          queryDomains.includes("DATA_PRIVACY") ||
          queryDomains.includes("CYBER") ||
          queryDomains.includes("PROPERTY") ||
          queryDomains.includes("FAMILY") ||
          queryDomains.includes("ADMINISTRATIVE") ||
          queryDomains.includes("LABOUR")
        )) {
          // Constitutional fundamental rights (Art 14, 19, 21, 22, 32, 226, 300A, 311) cross-apply to sovereign and civil rights
          domainRelevance = 0.85;
        } else if (
          (itemDomain === "CONTRACT" && (queryDomains.includes("ARBITRATION") || queryDomains.includes("COMMERCIAL") || queryDomains.includes("PROPERTY"))) ||
          (itemDomain === "ARBITRATION" && (queryDomains.includes("CONTRACT") || queryDomains.includes("COMMERCIAL"))) ||
          (itemDomain === "PROPERTY" && (queryDomains.includes("SUCCESSION") || queryDomains.includes("REAL_ESTATE") || queryDomains.includes("CONTRACT"))) ||
          (itemDomain === "SUCCESSION" && (queryDomains.includes("PROPERTY") || queryDomains.includes("FAMILY"))) ||
          (itemDomain === "REAL_ESTATE" && (queryDomains.includes("PROPERTY") || queryDomains.includes("CONSUMER"))) ||
          (itemDomain === "CONSUMER" && (queryDomains.includes("REAL_ESTATE") || queryDomains.includes("COMMERCIAL") || queryDomains.includes("CONTRACT"))) ||
          (itemDomain === "CRIMINAL_PROCEDURE" && queryDomains.includes("CRIMINAL")) ||
          (itemDomain === "CRIMINAL" && queryDomains.includes("CRIMINAL_PROCEDURE")) ||
          (itemDomain === "CYBER" && (queryDomains.includes("CRIMINAL") || queryDomains.includes("DATA_PRIVACY"))) ||
          (itemDomain === "EMPLOYMENT" && queryDomains.includes("LABOUR"))
        ) {
          // Harmonious cross-domain compatibility
          domainRelevance = 0.85;
        } else if (itemDomain === "GENERAL") {
          domainRelevance = 0.10;
          domainMatch = false;
        } else {
          // Disjoint domain: e.g. Contract Act chunk for criminal arrest or IT Act for family partition
          domainRelevance = 0.05;
          domainMatch = false;
        }
      } else {
        // Query belongs to an unindexed / out-of-corpus legal domain
        if (tokenOverlap >= 0.60 && matchedTokens.length >= 3) {
          domainRelevance = 0.60;
        } else {
          domainRelevance = 0.05;
          domainMatch = false;
        }
      }

      // Dimension 4: Authority Score & Precedent Hierarchy
      let authorityScore = 0.5;
      const authLevel = (item.authorityLevel || (item as any).provenance?.sourceAuthority || "").toUpperCase();
      if (authLevel === "CONSTITUTIONAL") {
        authorityScore = 1.0;
      } else if (authLevel === "OFFICIAL_PRIMARY" || authLevel === "MANDATORY_STATUTORY") {
        authorityScore = 0.98;
      } else if (
        authLevel === "BINDING_PRECEDENT" ||
        authLevel === "COURT_DECISION" ||
        authLevel === "MANDATORY_PRECEDENT" ||
        authLevel === "JUDICIAL" ||
        (item as any).sourceType === "CASE_LAW"
      ) {
        const itemCourt = court || ((item as any).provenance?.court) || ((item.provenanceChain as any)?.court);
        const itemJuris = item.jurisdiction || (item as any).provenance?.jurisdiction || "";
        if (itemCourt === "SUPREME_COURT" || (!itemCourt && (itemJuris === "INDIA" || itemJuris === "INDIAN"))) {
          authorityScore = 0.95;
        } else if (itemCourt === "HIGH_COURT" || itemJuris.startsWith("IN-")) {
          // Check if High Court is jurisdictionally aligned with query
          const targetState = query.filter?.jurisdiction;
          const isTargetState =
            (state && (queryLower.includes(state.toLowerCase()) || targetState?.toLowerCase().includes(state.toLowerCase()))) ||
            (targetState && itemJuris === targetState);
          authorityScore = isTargetState ? 0.90 : 0.65; // Intra-state binding vs extra-state persuasive
        } else {
          authorityScore = 0.70;
        }
      } else if (authLevel === "PERSUASIVE_PRECEDENT" || authLevel === "OFFICIAL_GOVERNMENT") {
        authorityScore = 0.90;
      } else if (authLevel === "VERIFIED_FIRM_SOURCE" || authLevel === "MANDATORY_DOCUMENT") {
        authorityScore = 0.85;
      } else if (authLevel === "SECONDARY_LEGAL" || authLevel === "GENERAL_REFERENCE") {
        authorityScore = 0.60;
      } else if (authLevel === "UNVERIFIED") {
        authorityScore = 0.20;
      }

      // If case law has UNCERTAIN status, cap authority score
      if (precedentStatus === "UNCERTAIN") {
        authorityScore = Math.min(authorityScore, 0.35);
      }

      // Dimension 5: Scope Match (Tenant / Workspace / Document isolation)
      let scopeMatch = true;
      if (query.access) {
        const itemFirmId = (item as any).provenance?.firmId || (item.provenanceChain as any)?.firmId || (item as any).firmId;
        if (query.access.firmId && itemFirmId && itemFirmId !== query.access.firmId && !query.access.isSuperAdmin) {
          scopeMatch = false;
        }
        if (query.access.allowedDocumentIds && query.access.allowedDocumentIds.length > 0) {
          if (item.documentId && !query.access.allowedDocumentIds.includes(item.documentId)) {
            scopeMatch = false;
          }
        }
      }

      // Dimension 6: Temporal Match & Precedent Validity (Overruled check)
      let temporalMatch = true;
      let isOverruled = false;
      const docStatus = ((item as any).provenance?.currentStatus || (item.provenanceChain as any)?.currentStatus || (item as any).currentStatus || (item as any).status);

      if (precedentStatus === "OVERRULED" || precedentStatus === "REVERSED") {
        isOverruled = true;
        if (!isHistoricalRequested) {
          temporalMatch = false;
        }
      } else if ((docStatus === "REPEALED" || docStatus === "SUPERSEDED") && !isHistoricalRequested) {
        temporalMatch = false;
      }

      // Dimension 7: Jurisdiction Match
      let jurisdictionMatch = true;
      const itemJurisdiction = item.jurisdiction || (item as any).provenance?.jurisdiction;
      const targetJurisdiction = query.filter?.jurisdiction;
      if (targetJurisdiction && itemJurisdiction) {
        const isItemNational = itemJurisdiction === "INDIA" || itemJurisdiction === "INDIAN";
        const isTargetNational = String(targetJurisdiction) === "INDIA" || String(targetJurisdiction) === "INDIAN";
        if (isItemNational || isTargetNational) {
          // National / pan-India law & Supreme Court precedent match
          jurisdictionMatch = true;
        } else if ((item as any).sourceType === "CASE_LAW") {
          // High Court from other state is persuasive, admitted with lower authority score
          jurisdictionMatch = true;
        } else if (itemJurisdiction !== targetJurisdiction) {
          jurisdictionMatch = false;
        }
      }

      // Dimension 8: Evidence Adequacy Calculation
      // Weighted composite: Domain (30%) + Semantic (35%) + Authority (20%) + Retrieval (15%)
      const evidenceAdequacy = parseFloat(
        (domainRelevance * 0.30 + semanticRelevance * 0.35 + authorityScore * 0.20 + (retrievalScore > 0.4 ? 0.15 : 0.05)).toFixed(4),
      );

      const metrics = {
        retrievalScore,
        semanticRelevance,
        domainRelevance,
        authorityScore,
        scopeMatch,
        temporalMatch,
        jurisdictionMatch,
        evidenceAdequacy,
      };

      // EVALUATE ADMISSION GATES
      if (!scopeMatch) {
        rejectedEvidence.push({
          ...item,
          legalDomain: itemDomain,
          precedentStatus,
          admissionStatus: "REJECTED_SCOPE",
          rejectionReason: "Cross-tenant or unauthorized document scope violation.",
          metrics,
        });
        continue;
      }

      if (!jurisdictionMatch) {
        rejectedEvidence.push({
          ...item,
          legalDomain: itemDomain,
          precedentStatus,
          admissionStatus: "REJECTED_JURISDICTION",
          rejectionReason: `Jurisdiction mismatch: query requested ${query.filter?.jurisdiction}, but source belongs to ${itemJurisdiction}.`,
          metrics,
        });
        continue;
      }

      if (isOverruled && !isHistoricalRequested) {
        rejectedEvidence.push({
          ...item,
          legalDomain: itemDomain,
          precedentStatus,
          admissionStatus: "REJECTED_OVERRULED",
          rejectionReason: "Case law precedent has been expressly OVERRULED and cannot be presented as current good law.",
          metrics,
        });
        continue;
      }

      if (!temporalMatch) {
        rejectedEvidence.push({
          ...item,
          legalDomain: itemDomain,
          precedentStatus,
          admissionStatus: "REJECTED_STALE",
          rejectionReason: "Document version is repealed or superseded, and historical law was not requested.",
          metrics,
        });
        continue;
      }

      if (authorityScore < 0.30) {
        rejectedEvidence.push({
          ...item,
          legalDomain: itemDomain,
          precedentStatus,
          admissionStatus: "REJECTED_AUTHORITY",
          rejectionReason: "Authority level is unverified or uncertain, insufficient for legal grounding.",
          metrics,
        });
        continue;
      }

      // Mandatory Invariant: Domain Mismatch cannot be operative evidence
      if (!domainMatch && domainRelevance < 0.20) {
        rejectedEvidence.push({
          ...item,
          legalDomain: itemDomain,
          precedentStatus,
          admissionStatus: "REJECTED_IRRELEVANT",
          rejectionReason: `Legal domain mismatch: Query concerns [${queryDomains.join(", ")}], but candidate belongs to [${itemDomain}].`,
          metrics,
        });
        continue;
      }

      // Mandatory Invariant: Weak semantic relevance cannot become operative evidence solely due to authority/retrieval score
      if (semanticRelevance < 0.30 && !item.exactStructuralMatch && !item.exactCitationMatch) {
        rejectedEvidence.push({
          ...item,
          legalDomain: itemDomain,
          precedentStatus,
          admissionStatus: "REJECTED_IRRELEVANT",
          rejectionReason: `Semantic relevance score (${semanticRelevance.toFixed(2)}) is below minimum threshold (0.30).`,
          metrics,
        });
        continue;
      }

      if (evidenceAdequacy < 0.40) {
        rejectedEvidence.push({
          ...item,
          legalDomain: itemDomain,
          precedentStatus,
          admissionStatus: "INSUFFICIENT_EVIDENCE",
          rejectionReason: `Composite evidence adequacy (${evidenceAdequacy.toFixed(2)}) is insufficient to ground answer.`,
          metrics,
        });
        continue;
      }

      // ADMIT AS OPERATIVE EVIDENCE
      operativeEvidence.push({
        ...item,
        legalDomain: itemDomain,
        precedentStatus,
        admissionStatus: "OPERATIVE",
        metrics,
      });
    }

    // Sort operative evidence by evidence adequacy descending
    operativeEvidence.sort((a, b) => b.metrics.evidenceAdequacy - a.metrics.evidenceAdequacy);

    // Calculate confidence state
    let confidenceState: "HIGH" | "MEDIUM" | "LOW" | "NO_RELEVANT_EVIDENCE" = "NO_RELEVANT_EVIDENCE";
    let overallAdequacyScore = 0.0;

    if (operativeEvidence.length > 0) {
      overallAdequacyScore = operativeEvidence[0].metrics.evidenceAdequacy;
      if (overallAdequacyScore >= 0.75) {
        confidenceState = "HIGH";
      } else if (overallAdequacyScore >= 0.50) {
        confidenceState = "MEDIUM";
      } else {
        confidenceState = "LOW";
      }
    }

    const rationale = operativeEvidence.length > 0
      ? `Admitted ${operativeEvidence.length} operative evidence chunks (highest adequacy: ${overallAdequacyScore.toFixed(2)}). Rejected ${rejectedEvidence.length} candidate items.`
      : `Zero operative evidence admitted. All ${candidates.length} candidate(s) failed evidence admission gates (domain mismatch, insufficient substantive relevance, overruled precedent, or missing authoritative source).`;

    return {
      operativeEvidence,
      rejectedEvidence,
      confidenceState,
      overallAdequacyScore,
      admittedCount: operativeEvidence.length,
      rejectedCount: rejectedEvidence.length,
      rationale,
    };
  }

  /**
   * Helper to evaluate a single candidate item against a query.
   */
  evaluateEvidence(
    item: any,
    query: { query: string; asOfDate?: string; targetJurisdiction?: string }
  ): {
    admitted: boolean;
    decision: string;
    effectiveAuthorityScore?: number;
    reason?: string;
  } {
    const searchQuery: KnowledgeSearchQuery = {
      query: query.query,
      access: { userId: "test_user", firmId: "firm_global", isSuperAdmin: true },
      filter: {
        asOfDate: query.asOfDate,
        jurisdiction: query.targetJurisdiction as any,
      },
      topK: 10,
    };

    const result = this.evaluateCandidates(searchQuery, [item]);
    if (result.operativeEvidence.length > 0) {
      const operative = result.operativeEvidence[0];
      let decision = "ADMITTED";
      if (item.temporalStatus === "HISTORICAL") {
        decision = "ADMITTED_HISTORICAL";
      } else if (item.precedentStatus === "UNCERTAIN") {
        decision = "ADMITTED_UNCERTAIN_PRECEDENT";
      }
      return {
        admitted: true,
        decision,
        effectiveAuthorityScore: operative.metrics?.authorityScore ?? operative.metrics?.evidenceAdequacy ?? 1.0,
      };
    } else {
      const rej = result.rejectedEvidence[0];
      return {
        admitted: false,
        decision: rej?.admissionStatus || rej?.rejectionReason || "REJECTED",
        reason: (rej as any)?.rejectionDetail || rej?.rejectionReason,
      };
    }
  }
}
