/**
 * CRUVELS AI — Layer 03 State Jurisdiction & Territorial Engine
 *
 * Implements full jurisdiction modeling for all 28 Indian States & 8 Union Territories,
 * Seventh Schedule legislative competency, state statute isolation, and ambiguous jurisdiction resolution.
 */

import { Injectable, Logger } from "@nestjs/common";
import type {
  IndianStateCode,
  IndianUnionTerritoryCode,
  LegislativeCompetenceList,
  StateJurisdictionDefinition,
  StateSpecificStatuteRecordV1,
} from "../contracts/state-jurisdiction.contract";

export const INDIAN_JURISDICTIONS: Record<string, StateJurisdictionDefinition> = {
  INDIA: {
    code: "INDIA",
    name: "Republic of India",
    type: "NATIONAL",
    highCourt: "Supreme Court of India (Apex)",
    principalBench: "New Delhi",
    officialLanguages: ["Hindi", "English"],
    localTribunals: ["NCLAT", "CAT", "TDSAT", "NGT", "CESTAT", "SAT", "DRAT"],
  },
  // 28 States
  "IN-AP": {
    code: "IN-AP",
    name: "Andhra Pradesh",
    type: "STATE",
    highCourt: "High Court of Andhra Pradesh",
    principalBench: "Amaravati",
    officialLanguages: ["Telugu", "English"],
    localTribunals: ["AP RERA", "AP State Consumer Commission"],
  },
  "IN-AR": {
    code: "IN-AR",
    name: "Arunachal Pradesh",
    type: "STATE",
    highCourt: "Gauhati High Court",
    principalBench: "Guwahati",
    circuitBenches: ["Itanagar"],
    officialLanguages: ["English"],
    localTribunals: ["Arunachal State Consumer Commission"],
  },
  "IN-AS": {
    code: "IN-AS",
    name: "Assam",
    type: "STATE",
    highCourt: "Gauhati High Court",
    principalBench: "Guwahati",
    circuitBenches: ["Kohima", "Aizawl", "Itanagar"],
    officialLanguages: ["Assamese", "Bengali", "Bodo", "English"],
    localTribunals: ["Assam RERA", "Assam State Consumer Commission"],
  },
  "IN-BR": {
    code: "IN-BR",
    name: "Bihar",
    type: "STATE",
    highCourt: "Patna High Court",
    principalBench: "Patna",
    officialLanguages: ["Hindi", "Urdu", "English"],
    localTribunals: ["Bihar RERA", "Bihar State Consumer Commission"],
  },
  "IN-CT": {
    code: "IN-CT",
    name: "Chhattisgarh",
    type: "STATE",
    highCourt: "High Court of Chhattisgarh",
    principalBench: "Bilaspur",
    officialLanguages: ["Hindi", "Chhattisgarhi"],
    localTribunals: ["Chhattisgarh RERA", "CG State Consumer Commission"],
  },
  "IN-GA": {
    code: "IN-GA",
    name: "Goa",
    type: "STATE",
    highCourt: "High Court of Judicature at Bombay",
    principalBench: "Mumbai",
    circuitBenches: ["Panaji"],
    officialLanguages: ["Konkani", "Marathi", "English"],
    localTribunals: ["Goa RERA", "Goa State Consumer Commission"],
  },
  "IN-GJ": {
    code: "IN-GJ",
    name: "Gujarat",
    type: "STATE",
    highCourt: "Gujarat High Court",
    principalBench: "Ahmedabad",
    officialLanguages: ["Gujarati", "Hindi", "English"],
    localTribunals: ["Gujarat RERA", "Gujarat State Consumer Commission"],
  },
  "IN-HR": {
    code: "IN-HR",
    name: "Haryana",
    type: "STATE",
    highCourt: "Punjab and Haryana High Court",
    principalBench: "Chandigarh",
    officialLanguages: ["Hindi", "English"],
    localTribunals: ["HRERA Gurugram", "HRERA Panchkula", "Haryana State Consumer Commission"],
  },
  "IN-HP": {
    code: "IN-HP",
    name: "Himachal Pradesh",
    type: "STATE",
    highCourt: "High Court of Himachal Pradesh",
    principalBench: "Shimla",
    officialLanguages: ["Hindi", "English"],
    localTribunals: ["HP RERA", "HP State Consumer Commission"],
  },
  "IN-JH": {
    code: "IN-JH",
    name: "Jharkhand",
    type: "STATE",
    highCourt: "High Court of Jharkhand",
    principalBench: "Ranchi",
    officialLanguages: ["Hindi", "English"],
    localTribunals: ["Jharkhand RERA", "Jharkhand State Consumer Commission"],
  },
  "IN-KA": {
    code: "IN-KA",
    name: "Karnataka",
    type: "STATE",
    highCourt: "High Court of Karnataka",
    principalBench: "Bengaluru",
    circuitBenches: ["Dharwad", "Kalaburagi"],
    officialLanguages: ["Kannada", "English"],
    localTribunals: ["Karnataka RERA", "Karnataka Administrative Tribunal (KAT)", "Karnataka State Consumer Commission"],
  },
  "IN-KL": {
    code: "IN-KL",
    name: "Kerala",
    type: "STATE",
    highCourt: "High Court of Kerala",
    principalBench: "Kochi",
    officialLanguages: ["Malayalam", "English"],
    localTribunals: ["Kerala RERA", "Kerala State Consumer Commission"],
  },
  "IN-MP": {
    code: "IN-MP",
    name: "Madhya Pradesh",
    type: "STATE",
    highCourt: "High Court of Madhya Pradesh",
    principalBench: "Jabalpur",
    circuitBenches: ["Gwalior", "Indore"],
    officialLanguages: ["Hindi", "English"],
    localTribunals: ["MP RERA", "MP State Consumer Commission"],
  },
  "IN-MH": {
    code: "IN-MH",
    name: "Maharashtra",
    type: "STATE",
    highCourt: "High Court of Judicature at Bombay",
    principalBench: "Mumbai",
    circuitBenches: ["Nagpur", "Aurangabad", "Panaji (Goa)"],
    officialLanguages: ["Marathi", "English"],
    localTribunals: ["MahaRERA", "Maharashtra Administrative Tribunal (MAT)", "State Consumer Commission (MCDRC)"],
  },
  "IN-MN": {
    code: "IN-MN",
    name: "Manipur",
    type: "STATE",
    highCourt: "High Court of Manipur",
    principalBench: "Imphal",
    officialLanguages: ["Meitei (Manipuri)", "English"],
    localTribunals: ["Manipur State Consumer Commission"],
  },
  "IN-ML": {
    code: "IN-ML",
    name: "Meghalaya",
    type: "STATE",
    highCourt: "High Court of Meghalaya",
    principalBench: "Shillong",
    officialLanguages: ["English", "Khasi", "Garo"],
    localTribunals: ["Meghalaya State Consumer Commission"],
  },
  "IN-MZ": {
    code: "IN-MZ",
    name: "Mizoram",
    type: "STATE",
    highCourt: "Gauhati High Court",
    principalBench: "Guwahati",
    circuitBenches: ["Aizawl"],
    officialLanguages: ["Mizo", "English"],
    localTribunals: ["Mizoram State Consumer Commission"],
  },
  "IN-NL": {
    code: "IN-NL",
    name: "Nagaland",
    type: "STATE",
    highCourt: "Gauhati High Court",
    principalBench: "Guwahati",
    circuitBenches: ["Kohima"],
    officialLanguages: ["English"],
    localTribunals: ["Nagaland State Consumer Commission"],
  },
  "IN-OR": {
    code: "IN-OR",
    name: "Odisha",
    type: "STATE",
    highCourt: "Orissa High Court",
    principalBench: "Cuttack",
    officialLanguages: ["Odia", "English"],
    localTribunals: ["Odisha RERA", "Odisha State Consumer Commission"],
  },
  "IN-PB": {
    code: "IN-PB",
    name: "Punjab",
    type: "STATE",
    highCourt: "Punjab and Haryana High Court",
    principalBench: "Chandigarh",
    officialLanguages: ["Punjabi", "English"],
    localTribunals: ["Punjab RERA", "Punjab State Consumer Commission"],
  },
  "IN-RJ": {
    code: "IN-RJ",
    name: "Rajasthan",
    type: "STATE",
    highCourt: "Rajasthan High Court",
    principalBench: "Jodhpur",
    circuitBenches: ["Jaipur"],
    officialLanguages: ["Hindi", "English"],
    localTribunals: ["Rajasthan RERA", "Rajasthan State Consumer Commission"],
  },
  "IN-SK": {
    code: "IN-SK",
    name: "Sikkim",
    type: "STATE",
    highCourt: "High Court of Sikkim",
    principalBench: "Gangtok",
    officialLanguages: ["Nepali", "Sikkimese", "Lepcha", "English"],
    localTribunals: ["Sikkim State Consumer Commission"],
  },
  "IN-TN": {
    code: "IN-TN",
    name: "Tamil Nadu",
    type: "STATE",
    highCourt: "Madras High Court",
    principalBench: "Chennai",
    circuitBenches: ["Madurai"],
    officialLanguages: ["Tamil", "English"],
    localTribunals: ["TNRERA", "Tamil Nadu State Consumer Commission"],
  },
  "IN-TG": {
    code: "IN-TG",
    name: "Telangana",
    type: "STATE",
    highCourt: "High Court for the State of Telangana",
    principalBench: "Hyderabad",
    officialLanguages: ["Telugu", "Urdu", "English"],
    localTribunals: ["Telangana RERA", "Telangana State Consumer Commission"],
  },
  "IN-TR": {
    code: "IN-TR",
    name: "Tripura",
    type: "STATE",
    highCourt: "High Court of Tripura",
    principalBench: "Agartala",
    officialLanguages: ["Bengali", "Kokborok", "English"],
    localTribunals: ["Tripura State Consumer Commission"],
  },
  "IN-UP": {
    code: "IN-UP",
    name: "Uttar Pradesh",
    type: "STATE",
    highCourt: "High Court of Judicature at Allahabad",
    principalBench: "Prayagraj (Allahabad)",
    circuitBenches: ["Lucknow"],
    officialLanguages: ["Hindi", "Urdu", "English"],
    localTribunals: ["UP RERA", "Uttar Pradesh State Consumer Commission"],
  },
  "IN-UT": {
    code: "IN-UT",
    name: "Uttarakhand",
    type: "STATE",
    highCourt: "High Court of Uttarakhand",
    principalBench: "Nainital",
    officialLanguages: ["Hindi", "Sanskrit", "English"],
    localTribunals: ["Uttarakhand RERA", "UK State Consumer Commission"],
  },
  "IN-WB": {
    code: "IN-WB",
    name: "West Bengal",
    type: "STATE",
    highCourt: "Calcutta High Court",
    principalBench: "Kolkata",
    circuitBenches: ["Jalpaiguri", "Port Blair (Andaman)"],
    officialLanguages: ["Bengali", "English"],
    localTribunals: ["WB RERA", "West Bengal Administrative Tribunal"],
  },

  // 8 Union Territories
  "IN-AN": {
    code: "IN-AN",
    name: "Andaman and Nicobar Islands",
    type: "UNION_TERRITORY",
    highCourt: "Calcutta High Court",
    principalBench: "Kolkata",
    circuitBenches: ["Port Blair"],
    officialLanguages: ["Hindi", "English"],
    localTribunals: ["A&N State Consumer Commission"],
  },
  "IN-CH": {
    code: "IN-CH",
    name: "Chandigarh",
    type: "UNION_TERRITORY",
    highCourt: "Punjab and Haryana High Court",
    principalBench: "Chandigarh",
    officialLanguages: ["English", "Hindi", "Punjabi"],
    localTribunals: ["Chandigarh Consumer Commission"],
  },
  "IN-DH": {
    code: "IN-DH",
    name: "Dadra and Nagar Haveli and Daman and Diu",
    type: "UNION_TERRITORY",
    highCourt: "High Court of Judicature at Bombay",
    principalBench: "Mumbai",
    officialLanguages: ["Gujarati", "Hindi", "English"],
    localTribunals: ["D&NH Consumer Commission"],
  },
  "IN-DL": {
    code: "IN-DL",
    name: "National Capital Territory of Delhi",
    type: "UNION_TERRITORY",
    highCourt: "High Court of Delhi",
    principalBench: "New Delhi",
    officialLanguages: ["Hindi", "English", "Punjabi", "Urdu"],
    localTribunals: ["Delhi RERA", "Central Administrative Tribunal", "Delhi State Consumer Commission"],
  },
  "IN-JK": {
    code: "IN-JK",
    name: "Jammu and Kashmir",
    type: "UNION_TERRITORY",
    highCourt: "High Court of Jammu & Kashmir and Ladakh",
    principalBench: "Srinagar / Jammu",
    officialLanguages: ["Kashmiri", "Dogri", "Urdu", "Hindi", "English"],
    localTribunals: ["J&K RERA", "J&K State Consumer Commission"],
  },
  "IN-LA": {
    code: "IN-LA",
    name: "Ladakh",
    type: "UNION_TERRITORY",
    highCourt: "High Court of Jammu & Kashmir and Ladakh",
    principalBench: "Srinagar / Jammu",
    circuitBenches: ["Leh"],
    officialLanguages: ["Ladakhi", "Hindi", "English", "Urdu"],
    localTribunals: ["Ladakh Consumer Forum"],
  },
  "IN-LD": {
    code: "IN-LD",
    name: "Lakshadweep",
    type: "UNION_TERRITORY",
    highCourt: "High Court of Kerala",
    principalBench: "Kochi",
    officialLanguages: ["Malayalam", "English"],
    localTribunals: ["Lakshadweep Consumer Forum"],
  },
  "IN-PY": {
    code: "IN-PY",
    name: "Puducherry",
    type: "UNION_TERRITORY",
    highCourt: "Madras High Court",
    principalBench: "Chennai",
    officialLanguages: ["Tamil", "French", "English"],
    localTribunals: ["Puducherry State Consumer Commission"],
  },
};

