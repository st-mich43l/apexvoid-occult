import casesRaw from "../../../knowledge/palace-overview/v1/benchmark/expert-benchmark-cases.v2.json";
import splitRaw from "../../../knowledge/palace-overview/v1/benchmark/calibration-holdout-split.v2.json";
import policyRaw from "../../../knowledge/palace-overview/v1/benchmark/readiness-policy.v3.json";
import {
  loadBenchmarkSplitV2,
  loadExpertReviewsV2,
  loadReviewAssignments,
  loadReviewers,
  multiReviewerCaseSchoolCount,
  overlappingReliabilityUnits,
  overlappingUnitsByAxis,
  overlappingUnitsBySchool,
  pairwiseCount,
  reliabilityByAxis,
  reliabilityBySchool,
  reviewedCaseSchoolCountBySchool,
  reviewedChartCountV2,
  uniquePairwiseFromReviews,
  uniqueReviewerIds,
  usablePairwiseFromReviews,
} from "./reviews-v2";
import { usablePairwiseCount } from "./pairwise";
import { assignCaseSplit } from "./split-v2";
import type { AxisName, ExpertBenchmarkCase } from "./benchmark-v2-types";
import { comparisonGraphConnectivity } from "./pairwise";
import { countCohorts, CORPUS_FLOOR_CHARTS, CORPUS_TARGET_CHARTS } from "../research/corpus-coverage";
import { corpusDecision } from "../research/corpus-decision";
import { validateBenchmarkCorpus } from "./validate-reviews";
import corpusManifest from "../../../knowledge/palace-overview/v1/benchmark/corpus-manifest.v1.json";
import feedbackRaw from "../../../knowledge/palace-overview/v1/benchmark/pilot-feedback.v1.json";
import pilotStateRaw from "../../../knowledge/palace-overview/v1/benchmark/pilot-state.v1.json";

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
    minOverlappingUnitsPerMultiReviewerCaseSchool: { value: number };
    minUsablePairwiseComparisons: { value: number };
    holdoutNonEmpty: { value: boolean };
    requiredGlobalReliabilityAxes: { value: AxisName[] };
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

export type ReliabilityBand =
  | "NOT_COMPUTABLE"
  | "COMPUTABLE_WEAK"
  | "COMPUTABLE_MODERATE"
  | "COMPUTABLE_STRONG";

export function classifyReliability(alpha: number | null): ReliabilityBand {
  if (alpha == null) return "NOT_COMPUTABLE";
  if (alpha < 0.4) return "COMPUTABLE_WEAK";
  if (alpha < 0.67) return "COMPUTABLE_MODERATE";
  return "COMPUTABLE_STRONG";
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
  rawPairwiseCount: number;
  usablePairwiseCount: number;
  uniquePairwiseCount: number;
  pairwiseBySchool: Record<string, number>;
  pairwiseByAxis: Record<string, number>;
  schools: string[];
  reviewedCaseSchoolCount: Record<string, number>;
  multiReviewerCaseSchoolCount: number;
  overlappingReliabilityUnitCount: number;
  overlappingUnitsByAxis: Record<string, number>;
  overlappingUnitsBySchool: Record<string, number>;
  krippendorffAlpha: number | null;
  krippendorffByAxis: Record<string, number | null>;
  krippendorffBySchool: Record<string, Record<string, number | null>>;
  comparisonGraph: { nodes: number; edges: number; components: number };
  missing: string[];
  hardBlockers: string[];
  warnings: string[];
}

function schoolSliceComputable(
  school: Record<AxisName, { alpha: number | null }> | undefined,
): boolean {
  if (!school) return false;
  const supportOrNet = school.support.alpha != null || school.netQuality.alpha != null;
  const pressureOrNet = school.pressure.alpha != null || school.netQuality.alpha != null;
  return supportOrNet && pressureOrNet;
}

