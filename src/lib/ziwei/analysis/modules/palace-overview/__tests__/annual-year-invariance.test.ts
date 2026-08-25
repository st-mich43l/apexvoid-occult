/**
 * Production Nam Phái uses Scoring Formula V2 — annualYear must not change scores.
 */
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzePalaceOverviewDisplay } from "../analyze-display";
import { normalizeNatalFacts } from "@/lib/ziwei/analysis/facts";
import type { BirthInput } from "@/types/chart";
import { TEMPORAL_FACT_SOURCES } from "@/lib/ziwei/analysis/facts";
import { isAnnualStar } from "@/lib/ziwei/star-classification";

const NATAL: BirthInput = {
  solarDate: "1998-10-01",
  birthHour: "Dần",
  gender: "male",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const YEARS = ["2025", "2026", "2027", "2030"] as const;

const ANNUAL_FLOW_NAME =
  /^(Lưu Thái Tuế|Lưu Văn Xương|Lưu Văn Khúc|Lưu Khôi|Lưu Việt|Lưu Lộc Tồn|Lưu Kình|Lưu Đà|Lưu Hóa)/;

function numericSlice(
  results: ReturnType<typeof analyzePalaceOverviewDisplay>["results"],
) {
  return results
    .map((r) => ({
      palaceName: r.palaceName,
      palaceIndex: r.palaceIndex,
      score: r.score,
      band: r.band,
      sCung: r.scoringV2?.sCung ?? null,
    }))
    .sort((a, b) => a.palaceIndex - b.palaceIndex);
}

describe("Palace Overview Formula V2 annual-year invariance", () => {
  it("PALACE_OVERVIEW_YEAR_INVARIANCE = PASS across 2025/2026/2027/2030", () => {
    const baselines = YEARS.map((year) => {
      const chart = calculateNamPhai({ ...NATAL, annualYear: year });
      return analyzePalaceOverviewDisplay(chart, { school: "nam-phai" });
    });
    const first = numericSlice(baselines[0]!.results);
    for (let i = 1; i < baselines.length; i++) {
      expect(numericSlice(baselines[i]!.results)).toEqual(first);
    }
  });

  it("PALACE_OVERVIEW_TEMPORAL_CONTAMINATION = ZERO in natal facts", () => {
    for (const year of YEARS) {
      const chart = calculateNamPhai({ ...NATAL, annualYear: year });
      const { facts } = normalizeNatalFacts(chart, { school: "nam-phai" });
      for (const fact of facts) {
        expect(TEMPORAL_FACT_SOURCES).not.toContain(fact.source);
        expect(fact.source).not.toBe("annual");
        expect(fact.source).not.toBe("annual-mutagen");
        expect(fact.source).not.toBe("major-mutagen");
        expect(fact.source).not.toBe("monthly-flow");
        const name = fact.canonicalStarName ?? fact.starName ?? "";
        expect(ANNUAL_FLOW_NAME.test(name)).toBe(false);
        if (name) {
          expect(
            isAnnualStar({ name, source: fact.source } as Parameters<
              typeof isAnnualStar
            >[0]),
          ).toBe(false);
        }
      }
    }
  });
});
