import type { BirthInput } from "@/types/chart";

export const AXIS_ORDINAL_VALUES = ["low", "medium", "high", "unable-to-judge"] as const;
type AxisOrdinal = (typeof AXIS_ORDINAL_VALUES)[number];

export const NET_QUALITY_VALUES = [
  "guarded",
  "neutral",
  "supportive",
  "strong",
  "unable-to-judge",
] as const;
type NetQualityClass = (typeof NET_QUALITY_VALUES)[number];

export const PAIRWISE_RESULT_VALUES = ["LEFT", "RIGHT", "TIE", "UNABLE_TO_JUDGE"] as const;
type PairwiseResult = (typeof PAIRWISE_RESULT_VALUES)[number];

export const CONFIDENCE_VALUES = ["low", "medium", "high"] as const;
type ConfidenceLevel = (typeof CONFIDENCE_VALUES)[number];

export type AxisName = "support" | "pressure" | "stability" | "activation" | "netQuality";
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
  /** Required when any axis is usable. Never inferred as medium. */
  confidence?: ConfidenceLevel;
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
  assignmentId: string;
  caseId: string;
  reviewerId: string;
  school: ZiweiSchool;
  reviewedAt: string;
  blindedToEngine: true;
  rubricVersion: string;
  palaceRatings: PalaceExpertRating[];
  pairwiseComparisons: ExpertPairwiseReview[];
  reviewerConfidence?: ConfidenceLevel;
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

export function palaceRatingIsUsable(p: PalaceExpertRating): boolean {
  return [p.support, p.pressure, p.stability, p.activation, p.netQuality].some(
    (v) => v !== "unable-to-judge",
  );
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
