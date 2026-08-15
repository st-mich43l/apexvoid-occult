import { describe, expect, it } from "vitest";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAllPalaces } from "../analyze-all-palaces";
import {
  applyBrightness,
  applyBrightnessUnclamped,
  applyTuHoaDeltas,
} from "../collect-evidence";

describe("Tứ Hóa as host-star transform", () => {
  it("Cự Môn Hãm + Hóa Lộc has lower pressure than Cự Môn Hãm alone", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const k = loaded.knowledge;
    const star = k.majorStars.stars.find((s) => s.name === "Cự Môn")!;
    const ham = applyBrightness(star.axes, "Hãm", k);
    const transformed = applyTuHoaDeltas(
      applyBrightnessUnclamped(star.axes, "Hãm", k),
      "Cự Môn",
      [{ transformation: "Lộc", factId: "t" }],
      k,
    );
    expect(transformed.axes.pressure).toBeLessThan(ham.pressure);
  });

  it("Quan Lộc on REGRESSION emits one Cự Môn evidence with both fact ids, not a separate Hóa Lộc row", () => {
    const chart = calculateNamPhai({
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    });
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    const quan = results.find((r) => r.palaceName === "Quan Lộc")!;
    const cu = quan.allEvidence.filter(
      (e) => e.category === "major-star" && e.starName === "Cự Môn",
    );
    expect(cu).toHaveLength(1);
    expect(cu[0]!.transformation).toBe("Lộc");
    expect(cu[0]!.factIds.length).toBeGreaterThanOrEqual(2);
    expect(quan.allEvidence.some((e) => e.category === "transformation")).toBe(false);
  });
});
