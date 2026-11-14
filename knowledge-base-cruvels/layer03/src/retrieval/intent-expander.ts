/**
 * LEGAL INTENT & DOCTRINE EXPANDER (Layer 03)
 *
 * Translates factual dispute scenarios and natural language inquiries
 * into precise Indian statutory acts, section numbers, codified doctrines,
 * and semantic expansion keywords.
 */

export interface LegalIntentMapping {
  domain: string;
  doctrine: string;
  pattern: RegExp;
  targetActs: string[];
  targetSections: string[];
  searchTerms: string[];
  keyCases?: string[];
  explanation: string;
}

export interface ExpandedLegalIntent {
  rawQuery: string;
  hasExplicitCitation: boolean;
  matchedDoctrines: string[];
  inferredActs: string[];
  inferredSections: string[];
  expandedTokens: string[];
  keyCases: string[];
  conceptQuery: string;
  primaryActCandidate: string | null;
  primarySectionCandidate: string | null;
}

export const LEGAL_INTENT_KNOWLEDGE_BASE: LegalIntentMapping[] = [
  {
    domain: "Contract & Commercial Law",
    doctrine: "Restraint of Trade / Negative Covenant (Post-Employment)",
    pattern: /\b(?:non-?compete|competing\s+business|competing\s+firm|competitor|restrict(?:s|ing|ion|ive)?\s+.*?(?:working|joining|departure|employment)|prevent(?:s|ing)?\s+.*?(?:working|joining|competitor)|restraint\s+of\s+trade|negative\s+covenant|after\s+departure|after\s+termination)\b/i,
    targetActs: [
      "The Indian Contract Act, 1872",
      "Indian Contract Act, 1872",
      "Indian Contract Act",
    ],
    targetSections: ["27", "28"],
    searchTerms: [
      "restraint of trade",
      "void agreement",
      "lawful profession trade or business",
      "goodwill",
      "negative covenant",
      "employment restriction",
      "exception",
      "sale of goodwill",
    ],
    keyCases: [
      "Niranjan Shankar Golikari v. Century Spg. & Mfg. Co. Ltd. (1967) 2 SCR 378",
      "Superintendence Company of India (P) Ltd. v. Krishan Murgai (1981) 2 SCC 246",
      "Percept D'Mark (India) Pvt. Ltd. v. Zaheer Khan (2006) 4 SCC 227",
    ],
    explanation: "Under Section 27 of the Indian Contract Act, 1872, every agreement restraining anyone from exercising a lawful profession, trade, or business is void to that extent. Post-termination non-compete covenants are strictly void, whereas negative covenants operating during the term of employment are generally enforceable.",
  },
  {
    domain: "Criminal & Commercial Law",
    doctrine: "Cheque Dishonour / Insufficient Funds",
    pattern: /\b(?:cheque\s+dishonou?r|cheque\s+bounce|dishonou?r\s+of\s+cheque|insufficient\s+funds|stop\s+payment|drawer|payee|banker\s+slip|notice\s+under\s+138|(?:refused|failed)\s+to\s+honou?r|returned\s+unpaid|not\s+have\s+enough\s+money|insufficient\s+balance|(?:payment\s+instrument|cheque).*?(?:refused|dishonou?r|unpaid|bounce)|(?:refused|dishonou?r|unpaid).*?(?:money|funds|balance))\b/i,
    targetActs: [
      "The Negotiable Instruments Act, 1881",
      "Negotiable Instruments Act, 1881",
      "Negotiable Instruments Act",
    ],
    targetSections: ["138", "141", "142"],
    searchTerms: ["cheque", "dishonour", "banker", "drawer", "debt or liability", "statutory notice"],
    keyCases: [
      "Dashrath Rupsingh Rathod v. State of Maharashtra (2014) 9 SCC 129",
      "K.S. Joseph v. Philips Carbon Black Ltd.",
    ],
    explanation: "Section 138 of Negotiable Instruments Act creates criminal liability for dishonour of cheques for insufficiency of funds.",
  },
  {
    domain: "Criminal Procedure",
    doctrine: "Police Powers of Arrest without Warrant",
    pattern: /\b(?:arrest\s+without\s+(?:an?\s+order\s+(?:from\s+a\s+magistrate\s+)?(?:or|and)\s+(?:without\s+)?(?:a\s+)?)?warrant|powers?\s+(?:of\s+police\s+(?:officer\s+)?)?to\s+arrest|police\s+officer\s+(?:may\s+arrest|authority)|cognizable\s+arrest|notice\s+of\s+appearance|apprehend\s+(?:a\s+person|someone)?|without\s+(?:court\s+permission\s+or\s+)?(?:arrest\s+)?warrant)\b/i,
    targetActs: [
      "Bharatiya Nagarik Suraksha Sanhita, 2023",
      "Code of Criminal Procedure, 1973",
    ],
    targetSections: ["35", "41"],
    searchTerms: ["arrest without warrant", "cognizable offence", "police officer", "notice of appearance"],
    keyCases: [
      "Arnesh Kumar v. State of Bihar (2014) 8 SCC 273",
      "D.K. Basu v. State of West Bengal (1997) 1 SCC 416",
    ],
    explanation: "Section 35 of BNSS (corresponding to Section 41 CrPC) defines the powers and limitations of police to arrest without a warrant.",
  },
  {
    domain: "Criminal Procedure",
    doctrine: "Anticipatory Bail & Pre-Arrest Protection",
    pattern: /\b(?:anticipatory\s+bail|apprehension\s+of\s+arrest|pre-?arrest\s+bail|direction\s+for\s+grant\s+of\s+bail)\b/i,
    targetActs: [
      "Bharatiya Nagarik Suraksha Sanhita, 2023",
      "Code of Criminal Procedure, 1973",
    ],
    targetSections: ["482", "438"],
    searchTerms: ["anticipatory bail", "apprehension of arrest", "direction for grant of bail"],
    keyCases: [
      "Gurbaksh Singh Sibbia v. State of Punjab (1980) 2 SCC 565",
      "Sushila Aggarwal v. State (NCT of Delhi) (2020) 5 SCC 1",
    ],
    explanation: "Section 482 of BNSS (Section 438 CrPC) governs directions for grant of bail to persons apprehending arrest.",
  },
  {
    domain: "Property Law",
    doctrine: "Determination of Lease & Statutory Notice",
    pattern: /\b(?:lease\s+duration|notice\s+to\s+quit|termination\s+of\s+lease|termination\s+of\s+(?:a\s+)?(?:monthly\s+)?lease|monthly\s+lease|six\s+months?\s+notice|fifteen\s+days?\s+notice|lessor|lessee|immovable\s+property\s+lease)\b/i,
    targetActs: [
      "The Transfer of Property Act, 1882",
      "Transfer of Property Act, 1882",
      "Transfer of Property Act",
    ],
    targetSections: ["106", "105", "111"],
    searchTerms: ["lease", "duration of certain leases", "notice in writing", "agricultural or manufacturing purpose", "termination of lease"],
    explanation: "Section 106 of Transfer of Property Act governs duration and notice requirements for termination of leases.",
  },
  {
    domain: "Arbitration & Dispute Resolution",
    doctrine: "Interim Measures by Court & Arbitral Tribunal",
    pattern: /\b(?:arbitration\s+interim|interim\s+measures|interim\s+relief|section\s+9|appointment\s+of\s+arbitrator|arbitral\s+tribunal)\b/i,
    targetActs: [
      "Arbitration and Conciliation Act, 1996",
      "Arbitration and Conciliation Act",
    ],
    targetSections: ["9", "11", "17", "34"],
    searchTerms: ["interim measures", "preservation of goods", "interim injunction", "arbitral proceedings"],
    explanation: "Section 9 of the Arbitration and Conciliation Act provides for interim measures by the Court before or during arbitral proceedings.",
  },
  {
    domain: "Substantive Criminal Law",
    doctrine: "Cheating & Dishonest Inducement of Property",
    pattern: /\b(?:cheating|dishonestly\s+induc(?:e|ing|ement)|deceiv(?:e|ing)|fraudulent\s+representation)\b/i,
    targetActs: [
      "Bharatiya Nyaya Sanhita, 2023",
      "Indian Penal Code, 1860",
    ],
    targetSections: ["318", "420"],
    searchTerms: ["cheating", "dishonestly inducing delivery of property", "deception"],
    explanation: "Section 318 of BNS (Section 420 IPC) penalizes cheating and dishonestly inducing delivery of property.",
  },
  {
    domain: "Constitutional Law",
    doctrine: "Right to Privacy & Life/Personal Liberty",
    pattern: /\b(?:right\s+to\s+privacy|personal\s+liberty|article\s+21|fundamental\s+freedoms?|arbitrary\s+state\s+action)\b/i,
    targetActs: ["Constitution of India"],
    targetSections: ["21", "14", "19"],
    searchTerms: ["protection of life and personal liberty", "procedure established by law", "privacy"],
    keyCases: [
      "Justice K.S. Puttaswamy v. Union of India (2017) 10 SCC 1",
      "Maneka Gandhi v. Union of India (1978) 1 SCC 248",
    ],
    explanation: "Article 21 guarantees protection of life and personal liberty except according to procedure established by law.",
  },
];

