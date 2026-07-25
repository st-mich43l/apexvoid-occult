import { describe, it, expect } from "vitest";
import { calculate, tuHoaTargets, stemBranchForLunarMonth } from "@/lib/ziwei/engine-nam-phai";
import { buildV02Result } from "../../../../analysis/modules/monthly-flow/v0.2/resolve-month-contexts";
import type { MonthlyCalculationProvider } from "../../../../analysis/modules/monthly-flow/types";

const mockProvider: MonthlyCalculationProvider = {
  school: "nam-phai",
  tuHoaTargets: (stem) => tuHoaTargets(stem),
  stemBranchForLunarMonth: (annualStem, lunarMonth) => stemBranchForLunarMonth(annualStem, lunarMonth)
};

describe("V0.2.3 Integrity Hard Gates Audit", () => {
  it("Audits integrity requirements across test charts", () => {
    // Generate an engine output for a real chart
    const chart = calculate({
      solarDate: "1990-10-15",
      birthHour: "Thìn",
      gender: "male",
      timezone: "7",
      annualYear: "2026",
      flowBase: "month"
    });

    const diagnostics: any = {
      invalidMonthNumber: [],
      missingFocusPalace: [],
      missingCalendarStemBranch: [],
      duplicateMonthKeys: [],
      ambiguousTransformationTargets: [],
      unresolvedTransformationTargets: [],
      missingMonthlyEntries: [],
      providerSchoolMismatch: []
    };

    const result = buildV02Result({
      chart,
      annualBaseline: { score: 60, sourceModule: "v02-research", sourceContractVersion: "1", sourceEngineVersion: "1" },
      provider: mockProvider,
      diagnostics,
    });

    // 1. Result contract is discriminated
    expect(["resolved", "partial", "unavailable"]).toContain(result.status);
    
    // Check missing focus palaces are fail-closed
    expect(result.months.length).toBe(12);

    for (const m of result.months) {
      if (m.status === "unavailable") {
        expect(m.overallMonthlyScore).toBeNull();
        expect(m.overallBand).toBeNull();
        expect(m.breakdown).toBeNull();
        expect(m.domainProjections).toHaveLength(0);
      } else {
        expect(m.overallMonthlyScore).not.toBeNull();
        expect(m.breakdown).not.toBeNull();
        // Domain projections must remain disabled
        expect(m.domainProjections).toHaveLength(0);
        
        // Assert finiteness of scores
        expect(Number.isFinite(m.overallMonthlyScore)).toBe(true);
        expect(m.overallMonthlyScore).toBeGreaterThanOrEqual(0);
        expect(m.overallMonthlyScore).toBeLessThanOrEqual(100);

        // Kỵ collision
        if (m.breakdown!.transformations.collisionCandidates.length > 0) {
          expect(m.status).toBe("partial");
          expect(m.breakdown!.transformations.collisionPolicyApplied).toBe(false);
        }

        // Dau Quan multiplier logic
        if (m.breakdown!.palace.dauQuanMultiplier === 1.5) {
          expect(m.focusPalaceIndex).toBe(chart.monthStartPalace?.index);
        }
      }
    }
  });

  it("Rejects invalid annual baselines", () => {
    const chart = calculate({
      solarDate: "1990-10-15",
      birthHour: "Thìn",
      gender: "male",
      timezone: "7",
      annualYear: "2026",
      flowBase: "month"
    });

    const diagnostics: any = {
      invalidMonthNumber: [],
      missingFocusPalace: [],
      missingCalendarStemBranch: [],
      duplicateMonthKeys: [],
      ambiguousTransformationTargets: [],
      unresolvedTransformationTargets: [],
      missingMonthlyEntries: [],
      providerSchoolMismatch: []
    };

    const result = buildV02Result({
      chart,
      annualBaseline: null,
      provider: mockProvider,
      diagnostics,
    });

    expect(result.status).toBe("unavailable");
    expect(result.reasonCodes).toContain("annual-baseline-unavailable");
  });
});
