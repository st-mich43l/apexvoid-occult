/**
 * Romance Semantic Evidence V0.1 — research-only, non-numeric shadow model.
 *
 * numericAuthority is always "none". This module must never feed V0.10 compose.
 */

export const ROMANCE_SEMANTIC_MODEL_ID = "romance-semantic-v0.1" as const;
export const ROMANCE_SEMANTIC_MODULE = "annual-axes-romance-semantic" as const;

type RomanceSemanticSchool = "nam-phai";

export type RomanceSemanticAdjudication =
  | "VERIFIED_PRIMARY"
  | "VERIFIED_SCHOOL"
  | "EXPERT_SYNTHESIS"
  | "UNVERIFIED"
  | "ENGINEERING_POLICY";

export type RomanceConditionKind =
  | "brightness"
  | "branches"
  | "coStars"
  | "supportStars"
  | "pressureStars"
  | "transformations";

export type RomanceConditionState =
  | "satisfied"
  | "not-satisfied"
  | "unresolved";

export interface RomanceConditionResolution {
  kind: RomanceConditionKind;
  required: string[];
  observed: string[];
  state: RomanceConditionState;
  detail: string;
}

type RomanceClaimStatus =
  | "admitted"
  | "rejected-condition"
  | "unresolved-condition"
  | "rejected-school"
  | "rejected-source"
  | "conflict";

export interface RomanceTendency {
  support?: "up" | "down";
  pressure?: "up" | "down";
  stability?: "up" | "down";
  activation?: "up" | "down";
}

export type RomanceMagnitudeOrdinal =
  | "weak"
  | "moderate"
  | "strong"
  | "unspecified"
  | null;

export interface RomanceSemanticClaimResolution {
  claimId: string;
  palace: string;
  starOrSystem: string;
  school: string;
  adjudication: RomanceSemanticAdjudication | string;
  sourceIds: string[];
  locator?: string;
  locatorType?: string;
  tendency: RomanceTendency;
  magnitudeOrdinal: RomanceMagnitudeOrdinal;
  status: RomanceClaimStatus;
  conditions: RomanceConditionResolution[];
  tier: "A" | "B" | "non-admitted" | "engineering";
}

export interface RomancePalaceBaselineSnapshot {
  palace: string;
  majorStars: Array<{
    name: string;
    brightness: string | null;
    brightnessStatus: string;
  }>;
  rawAxes: {
    support: number;
    pressure: number;
    stability: number;
    activation: number;
  };
  structureNet: number | null;
  score: number;
  annotationCount: number;
  palaceDomainCandidateCount: number;
  doctrineClaimCount: number;
  admittedClaimIds: string[];
  rejectedClaimIds: string[];
  unresolvedClaimIds: string[];
  conflictIds: string[];
  adjudicationDistribution: Record<string, number>;
}

export interface RomanceSemanticConflict {
  key: string;
  palace: string;
  starOrSystem: string;
  axis: "support" | "pressure" | "stability" | "activation";
  claimIds: string[];
  directions: Array<"up" | "down">;
  note: string;
}

export interface RomanceSemanticCoverage {
  observedEligibleStars: number;
  starsWithAnyDoctrineClaim: number;
  starsWithAdmittedClaim: number;
  unresolvedConditionalClaimCount: number;
  expertSynthesisOnlyClaimCount: number;
  verifiedAdmittedClaimCount: number;
  zeroEvidencePalaceCount: number;
  conflictCount: number;
  sourceTierDistribution: Record<string, number>;
  palaceCoverage: Record<
    string,
    {
      observedStars: number;
      doctrineClaims: number;
      admitted: number;
      unresolved: number;
    }
  >;
}

export type RomanceSemanticReportStatus =
  | "available"
  | "partial"
  | "unavailable";

export type RomanceResearchDecision =
  | "ROMANCE_SEMANTIC_EVIDENCE_SUFFICIENT_FOR_NUMERIC_DESIGN"
  | "ROMANCE_SEMANTIC_EVIDENCE_PARTIAL"
  | "INSUFFICIENT_ROMANCE_SEMANTIC_AUTHORITY";

export interface RomanceSemanticReportV01 {
  module: typeof ROMANCE_SEMANTIC_MODULE;
  model: typeof ROMANCE_SEMANTIC_MODEL_ID;
  school: RomanceSemanticSchool;
  status: RomanceSemanticReportStatus;
  numericAuthority: "none";
  scoreImpactAllowed: false;
  anchors: {
    legacy: readonly ["Phu Thê", "Tử Tức"];
    researchComparison: readonly ["Phúc Đức", "Mệnh"];
  };
  observedMajorStars: Array<{ palace: string; name: string; brightness: string | null }>;
  admittedClaims: RomanceSemanticClaimResolution[];
  rejectedClaims: RomanceSemanticClaimResolution[];
  unresolvedClaims: RomanceSemanticClaimResolution[];
  conflicts: RomanceSemanticConflict[];
  supportSignals: string[];
  pressureSignals: string[];
  mixedSignals: string[];
  unresolvedSignals: string[];
  coverage: RomanceSemanticCoverage;
  palaceBaselines: RomancePalaceBaselineSnapshot[];
  diagnostics: string[];
  warnings: string[];
  researchDecision: RomanceResearchDecision;
  provenance: {
    sourceIds: string[];
    claimIds: string[];
  };
}

interface RomanceCaseV10Scores {
  finalScore: number | null;
  natal: number | null;
  decade: number | null;
  annual: number | null;
  resonance: number | null;
  controlScore: number | null;
}

export interface RomanceCaseDiagnosticReport {
  caseId: "CASE-AA10-M1998-DAN-2026";
  annualYear: number;
  v10Romance: RomanceCaseV10Scores;
  romanceSemanticV01: RomanceSemanticReportV01;
  note: string;
}

export interface RomanceCorpusAuditReport {
  model: typeof ROMANCE_SEMANTIC_MODEL_ID;
  school: RomanceSemanticSchool;
  chartCount: number;
  numericAuthority: "none";
  scoreImpactAllowed: false;
  aggregate: {
    observedPhuTheMajorStars: number;
    starsWithDoctrineClaims: number;
    starsWithAdmittedVerifiedClaims: number;
    expertSynthesisOnlyClaims: number;
    unresolvedConditionalCount: number;
    conflictCount: number;
    zeroEvidenceChartCount: number;
    sourceTierDistribution: Record<string, number>;
    palaceCoverageDistribution: Record<string, number>;
  };
  warnings: string[];
  researchDecision: RomanceResearchDecision;
  perChart: Array<{
    solarDate: string;
    birthHour: string;
    status: RomanceSemanticReportStatus;
    admitted: number;
    unresolved: number;
    conflicts: number;
    decision: RomanceResearchDecision;
  }>;
}
