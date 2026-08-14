import seedCasesRaw from "../../../knowledge/palace-overview/v1/benchmark/expert-benchmark-cases.seed.json";
import splitRaw from "../../../knowledge/palace-overview/v1/benchmark/calibration-holdout-split.json";
import { krippendorffAlphaOrdinal } from "./krippendorff";

type AxisOrdinal = "low" | "medium" | "high" | "unknown";
type NetQualityClass =
  | "guarded"
  | "neutral"
  | "supportive"
  | "strong"
  | "unknown";
type PairwiseRelation = "left" | "right" | "tie" | "unable-to-judge";

interface ExpertPalaceLabel {
  palaceName: string;
  support: AxisOrdinal | null;
  pressure: AxisOrdinal | null;
  stability: AxisOrdinal | null;
  activation: AxisOrdinal | null;
  netQuality?: NetQualityClass | null;
  notes: string | null;
  reviewer: string | null;
  reviewDate?: string | null;
  school?: string | null;
  reviewConfidence?: "low" | "medium" | "high" | null;
  sourceReferences?: string[] | null;
  disputed?: boolean;
  reviewStatus: "unreviewed" | "reviewed" | "disputed";
}

interface ExpertPairwiseComparison {
  leftPalace: string;
  rightPalace: string;
  axis: "support" | "pressure" | "stability" | "activation" | "net-quality";
  relation: PairwiseRelation | "greater" | "less" | "similar";
  notes: string | null;
}

export interface BenchmarkSplit {
  id: string;
  frozenAt: string;
  policy: string;
  calibrationCaseIds: string[];
  holdoutCaseIds: string[];
  notes: string;
}

interface SeedFile {
  id: string;
  version: string;
  cases: Array<{
    caseId: string;
    schools?: string[];
    labels: ExpertPalaceLabel[];
    pairwiseComparisons: ExpertPairwiseComparison[];
  }>;
}

const seed = seedCasesRaw as SeedFile;
const split = splitRaw as BenchmarkSplit;

export function loadBenchmarkSplit(): BenchmarkSplit {
  return split;
}

export function reviewedPalaceLabelCount(): number {
  return seed.cases.flatMap((c) => c.labels).filter((l) => l.reviewStatus === "reviewed")
    .length;
}

export function reviewedChartCount(): number {
  return seed.cases.filter((c) =>
    c.labels.some((l) => l.reviewStatus === "reviewed"),
  ).length;
}

export function uniqueReviewers(): string[] {
  const names = new Set<string>();
  for (const c of seed.cases) {
    for (const l of c.labels) {
      if (l.reviewer) names.add(l.reviewer);
    }
  }
  return [...names];
}

function pairwiseComparisonCount(): number {
  return seed.cases.reduce((n, c) => n + c.pairwiseComparisons.length, 0);
}

function reviewedSchools(): string[] {
  const schools = new Set<string>();
  for (const c of seed.cases) {
    if (!c.labels.some((l) => l.reviewStatus === "reviewed")) continue;
    for (const s of c.schools ?? []) schools.add(s);
    for (const l of c.labels) {
      if (l.school) schools.add(l.school);
    }
  }
  return [...schools];
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
  krippendorffAlpha: number | null;
  missing: string[];
}

const REQUIRED_CHARTS = 20;
const REQUIRED_HOLDOUT = 1;
const REQUIRED_PAIRWISE = 20;
const REQUIRED_MULTI_REVIEWER_CHARTS = 5;
const KRIPPENDORFF_FLOOR = 0.67;
const KRIPPENDORFF_FLOOR_RATIONALE =
  "0.67 is a conventional lower bound for tentative ordinal reliability (Krippendorff). It is not a universal law; raise it before GO_PRODUCTION.";

export function assessBenchmarkReadiness(): BenchmarkReadiness {
  const chartCount = reviewedChartCount();
  const reviewedPalaceLabels = reviewedPalaceLabelCount();
  const reviewerCount = uniqueReviewers().length;
  const holdoutCount = split.holdoutCaseIds.length;
  const pairwiseCount = pairwiseComparisonCount();
  const schools = reviewedSchools();
  const alpha = krippendorffAlphaOrdinal([], ["low", "medium", "high"]);
  const missing: string[] = [];
  if (chartCount < REQUIRED_CHARTS) missing.push(`reviewedCharts>=${REQUIRED_CHARTS}`);
  if (!schools.includes("nam-phai") || !schools.includes("trung-chau")) {
    missing.push("both-schools-reviewed");
  }
  if (split.calibrationCaseIds.length === 0) missing.push("non-empty-calibration");
  if (holdoutCount < REQUIRED_HOLDOUT) missing.push("non-empty-holdout");
  if (pairwiseCount < REQUIRED_PAIRWISE) missing.push(`pairwise>=${REQUIRED_PAIRWISE}`);
  if (reviewerCount < 2) missing.push(`multi-reviewer-subset>=${REQUIRED_MULTI_REVIEWER_CHARTS}`);
  if (alpha.alpha == null) missing.push("krippendorff-alpha-computable");
  else if (alpha.alpha < KRIPPENDORFF_FLOOR) missing.push("krippendorff-alpha>=0.67");
  if (reviewedPalaceLabels === 0) missing.push("reviewed-palace-labels");

  const ready = missing.length === 0;
  return {
    ready,
    reason: ready ? "GO_FOR_CALIBRATION" : "NO_GO_FOR_CALIBRATION",
    chartCount,
    reviewedPalaceLabels,
    reviewerCount,
    requiredCharts: REQUIRED_CHARTS,
    requiredHoldout: REQUIRED_HOLDOUT,
    requiredPairwise: REQUIRED_PAIRWISE,
    requiredMultiReviewerCharts: REQUIRED_MULTI_REVIEWER_CHARTS,
    holdoutCount,
    pairwiseCount,
    schools,
    krippendorffAlpha: alpha.alpha,
    missing,
  };
}

export const KRIPPENDORFF_POLICY = KRIPPENDORFF_FLOOR_RATIONALE;

export function assertSplitIsByCompleteChart(): boolean {
  const ids = new Set(seed.cases.map((c) => c.caseId));
  for (const id of [...split.calibrationCaseIds, ...split.holdoutCaseIds]) {
    if (!ids.has(id)) return false;
  }
  const overlap = split.calibrationCaseIds.filter((id) =>
    split.holdoutCaseIds.includes(id),
  );
  return overlap.length === 0;
}
