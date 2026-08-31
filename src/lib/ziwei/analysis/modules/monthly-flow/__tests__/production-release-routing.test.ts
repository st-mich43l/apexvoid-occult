import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalysisStatus } from "../../../contracts/common";
import { calculate as calculateNamPhai } from "../../../../engine-nam-phai";
import { calculate as calculateTrungChau } from "../../../../engine-trung-chau";
import { analyzeAnnualAxes } from "../../annual-axes";
import {
  analyzeMonthlyFlow,
  type MonthlyFlowAnalysis,
} from "../production";
import {
  analyzeMonthlyFlowProductionV03,
  MonthlyFlowV03UnsupportedSchoolError,
} from "../v0.3-production/analyze-production";
import * as v03Module from "../v0.3-production/analyze-production";
import frozenNamV03 from "./fixtures/nam-phai-v03-1990-canh-2026.json";

const REGRESSION_BIRTH = {
  solarDate: "15/08/1990",
  birthHour: "Ngọ",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien" as const,
};

function slimForZeroDelta(result: MonthlyFlowAnalysis) {
  if (!("version" in result) || result.version !== "0.3.0") {
    throw new Error("expected V0.3 production result");
  }
  return {
    annualYear: result.annualYear,
    status: result.status,
    baselineScore: result.annualBaseline?.score ?? null,
    months: result.monthSummaries.map((m) => ({
      monthKey: m.monthKey,
      status: m.status,
      focusPalaceIndex: m.focusPalaceIndex,
      calendarStem: m.calendarStem,
      calendarBranch: m.calendarBranch,
      score: m.score,
      band: m.band,
      reasonCodes: [...m.reasonCodes].sort(),
      collisionCount: m.collisionCandidates.length,
      breakdown: m.breakdown,
    })),
  };
}

describe("getAnalysisStatus monthly-flow release routing", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("Nam → available 0.3.0", () => {
    expect(getAnalysisStatus("monthly-flow", { school: "nam-phai" })).toEqual({
      status: "available",
      module: "monthly-flow",
      version: "0.3.0",
    });
    expect(getAnalysisStatus("monthly-flow")).toEqual({
      status: "available",
      module: "monthly-flow",
      version: "0.3.0",
    });
  });

  it("TC → unavailable/rebuilding (not invalid-knowledge)", () => {
    expect(getAnalysisStatus("monthly-flow", { school: "trung-chau" })).toEqual({
      status: "unavailable",
      module: "monthly-flow",
      reason: "rebuilding",
    });
  });

  it("Nam + V03 off → unavailable/rebuilding", () => {
    vi.stubEnv("VITE_ZIWEI_MONTHLY_FLOW_V03", "false");
    expect(getAnalysisStatus("monthly-flow", { school: "nam-phai" })).toEqual({
      status: "unavailable",
      module: "monthly-flow",
      reason: "rebuilding",
    });
  });

  it("Nam + V01 off → unavailable/rebuilding", () => {
    vi.stubEnv("VITE_ZIWEI_MONTHLY_FLOW_V01", "false");
    expect(getAnalysisStatus("monthly-flow", { school: "nam-phai" })).toEqual({
      status: "unavailable",
      module: "monthly-flow",
      reason: "rebuilding",
    });
  });

  it("never returns available 0.1.2", () => {
    for (const school of ["nam-phai", "trung-chau"] as const) {
      const status = getAnalysisStatus("monthly-flow", { school });
      if (status.status === "available") {
        expect(status.version).not.toBe("0.1.2");
      }
    }
    vi.stubEnv("VITE_ZIWEI_MONTHLY_FLOW_V03", "false");
    expect(getAnalysisStatus("monthly-flow", { school: "nam-phai" })).toMatchObject({
      status: "unavailable",
    });
  });
});

describe("analyzeMonthlyFlow production release routing", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("Nam canonical equals direct V0.3 and frozen regression fixture", () => {
    const chart = calculateNamPhai(REGRESSION_BIRTH);
    const annualAxesResult = analyzeAnnualAxes(chart, { school: "nam-phai" }) as never;
    const direct = analyzeMonthlyFlowProductionV03(chart, {
      school: "nam-phai",
      annualAxesResult,
    });
    const canonical = analyzeMonthlyFlow(chart, {
      school: "nam-phai",
      annualAxesResult,
    });

    expect(canonical).toEqual(direct);
    expect(slimForZeroDelta(canonical)).toEqual(frozenNamV03);
  });

  it("TC is unavailable with school trung-chau and does not call V0.3", () => {
    const spy = vi.spyOn(v03Module, "analyzeMonthlyFlowProductionV03");
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const annualAxesResult = analyzeAnnualAxes(chart, {
      school: "trung-chau",
    }) as never;
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      annualAxesResult,
    });

    expect(spy).not.toHaveBeenCalled();
    expect(result).toEqual({
      module: "monthly-flow",
      school: "trung-chau",
      status: "unavailable",
      version: null,
      annualYear: chart.annualYear ?? null,
      monthSummaries: [],
      annualBaseline: null,
      releaseReason: "unsupported-school",
    });
  });

  it("V03 disabled is unavailable and does not call V0.3", () => {
    vi.stubEnv("VITE_ZIWEI_MONTHLY_FLOW_V03", "false");
    const spy = vi.spyOn(v03Module, "analyzeMonthlyFlowProductionV03");
    const chart = calculateNamPhai(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, { school: "nam-phai" });

    expect(spy).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      module: "monthly-flow",
      school: "nam-phai",
      status: "unavailable",
      releaseReason: "v03-disabled",
      monthSummaries: [],
    });
  });
});

describe("analyzeMonthlyFlowProductionV03 school boundary", () => {
  it("unsafe TC call fails closed", () => {
    expect(() =>
      analyzeMonthlyFlowProductionV03({} as never, {
        school: "trung-chau" as "nam-phai",
      }),
    ).toThrow(MonthlyFlowV03UnsupportedSchoolError);
  });

  it("replaces false-confidence TC-without-baseline test with explicit school rejection", () => {
    // Provider CAN be created for TC; absence of Annual Axes is NOT school routing.
    // School rejection must throw before any scoring path.
    expect(() =>
      analyzeMonthlyFlowProductionV03(
        { annualYear: 2026 } as never,
        { school: "trung-chau" as "nam-phai" },
      ),
    ).toThrow(/nam-phai only/);
  });
});
