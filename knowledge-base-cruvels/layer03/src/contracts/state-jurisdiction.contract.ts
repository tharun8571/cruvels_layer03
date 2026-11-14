/**
 * CRUVELS AI — Layer 03 State & Union Territory Jurisdiction Contract
 *
 * Contract Version: 1.0.0
 *
 * Defines the complete territorial and constitutional jurisdiction model
 * for India (28 States + 8 Union Territories), legislative competence lists
 * under the Seventh Schedule, and state law isolation rules.
 */

export type IndianStateCode =
  | "IN-AP" // Andhra Pradesh
  | "IN-AR" // Arunachal Pradesh
  | "IN-AS" // Assam
  | "IN-BR" // Bihar
  | "IN-CT" // Chhattisgarh
  | "IN-GA" // Goa
  | "IN-GJ" // Gujarat
  | "IN-HR" // Haryana
  | "IN-HP" // Himachal Pradesh
  | "IN-JH" // Jharkhand
  | "IN-KA" // Karnataka
  | "IN-KL" // Kerala
  | "IN-MP" // Madhya Pradesh
  | "IN-MH" // Maharashtra
  | "IN-MN" // Manipur
  | "IN-ML" // Meghalaya
  | "IN-MZ" // Mizoram
  | "IN-NL" // Nagaland
  | "IN-OR" // Odisha
  | "IN-PB" // Punjab
  | "IN-RJ" // Rajasthan
  | "IN-SK" // Sikkim
  | "IN-TN" // Tamil Nadu
  | "IN-TG" // Telangana
  | "IN-TR" // Tripura
  | "IN-UP" // Uttar Pradesh
  | "IN-UT" // Uttarakhand
  | "IN-WB"; // West Bengal

export type IndianUnionTerritoryCode =
  | "IN-AN" // Andaman and Nicobar Islands
  | "IN-CH" // Chandigarh
  | "IN-DH" // Dadra and Nagar Haveli and Daman and Diu
  | "IN-DL" // National Capital Territory of Delhi
  | "IN-JK" // Jammu and Kashmir
  | "IN-LA" // Ladakh
  | "IN-LD" // Lakshadweep
  | "IN-PY"; // Puducherry

export type LegislativeCompetenceList =
  | "LIST_I_UNION"      // Seventh Schedule, List I (Parliament exclusive)
  | "LIST_II_STATE"     // Seventh Schedule, List II (State Legislature exclusive)
  | "LIST_III_CONCURRENT"// Seventh Schedule, List III (Parliament & State concurrent)
  | "RESIDUARY";        // Article 248 (Parliament)

export interface StateJurisdictionDefinition {
  code: IndianStateCode | IndianUnionTerritoryCode | "INDIA";
  name: string;
  type: "NATIONAL" | "STATE" | "UNION_TERRITORY";
  highCourt: string;
  principalBench: string;
  circuitBenches?: string[];
  officialLanguages: string[];
  localTribunals: string[];
}

export interface StateSpecificStatuteRecordV1 {
  statuteId: string;
  title: string;
  stateCode: IndianStateCode | IndianUnionTerritoryCode;
  stateName: string;
  legislativeList: LegislativeCompetenceList;
  passedBy: string; // e.g. "Maharashtra Legislative Assembly"
  assentDate?: string;
  presidentialAssentRequired: boolean; // Article 254(2) for Concurrent List variations
  effectiveFrom: string;
  isCurrentLaw: boolean;
  subjectDomain: string;
  isGloballyApplicable: false; // Mandatory Invariant: State statutes are NEVER globally applicable
  keyProvisions: Array<{
    section: string;
    heading: string;
    text: string;
    diffFromCentralAct?: string;
  }>;
  provenance: {
    officialGazette: string;
    sourceUrl: string;
  };
}
