import type { BirthInput } from "@/types/chart";

export type AxisName = "support" | "pressure" | "stability" | "activation" | "netQuality";
type AxisOrdinal = "low" | "medium" | "high" | "unable-to-judge";
type NetQualityClass =
  | "guarded"
  | "neutral"
  | "supportive"
  | "strong"
  | "unable-to-judge";
type PairwiseResult = "LEFT" | "RIGHT" | "TIE" | "UNABLE_TO_JUDGE";
type ZiweiSchool = "nam-phai" | "trung-chau";

export interface ExpertBenchmarkCase {
  caseId: string;
  input: BirthInput;
  eligibleSchools: ZiweiSchool[];
  cohortTags: string[];
  createdAt: string;
  splitAssignment: "calibration" | "holdout";
  splitVersion: string;
}

export interface PalaceExpertRating {
  palaceName: string;
  support: AxisOrdinal;
  pressure: AxisOrdinal;
  stability: AxisOrdinal;
  activation: AxisOrdinal;
  netQuality: NetQualityClass;
  confidence: "low" | "medium" | "high";
  doctrineNotes?: string;
}

export interface ExpertPairwiseReview {
  reviewerId: string;
  school: ZiweiSchool;
  caseId: string;
  axis: AxisName;
  leftPalace: string;
  rightPalace: string;
  result: PairwiseResult;
}

export interface ExpertReviewer {
  id: string;
  displayName?: string;
  schools: ZiweiSchool[];
  status: "active" | "inactive";
  expertiseNotes?: string;
  addedAt: string;
}

export interface ExpertReview {
  reviewId: string;
  caseId: string;
  reviewerId: string;
  school: ZiweiSchool;
  reviewedAt: string;
  blindedToEngine: true;
  palaceRatings: PalaceExpertRating[];
  pairwiseComparisons: ExpertPairwiseReview[];
  reviewerConfidence?: "low" | "medium" | "high";
  notes?: string;
}

export interface ExpertAdjudication {
  caseId: string;
  school: ZiweiSchool;
  palaceName: string;
  axis: AxisName;
  reviewerIds: string[];
  decision: string;
  adjudicator: string;
  rationale: string;
  sourceReferences: string[];
}

export function reliabilityUnitId(
  caseId: string,
  school: string,
  palaceName: string,
  axis: string,
): string {
  return JSON.stringify([caseId, school, palaceName, axis]);
}

export function parseReliabilityUnitId(id: string): {
  caseId: string;
  school: string;
  palaceName: string;
  axis: string;
} {
  const parsed = JSON.parse(id) as unknown;
  if (
    !Array.isArray(parsed) ||
    parsed.length !== 4 ||
    parsed.some((x) => typeof x !== "string")
  ) {
    throw new Error(`invalid reliability unit id: ${id}`);
  }
  return {
    caseId: parsed[0] as string,
    school: parsed[1] as string,
    palaceName: parsed[2] as string,
    axis: parsed[3] as string,
  };
}

export function pairwiseLogicalKey(
  caseId: string,
  school: string,
  axis: string,
  leftPalace: string,
  rightPalace: string,
): string {
  const palaces = [leftPalace, rightPalace].sort();
  return JSON.stringify([caseId, school, axis, palaces[0], palaces[1]]);
}
