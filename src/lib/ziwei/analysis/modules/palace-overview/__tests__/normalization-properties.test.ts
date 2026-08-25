import { describe, expect, it } from "vitest";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import {
  computeRadarScore,
  normalizeAxes,
} from "../normalize-result";
import { emptyAxes } from "../types";
import {
  activationDoesNotRaiseQualityAlone,
  activationMagnitudeFollowsSaturating,
  assertFiniteScore,
  intensityUsesActivation,
  equalCatHungIsMidpoint,
  pressureMonotone,
  smallPerturbationBound,
  stabilityAxisMonotone,
  supportMonotone,
  pureCatReachesCeiling,
} from "../scoring/normalization-properties";

function knowledge() {
  const loaded = loadPalaceOverviewKnowledgeV1();
  expect(loaded.ok).toBe(true);
  if (!loaded.ok) throw new Error("knowledge invalid");
  return loaded.knowledge;
}

describe("normalization properties", () => {
  it("P1 increasing pure support never reduces net-quality", () => {
    expect(supportMonotone(knowledge())).toBe(true);
  });

  it("P2 increasing pure pressure never increases net-quality", () => {
    expect(pressureMonotone(knowledge())).toBe(true);
  });

  it("P3 equal cát and hung maps to midpoint 50; pure cát reaches 100", () => {
    const k = knowledge();
    expect(equalCatHungIsMidpoint(k)).toBe(true);
    expect(pureCatReachesCeiling(k)).toBe(true);
  });

  it("P4 greater stability does not reduce normalized stability", () => {
    expect(stabilityAxisMonotone(knowledge())).toBe(true);
  });

  it("P5 greater activation follows saturating axis; does not masquerade as quality", () => {
    const k = knowledge();
    expect(activationMagnitudeFollowsSaturating(k)).toBe(true);
    expect(activationDoesNotRaiseQualityAlone(k)).toBe(true);
    expect(intensityUsesActivation(k)).toBe(true);
  });

  it("P6 outputs are finite and in range", () => {
    const k = knowledge();
    const raw = { support: 12, pressure: 9, stability: -3, activation: 8 };
    const score = computeRadarScore(raw, k);
    const axes = normalizeAxes(raw, k);
    expect(assertFiniteScore(score)).toBe(true);
    expect(Object.values(axes).every(assertFiniteScore)).toBe(true);
  });

  it("P7 empty palace is midpoint; net ≥ scale is ceiling 100", () => {
    const k = knowledge();
    const scale = k.profile.qualityNormalization.scale;
    const pure = computeRadarScore({ ...emptyAxes(), support: scale }, k);
    const zero = computeRadarScore(emptyAxes(), k);
    expect(zero).toBe(50);
    expect(pure).toBe(100);
  });

  it("P8 small input perturbation does not jump the score", () => {
    expect(smallPerturbationBound(knowledge())).toBe(true);
  });
});
