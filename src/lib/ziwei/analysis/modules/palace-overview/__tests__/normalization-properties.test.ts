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
  neutralAtCalibratedOffset,
  pressureMonotone,
  smallPerturbationBound,
  stabilityAxisMonotone,
  supportMonotone,
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

  it("P3 support − pressure === offset maps to midpoint 50", () => {
    expect(neutralAtCalibratedOffset(knowledge())).toBe(true);
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

  it("P7 band boundaries are label-only (score itself is continuous logistic)", () => {
    const k = knowledge();
    const below = computeRadarScore({ ...emptyAxes(), support: 0.01 }, k);
    const zero = computeRadarScore(emptyAxes(), k);
    expect(Math.abs(below - zero)).toBeLessThan(1);
  });

  it("P8 small input perturbation does not jump the score", () => {
    expect(smallPerturbationBound(knowledge())).toBe(true);
  });
});
