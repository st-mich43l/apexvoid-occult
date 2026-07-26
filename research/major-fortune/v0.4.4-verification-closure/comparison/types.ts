export type MajorFortuneComparisonProfile =
  | "exact-scoring"
  | "fallback-equivalence"
  | "control-equivalence"
  | "timeline-equivalence"
  | "temporal-independence";

export interface MajorFortuneObservationComparisonOptions {
  profile: MajorFortuneComparisonProfile;
  allowedMetadataPaths?: string[];
}

export interface MajorFortuneObservationDifference {
  path: string;
  baseValue: unknown;
  currentValue: unknown;
}

export interface MajorFortuneObservationComparisonResult {
  observationId: string;
  passed: boolean;
  differences: MajorFortuneObservationDifference[];
}

export interface MajorFortuneObservationSetComparisonReport {
  comparedObservationCount: number;
  matchingObservationCount: number;
  mismatchingObservationCount: number;
  differenceRowCount: number;
  missingBaselineIds: string[];
  missingCurrentIds: string[];
  differences: MajorFortuneObservationComparisonResult[];
}
