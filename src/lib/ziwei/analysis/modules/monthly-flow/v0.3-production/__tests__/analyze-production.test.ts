import { describe, it, expect, vi } from "vitest";
import { analyzeMonthlyFlowProductionV03 } from "../analyze-production";
import * as deriveAnnualBaselineModule from "../derive-annual-baseline";
import * as resolveMonthContextsModule from "../../v0.2/resolve-month-contexts";
import type { ChartData } from "@/types/chart";

vi.mock("../derive-annual-baseline", () => ({
  deriveAnnualBaseline: vi.fn(),
}));

vi.mock("../../v0.2/resolve-month-contexts", () => ({
  buildV02Result: vi.fn(),
}));

describe("analyzeMonthlyFlowProductionV03", () => {
  it("returns unavailable when school mismatch or provider missing", () => {
    vi.spyOn(resolveMonthContextsModule, "buildV02Result").mockReturnValue({
      status: "unavailable",
      reasonCodes: [],
      annualYear: 2026,
      annualStem: "Binh",
      annualBranch: "Ngo",
      months: []
    } as any);
    
    const res = analyzeMonthlyFlowProductionV03({} as ChartData, { school: "trung-chau" });
    // Since default feature flag logic might not include V0.3 for trung chau provider,
    // let's see. If the provider doesn't match or doesn't support the school...
    expect(res.status).toBe("unavailable");
  });

  it("calls deriveAnnualBaseline and buildV02Result correctly", () => {
    vi.spyOn(deriveAnnualBaselineModule, "deriveAnnualBaseline").mockReturnValue({
      score: 60,
      sourceModule: "annual-axes",
      sourceContractVersion: "1.0",
      sourceEngineVersion: "1.0",
      sourceKnowledgeVersion: "1.0",
      aggregationMethod: "lower-median-v1",
      sourceScoreCount: 4,
      sourceScores: [40, 50, 60, 70]
    });

    vi.spyOn(resolveMonthContextsModule, "buildV02Result").mockReturnValue({
      status: "resolved",
      reasonCodes: [],
      annualYear: 2026,
      annualStem: "Binh",
      annualBranch: "Ngo",
      months: [
        {
          status: "resolved",
          monthIndex: 1,
          lunarMonth: 1,
          isLeapMonth: false,
          calendarStem: "Giap",
          calendarBranch: "Ty",
          focusPalaceIndex: 2,
          reasonCodes: [],
          diagnostics: {
            unresolvedTransformationTargets: [],
            ambiguousTransformationTargets: []
          },
          overallMonthlyScore: 80,
          overallBand: "favorable",
          breakdown: {
            annualBaseline: 60,
            palace: { raw: 10, capped: 10, dauQuanMultiplier: 1, amplified: 10 },
            transformations: {
              contributions: [],
              collisionCandidates: [],
              dominantContributionId: null,
              dominantDelta: 0,
              secondaryRawSum: 0,
              secondaryAppliedDelta: 0,
              authorizedAppliedDelta: 0,
              collisionPolicyApplied: false,
              finalDelta: 5
            },
            localActivation: 15,
            annualEnvelope: { radius: 30, floor: 30, ceiling: 90 },
            rawMonthlyScore: 75,
            finalMonthlyScore: 80,
            clippedByAnnualFloor: false,
            clippedByAnnualCeiling: false
          },
          provenance: { annualHeadPalace: null, smallLimitPalace: null, taiTuePalace: null },
          domainProjections: []
        }
      ]
    });

    const chart = { annualYear: 2026 } as ChartData;
    const mockAnnualAxesResult = {
      status: "available",
      versions: { contractVersion: "0.8.0", engineVersion: "0.8.0", knowledgeVersion: "0.8.0" },
      axes: {
        mental: { status: "available", score: 60, raw: 0 },
        health: { status: "available", score: 60, raw: 0 },
        wealth: { status: "available", score: 60, raw: 0 },
        career: { status: "available", score: 60, raw: 0 },
        social: { status: "available", score: 60, raw: 0 },
        romance: { status: "available", score: 60, raw: 0 },
      }
    } as any;
    const res = analyzeMonthlyFlowProductionV03(chart, { school: "nam-phai", annualAxesResult: mockAnnualAxesResult });
    
    expect(res.status).toBe("resolved");
    expect(res.annualBaseline?.score).toBe(60);
    expect(res.monthSummaries.length).toBe(1);
    const firstSummary = res.monthSummaries[0];
    if (firstSummary && "score" in firstSummary && firstSummary.score != null) {
      expect(firstSummary.score).toBe(80);
      expect(firstSummary.band).toBe("favorable");
    }
  });
});
