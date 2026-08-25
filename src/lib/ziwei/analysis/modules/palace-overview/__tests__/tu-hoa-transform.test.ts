import { describe, expect, it } from "vitest";
import { loadPalaceOverviewResearchKnowledgeV2 } from "@/lib/ziwei/analysis/knowledge/palace-overview-research-v2";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { normalizeNatalFacts, indexFactsByPalace } from "@/lib/ziwei/analysis/facts";
import { buildStaticFrame } from "@/lib/ziwei/analysis/frame";
import {
  applyBrightness,
  applyBrightnessUnclamped,
  applyTuHoaDeltas,
  collectPalaceEvidence,
} from "../research/collect-evidence-v2";
import { emptyDiagnostics } from "../collect-evidence";

describe("Tứ Hóa as host-star transform (research-v2)", () => {
  it("Cự Môn Hãm + Hóa Lộc has lower pressure than Cự Môn Hãm alone", () => {
    const loaded = loadPalaceOverviewResearchKnowledgeV2();
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

  it("Quan Lộc on REGRESSION emits one Cự Môn evidence with both fact ids (research collect)", () => {
    const chart = calculateNamPhai({
      solarDate: "1991-09-21",
      birthHour: "Dậu",
      gender: "female",
      timezone: "7",
      annualYear: "2026",
      flowBase: "luu-nien",
    });
    const loaded = loadPalaceOverviewResearchKnowledgeV2();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const { facts } = normalizeNatalFacts(chart, { school: "nam-phai" });
    const quan = chart.palaces.find((p) => p.name === "Quan Lộc")!;
    const frame = buildStaticFrame(chart, quan.index, {
      geometry: loaded.knowledge.profile.geometry,
    });
    const { evidence } = collectPalaceEvidence({
      frame,
      factsByPalace: indexFactsByPalace(facts),
      knowledge: loaded.knowledge,
      diagnostics: emptyDiagnostics(),
    });
    const cu = evidence.filter(
      (e) => e.category === "major-star" && e.starName === "Cự Môn",
    );
    expect(cu).toHaveLength(1);
    expect(cu[0]!.transformation).toBe("Lộc");
    expect(cu[0]!.factIds.length).toBeGreaterThanOrEqual(2);
    expect(evidence.some((e) => e.category === "transformation")).toBe(false);
  });
});