export function assessBenchmarkReadiness(): BenchmarkReadiness {
  const reviews = loadExpertReviewsV2();
  const t = policy.thresholds;
  const minOverlap = t.minOverlappingUnitsPerMultiReviewerCaseSchool.value;
  const chartCount = reviewedChartCountV2(reviews);
  const reviewedPalaceLabels = reviewedPalaceLabelCount();
  const reviewerCount = uniqueReviewerIds(reviews).length;
  const holdoutCount = split.holdoutCaseIds.length;
  const rawPairwise = pairwiseCount(reviews);
  const usablePairwise = usablePairwiseFromReviews(reviews);
  const uniquePairwise = uniquePairwiseFromReviews(reviews);
  const schoolCounts = reviewedCaseSchoolCountBySchool(reviews);
  const multi = multiReviewerCaseSchoolCount(reviews, minOverlap);
  const overlapping = overlappingReliabilityUnits(reviews);
  const byAxis = reliabilityByAxis(reviews);
  const bySchool = reliabilityBySchool(reviews);
  const hardBlockers: string[] = [];
  const warnings: string[] = [];

  if (chartCount < t.floorReviewedCharts.value) {
    hardBlockers.push(`reviewedCharts>=${t.floorReviewedCharts.value}`);
  } else if (chartCount < t.preferredReviewedCharts.value) {
    warnings.push(`preferredReviewedCharts>=${t.preferredReviewedCharts.value}`);
  }
  if (schoolCounts["nam-phai"]! < t.minReviewedCaseSchoolNamPhai.value) {
    hardBlockers.push(`reviewedCaseSchoolCount[nam-phai]>=${t.minReviewedCaseSchoolNamPhai.value}`);
  }
  if (schoolCounts["trung-chau"]! < t.minReviewedCaseSchoolTrungChau.value) {
    hardBlockers.push(`reviewedCaseSchoolCount[trung-chau]>=${t.minReviewedCaseSchoolTrungChau.value}`);
  }
  if (split.calibrationCaseIds.length === 0) hardBlockers.push("non-empty-calibration");
  if (t.holdoutNonEmpty.value && holdoutCount < 1) hardBlockers.push("non-empty-holdout");
  if (usablePairwise < t.minUsablePairwiseComparisons.value) {
    hardBlockers.push(`usablePairwise>=${t.minUsablePairwiseComparisons.value}`);
  }
  if (multi < t.multiReviewerCaseSchoolCount.value) {
    hardBlockers.push(`multiReviewerCaseSchoolCount>=${t.multiReviewerCaseSchoolCount.value}`);
  }
  for (const axis of t.requiredGlobalReliabilityAxes.value) {
    if (byAxis[axis].alpha == null) {
      hardBlockers.push(`krippendorff[${axis}]-computable`);
    }
  }
  if (!schoolSliceComputable(bySchool["nam-phai"])) {
    hardBlockers.push("nam-phai-support-or-netQuality-and-pressure-or-netQuality");
  }
  if (!schoolSliceComputable(bySchool["trung-chau"])) {
    hardBlockers.push("trung-chau-support-or-netQuality-and-pressure-or-netQuality");
  }
  if (reviewedPalaceLabels === 0) hardBlockers.push("reviewed-palace-labels");

  const missing = [...hardBlockers];
  const ready = hardBlockers.length === 0;
  return {
    ready,
    reason: ready ? "GO_FOR_CALIBRATION" : "NO_GO_FOR_CALIBRATION",
    chartCount,
    reviewedPalaceLabels,
    reviewerCount,
    requiredCharts: t.floorReviewedCharts.value,
    requiredHoldout: 1,
    requiredPairwise: t.minUsablePairwiseComparisons.value,
    requiredMultiReviewerCharts: t.multiReviewerCaseSchoolCount.value,
    holdoutCount,
    pairwiseCount: usablePairwise,
    rawPairwiseCount: rawPairwise,
    usablePairwiseCount: usablePairwise,
    uniquePairwiseCount: uniquePairwise,
    schools: Object.entries(schoolCounts)
      .filter(([, n]) => n > 0)
      .map(([s]) => s),
    reviewedCaseSchoolCount: schoolCounts,
    multiReviewerCaseSchoolCount: multi,
    overlappingReliabilityUnitCount: overlapping.length,
    overlappingUnitsByAxis: overlappingUnitsByAxis(reviews),
    overlappingUnitsBySchool: overlappingUnitsBySchool(reviews),
    krippendorffAlpha: byAxis.support.alpha,
    krippendorffByAxis: {
      support: byAxis.support.alpha,
      pressure: byAxis.pressure.alpha,
      stability: byAxis.stability.alpha,
      activation: byAxis.activation.alpha,
      netQuality: byAxis.netQuality.alpha,
    },
    krippendorffBySchool: Object.fromEntries(
      Object.entries(bySchool).map(([school, axes]) => [
        school,
        {
          support: axes.support.alpha,
          pressure: axes.pressure.alpha,
          stability: axes.stability.alpha,
          activation: axes.activation.alpha,
          netQuality: axes.netQuality.alpha,
        },
      ]),
    ),
    pairwiseBySchool: Object.fromEntries(
      ["nam-phai", "trung-chau"].map((school) => [
        school,
        usablePairwiseFromReviews(reviews.filter((r) => r.school === school)),
      ]),
    ),
    pairwiseByAxis: Object.fromEntries(
      (["support", "pressure", "stability", "activation", "netQuality"] as AxisName[]).map(
        (axis) => [
          axis,
          usablePairwiseCount(
            reviews.flatMap((r) => r.pairwiseComparisons).filter((p) => p.axis === axis),
          ),
        ],
      ),
    ),
    comparisonGraph: comparisonGraphConnectivity(reviews.flatMap((r) => r.pairwiseComparisons)),
    missing,
    hardBlockers,
    warnings,
  };
}

