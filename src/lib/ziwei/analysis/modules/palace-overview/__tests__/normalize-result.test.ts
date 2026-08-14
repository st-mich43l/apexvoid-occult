import { describe, expect, it } from "vitest";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { bandForScore, computeRadarScore } from "../normalize-result";

describe("normalize-result config honesty", () => {
  it("logistic method and midpoint are actually enforced", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    expect(k.profile.qualityNormalization.method).toBe("logistic");
    const offset = k.profile.qualityNormalization.offset;
    expect(
      computeRadarScore(
        { support: offset, pressure: 0, stability: 0, activation: 0 },
        k,
      ),
    ).toBe(k.profile.qualityNormalization.midpoint);
  });

  it("band thresholds come from profile, matching historical V1 cuts", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const cases: [number, string][] = [
      [0, "low"],
      [24, "low"],
      [24.1, "guarded"],
      [49.9, "guarded"],
      [50, "balanced"],
      [59.9, "balanced"],
      [60, "supportive"],
      [74.9, "supportive"],
      [75, "strong"],
      [100, "strong"],
    ];
    for (const [score, expected] of cases) {
      expect(bandForScore(score, k)).toBe(expected);
    }
  });
});
