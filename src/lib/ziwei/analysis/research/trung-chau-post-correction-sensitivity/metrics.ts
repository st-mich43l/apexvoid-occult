/**
 * Deterministic descriptive statistics for research reports.
 * No external stats dependency. P95 uses nearest-rank on sorted abs values.
 */
import type { NumericDeltaStats } from "./types";

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
 * Nearest-rank P95: index = ceil(0.95 * n) - 1 on ascending sorted values.
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
  const changedCount = signedDeltas.filter((d) => d !== 0).length;
  return {
    count: signedDeltas.length,
    changedCount,
    unchangedCount: signedDeltas.length - changedCount,
    meanSignedDelta: round6(mean(signedDeltas)),
    meanAbsoluteDelta: round6(mean(abs)),
    medianAbsoluteDelta: round6(median(abs)),
    p95AbsoluteDelta: round6(percentileNearestRank(abs, 0.95)),
    maxAbsoluteDelta: abs.length === 0 ? 0 : abs[abs.length - 1]!,
  };
}

export function stableSortByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

export function evidenceIdSet(
  evidence: Array<{ id?: string; evidenceId?: string }>,
): Set<string> {
  const out = new Set<string>();
  for (const e of evidence) {
    const id = e.id ?? e.evidenceId;
    if (id) out.add(id);
  }
  return out;
}

export function setDiff(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((x) => !b.has(x)).sort();
}
