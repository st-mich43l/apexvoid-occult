/**
 * Research-only types for PR #265 post-Trung-Châu Khoa correction sensitivity.
 * Not imported by production routers.
 */

export const CORRECTED_STEMS = ["Mậu", "Nhâm"] as const;

export type SensitivityClassification =
  | "PHYSICAL_CORRECTION_PROPAGATION"
  | "EXPECTED_ANALYSIS_RESPONSE"
  | "MODEL_INSTABILITY"
  | "COVERAGE_GAP"
  | "UNEXPECTED_DELTA";

export type ExposureCohort =
  | "NATAL_ONLY"
  | "ANNUAL_ONLY"
  | "MAJOR_ONLY"
  | "MULTI_LAYER"
  | "NO_EXPOSURE";

export interface CorrectionExposure {
  natalStem: string | null;
  annualStem: string | null;
  majorStem: string | null;
  lunarMonth?: number;
  monthlyCalendarStem?: string | null;
  natalKhoaChanged: boolean;
  annualKhoaChanged: boolean;
  majorKhoaChanged: boolean;
  monthlyKhoaChanged: boolean;
}

export interface NumericDeltaStats {
  count: number;
  changedCount: number;
  unchangedCount: number;
  meanSignedDelta: number;
  meanAbsoluteDelta: number;
  medianAbsoluteDelta: number;
  p95AbsoluteDelta: number;
  maxAbsoluteDelta: number;
}

export interface ModuleSummaryRow {
  module: string;
  observations: number;
  exposed: number;
  changed: number;
  controlMaxAbsDelta: number;
  medianAbsDelta: number | "N/A";
  p95AbsDelta: number | "N/A";
  maxAbsDelta: number | "N/A";
  bandFlips: number | "N/A";
  verdict: string;
}

export interface PolicyCellDiff {
  stem: string;
  mutagen: string;
  from: string;
  to: string;
}
