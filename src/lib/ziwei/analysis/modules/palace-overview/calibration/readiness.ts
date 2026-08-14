import seedCasesRaw from "../../../knowledge/palace-overview/v1/benchmark/expert-benchmark-cases.seed.json";
import splitRaw from "../../../knowledge/palace-overview/v1/benchmark/calibration-holdout-split.json";

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

export type BenchmarkReadiness =
  | { ready: true; chartCount: number }
  | {
      ready: false;
      reason: "NO_GO_FOR_CALIBRATION";
      chartCount: number;
      reviewedPalaceLabels: number;
      reviewerCount: number;
      requiredCharts: number;
    };

const REQUIRED_CHARTS = 20;

export function assessBenchmarkReadiness(): BenchmarkReadiness {
  const chartCount = reviewedChartCount();
  const reviewedPalaceLabels = reviewedPalaceLabelCount();
  const reviewerCount = uniqueReviewers().length;
  if (chartCount < REQUIRED_CHARTS || reviewedPalaceLabels === 0) {
    return {
      ready: false,
      reason: "NO_GO_FOR_CALIBRATION",
      chartCount,
      reviewedPalaceLabels,
      reviewerCount,
      requiredCharts: REQUIRED_CHARTS,
    };
  }
  return { ready: true, chartCount };
}

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
