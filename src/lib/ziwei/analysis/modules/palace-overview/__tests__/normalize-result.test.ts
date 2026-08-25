import { describe, expect, it } from "vitest";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { bandForScore, computePalaceScore, computeRadarScore, xungChieuNet } from "../normalize-result";
import type { PalaceEvidence } from "../types";

function nodeEvidence(
  role: PalaceEvidence["palaceRole"],
  axes: PalaceEvidence["axes"],
  extra: Partial<PalaceEvidence> = {},
): PalaceEvidence {
  return {
    id: `ev:${role}:${extra.starName ?? "x"}`,
    category: extra.category ?? "major-star",
    factIds: [],
    palaceRole: role,
    palaceName: "Mệnh",
    palaceBranch: "Tý",
    axes,
    label: extra.label ?? "test",
    explanationKey: extra.explanationKey ?? "test",
    sourceIds: [],
    knowledgeStatus: "experimental",
    ...extra,
  };
}

describe("normalize-result config honesty", () => {
  it("absolute tanh: net 0 is 50; same net is the same score regardless of other cung", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    expect(k.formula.display.method).toBe("absolute-tanh");
    expect(k.formula.display.yongCapMieu).toBeLessThanOrEqual(k.formula.display.mieuRef);
    const ham = k.profile.brightnessQuality.Hãm ?? 0;
    const dac = k.profile.brightnessQuality.Đắc ?? 0;
    expect(Math.abs(ham)).toBeLessThanOrEqual(Math.abs(dac));
    expect(k.profile.geometry.focus).toBeGreaterThan(
      2 * k.profile.geometry.trine + k.profile.geometry.opposite,
    );
  });

  it("linear-net identity still holds for axis helper", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    expect(k.profile.qualityNormalization.method).toBe("linear-net");
    expect(k.profile.qualityNormalization.scale).toBe(k.formula.display.mieuRef);
    expect(k.formula.display.method).toBe("absolute-tanh");
    const scale = k.profile.qualityNormalization.scale;
    expect(
      computeRadarScore(
        { support: 4, pressure: 4, stability: 0, activation: 0 },
        k,
      ),
    ).toBe(50);
    expect(
      computeRadarScore(
        { support: scale, pressure: 0, stability: 0, activation: 0 },
        k,
      ),
    ).toBe(100);
    expect(
      computeRadarScore(
        { support: 0, pressure: scale, stability: 0, activation: 0 },
        k,
      ),
    ).toBe(0);
    const weak = computeRadarScore(
      { support: 0.4, pressure: 0.2, stability: 0, activation: 0 },
      k,
    );
    const stronger = computeRadarScore(
      { support: 0.8, pressure: 0.4, stability: 0, activation: 0 },
      k,
    );
    expect(stronger).toBeGreaterThan(weak);
  });

  it("two Miếu on focus score higher than one; one Miếu is not already 100", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const one = computePalaceScore(
      [
        nodeEvidence(
          "focus",
          { support: 0, pressure: 0, stability: 0, activation: 0 },
          { starName: "Tử Vi", starBrightness: "Miếu" },
        ),
      ],
      k,
    );
    const two = computePalaceScore(
      [
        nodeEvidence(
          "focus",
          { support: 0, pressure: 0, stability: 0, activation: 0 },
          { starName: "Tử Vi", starBrightness: "Miếu" },
        ),
        nodeEvidence(
          "focus",
          { support: 0, pressure: 0, stability: 0, activation: 0 },
          { starName: "Thiên Phủ", starBrightness: "Miếu" },
        ),
      ],
      k,
    );
    expect(one).toBeLessThan(90);
    expect(two).toBeGreaterThan(one);
    expect(two).toBeLessThan(90);
    const three = computePalaceScore(
      [
        nodeEvidence(
          "focus",
          { support: 0, pressure: 0, stability: 0, activation: 0 },
          { starName: "Tử Vi", starBrightness: "Miếu" },
        ),
        nodeEvidence(
          "focus",
          { support: 0, pressure: 0, stability: 0, activation: 0 },
          { starName: "Thiên Phủ", starBrightness: "Miếu" },
        ),
        nodeEvidence(
          "focus",
          { support: 0, pressure: 0, stability: 0, activation: 0 },
          { starName: "Thất Sát", starBrightness: "Miếu" },
        ),
      ],
      k,
    );
    expect(three).toBeGreaterThan(two);
    expect(three).toBeLessThan(92);
  });

  it("xung chiếu: hung đối phá cát; cát đối cứu hung", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const mieu = { support: 0, pressure: 0, stability: 0, activation: 0 };
    const focusOnly = computePalaceScore(
      [nodeEvidence("focus", mieu, { starName: "Tử Vi", starBrightness: "Miếu" })],
      k,
    );
    const hungOpposite = computePalaceScore(
      [
        nodeEvidence("focus", mieu, { starName: "Tử Vi", starBrightness: "Miếu" }),
        nodeEvidence("opposite", mieu, { starName: "Thất Sát", starBrightness: "Hãm" }),
      ],
      k,
    );
    const hungFocus = computePalaceScore(
      [nodeEvidence("focus", mieu, { starName: "Thất Sát", starBrightness: "Hãm" })],
      k,
    );
    const catOppositeRescue = computePalaceScore(
      [
        nodeEvidence("focus", mieu, { starName: "Thất Sát", starBrightness: "Hãm" }),
        nodeEvidence("opposite", mieu, { starName: "Tử Vi", starBrightness: "Miếu" }),
      ],
      k,
    );
    expect(hungOpposite).toBeLessThan(focusOnly);
    expect(catOppositeRescue).toBeGreaterThan(hungFocus);
    expect(xungChieuNet(8, -8, k.profile.xungChieu)).toBeCloseTo(-8 * k.profile.xungChieu.phaCachFactor);
    expect(xungChieuNet(-8, 8, k.profile.xungChieu)).toBeCloseTo(8 * k.profile.xungChieu.cuuGiaiFactor);
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
