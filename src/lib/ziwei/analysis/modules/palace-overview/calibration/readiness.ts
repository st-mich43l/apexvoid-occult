import casesRaw from "../../../knowledge/palace-overview/v1/benchmark/expert-benchmark-cases.v2.json";
import splitRaw from "../../../knowledge/palace-overview/v1/benchmark/calibration-holdout-split.v2.json";
import policyRaw from "../../../knowledge/palace-overview/v1/benchmark/readiness-policy.v2.json";
import {
  loadBenchmarkSplitV2,
  loadExpertReviewsV2,
  multiReviewerCaseSchoolCount,
  pairwiseCount,
  reliabilityByAxis,
  reviewedCaseSchoolCountBySchool,
  reviewedChartCountV2,
  uniqueReviewerIds,
} from "./reviews-v2";
import { assignCaseSplit } from "./split-v2";
import type { ExpertBenchmarkCase } from "./benchmark-v2-types";

export interface BenchmarkSplit {
  id?: string;
  frozenAt?: string;
  policy: string;
  calibrationCaseIds: string[];
  holdoutCaseIds: string[];
  notes?: string;
}

interface PolicyFile {
  thresholds: {
    floorReviewedCharts: { value: number };
    preferredReviewedCharts: { value: number };
    minReviewedCaseSchoolNamPhai: { value: number };
    minReviewedCaseSchoolTrungChau: { value: number };
    multiReviewerCaseSchoolCount: { value: number };
    minPairwiseComparisons: { value: number };
    holdoutNonEmpty: { value: boolean };
    krippendorffMustBeComputable: { value: boolean };
  };
}

const policy = policyRaw as PolicyFile;
const cases = (casesRaw as { cases: ExpertBenchmarkCase[] }).cases;
const split = splitRaw as BenchmarkSplit;

export function loadBenchmarkSplit(): BenchmarkSplit {
  return loadBenchmarkSplitV2();
}

export function reviewedPalaceLabelCount(): number {
  return loadExpertReviewsV2().reduce((n, r) => n + r.palaceRatings.length, 0);
}

export function reviewedChartCount(): number {
  return reviewedChartCountV2();
}

export function uniqueReviewers(): string[] {
  return uniqueReviewerIds();
}

export interface BenchmarkReadiness {
  ready: boolean;
  reason: "GO_FOR_CALIBRATION" | "NO_GO_FOR_CALIBRATION";
  chartCount: number;
  reviewedPalaceLabels: number;
  reviewerCount: number;
  requiredCharts: number;
  requiredHoldout: number;
  requiredPairwise: number;
  requiredMultiReviewerCharts: number;
  holdoutCount: number;
  pairwiseCount: number;
  schools: string[];
  reviewedCaseSchoolCount: Record<string, number>;
  multiReviewerCaseSchoolCount: number;
  krippendorffAlpha: number | null;
  krippendorffByAxis: Record<string, number | null>;
  missing: string[];
}

