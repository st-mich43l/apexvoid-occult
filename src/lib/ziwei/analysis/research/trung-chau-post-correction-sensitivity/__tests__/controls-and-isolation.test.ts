import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveMonthlyFlowProductionRoute } from "../../../modules/monthly-flow/release-policy";
import { analyzeMonthlyFlow as analyzeMonthlyProduction } from "../../../modules/monthly-flow/production";
import { loadFullTrungChauCorpus } from "../corpus";
import { buildPreCorrectionShadowChart } from "../counterfactual";
import { runPalaceOverviewSensitivity } from "../modules/palace-overview";
import { runAnnualAxesSensitivity } from "../modules/annual-axes";
import { runMajorFortuneV05Correction } from "../modules/major-fortune";
import {
  assertTcMonthlyProductionUnavailable,
  runMonthlyFlowV1ShadowSensitivity,
} from "../modules/monthly-flow-v1";

describe("PR265 negative controls + monthly invariants + release contract", () => {
  it("keeps TC Monthly production unavailable and non-executing V0.3", () => {
    assertTcMonthlyProductionUnavailable();
    const route = resolveMonthlyFlowProductionRoute("trung-chau");
    expect(route.available).toBe(false);
    const corpus = loadFullTrungChauCorpus();
    const chart = corpus[0]!.postChart;
    const result = analyzeMonthlyProduction(chart, { school: "trung-chau" });
    expect(result.status).toBe("unavailable");
    expect(result.version).toBeNull();
  });

  it("unexposed Palace Overview / Annual Axes / MF-A controls are exact-zero", () => {
    const corpus = loadFullTrungChauCorpus();
    for (const c of corpus) {
      const pair = buildPreCorrectionShadowChart(c.postChart);
      for (const obs of runPalaceOverviewSensitivity(c.caseId, pair)) {
        if (!obs.exposed) expect(obs.absoluteDelta).toBe(0);
      }
      for (const obs of runAnnualAxesSensitivity(c.caseId, pair)) {
        if (!obs.exposed) expect(obs.absoluteDelta).toBe(0);
      }
      const mf = runMajorFortuneV05Correction(c.caseId, pair);
      if (!mf.natalExposed) expect(mf.absoluteDelta).toBe(0);
    }
  }, 120_000);

  it("Monthly V1 PRE/POST keeps calendar and focus invariants; unexposed months Δ=0", () => {
    const corpus = loadFullTrungChauCorpus();
    // Spot-check a stem-coverage case plus one historical case for speed in CI shape,
    // while still covering Mậu/Nhâm calendar months when present.
    const sampleIds = ["annual-stem-2018", "annual-stem-2022", corpus[0]!.caseId];
    for (const id of [...new Set(sampleIds)]) {
      const c = corpus.find((x) => x.caseId === id)!;
      const obs = runMonthlyFlowV1ShadowSensitivity(c.caseId, c.postChart);
      expect(obs.length).toBeGreaterThan(0);
      for (const row of obs) {
        expect(row.calendarInvariantOk).toBe(true);
        expect(row.preCalendarStem).toBe(row.postCalendarStem);
        expect(row.preCalendarBranch).toBe(row.postCalendarBranch);
        expect(row.preFocusPalace).toBe(row.postFocusPalace);
        if (!row.exposed) expect(row.absoluteDelta).toBe(0);
      }
    }
  }, 60_000);
});

describe("PR265 historical provenance + production isolation", () => {
  it("does not rewrite historical V0.3 impact-compare annual-stem exclusion", () => {
    const path = resolve(
      process.cwd(),
      "src/lib/ziwei/analysis/knowledge/trung-chau-research-v0/impact-compare.ts",
    );
    const src = readFileSync(path, "utf8");
    expect(src).toContain('!c.id.startsWith("annual-stem-")');
    expect(src).toContain("PRE_CORRECTION_TRUNG_CHAU_TU_HOA");
    expect(src).toContain('Khoa: "Hữu Bật"');
    expect(src).toContain('Khoa: "Tả Phụ"');
  });

  it("production monthly/palace/annual entrypoints do not import the research harness", () => {
    const roots = [
      "src/lib/ziwei/analysis/modules/monthly-flow/production.ts",
      "src/lib/ziwei/analysis/modules/monthly-flow/release-policy.ts",
      "src/lib/ziwei/analysis/modules/palace-overview/analyze-all-palaces.ts",
      "src/lib/ziwei/analysis/modules/annual-axes/released-router.ts",
      "src/lib/ziwei/analysis/modules/major-fortune/production.ts",
      "src/lib/ziwei/schools/trung-chau-policy.ts",
    ];
    for (const rel of roots) {
      const src = readFileSync(resolve(process.cwd(), rel), "utf8");
      expect(src).not.toContain("trung-chau-post-correction-sensitivity");
    }
  });
});
