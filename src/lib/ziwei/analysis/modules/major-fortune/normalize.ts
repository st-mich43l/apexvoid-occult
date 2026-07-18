import type { MajorFortuneScoringProfile } from "../../knowledge/major-fortune-scoring";
import {
  addMajorFortuneAxes,
  emptyMajorFortuneAxes,
  type MajorFortuneAxes,
  type MajorFortuneBand,
  type MajorFortuneEvidence,
} from "./types";

export function sumWeightedAxes(evidence: MajorFortuneEvidence[]): MajorFortuneAxes {
  return evidence.reduce((acc, e) => addMajorFortuneAxes(acc, e.weightedAxes), emptyMajorFortuneAxes());
}

export function resolveMajorFortuneBand(score: number, profile: MajorFortuneScoringProfile): MajorFortuneBand {
  for (const band of profile.output.bands) {
    const aboveMin = score >= band.minInclusive;
    const belowMax =
      band.maxExclusive !== undefined
        ? score < band.maxExclusive
        : band.maxInclusive !== undefined
          ? score <= band.maxInclusive
          : true;
    if (aboveMin && belowMax) return band.id as MajorFortuneBand;
  }
  throw new Error(`score ${score} did not resolve to any configured band`);
}

export interface MajorFortuneNormalizeResult {
  score: number;
  band: MajorFortuneBand;
  intensity: number;
  conflict: number;
  normalizedAxes: MajorFortuneAxes;
}

/**
 * Literal implementation of
 * `major-fortune-scoring-profile.v0.json#formulaSpec`. Every scale/
 * coefficient is read from the loaded profile — never a hardcoded TS
 * numeric literal.
 */
export function normalizeMajorFortuneAxes(
  rawAxes: MajorFortuneAxes,
  profile: MajorFortuneScoringProfile,
): MajorFortuneNormalizeResult {
  const n = profile.normalization;

  const supportNorm = 1 - Math.exp(-rawAxes.support / n.supportScale);
  const pressureNorm = 1 - Math.exp(-rawAxes.pressure / n.pressureScale);
  const stabilityNorm = Math.tanh(rawAxes.stability / n.stabilityScale);
  const activationNorm = 1 - Math.exp(-rawAxes.activation / n.activationScale);

  const netQuality = supportNorm - pressureNorm + n.stabilityCoefficient * stabilityNorm;
  const activationGate = n.activationGateFloor + n.activationGateRange * activationNorm;

  const rawScore =
    n.neutralScore + n.scoreAmplitude * Math.tanh((netQuality * activationGate) / n.scoreDivisor);
  const clampedScore = Math.min(profile.output.scoreMax, Math.max(profile.output.scoreMin, rawScore));
  const precisionFactor = 10 ** profile.output.scorePrecision;
  const score = Math.round(clampedScore * precisionFactor) / precisionFactor;

  const intensity = Math.round(100 * activationNorm);
  const conflict = Math.round(100 * Math.min(supportNorm, pressureNorm) * activationNorm);

  return {
    score,
    band: resolveMajorFortuneBand(score, profile),
    intensity,
    conflict,
    normalizedAxes: {
      support: supportNorm,
      pressure: pressureNorm,
      stability: stabilityNorm,
      activation: activationNorm,
    },
  };
}
