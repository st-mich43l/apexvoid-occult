import type { AnnualAxesKnowledgeV08NamPhai } from "../../../knowledge/annual-axes/v0.8";

function roundToPrecision(value: number, precision: number): number {
  const f = 10 ** precision;
  return Math.round(value * f) / f;
}

/**
 * Frozen V0.8 score mapping — do not retune in V0.10.
 * score = clamp(50 + 50 × tanh(raw / tanhScale), min, max)
 */
export function normalizeWithV08Mapping(
  compositeRaw: number,
  knowledge08: AnnualAxesKnowledgeV08NamPhai,
): number {
  const { tanhScale, minimum, maximum, precision, neutral } = knowledge08.pointClasses.score;
  const amplitude = 50;
  const mapped = neutral + amplitude * Math.tanh(compositeRaw / tanhScale);
  return roundToPrecision(Math.min(maximum, Math.max(minimum, mapped)), precision);
}

export function resolveV08Band(
  score: number,
  knowledge08: AnnualAxesKnowledgeV08NamPhai,
): string {
  for (const band of knowledge08.scoreBands.bands) {
    const aboveMin = score >= band.minInclusive;
    const belowMax =
      band.maxExclusive !== undefined
        ? score < band.maxExclusive
        : band.maxInclusive !== undefined
          ? score <= band.maxInclusive
          : true;
    if (aboveMin && belowMax) return band.id;
  }
  return "balanced";
}
