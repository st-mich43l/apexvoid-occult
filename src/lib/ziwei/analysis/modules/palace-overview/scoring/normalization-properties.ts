import type { PalaceOverviewKnowledgeV1 } from "../../../knowledge";
import {
  computeRadarScore,
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

export function neutralAtEqualSupportPressure(
  knowledge: PalaceOverviewKnowledgeV1,
): boolean {
  for (const v of [0, 1, 3, 8, 15]) {
    const score = computeRadarScore(
      { support: v, pressure: v, stability: 0, activation: 0 },
      knowledge,
    );
    if (score !== knowledge.profile.qualityNormalization.midpoint) return false;
  }
  return true;
}

export function activationDoesNotRaiseQualityAlone(
  knowledge: PalaceOverviewKnowledgeV1,
): boolean {
  const base = computeRadarScore(emptyAxes(), knowledge);
  const hot: PalaceEvidenceAxes = { ...emptyAxes(), activation: 20 };
  return computeRadarScore(hot, knowledge) === base;
}
