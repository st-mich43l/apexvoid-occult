import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAllPalaces } from "../analyze-all-palaces";
import { loadPalaceOverviewKnowledgeV1 } from "@/lib/ziwei/analysis/knowledge";
import { evaluateStructuralRules } from "../evaluate-structural-rules";
import { emptyDiagnostics } from "../collect-evidence";
import { buildStaticFrame } from "@/lib/ziwei/analysis/frame";
import { indexFactsByPalace, normalizeNatalFacts } from "@/lib/ziwei/analysis/facts";
import { absEffect } from "../types";

const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien" as const,
};

describe("structural formations v2", () => {
  it("REGRESSION Quan Lộc recognizes Cự Nhật (structure only, no score assert)", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    const quan = results.find((r) => r.palaceName === "Quan Lộc")!;
    const systems = quan.recognizedStarSystems ?? [];
    expect(systems.some((s) => s.label === "Cự Nhật")).toBe(true);
  });

  it("Cự Nhật net is higher when Thái Dương is Miếu than when Hãm", () => {
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const rule = loaded.knowledge.structuralRules.rules.find((r) => r.id === "rule-cu-nhat")!;
    const ham = {
      ...rule.baseAxes,
      support: rule.baseAxes.support * Number(rule.conditions.supportFactorWhenHam),
      pressure: rule.baseAxes.pressure + Number(rule.conditions.pressureDeltaWhenHam),
      stability: rule.baseAxes.stability + Number(rule.conditions.stabilityDeltaWhenHam),
    };
    const mieu = rule.baseAxes;
    expect(mieu.support - mieu.pressure).toBeGreaterThan(ham.support - ham.pressure);
  });

  it("voided structural-rule magnitude is lower than the same rule without void", () => {
    const chart = calculateNamPhai(REGRESSION);
    const loaded = loadPalaceOverviewKnowledgeV1();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const { facts } = normalizeNatalFacts(chart, { school: "nam-phai" });
    const factsByPalace = indexFactsByPalace(facts);
    const quan = chart.palaces.find((p) => p.name === "Quan Lộc")!;
    const frame = buildStaticFrame(chart, quan.index, {
      geometry: loaded.knowledge.profile.geometry,
    });
    const diagnostics = emptyDiagnostics();
    const rules = evaluateStructuralRules({
      frame,
      factsByPalace,
      knowledge: loaded.knowledge,
      diagnostics,
      focusPalaceName: quan.name,
      focusPalaceBranch: quan.branch,
    });
    const cu = rules.find((r) => r.ruleId === "rule-cu-nhat");
    expect(cu).toBeTruthy();
    const factor = loaded.knowledge.voidEnvironment.singleVoid.localStructuralMagnitudeFactor;
    expect(factor).toBeLessThan(
      loaded.knowledge.voidEnvironment.singleVoid.localMajorMagnitudeFactor,
    );
    expect(absEffect({ ...cu!.axes, support: cu!.axes.support * factor, pressure: cu!.axes.pressure * factor, stability: cu!.axes.stability, activation: cu!.axes.activation })).toBeLessThan(
      absEffect(cu!.axes),
    );
  });

  it("exactly one void-attenuate evidence per palace", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    for (const r of results) {
      const voids = r.allEvidence.filter((e) => e.category === "void-environment" && e.id.startsWith("ev:void-attenuate:"));
      const ids = voids.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith("ev:void-attenuate:"))).toBe(true);
    }
  });
});
