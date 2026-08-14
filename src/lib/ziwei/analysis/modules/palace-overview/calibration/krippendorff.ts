/**
 * Krippendorff's alpha for ordinal labels.
 * Returns null when there are fewer than two raters with overlapping units.
 */
export function krippendorffAlphaOrdinal(
  units: Array<Array<string | null>>,
  ordinalLevels: string[],
): { alpha: number | null; units: number; raters: number } {
  const levelIndex = new Map(ordinalLevels.map((l, i) => [l, i]));
  const raters = units.reduce((m, row) => Math.max(m, row.length), 0);
  const coded = units.filter((row) => row.filter((v) => v != null).length >= 2);
  if (coded.length === 0 || raters < 2) {
    return { alpha: null, units: coded.length, raters };
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
    const m = present.length;
    n += m;
    for (const v of present) valueCounts.set(v, (valueCounts.get(v) ?? 0) + 1);
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const d = (present[i]! - present[j]!) ** 2;
        Do += d;
        pairCount += 1;
      }
    }
  }
  if (pairCount === 0 || n < 2) return { alpha: null, units: coded.length, raters };
  Do /= pairCount;

  let De = 0;
  let denomPairs = 0;
  const vals = [...valueCounts.entries()];
  for (let i = 0; i < vals.length; i++) {
    for (let j = i + 1; j < vals.length; j++) {
      const [vi, ci] = vals[i]!;
      const [vj, cj] = vals[j]!;
      const d = (vi - vj) ** 2;
      De += ci * cj * d;
      denomPairs += ci * cj;
    }
  }
  if (denomPairs === 0) return { alpha: 1, units: coded.length, raters };
  De /= denomPairs;
  if (De === 0) return { alpha: 1, units: coded.length, raters };
  return { alpha: 1 - Do / De, units: coded.length, raters };
}
