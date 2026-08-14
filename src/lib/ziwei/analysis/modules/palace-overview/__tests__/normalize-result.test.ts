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

  it("band thresholds come from profile quantile cuts", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const t = k.profile.bandThresholds;
    expect(bandForScore(0, k)).toBe("low");
    expect(bandForScore(t.lowMaxInclusive, k)).toBe("low");
    expect(bandForScore(t.lowMaxInclusive + 0.1, k)).toBe("guarded");
    expect(bandForScore(t.guardedMaxExclusive - 0.1, k)).toBe("guarded");
    expect(bandForScore(t.guardedMaxExclusive, k)).toBe("balanced");
    expect(bandForScore(t.balancedMaxExclusive - 0.1, k)).toBe("balanced");
    expect(bandForScore(t.balancedMaxExclusive, k)).toBe("supportive");
    expect(bandForScore(t.supportiveMaxExclusive - 0.1, k)).toBe("supportive");
    expect(bandForScore(t.supportiveMaxExclusive, k)).toBe("strong");
    expect(bandForScore(100, k)).toBe("strong");
  });
});
