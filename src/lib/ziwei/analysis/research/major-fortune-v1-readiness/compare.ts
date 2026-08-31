/**
 * V0.5 vs V1 corpus characterization via explicit shadow comparator.
 */
import { compareMajorFortuneV1Shadow } from "../../modules/major-fortune/shadow";
import type { CorpusObservation } from "./corpus";
import {
  emptyComparisonBlock,
  numericDeltaStats,
  scoreDistribution,
  rate,
  round6,
} from "./metrics";
import type {
  ModelComparisonBlock,
  TimelineChartSummary,
  ZiweiSchoolId,
} from "./types";
import type { ObservationCoverage } from "./coverage";

export interface ShadowRow {
  school: ZiweiSchoolId;
  caseId: string;
  cycleIndex: number;
  activePalaceIndex: number;
  isVcd: boolean;
  mutagensPresent: boolean;
  baselineStatus: string;
  candidateStatus: string;
  baselineScore: number | null;
  candidateScore: number | null;
  baselineBand: string | null;
  candidateBand: string | null;
  delta: number | null;
  bandChanged: boolean;
  errorMessage: string | null;
}

export function runShadowRow(
  obs: CorpusObservation,
  coverage: ObservationCoverage,
): ShadowRow {
  const cmp = compareMajorFortuneV1Shadow(obs.chart, {
    school: obs.school,
    cycleOverride: obs.cycle,
  });
  return {
    school: obs.school,
    caseId: obs.caseId,
    cycleIndex: obs.cycle.cycleIndex,
    activePalaceIndex: obs.cycle.activePalaceIndex,
    isVcd: coverage.isVcd,
    mutagensPresent: coverage.majorMutagensPhysicalCount > 0,
    baselineStatus: cmp.baseline.status,
    candidateStatus: cmp.candidate.status,
    baselineScore: cmp.baseline.score,
    candidateScore: cmp.candidate.score,
    baselineBand: cmp.baseline.band,
    candidateBand: cmp.candidate.band,
    delta: cmp.delta.score,
    bandChanged: cmp.delta.bandChanged,
    errorMessage: cmp.candidate.errorMessage,
  };
}

function buildBlock(rows: ShadowRow[]): ModelComparisonBlock {
  const block = emptyComparisonBlock();
  const deltas: number[] = [];
  const v05: number[] = [];
  const v1: number[] = [];
  let bandAgree = 0;
  let bandComparable = 0;

  for (const r of rows) {
    if (r.baselineStatus === "unavailable") block.unavailableBaseline += 1;
    if (r.candidateStatus === "unavailable") block.unavailableCandidate += 1;
    if (r.candidateStatus === "error") block.candidateErrors += 1;

    if (r.delta != null && r.baselineScore != null && r.candidateScore != null) {
      block.comparableObservations += 1;
      deltas.push(r.delta);
      v05.push(r.baselineScore);
      v1.push(r.candidateScore);
    }

    if (r.baselineBand != null && r.candidateBand != null && r.candidateStatus === "available") {
      bandComparable += 1;
      if (r.baselineBand === r.candidateBand) bandAgree += 1;
      else {
        block.bandChangedCount += 1;
        const key = `${r.baselineBand}->${r.candidateBand}`;
        block.bandTransitionMatrix[key] = (block.bandTransitionMatrix[key] ?? 0) + 1;
      }
    }
  }

  block.deltas = numericDeltaStats(deltas);
  block.bandAgreementRate = rate(bandAgree, bandComparable);
  block.v05Distribution = scoreDistribution(v05);
  block.v1Distribution = scoreDistribution(v1);

  // Stable key order for matrix
  const ordered: Record<string, number> = {};
  for (const k of Object.keys(block.bandTransitionMatrix).sort()) {
    ordered[k] = block.bandTransitionMatrix[k]!;
  }
  block.bandTransitionMatrix = ordered;
  return block;
}

