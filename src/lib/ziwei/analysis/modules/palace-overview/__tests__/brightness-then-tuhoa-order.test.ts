import { describe, expect, it } from "vitest";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { applyBrightnessUnclamped, applyTuHoaDeltas } from "../collect-evidence";

describe("brightness then Tứ Hóa apply order", () => {
  it("seed → brightness multiply+delta → tứ hóa → clamp differs from tứ hóa-then-brightness", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const star = k.majorStars.stars.find((s) => s.name === "Cự Môn")!;
    const seed = { ...star.axes };
    const afterBright = applyBrightnessUnclamped(seed, "Hãm", k);
    const correct = applyTuHoaDeltas(
      afterBright,
      "Cự Môn",
      [{ transformation: "Lộc", factId: "t" }],
      k,
    ).axes;
    const hoaFirst = applyTuHoaDeltas(
      seed,
      "Cự Môn",
      [{ transformation: "Lộc", factId: "t" }],
      k,
    ).axes;
    const wrong = applyBrightnessUnclamped(hoaFirst, "Hãm", k);
    expect(correct.pressure).not.toBeCloseTo(wrong.pressure, 8);
    expect(correct.support).toBeGreaterThanOrEqual(0);
    expect(correct.pressure).toBeGreaterThanOrEqual(0);
  });
});