export const KRIPPENDORFF_POLICY =
  "Krippendorff α — fixed quadratic rank distance δ²=(rank_i-rank_j)². Alpha is diagnostic plus gating evidence, not a single global floor. Insufficient overlap → NOT_COMPUTABLE. Conventional 0.67 is a COMPUTABLE_STRONG comment-only band, not the sole GO condition.";

export function assertSplitIsByCompleteChart(): boolean {
  const ids = new Set(cases.map((c) => c.caseId));
  for (const id of [...split.calibrationCaseIds, ...split.holdoutCaseIds]) {
    if (!ids.has(id)) return false;
  }
  const overlap = split.calibrationCaseIds.filter((id) => split.holdoutCaseIds.includes(id));
  if (overlap.length !== 0) return false;
  if (cases.length !== split.calibrationCaseIds.length + split.holdoutCaseIds.length) {
    return false;
  }
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
  collection: "READY" | "BLOCKED";
  calibration: "NO_GO" | "GO_FOR_CALIBRATION";
  shadow: "NO_GO";
  production: "NO_GO";
}

export function stage3Decision(infrastructureOk: boolean): Stage3Decision {
  const calibration = assessBenchmarkReadiness();
  const corpusErrors = validateBenchmarkCorpus();
  const collectionReady = infrastructureOk && corpusErrors.length === 0;
  return {
    research: collectionReady ? "READY_FOR_EXPERT_DATA_COLLECTION" : "RESEARCH_BLOCKED",
    collection: collectionReady ? "READY" : "BLOCKED",
    calibration: calibration.ready ? "GO_FOR_CALIBRATION" : "NO_GO",
    shadow: "NO_GO",
    production: "NO_GO",
  };
}

export function collectionStatusJson() {
  const readiness = assessBenchmarkReadiness();
  const decision = stage3Decision(true);
  const reviews = loadExpertReviewsV2();
  const reviewers = loadReviewers();
  const bySchool = reliabilityBySchool(reviews);
  const assignments = loadReviewAssignments();
  const corpus = corpusDecision({
    cases,
    reviews,
    reviewers,
    assignments,
    pilotAccepted: Boolean((pilotStateRaw as { accepted?: boolean }).accepted),
  });
  const cohorts = countCohorts(cases);
  return {
    research: decision.research,
    corpus,
    pilot: corpus,
    assignments: {
      total: assignments.length,
      assigned: assignments.filter((a) => a.status === "assigned").length,
      completed: assignments.filter((a) => a.status === "completed").length,
      withdrawn: assignments.filter((a) => a.status === "withdrawn").length,
      pilot: assignments.filter((a) => a.purpose === "pilot").length,
      overlap: assignments.filter((a) => a.purpose === "overlap").length,
    },
    corpusManifest: {
      id: (corpusManifest as { id: string }).id,
      targetCharts: CORPUS_TARGET_CHARTS,
      floorCharts: CORPUS_FLOOR_CHARTS,
    },
    collection: {
      status: decision.collection,
      cases: cases.length,
      targetCharts: CORPUS_TARGET_CHARTS,
      floorCharts: CORPUS_FLOOR_CHARTS,
      calibrationCases: split.calibrationCaseIds.length,
      holdoutCases: split.holdoutCaseIds.length,
      reviews: reviews.length,
      reviewers: reviewers.length,
      reviewersActive: reviewers.filter((r) => r.status === "active").length,
      reviewersNamPhai: reviewers.filter((r) => r.schools.includes("nam-phai")).length,
      reviewersTrungChau: reviewers.filter((r) => r.schools.includes("trung-chau")).length,
      usablePairwise: readiness.usablePairwiseCount,
      rawPairwise: readiness.rawPairwiseCount,
      uniquePairwise: readiness.uniquePairwiseCount,
      multiReviewerCaseSchools: readiness.multiReviewerCaseSchoolCount,
      overlappingReliabilityUnits: readiness.overlappingReliabilityUnitCount,
      pilotFeedbackEntries: ((feedbackRaw as { entries: unknown[] }).entries ?? []).length,
      reviewedNamPhai: readiness.reviewedCaseSchoolCount["nam-phai"] ?? 0,
      reviewedTrungChau: readiness.reviewedCaseSchoolCount["trung-chau"] ?? 0,
      cohorts,
      comparisonGraph: readiness.comparisonGraph,
    },
    reliability: {
      global: readiness.krippendorffByAxis,
      bySchool: Object.fromEntries(
        Object.entries(bySchool).map(([school, axes]) => [
          school,
          Object.fromEntries(Object.entries(axes).map(([axis, r]) => [axis, r.alpha])),
        ]),
      ),
    },
    calibration: {
      decision: decision.calibration,
      blockers: readiness.hardBlockers,
      warnings: readiness.warnings,
      reliabilityBands: {
        global: Object.fromEntries(
          Object.entries(readiness.krippendorffByAxis).map(([axis, alpha]) => [
            axis,
            classifyReliability(alpha),
          ]),
        ),
      },
    },
    shadow: decision.shadow,
    production: decision.production,
  };
}
