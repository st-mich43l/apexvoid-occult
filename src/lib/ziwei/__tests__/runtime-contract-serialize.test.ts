/**
 * PR #249 — displayed chartData === serialized AI chart identity.
 */
import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "../engine-nam-phai";
import { buildChartText, serializeChart } from "../chart";
import type { BirthInput } from "@/types/chart";

const INPUT: BirthInput = {
  solarDate: "21/09/1991",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("UI / AI chart identity", () => {
  it("serializeChart uses the same ChartData instance fields as displayed", () => {
    const chartData = calculateNamPhai(INPUT);
    const school = "nam-phai" as const;
    const gender = INPUT.gender;
    const dto = serializeChart(chartData, school, gender);
    expect(dto).not.toBeNull();
    expect(dto!.school).toBe(school);
    expect(dto!.gender).toBe(gender);
    expect(dto!.annualYear).toBe(chartData.annualYear);
    expect(dto!.yearStem).toBe(chartData.yearStem);
    expect(dto!.yearBranch).toBe(chartData.yearBranch);
    expect(dto!.birthHourBranch).toBe(chartData.birthHourBranch);
    expect(dto!.annualHeadPalace?.branch).toBe(
      chartData.annualHeadPalace?.branch ?? undefined,
    );
    const text = buildChartText(chartData, school, gender);
    expect(text).toContain(String(chartData.annualYear));
    expect(text).toContain(chartData.birthHourBranch);
  });
});