@Injectable()
export class StateJurisdictionService {
  private readonly logger = new Logger(StateJurisdictionService.name);
  private readonly stateStatutes = new Map<string, StateSpecificStatuteRecordV1>();

  constructor() {
    this.seedStateStatutes();
  }

  /**
   * Resolves jurisdiction from query tokens, target parameter, or inferred state context.
   */
  resolveQueryJurisdiction(query: string, targetJurisdiction?: string): {
    jurisdictionCode: string;
    jurisdictionName: string;
    isStateSpecific: boolean;
    clarificationRequired: boolean;
    clarificationReason?: string;
  } {
    const qLower = query.toLowerCase();

    // 1. Explicit target code provided
    if (targetJurisdiction && INDIAN_JURISDICTIONS[targetJurisdiction]) {
      const def = INDIAN_JURISDICTIONS[targetJurisdiction];
      return {
        jurisdictionCode: def.code,
        jurisdictionName: def.name,
        isStateSpecific: def.code !== "INDIA",
        clarificationRequired: false,
      };
    }

    // 2. Keyword detection for specific States / UTs
    if (qLower.includes("maharashtra") || qLower.includes("mumbai") || qLower.includes("pune") || qLower.includes("bombay")) {
      return { jurisdictionCode: "IN-MH", jurisdictionName: "Maharashtra", isStateSpecific: true, clarificationRequired: false };
    }
    if (qLower.includes("delhi") || qLower.includes("ncr") || qLower.includes("new delhi")) {
      return { jurisdictionCode: "IN-DL", jurisdictionName: "Delhi (NCT)", isStateSpecific: true, clarificationRequired: false };
    }
    if (qLower.includes("karnataka") || qLower.includes("bangalore") || qLower.includes("bengaluru")) {
      return { jurisdictionCode: "IN-KA", jurisdictionName: "Karnataka", isStateSpecific: true, clarificationRequired: false };
    }
    if (qLower.includes("tamil nadu") || qLower.includes("chennai") || qLower.includes("madras")) {
      return { jurisdictionCode: "IN-TN", jurisdictionName: "Tamil Nadu", isStateSpecific: true, clarificationRequired: false };
    }
    if (qLower.includes("west bengal") || qLower.includes("kolkata") || qLower.includes("calcutta")) {
      return { jurisdictionCode: "IN-WB", jurisdictionName: "West Bengal", isStateSpecific: true, clarificationRequired: false };
    }
    if (qLower.includes("uttar pradesh") || qLower.includes("lucknow") || qLower.includes("noida") || qLower.includes("allahabad")) {
      return { jurisdictionCode: "IN-UP", jurisdictionName: "Uttar Pradesh", isStateSpecific: true, clarificationRequired: false };
    }

    // 3. Check for Subject Matter needing State Clarification (e.g. Rent Control, State Excise, Land Revenue)
    const isStateListSubject = /\b(?:rent\s+control|standard\s+rent|land\s+revenue|tenancy\s+act|stamp\s+duty\s+rate|local\s+police\s+rules|panchayat\s+election)\b/i.test(qLower);
    if (isStateListSubject) {
      return {
        jurisdictionCode: "UNKNOWN",
        jurisdictionName: "Ambiguous State Jurisdiction",
        isStateSpecific: true,
        clarificationRequired: true,
        clarificationReason: "Rent control, land revenue, and stamp duty are governed by State-specific Acts under List II of the Seventh Schedule. Please specify the applicable Indian State.",
      };
    }

    // Default to Pan-India National Jurisdiction
    return {
      jurisdictionCode: "INDIA",
      jurisdictionName: "Republic of India",
      isStateSpecific: false,
      clarificationRequired: false,
    };
  }