export function summarizeModelComparison(rows: ShadowRow[]): {
  global: ModelComparisonBlock;
  bySchool: Record<ZiweiSchoolId, ModelComparisonBlock>;
  byVcd: Record<"vcd" | "non-vcd", ModelComparisonBlock>;
  byTransformationExposure: Record<"mutagens-present" | "mutagens-absent", ModelComparisonBlock>;
} {
  return {
    global: buildBlock(rows),
    bySchool: {
      "nam-phai": buildBlock(rows.filter((r) => r.school === "nam-phai")),
      "trung-chau": buildBlock(rows.filter((r) => r.school === "trung-chau")),
    },
    byVcd: {
      vcd: buildBlock(rows.filter((r) => r.isVcd)),
      "non-vcd": buildBlock(rows.filter((r) => !r.isVcd)),
    },
    byTransformationExposure: {
      "mutagens-present": buildBlock(rows.filter((r) => r.mutagensPresent)),
      "mutagens-absent": buildBlock(rows.filter((r) => !r.mutagensPresent)),
    },
  };
}

function adjacentAbsDeltas(scores: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < scores.length; i++) {
    out.push(Math.abs(scores[i]! - scores[i - 1]!));
  }
  return out;
}

export function summarizeTimelines(rows: ShadowRow[]): {
  charts: number;
  flatTimelineRateV05: number;
  flatTimelineRateV1: number;
  medianWithinChartRangeV05: number | null;
  medianWithinChartRangeV1: number | null;
  sample: TimelineChartSummary[];
} {
  const byChart = new Map<string, ShadowRow[]>();
  for (const r of rows) {
    const key = `${r.school}|${r.caseId}`;
    const list = byChart.get(key) ?? [];
    list.push(r);
    byChart.set(key, list);
  }

  const summaries: TimelineChartSummary[] = [];
  let flatV05 = 0;
  let flatV1 = 0;
  const rangesV05: number[] = [];
  const rangesV1: number[] = [];

  for (const [key, list] of [...byChart.entries()].sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
  )) {
    const sorted = [...list].sort(
      (a, b) => a.cycleIndex - b.cycleIndex || a.activePalaceIndex - b.activePalaceIndex,
    );
    const [school, caseId] = key.split("|") as [ZiweiSchoolId, string];
    const v05Scores = sorted
      .map((r) => r.baselineScore)
      .filter((s): s is number => s != null);
    const v1Scores = sorted
      .map((r) => r.candidateScore)
      .filter((s): s is number => s != null);

    const v05Range =
      v05Scores.length > 0
        ? Math.max(...v05Scores) - Math.min(...v05Scores)
        : null;
    const v1Range =
      v1Scores.length > 0 ? Math.max(...v1Scores) - Math.min(...v1Scores) : null;

    const v05Adj = adjacentAbsDeltas(v05Scores);
    const v1Adj = adjacentAbsDeltas(v1Scores);
    const v05Flat = v05Scores.length > 1 && v05Range === 0;
    const v1Flat = v1Scores.length > 1 && v1Range === 0;
    if (v05Flat) flatV05 += 1;
    if (v1Flat) flatV1 += 1;
    if (v05Range != null) rangesV05.push(v05Range);
    if (v1Range != null) rangesV1.push(v1Range);

    const med = (xs: number[]) => {
      if (xs.length === 0) return null;
      const s = [...xs].sort((a, b) => a - b);
      const mid = Math.floor(s.length / 2);
      return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
    };

    summaries.push({
      school,
      caseId,
      cycleCount: sorted.length,
      v05Range: v05Range == null ? null : round6(v05Range),
      v1Range: v1Range == null ? null : round6(v1Range),
      v05MedianAdjacentAbsDelta:
        v05Adj.length === 0 ? null : round6(med(v05Adj)!),
      v1MedianAdjacentAbsDelta: v1Adj.length === 0 ? null : round6(med(v1Adj)!),
      v05MaxAdjacentAbsDelta:
        v05Adj.length === 0 ? null : round6(Math.max(...v05Adj)),
      v1MaxAdjacentAbsDelta:
        v1Adj.length === 0 ? null : round6(Math.max(...v1Adj)),
      v05Flat,
      v1Flat,
    });
  }

  const medRange = (xs: number[]) => {
    if (xs.length === 0) return null;
    const s = [...xs].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return round6(s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2);
  };

  return {
    charts: summaries.length,
    flatTimelineRateV05: rate(flatV05, summaries.length) ?? 0,
    flatTimelineRateV1: rate(flatV1, summaries.length) ?? 0,
    medianWithinChartRangeV05: medRange(rangesV05),
    medianWithinChartRangeV1: medRange(rangesV1),
    sample: summaries.slice(0, 12),
  };
}