export class LegalIntentExpander {
  /**
   * Analyzes an input query and expands implicit legal doctrines,
   * candidate acts, and specific statutory sections.
   */
  static expandQuery(query: string): ExpandedLegalIntent {
    const q = query.trim();
    const matchedDoctrines: string[] = [];
    const inferredActs = new Set<string>();
    const inferredSections = new Set<string>();
    const expandedTokens = new Set<string>();
    const keyCases = new Set<string>();

    // 1. Direct explicit section & act check
    const secMatch = q.match(/\b(?:section|sec\.?|article|art\.?)\s+([0-9]+[A-Za-z]*)\b/i);
    const hasExplicitCitation = Boolean(secMatch);

    let primaryActCandidate: string | null = null;
    let primarySectionCandidate: string | null = secMatch ? secMatch[1] : null;

    // 2. Scan knowledge base patterns
    for (const mapping of LEGAL_INTENT_KNOWLEDGE_BASE) {
      if (mapping.pattern.test(q)) {
        matchedDoctrines.push(mapping.doctrine);
        mapping.targetActs.forEach((a) => inferredActs.add(a));
        mapping.targetSections.forEach((s) => inferredSections.add(s));
        mapping.searchTerms.forEach((t) => expandedTokens.add(t));
        if (mapping.keyCases) {
          mapping.keyCases.forEach((c) => keyCases.add(c));
        }

        if (!primaryActCandidate && mapping.targetActs.length > 0) {
          primaryActCandidate = mapping.targetActs[0];
        }
        if (!primarySectionCandidate && mapping.targetSections.length > 0) {
          primarySectionCandidate = mapping.targetSections[0];
        }
      }
    }

    const conceptQuery = Array.from(expandedTokens).join(" ");

    return {
      rawQuery: q,
      hasExplicitCitation,
      matchedDoctrines,
      inferredActs: Array.from(inferredActs),
      inferredSections: Array.from(inferredSections),
      expandedTokens: Array.from(expandedTokens),
      keyCases: Array.from(keyCases),
      conceptQuery,
      primaryActCandidate,
      primarySectionCandidate,
    };
  }
}

