import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import { ANNUAL_AXIS_DOMAINS, type AnnualAxisDomain } from "../../../contracts/annual-axes";
import { analyzeMonthlyFlow } from "../analyze";
import { REGRESSION_BIRTH, namPhaiProvider, trungChauProvider } from "./test-providers";

describe("analyzeMonthlyFlow — Trung Châu regression", () => {
  it("returns twelve month results with six available domains each", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });

    expect(result.status).toBe("available");
    expect(result.months).toHaveLength(12);
    for (const month of result.months) {
      expect(month.status).toBe("available");
      expect(month.overall.status).toBe("available");
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        const axis = month.domains[domain];
        expect(axis.status).toBe("available");
        if (axis.status !== "available") continue;
        expect(axis.score).toBeGreaterThanOrEqual(0);
        expect(axis.score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("uses an explicit overall evidence scope instead of a fabricated domain", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });

    for (const month of result.months) {
      expect(month.overall.status).toBe("available");
      if (month.overall.status !== "available") continue;
      expect(month.overall.evidence.length).toBeGreaterThan(0);
      expect(month.overall.evidence.every((item) => item.domain === "overall")).toBe(true);
      expect(month.overall.coverage.coveragePercent).toBeGreaterThanOrEqual(0);
      expect(month.overall.coverage.coveragePercent).toBeLessThanOrEqual(100);
      expect(month.overall.confidence.confidencePercent).toBeGreaterThanOrEqual(0);
      expect(month.overall.confidence.confidencePercent).toBeLessThanOrEqual(100);
    }
  });

  it("reports V1 RC1 engine and contract provenance", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    expect(result.versions.engineVersion).toBe("1.0.0-rc.1");
    expect(result.versions.contractVersion).toBe("1.0.0-rc.1");
  });

  it("does not falsely report Palace Overview star source IDs as missing", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    expect(result.diagnostics.missingSourceIds).toEqual([]);
  });

  it("does not mutate the input chart", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const beforeMonthCount = (chart.monthlyPalaces ?? []).length;
    const beforePalaceStars = chart.palaces.map((palace) => (palace.stars ?? []).length);
    const beforeAnnualStars = (chart.annualStars ?? []).length;

    analyzeMonthlyFlow(chart, { school: "trung-chau", provider: trungChauProvider() });

    expect((chart.monthlyPalaces ?? []).length).toBe(beforeMonthCount);
    expect(chart.palaces.map((palace) => (palace.stars ?? []).length)).toEqual(beforePalaceStars);
    expect((chart.annualStars ?? []).length).toBe(beforeAnnualStars);
  });

  it("is byte-stable for identical input", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const first = analyzeMonthlyFlow(chart, { school: "trung-chau", provider: trungChauProvider() });
    const second = analyzeMonthlyFlow(chart, { school: "trung-chau", provider: trungChauProvider() });
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("never emits interaction-category evidence in any month/domain", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    for (const month of result.months) {
      if (month.overall.status === "available") {
        expect(month.overall.evidence.some((item) => item.category === "interaction")).toBe(false);
      }
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        const axis = month.domains[domain];
        if (axis.status !== "available") continue;
        expect(axis.evidence.some((item) => item.category === "interaction")).toBe(false);
      }
    }
  });

  it("preserves static school capabilities from the profile", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    expect(result.capabilities.supportsMonthlyTransformations).toBe(true);
    expect(result.capabilities.supportsSixAxisOverlayFromCurrentChart).toBe(true);
  });

  it("reports monthly transformation evidence with correct category", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    const transformationCount = result.months.flatMap((month) =>
      ANNUAL_AXIS_DOMAINS.flatMap((domain) => {
        const axis = month.domains[domain];
        return axis.status === "available"
          ? axis.evidence.filter((item) => item.category === "monthly-transformation")
          : [];
      }),
    ).length;
    expect(transformationCount).toBeGreaterThan(0);
  });

  it("period-independent — annualYear+1 changes results but keeps structural stability", () => {
    const chart2026 = calculateTrungChau({ ...REGRESSION_BIRTH, annualYear: "2026" });
    const chart2027 = calculateTrungChau({ ...REGRESSION_BIRTH, annualYear: "2027" });
    const first = analyzeMonthlyFlow(chart2026, { school: "trung-chau", provider: trungChauProvider() });
    const second = analyzeMonthlyFlow(chart2027, { school: "trung-chau", provider: trungChauProvider() });
    expect(first.months).toHaveLength(12);
    expect(second.months).toHaveLength(12);
    expect(first.months[0]!.identity.monthKey).toBe("2026-M01");
    expect(second.months[0]!.identity.monthKey).toBe("2027-M01");
  });
});

