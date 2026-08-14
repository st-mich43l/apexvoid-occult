/**
 * Krippendorff's α for equally spaced ordered categories.
 *
 * Distance: δ²(i,j) = (rank(i) − rank(j))² on 0-based rank indices.
 * See knowledge/.../benchmark/KRIPPENDORFF.md
 *
 * Returns null / NOT_COMPUTABLE when overlap is insufficient.
 * Does not fabricate alpha.
 */

type KrippendorffStatus = "ok" | "NOT_COMPUTABLE";

export interface KrippendorffResult {
  alpha: number | null;
  status: KrippendorffStatus;
  unitCount: number;
  reviewerCount: number;
  overlapCount: number;
}

export const KRIPPENDORFF_DISTANCE =
  "equal-spaced-ordered-categories: delta_sq = (rank_i - rank_j)^2";

export function krippendorffAlphaOrdinal(
  units: Array<Array<string | null>>,
  ordinalLevels: string[],
): KrippendorffResult {
  const levelIndex = new Map(ordinalLevels.map((l, i) => [l, i]));
  const reviewerCount = units.reduce((m, row) => Math.max(m, row.length), 0);
  const coded = units.filter((row) => row.filter((v) => v != null).length >= 2);
  const overlapCount = coded.length;
  if (coded.length === 0 || reviewerCount < 2) {
    return {
      alpha: null,
      status: "NOT_COMPUTABLE",
      unitCount: coded.length,
      reviewerCount,
      overlapCount,
    };
  }

  const values: number[][] = coded.map((row) =>
    row.map((v) => (v == null ? Number.NaN : (levelIndex.get(v) ?? Number.NaN))),
  );

  let Do = 0;
  let pairCount = 0;
  const valueCounts = new Map<number, number>();
  let n = 0;
  for (const row of values) {
    const present = row.filter((v) => Number.isFinite(v));
    n += present.length;
    for (const v of present) valueCounts.set(v, (valueCounts.get(v) ?? 0) + 1);
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        Do += (present[i]! - present[j]!) ** 2;
        pairCount += 1;
      }
    }
  }
  if (pairCount === 0 || n < 2) {
    return {
      alpha: null,
      status: "NOT_COMPUTABLE",
      unitCount: coded.length,
      reviewerCount,
      overlapCount,
    };
  }
  Do /= pairCount;

  let De = 0;
  let denomPairs = 0;
  const vals = [...valueCounts.entries()];
  for (let i = 0; i < vals.length; i++) {
    for (let j = i + 1; j < vals.length; j++) {
      const [vi, ci] = vals[i]!;
      const [vj, cj] = vals[j]!;
      De += ci * cj * (vi - vj) ** 2;
      denomPairs += ci * cj;
    }
  }
  if (denomPairs === 0 || De === 0) {
    return {
      alpha: 1,
      status: "ok",
      unitCount: coded.length,
      reviewerCount,
      overlapCount,
    };
  }
  De /= denomPairs;
  return {
    alpha: 1 - Do / De,
    status: "ok",
    unitCount: coded.length,
    reviewerCount,
    overlapCount,
  };
}
