import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAllPalaces } from "@/lib/ziwei/analysis/modules/palace-overview";
import { aggregateEvidence } from "../aggregate-evidence";
import {
  borrowedMajorAlsoScoredAsOpposite,
  duplicateComponentIdentities,
  duplicateMinorFactIds,
} from "../scoring/dedup";
import { buildScoringTrace, sumTracedAxes } from "../scoring/trace";
import type { BirthInput } from "@/types/chart";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("evidence accounting", () => {
  it("P9 identical evidence produces identical scores", () => {
    const chart = calculateNamPhai(REGRESSION);
    const a = analyzeAllPalaces(chart, { school: "nam-phai" });
    const b = analyzeAllPalaces(chart, { school: "nam-phai" });
    expect(a.results.map((r) => r.score)).toEqual(b.results.map((r) => r.score));
  });

  it("P10 evidence order does not alter aggregated axes beyond float ulp", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    for (const r of results) {
      const reversed = aggregateEvidence([...r.allEvidence].reverse());
      expect(reversed.support).toBeCloseTo(r.rawAxes.support, 10);
      expect(reversed.pressure).toBeCloseTo(r.rawAxes.pressure, 10);
      expect(reversed.stability).toBeCloseTo(r.rawAxes.stability, 10);
      expect(reversed.activation).toBeCloseTo(r.rawAxes.activation, 10);
    }
  });

  it("trace sums to rawAxes and names the frozen logistic formula", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    const r = results.find((p) => p.palaceName === "Quan Lộc") ?? results[0]!;
    const trace = buildScoringTrace({
      palaceName: r.palaceName,
      score: r.score,
      band: r.band,
      rawAxes: r.rawAxes,
      evidence: r.allEvidence,
    });
    expect(sumTracedAxes(trace)).toEqual(r.rawAxes);
    expect(trace.formula).toBe("logistic(support - pressure)");
    expect(trace.duplicatePhysicalIdentities).toEqual([]);
  });

  it("does not double-count borrowed VCD majors as opposite majors", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    for (const r of results) {
      expect(borrowedMajorAlsoScoredAsOpposite(r.allEvidence)).toEqual([]);
      expect(duplicateComponentIdentities(r.allEvidence)).toEqual([]);
      expect(duplicateMinorFactIds(r.allEvidence)).toEqual([]);
    }
  });

  it("structural rules are marked interaction-delta", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    const rules = results.flatMap((r) =>
      r.allEvidence.filter((e) => e.category === "structural-rule"),
    );
    for (const ev of rules) {
      expect(ev.contributionKind).toBe("interaction-delta");
      expect(ev.factIds.length).toBeGreaterThan(0);
    }
  });

  it("confidence does not equal score and sourceConfidence is not fabricated", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    for (const r of results) {
      expect(r.confidence.sourceConfidencePercent).toBeNull();
      expect(r.confidence.calibrationConfidence).toBe("unvalidated");
      expect(r.calibration.releaseStage).toBe("experimental");
      expect(r.score).not.toBe(r.confidence.evidenceCompletenessPercent);
    }
  });

  it("does not double-count the same component identity (frozen additive transforms allowed)", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    for (const r of results) {
      const componentKeys = r.allEvidence
        .filter((e) => e.contributionKind !== "interaction-delta")
        .filter((e) => e.category !== "void-environment")
        .map((e) => `${e.category}:${[...e.factIds].sort().join(",")}:${e.starName ?? ""}:${e.id}`);
      expect(new Set(componentKeys).size).toBe(componentKeys.length);
    }
  });
});
