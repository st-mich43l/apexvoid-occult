/**
 * PR #249 — Calculation Core must be stateless across sequential calls.
 */
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "../engine-nam-phai";
import { calculate as calculateTrungChau } from "../engine-trung-chau";
import { calculateForAnnualYear } from "../chart";
import type { BirthInput, ChartData } from "@/types/chart";
import * as namPhai from "../engine-nam-phai";
import * as trungChau from "../engine-trung-chau";

const A: BirthInput = {
  solarDate: "15/03/1998",
  birthHour: "Dần",
  gender: "male",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

const B: BirthInput = {
  solarDate: "21/09/1991",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2027",
  flowBase: "tieu-han",
};

function snap(data: ChartData) {
  return {
    solar: data.solar,
    lunar: data.lunar,
    timeZone: data.timeZone,
    birthHourBranch: data.birthHourBranch,
    yearStem: data.yearStem,
    yearBranch: data.yearBranch,
    menhIndex: data.menhIndex,
    thanIndex: data.thanIndex,
    annualYear: data.annualYear,
    annualStem: data.annualStem,
    annualBranch: data.annualBranch,
    nominalAge: data.nominalAge,
    majorFortuneBranch: data.majorFortunePalace?.branch ?? null,
    taiTueBranch: data.taiTuePalace?.branch ?? null,
    smallLimitBranch: data.smallLimitPalace?.branch ?? null,
    annualHeadBranch: data.annualHeadPalace?.branch ?? null,
    starCount: data.starCount,
    palaceStars: data.palaces.map((p) => ({
      name: p.name,
      branch: p.branch,
      stars: (p.stars ?? []).map((s) => `${s.name}|${s.source ?? ""}|${s.brightness ?? ""}`),
    })),
  };
}

describe("stateless Zi Wei calculate()", () => {
  it("calculate(A); calculate(B); calculate(A) restores A for Nam Phái", () => {
    const first = snap(calculateNamPhai(A));
    Object.freeze(first);
    calculateNamPhai(B);
    const again = snap(calculateNamPhai(A));
    expect(again).toEqual(first);
  });

  it("alternating schools/years does not leak history", () => {
    const np2026 = { ...A, annualYear: "2026" };
    const np2027 = { ...A, annualYear: "2027" };
    const first = snap(calculateNamPhai(np2026));
    Object.freeze(first);
    calculateNamPhai(np2027);
    calculateTrungChau(np2026);
    const again = snap(calculateNamPhai(np2026));
    expect(again).toEqual(first);
  });

  it("calculateForAnnualYear is pure and year-isolated", () => {
    for (const school of ["nam-phai", "trung-chau"] as const) {
      const y2026 = snap(calculateForAnnualYear(school, A, 2026));
      const y2027 = snap(calculateForAnnualYear(school, A, 2027));
      expect(y2026.annualYear).toBe(2026);
      expect(y2027.annualYear).toBe(2027);
      expect(snap(calculateForAnnualYear(school, A, 2026))).toEqual(y2026);
    }
  });

  it("engines do not expose getData or lastData", () => {
    expect("getData" in namPhai).toBe(false);
    expect("getData" in trungChau).toBe(false);
    expect("lastData" in namPhai).toBe(false);
    expect("lastData" in trungChau).toBe(false);
  });
});
