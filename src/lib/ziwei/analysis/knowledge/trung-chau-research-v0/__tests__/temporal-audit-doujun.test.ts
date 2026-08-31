import { describe, expect, it } from "vitest";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import {
  getFlowMonthBaseIndex,
  getFirstFlowMonthIndex,
} from "@/lib/ziwei/annual-flow";

const BIRTH = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien" as const,
};

describe("trung-chau-research-v0 Doujun characterization", () => {
  it("luu-nien: Doujun branch matches month-1 focus branch", () => {
    const chart = calculateTrungChau(BIRTH);
    const doujun = chart.palaces.find((p) =>
      p.stars.some((s) => s.name === "Lưu Đẩu Quân"),
    );
    const monthStart = chart.palaces.find((p) => p.isMonthStart);
    expect(doujun?.branch).toBe(monthStart?.branch);
  });

  it("tieu-han: month base differs from luu-nien Tai Sui base for fixture", () => {
    const args = ["Mùi", "female", "Ngọ"] as const;
    const luuBase = getFlowMonthBaseIndex("luu-nien", ...args);
    const tieuBase = getFlowMonthBaseIndex("tieu-han", ...args);
    expect(luuBase).not.toBe(tieuBase);
  });

  it("dai-van: same base as tieu-han (engineering policy)", () => {
    const args = ["Mùi", "female", "Ngọ"] as const;
    const tieuBase = getFlowMonthBaseIndex("tieu-han", ...args);
    const daiBase = getFlowMonthBaseIndex("dai-van", ...args);
    expect(daiBase).toBe(tieuBase);
  });

  it("luu-nien getFirstFlowMonthIndex matches runtime month-1 palace branch", () => {
    const chart = calculateTrungChau(BIRTH);
    const monthStart = chart.palaces.find((p) => p.isMonthStart);
    const base = getFlowMonthBaseIndex(
      "luu-nien",
      chart.yearBranch,
      "female",
      chart.annualBranch,
    );
    const computed = getFirstFlowMonthIndex(base, chart.month, 9);
    expect(chart.palaces[computed]?.branch).toBe(monthStart?.branch);
  });
});
