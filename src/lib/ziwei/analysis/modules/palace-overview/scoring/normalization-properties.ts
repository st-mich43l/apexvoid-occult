import type { PalaceOverviewKnowledgeV1 } from "../../../knowledge";
import {
  computeIntensity,
  computeRadarScore,
  normalizeAxes,
} from "../normalize-result";
import { emptyAxes, type PalaceEvidenceAxes } from "../types";

export function assertFiniteScore(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

export function supportMonotone(
  knowledge: PalaceOverviewKnowledgeV1,
): boolean {
  let prev = computeRadarScore({ ...emptyAxes(), support: 0 }, knowledge);
  for (let s = 0.5; s <= 20; s += 0.5) {
    const next = computeRadarScore({ ...emptyAxes(), support: s }, knowledge);
    if (next < prev) return false;
    prev = next;
  }
  return true;
}

export function pressureMonotone(
  knowledge: PalaceOverviewKnowledgeV1,
): boolean {
  let prev = computeRadarScore({ ...emptyAxes(), pressure: 0 }, knowledge);
  for (let p = 0.5; p <= 20; p += 0.5) {
    const next = computeRadarScore({ ...emptyAxes(), pressure: p }, knowledge);
    if (next > prev) return false;
    prev = next;
  }
  return true;
}

export function neutralAtCalibratedOffset(
  knowledge: PalaceOverviewKnowledgeV1,
): boolean {
  const offset = knowledge.profile.qualityNormalization.offset;
  for (const v of [0, 1, 3, 8, 15]) {
    const score = computeRadarScore(
      { support: offset + v, pressure: v, stability: 0, activation: 0 },
      knowledge,
    );
    if (score !== knowledge.profile.qualityNormalization.midpoint) return false;
  }
  return true;
}

export function stabilityAxisMonotone(
  knowledge: PalaceOverviewKnowledgeV1,
): boolean {
  let prev = normalizeAxes({ ...emptyAxes(), stability: -8 }, knowledge).stability;
  for (let s = -7; s <= 12; s += 1) {
    const next = normalizeAxes({ ...emptyAxes(), stability: s }, knowledge)
      .stability;
    if (next < prev) return false;
    prev = next;
  }
  return true;
}

export function activationMagnitudeFollowsSaturating(
  knowledge: PalaceOverviewKnowledgeV1,
): boolean {
  const a0 = normalizeAxes({ ...emptyAxes(), activation: 0 }, knowledge).activation;
  const a1 = normalizeAxes({ ...emptyAxes(), activation: 4 }, knowledge).activation;
  const a2 = normalizeAxes({ ...emptyAxes(), activation: 12 }, knowledge).activation;
  return a0 <= a1 && a1 <= a2 && a0 === 0;
}

export function activationDoesNotRaiseQualityAlone(
  knowledge: PalaceOverviewKnowledgeV1,
): boolean {
  const base = computeRadarScore(emptyAxes(), knowledge);
  const hot: PalaceEvidenceAxes = { ...emptyAxes(), activation: 20 };
  return computeRadarScore(hot, knowledge) === base;
}

export function intensityUsesActivation(
  knowledge: PalaceOverviewKnowledgeV1,
): boolean {
  const quiet = computeIntensity(emptyAxes(), knowledge);
  const hot = computeIntensity({ ...emptyAxes(), activation: 10 }, knowledge);
  return hot > quiet;
}

export function smallPerturbationBound(
  knowledge: PalaceOverviewKnowledgeV1,
  epsilon = 0.05,
  maxJump = 3,
): boolean {
  const base = { support: 4, pressure: 3, stability: 1, activation: 2 };
  const s0 = computeRadarScore(base, knowledge);
  const s1 = computeRadarScore({ ...base, support: base.support + epsilon }, knowledge);
  return Math.abs(s1 - s0) <= maxJump;
}
