import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { TRUNG_CHAU_TU_HOA } from "@/lib/ziwei/schools/trung-chau-policy";
import {
  CANDIDATE_TU_HOA,
  candidateCellDifferences,
  computeImpactSummary,
  khoaTarget,
} from "../impact-compare";

describe("trung-chau-research-v0 candidate structural delta", () => {
  it("differs from runtime in exactly two Khoa cells (Mậu, Nhâm); Canh unchanged", () => {
    const diffs = candidateCellDifferences();
    expect(diffs).toHaveLength(2);
    expect(diffs).toEqual(
      expect.arrayContaining([
        { stem: "Mậu", mutagen: "Khoa", from: "Hữu Bật", to: "Thái Dương" },
        { stem: "Nhâm", mutagen: "Khoa", from: "Tả Phụ", to: "Thiên Phủ" },
      ]),
    );
    expect(khoaTarget(CANDIDATE_TU_HOA, "Canh")).toBe("Thiên Phủ");
    expect(khoaTarget(TRUNG_CHAU_TU_HOA, "Canh")).toBe("Thiên Phủ");
    expect(khoaTarget(CANDIDATE_TU_HOA, "Mậu")).toBe("Thái Dương");
    expect(khoaTarget(TRUNG_CHAU_TU_HOA, "Mậu")).toBe("Hữu Bật");
    expect(khoaTarget(CANDIDATE_TU_HOA, "Nhâm")).toBe("Thiên Phủ");
    expect(khoaTarget(TRUNG_CHAU_TU_HOA, "Nhâm")).toBe("Tả Phụ");
  });
});

describe("trung-chau-research-v0 layer impact characterization", () => {
  const { summary, cases, monthly } = computeImpactSummary();

  it("measures natal / annual / major / phiFlow deltas on TC golden", () => {
    expect(summary.goldenCasesTotal).toBe(45);
    expect(summary.directNatalTriggerCases).toBe(9);
    expect(summary.goldenCasesWithNatalDelta).toBe(9);
    expect(summary.directAnnualTriggerCases).toBe(0);
    expect(summary.goldenCasesWithAnnualDelta).toBe(0);
    expect(summary.annualStemMauOrNhamCoverage).toBe(0);
    expect(summary.majorFortuneStemMauOrNhamCases).toBe(
      summary.goldenCasesWithMajorDelta,
    );
    expect(summary.goldenCasesWithMajorDelta).toBeGreaterThan(0);
  });

  it("documents palace-stem geometry: every TC golden has Mậu and Nhâm", () => {
    expect(summary.casesWithPalaceStemMau).toBe(45);
    expect(summary.casesWithPalaceStemNham).toBe(45);
    expect(summary.casesWithBothPalaceStemsMauNham).toBe(45);
  });

  it("PhiFlow Khoa deltas affect every TC golden case", () => {
    expect(summary.goldenCasesWithPhiFlowDelta).toBe(45);
    expect(summary.goldenCasesWithAnyMutagenDelta).toBe(45);
    for (const c of cases) {
      expect(c.phiFlows.length).toBeGreaterThanOrEqual(2);
      expect(c.phiFlows.every((p) => p.changed)).toBe(true);
      expect(c.phiFlows.every((p) => p.currentResolved)).toBe(true);
      expect(c.phiFlows.every((p) => p.candidateResolved)).toBe(true);
    }
  });

  it("monthly calendar stem coverage: 10 annual × 12 months", () => {
    expect(summary.monthlyRowsTotal).toBe(120);
    expect(summary.monthlyRowsWithMauOrNhamCalendarStem).toBe(
      summary.monthlyRowsWithKhoaDelta,
    );
    expect(summary.monthlyRowsWithKhoaDelta).toBe(24);
    const mauMonths = monthly.filter((m) => m.calendarStem === "Mậu");
    const nhamMonths = monthly.filter((m) => m.calendarStem === "Nhâm");
    expect(mauMonths.every((m) => m.currentKhoa === "Hữu Bật")).toBe(true);
    expect(mauMonths.every((m) => m.candidateKhoa === "Thái Dương")).toBe(true);
    expect(nhamMonths.every((m) => m.currentKhoa === "Tả Phụ")).toBe(true);
    expect(nhamMonths.every((m) => m.candidateKhoa === "Thiên Phủ")).toBe(true);
  });
});
