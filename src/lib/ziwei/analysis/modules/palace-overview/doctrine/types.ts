export interface PalaceDomainModifierCandidate {
  claimIds: string[];
  starOrSystem: string;
  palace: string;
  tendency: string;
  strengthOrdinal: string | null;
  numericDelta: null;
  status: "research-only";
}

export interface SupportPressureConflict {
  present: boolean;
  support: number;
  pressure: number;
  note: string;
}

export interface CoverageComponents {
  frame: number;
  principalStarIdentity: number;
  stateBrightness: number;
  minorStarMapping: number;
  transformationMapping: number;
  schoolPolicyResolution: number;
  domainDoctrine: number;
}

export const COVERAGE_COMPOSITE_POLICY =
  "Legacy evidenceCompleteness remains the V1 penalty formula so numeric freeze snapshots stay stable. Component scores are parallel metadata and never modify score.";