  /**
   * Registers a state-specific statute.
   */
  registerStateStatute(statute: StateSpecificStatuteRecordV1): void {
    this.stateStatutes.set(statute.statuteId, statute);
  }

  /**
   * Retrieves state statutes for a specific state code.
   */
  getStateStatutes(stateCode: string): StateSpecificStatuteRecordV1[] {
    return Array.from(this.stateStatutes.values()).filter((s) => s.stateCode === stateCode);
  }

  /**
   * Alias for getStateStatutes.
   */
  getStatutesForJurisdiction(stateCode: string): StateSpecificStatuteRecordV1[] {
    return this.getStateStatutes(stateCode);
  }

  /**
   * Validates if a state statute can be admitted for a query jurisdiction.
   * Invariant: State statutes can NEVER be admitted for extra-state queries.
   */
  canAdmitStateStatute(statuteStateCode: string, queryJurisdictionCode: string): boolean {
    if (queryJurisdictionCode === "INDIA" || queryJurisdictionCode === "INDIAN") {
      // Allowed as state-level illustration only if explicitly flagged
      return false;
    }
    return statuteStateCode === queryJurisdictionCode;
  }

  private seedStateStatutes(): void {
    // 1. Maharashtra Rent Control Act, 1999 (State List II)
    this.registerStateStatute({
      statuteId: "stat_mh_rent_control_1999",
      title: "Maharashtra Rent Control Act, 1999",
      stateCode: "IN-MH",
      stateName: "Maharashtra",
      legislativeList: "LIST_II_STATE",
      passedBy: "Maharashtra Legislative Assembly",
      presidentialAssentRequired: false,
      effectiveFrom: "2000-03-31",
      isCurrentLaw: true,
      subjectDomain: "PROPERTY",
      isGloballyApplicable: false,
      keyProvisions: [
        {
          section: "Section 15",
          heading: "No ejectment ordinarily to be made if tenant pays standard rent",
          text: "A landlord shall not be entitled to the recovery of possession of any premises so long as the tenant pays, or is ready and willing to pay, the amount of the standard rent and permitted increases.",
        },
        {
          section: "Section 16",
          heading: "When landlord may recover possession",
          text: "A landlord may recover possession if the premises are reasonably and bona fide required by the landlord for occupation by himself, or for building/repair without eviction of others.",
        },
        {
          section: "Section 24",
          heading: "Landlord entitled to recover possession of premises given on licence on expiry",
          text: "Notwithstanding anything contained in this Act, a licensee in possession or occupation of premises given to him on licence for residence shall deliver possession of such premises to the landlord on expiry of the period of licence.",
        },
      ],
      provenance: {
        officialGazette: "Maharashtra Government Gazette, Part IV, March 2000",
        sourceUrl: "https://bombayhighcourt.nic.in/libweb/acts/2000.18.pdf",
      },
    });

    // 2. Maharashtra Land Revenue Code, 1966
    this.registerStateStatute({
      statuteId: "stat_mh_land_revenue_1966",
      title: "Maharashtra Land Revenue Code, 1966",
      stateCode: "IN-MH",
      stateName: "Maharashtra",
      legislativeList: "LIST_II_STATE",
      passedBy: "Maharashtra Legislative Assembly",
      presidentialAssentRequired: false,
      effectiveFrom: "1966-12-30",
      isCurrentLaw: true,
      subjectDomain: "PROPERTY",
      isGloballyApplicable: false,
      keyProvisions: [
        {
          section: "Section 44",
          heading: "Procedure for conversion of use of land from one purpose to another (NA Permission)",
          text: "If an occupant of land assessed or held for the purpose of agriculture wishes to use it for any other purpose, he shall apply to the Collector for permission.",
        },
      ],
      provenance: {
        officialGazette: "Maharashtra Government Gazette, 1966",
        sourceUrl: "https://bombayhighcourt.nic.in",
      },
    });

    // 3. Maharashtra Stamp Act, 1958
    this.registerStateStatute({
      statuteId: "stat_mh_stamp_1958",
      title: "Maharashtra Stamp Act, 1958",
      stateCode: "IN-MH",
      stateName: "Maharashtra",
      legislativeList: "LIST_II_STATE",
      passedBy: "Maharashtra Legislative Assembly",
      presidentialAssentRequired: false,
      effectiveFrom: "1959-03-03",
      isCurrentLaw: true,
      subjectDomain: "COMMERCIAL",
      isGloballyApplicable: false,
      keyProvisions: [
        {
          section: "Section 34",
          heading: "Instruments not duly stamped inadmissible in evidence",
          text: "No instrument chargeable with duty shall be admitted in evidence for any purpose by any person having by law or consent of parties authority to receive evidence, or shall be acted upon, unless such instrument is duly stamped.",
        },
      ],
      provenance: {
        officialGazette: "Maharashtra Government Gazette",
        sourceUrl: "https://igrmaharashtra.gov.in",
      },
    });

    // 4. Karnataka Rent Act, 1999 (State List II)
    this.registerStateStatute({
      statuteId: "stat_ka_rent_act_1999",
      title: "Karnataka Rent Act, 1999",
      stateCode: "IN-KA",
      stateName: "Karnataka",
      legislativeList: "LIST_II_STATE",
      passedBy: "Karnataka Legislative Assembly",
      presidentialAssentRequired: false,
      effectiveFrom: "2001-11-27",
      isCurrentLaw: true,
      subjectDomain: "PROPERTY",
      isGloballyApplicable: false,
      keyProvisions: [
        {
          section: "Section 27",
          heading: "Protection of tenants against eviction",
          text: "Notwithstanding anything contained in any other law or contract, no order or decree for recovery of possession of any premises shall be made by court except on specified grounds under this section.",
        },
        {
          section: "Section 31",
          heading: "Immediate possession of premises to accrue to members of the armed forces, etc.",
          text: "Right to recover immediate possession of premises to accrue to a member of armed forces or widow/dependent on certificate of prescribed authority.",
        },
      ],
      provenance: {
        officialGazette: "Karnataka Gazette Extraordinary",
        sourceUrl: "https://dpal.karnataka.gov.in",
      },
    });

    // 5. Karnataka Land Revenue Act, 1964
    this.registerStateStatute({
      statuteId: "stat_ka_land_revenue_1964",
      title: "Karnataka Land Revenue Act, 1964",
      stateCode: "IN-KA",
      stateName: "Karnataka",
      legislativeList: "LIST_II_STATE",
      passedBy: "Karnataka Legislative Assembly",
      presidentialAssentRequired: false,
      effectiveFrom: "1964-03-19",
      isCurrentLaw: true,
      subjectDomain: "PROPERTY",
      isGloballyApplicable: false,
      keyProvisions: [
        {
          section: "Section 95",
          heading: "Uses of agricultural land and the procedure for use of agricultural land for other purposes",
          text: "An occupant of land assessed or held for the purpose of agriculture wishing to divert such land or any part thereof to any other purpose shall apply to the Deputy Commissioner for permission.",
        },
      ],
      provenance: {
        officialGazette: "Karnataka Gazette",
        sourceUrl: "https://dpal.karnataka.gov.in",
      },
    });

    // 6. Delhi Rent Control Act, 1958 (NCT of Delhi)
    this.registerStateStatute({
      statuteId: "stat_dl_rent_control_1958",
      title: "Delhi Rent Control Act, 1958",
      stateCode: "IN-DL",
      stateName: "National Capital Territory of Delhi",
      legislativeList: "LIST_II_STATE",
      passedBy: "Parliament of India (for UT of Delhi)",
      presidentialAssentRequired: false,
      effectiveFrom: "1959-02-09",
      isCurrentLaw: true,
      subjectDomain: "PROPERTY",
      isGloballyApplicable: false,
      keyProvisions: [
        {
          section: "Section 14",
          heading: "Protection of tenant against eviction",
          text: "Notwithstanding anything to the contrary contained in any other law or contract, no order or decree for recovery of possession of any premises shall be made by any court or Controller in favour of the landlord against a tenant.",
        },
        {
          section: "Section 14(1)(e)",
          heading: "Bona fide requirement eviction ground",
          text: "That the premises let for residential purposes are required bona fide by the landlord for occupation as a residence for himself or for any member of his family dependent on him.",
        },
      ],
      provenance: {
        officialGazette: "Gazette of India",
        sourceUrl: "https://delhihighcourt.nic.in",
      },
    });

    // 7. Tamil Nadu Tenancy Act, 2017
    this.registerStateStatute({
      statuteId: "stat_tn_tenancy_2017",
      title: "Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act, 2017",
      stateCode: "IN-TN",
      stateName: "Tamil Nadu",
      legislativeList: "LIST_II_STATE",
      passedBy: "Tamil Nadu Legislative Assembly",
      presidentialAssentRequired: false,
      effectiveFrom: "2019-02-22",
      isCurrentLaw: true,
      subjectDomain: "PROPERTY",
      isGloballyApplicable: false,
      keyProvisions: [
        {
          section: "Section 4",
          heading: "Tenancy Agreement mandatory registration",
          text: "Notwithstanding anything contained in this Act or any other law, no person shall let or take on rent any premises except by an agreement in writing registered with the Rent Authority.",
        },
        {
          section: "Section 21",
          heading: "Repossession of premises by landlord",
          text: "The Rent Court may, on an application made to it in the prescribed manner, make an order for the recovery of possession of the premises on specified grounds.",
        },
      ],
      provenance: {
        officialGazette: "Tamil Nadu Government Gazette",
        sourceUrl: "https://www.tenancy.tn.gov.in",
      },
    });

    // 8. UP Regulation of Urban Premises Tenancy Act, 2021
    this.registerStateStatute({
      statuteId: "stat_up_tenancy_2021",
      title: "Uttar Pradesh Regulation of Urban Premises Tenancy Act, 2021",
      stateCode: "IN-UP",
      stateName: "Uttar Pradesh",
      legislativeList: "LIST_II_STATE",
      passedBy: "Uttar Pradesh Legislative Assembly",
      presidentialAssentRequired: false,
      effectiveFrom: "2021-01-11",
      isCurrentLaw: true,
      subjectDomain: "PROPERTY",
      isGloballyApplicable: false,
      keyProvisions: [
        {
          section: "Section 4",
          heading: "Mandatory Tenancy Agreement",
          text: "No person shall let or take on rent any premises except by an agreement in writing, informed to the Rent Authority in prescribed form.",
        },
      ],
      provenance: {
        officialGazette: "UP Government Gazette",
        sourceUrl: "https://allahabadhighcourt.in",
      },
    });

    // 9. West Bengal Premises Tenancy Act, 1997
    this.registerStateStatute({
      statuteId: "stat_wb_tenancy_1997",
      title: "West Bengal Premises Tenancy Act, 1997",
      stateCode: "IN-WB",
      stateName: "West Bengal",
      legislativeList: "LIST_II_STATE",
      passedBy: "West Bengal Legislative Assembly",
      presidentialAssentRequired: false,
      effectiveFrom: "2001-07-10",
      isCurrentLaw: true,
      subjectDomain: "PROPERTY",
      isGloballyApplicable: false,
      keyProvisions: [
        {
          section: "Section 6",
          heading: "Protection of tenant against eviction",
          text: "Notwithstanding anything to the contrary contained in any other law for the time being in force, no order or decree for recovery of possession of any premises shall be made by the Controller or Court except on application.",
        },
      ],
      provenance: {
        officialGazette: "Kolkata Gazette Extraordinary",
        sourceUrl: "https://calcuttahighcourt.gov.in",
      },
    });
  }
}