describe("analyzeMonthlyFlow — Nam Phái school", () => {
  it("reports six-axis overlay supported via approved natal-domain resolver", () => {
    const chart = calculateNamPhai(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "nam-phai",
      provider: namPhaiProvider(),
    });
    expect(result.capabilities.supportsMonthlyFocus).toBe(true);
    expect(result.capabilities.supportsMonthlyTransformations).toBe(true);
    expect(result.capabilities.supportsSixAxisOverlayFromCurrentChart).toBe(true);
  });

  it("keeps overall scores when annual-domain overlays are unavailable", () => {
    const chart = calculateNamPhai(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "nam-phai",
      provider: namPhaiProvider(),
    });

    expect(result.months).toHaveLength(12);
    for (const month of result.months) {
      expect(month.overall.status).toBe("available");
      expect(month.status).toBe("partial");
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        expect(month.domains[domain].status).toBe("unavailable");
      }
    }
    expect(result.status).toBe("partial");
    expect(result.diagnostics.incompleteAnnualDomainLabels.length).toBeGreaterThan(0);
  });

  it("with approved adapter map, domains can score for Nam Phái", () => {
    const chart = calculateNamPhai(REGRESSION_BIRTH);
    const explicitAnnualDomainMap = new Map<number, AnnualAxisDomain>([
      [0, "health"],
      [1, "family"],
      [2, "family"],
      [3, "family"],
      [4, "career"],
      [5, "social"],
      [6, "career"],
      [7, "health"],
      [8, "wealth"],
      [9, "family"],
      [10, "romance"],
      [11, "social"],
    ]);
    const result = analyzeMonthlyFlow(chart, {
      school: "nam-phai",
      provider: namPhaiProvider(),
      explicitAnnualDomainMap,
    });
    expect(result.months.length).toBeGreaterThan(0);
    expect(result.capabilities.supportsSixAxisOverlayFromCurrentChart).toBe(true);
    const anyAvailable = result.months.some((month) =>
      ANNUAL_AXIS_DOMAINS.some((domain) => month.domains[domain].status === "available"),
    );
    expect(anyAvailable).toBe(true);
  });
});

describe("analyzeMonthlyFlow — safety invariants", () => {
  it("never JSON.stringify()s FlowMonthEntry.palace back-references", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    expect(() =>
      analyzeMonthlyFlow(chart, { school: "trung-chau", provider: trungChauProvider() }),
    ).not.toThrow();
  });

  it("rejects providers whose school mismatches", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const bad = { ...trungChauProvider(), school: "nam-phai" as const };
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: bad,
    });
    expect(result.status).toBe("unavailable");
    expect(result.diagnostics.providerSchoolMismatch.length).toBeGreaterThan(0);
  });

  it("calculationPolicyProfileVersion is honestly null with a diagnostic", () => {
    const chart = calculateTrungChau(REGRESSION_BIRTH);
    const result = analyzeMonthlyFlow(chart, {
      school: "trung-chau",
      provider: trungChauProvider(),
    });
    expect(result.versions.calculationPolicyProfileVersion).toBeNull();
    expect(result.diagnostics.missingCalculationPolicyProfile.length).toBeGreaterThan(0);
  });
});
