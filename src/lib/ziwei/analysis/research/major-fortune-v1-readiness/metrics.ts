/**
 * Deterministic descriptive statistics for PR #267 research reports.
 * No external stats dependency. Percentiles use nearest-rank.
 */
import type { NumericDeltaStats, ScoreDistribution } from "./types";

export function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Nearest-rank percentile: index = ceil(p * n) - 1 on ascending sorted values.
 * Documented for reproducibility; not a release gate threshold.
 */
function percentileNearestRank(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const rank = Math.ceil(p * sortedAsc.length) - 1;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, rank));
  return sortedAsc[idx]!;
}

export function numericDeltaStats(signedDeltas: number[]): NumericDeltaStats {
  const abs = signedDeltas.map((d) => Math.abs(d)).sort((a, b) => a - b);
  return {
    count: signedDeltas.length,
    meanSignedDelta: round6(mean(signedDeltas)),
    meanAbsoluteDelta: round6(mean(abs)),
    medianAbsoluteDelta: round6(median(abs)),
    p95AbsoluteDelta: round6(percentileNearestRank(abs, 0.95)),
    maxAbsoluteDelta: abs.length === 0 ? 0 : abs[abs.length - 1]!,
  };
}

export function scoreDistribution(scores: number[]): ScoreDistribution | null {
  if (scores.length === 0) return null;
  const sorted = [...scores].sort((a, b) => a - b);
  const m = mean(sorted);
  const variance =
    sorted.reduce((acc, v) => acc + (v - m) * (v - m), 0) / sorted.length;
  const nearCenter = scores.filter((s) => s >= 45 && s <= 55).length;
  return {
    count: scores.length,
    min: sorted[0]!,
    p10: round6(percentileNearestRank(sorted, 0.1)),
    median: round6(median(sorted)),
    mean: round6(m),
    p90: round6(percentileNearestRank(sorted, 0.9)),
    max: sorted[sorted.length - 1]!,
    standardDeviation: round6(Math.sqrt(variance)),
    scoreAt0Rate: round6(scores.filter((s) => s === 0).length / scores.length),
    scoreAt100Rate: round6(scores.filter((s) => s === 100).length / scores.length),
    nearCenterRate: round6(nearCenter / scores.length),
  };
}

export function stableSortByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

export function rate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return round6(numerator / denominator);
}

export function emptyComparisonBlock(): import("./types").ModelComparisonBlock {
  return {
    comparableObservations: 0,
    unavailableBaseline: 0,
    unavailableCandidate: 0,
    candidateErrors: 0,
    deltas: numericDeltaStats([]),
    bandAgreementRate: null,
    bandChangedCount: 0,
    bandTransitionMatrix: {},
    v05Distribution: null,
    v1Distribution: null,
  };
}
