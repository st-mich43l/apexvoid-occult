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

type LocatorType =
  | "EXACT_SECTION"
  | "EXACT_LINE_OR_PARAGRAPH"
  | "PAGE"
  | "BIBLIOGRAPHIC_ONLY"
  | "INTERNAL";

type DoctrineAdjudication =
  | "VERIFIED_PRIMARY"
  | "VERIFIED_SCHOOL"
  | "UNVERIFIED"
  | "EXPERT_SYNTHESIS"
  | "ENGINEERING_POLICY";

export interface MajorStarPalaceClaim {
  claimId: string;
  star: string;
  palace: string;
  school: "classical-shared" | "nam-phai" | "trung-chau";
  conditions: {
    brightness?: string[];
    branches?: string[];
    coStars?: string[];
    supportStars?: string[];
    pressureStars?: string[];
    transformations?: string[];
  };
  tendency: {
    support?: "up" | "down";
    pressure?: "up" | "down";
    stability?: "up" | "down";
    activation?: "up" | "down";
  };
  magnitudeOrdinal?: "weak" | "moderate" | "strong" | "unspecified";
  sourceIds: string[];
  locator: string;
  locatorType: LocatorType;
  adjudication: DoctrineAdjudication;
  numericDelta: null;
  scoringAuthority?: string;
}

export interface HonestDoctrineCoverage {
  directPrimaryClaims: number;
  conditionalPrimaryClaims: number;
  schoolSpecificClaims: number;
  expertSynthesisClaims: number;
  unknownPairs: number;
  contradictedPairs: number;
  unresolvedConditions: number;
  uniqueClaimedPairs: number;
  cartesianCells: number;
  byPalace: Record<string, number>;
  byStar: Record<string, number>;
  bySchool: Record<string, number>;
  bySourceTier: Record<string, number>;
}