export function assessBenchmarkReadiness(): BenchmarkReadiness {
  const reviews = loadExpertReviewsV2();
  const chartCount = reviewedChartCountV2(reviews);
  const reviewedPalaceLabels = reviewedPalaceLabelCount();
  const reviewerCount = uniqueReviewerIds(reviews).length;
  const holdoutCount = split.holdoutCaseIds.length;
  const pairwise = pairwiseCount(reviews);
  const schoolCounts = reviewedCaseSchoolCountBySchool(reviews);
  const multi = multiReviewerCaseSchoolCount(reviews);
  const byAxis = reliabilityByAxis(reviews);
  const alphaSupport = byAxis.support.alpha;
  const missing: string[] = [];
  const t = policy.thresholds;

  if (chartCount < t.floorReviewedCharts.value) {
    missing.push(`reviewedCharts>=${t.floorReviewedCharts.value}`);
  }
  if (schoolCounts["nam-phai"]! < t.minReviewedCaseSchoolNamPhai.value) {
    missing.push(`reviewedCaseSchoolCount[nam-phai]>=${t.minReviewedCaseSchoolNamPhai.value}`);
  }
  if (schoolCounts["trung-chau"]! < t.minReviewedCaseSchoolTrungChau.value) {
    missing.push(`reviewedCaseSchoolCount[trung-chau]>=${t.minReviewedCaseSchoolTrungChau.value}`);
  }
  if (split.calibrationCaseIds.length === 0) missing.push("non-empty-calibration");
  if (t.holdoutNonEmpty.value && holdoutCount < 1) missing.push("non-empty-holdout");
  if (pairwise < t.minPairwiseComparisons.value) {
    missing.push(`pairwise>=${t.minPairwiseComparisons.value}`);
  }
  if (multi < t.multiReviewerCaseSchoolCount.value) {
    missing.push(`multiReviewerCaseSchoolCount>=${t.multiReviewerCaseSchoolCount.value}`);
  }
  if (t.krippendorffMustBeComputable.value && alphaSupport == null) {
    missing.push("krippendorff-alpha-computable");
  }
  if (reviewedPalaceLabels === 0) missing.push("reviewed-palace-labels");

  const ready = missing.length === 0;
  return {
    ready,
    reason: ready ? "GO_FOR_CALIBRATION" : "NO_GO_FOR_CALIBRATION",
    chartCount,
    reviewedPalaceLabels,
    reviewerCount,
    requiredCharts: t.floorReviewedCharts.value,
    requiredHoldout: 1,
    requiredPairwise: t.minPairwiseComparisons.value,
    requiredMultiReviewerCharts: t.multiReviewerCaseSchoolCount.value,
    holdoutCount,
    pairwiseCount: pairwise,
    schools: Object.entries(schoolCounts)
      .filter(([, n]) => n > 0)
      .map(([s]) => s),
    reviewedCaseSchoolCount: schoolCounts,
    multiReviewerCaseSchoolCount: multi,
    krippendorffAlpha: alphaSupport,
    krippendorffByAxis: {
      support: byAxis.support.alpha,
      pressure: byAxis.pressure.alpha,
      stability: byAxis.stability.alpha,
      activation: byAxis.activation.alpha,
      netQuality: byAxis.netQuality.alpha,
    },
    missing,
  };
}

export const KRIPPENDORFF_POLICY =
  "Equal-spaced ordered categories; δ²=(rank_i-rank_j)². Alpha is diagnostic plus gating evidence, not a single global floor. Insufficient overlap → NOT_COMPUTABLE. Conventional 0.67 is comment-only, not the sole GO condition.";

export function assertSplitIsByCompleteChart(): boolean {
  const ids = new Set(cases.map((c) => c.caseId));
  for (const id of [...split.calibrationCaseIds, ...split.holdoutCaseIds]) {
    if (!ids.has(id)) return false;
  }
  const overlap = split.calibrationCaseIds.filter((id) => split.holdoutCaseIds.includes(id));
  if (overlap.length !== 0) return false;
  for (const c of cases) {
    if (assignCaseSplit(c.caseId) !== c.splitAssignment) return false;
    const expectedBucket =
      c.splitAssignment === "calibration" ? split.calibrationCaseIds : split.holdoutCaseIds;
    if (!expectedBucket.includes(c.caseId)) return false;
  }
  return true;
}

export interface Stage3Decision {
  research: "READY_FOR_EXPERT_DATA_COLLECTION" | "RESEARCH_BLOCKED";
  calibration: "NO_GO" | "GO_FOR_CALIBRATION";
  shadow: "NO_GO";
  production: "NO_GO";
}

export function stage3Decision(infrastructureOk: boolean): Stage3Decision {
  const calibration = assessBenchmarkReadiness();
  return {
    research: infrastructureOk ? "READY_FOR_EXPERT_DATA_COLLECTION" : "RESEARCH_BLOCKED",
    calibration: calibration.ready ? "GO_FOR_CALIBRATION" : "NO_GO",
    shadow: "NO_GO",
    production: "NO_GO",
  };
}