import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAnnualAxesNamPhaiV10 } from "../analyze";
import { CASE_AA10_M1998_DAN_2026 } from "../compare";
import { evaluateCaseAa10Hypotheses } from "../hypothesis";
import { analyzeMajorFortune } from "../../../major-fortune";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("CASE-AA10-M1998-DAN-2026", () => {
  it("career natal includes Quan Lộc; romance natal includes Phu Thê; annual is 2026", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const result = analyzeAnnualAxesNamPhaiV10(chart, {
      profileId: "layered-balanced",
    });
    expect(result.annualYear).toBe(2026);
    expect(
      result.axes.career.natal.contributors.some((c) => c.palaceName === "Quan Lộc"),
    ).toBe(true);
    expect(
      result.axes.romance.natal.contributors.some((c) => c.palaceName === "Phu Thê"),
    ).toBe(true);
    expect(result.axes.career.annual.availability).not.toBe("unavailable");
    expect(result.calibrated).toBe(false);
    expect(result.releaseStage).toBe("experimental");

    const hyp = evaluateCaseAa10Hypotheses(result);
    expect(["REPRODUCED", "PARTIALLY_REPRODUCED", "NOT_REPRODUCED"]).toContain(
      hyp.careerHypothesis.status,
    );
    expect(["REPRODUCED", "PARTIALLY_REPRODUCED", "NOT_REPRODUCED"]).toContain(
      hyp.romanceHypothesis.status,
    );
  });
});

describe("V0.10 temporal isolation", () => {
  it("NatalFoundation identical across annual years", () => {
    const base = { ...CASE_AA10_M1998_DAN_2026 };
    const a = analyzeAnnualAxesNamPhaiV10(
      calculateNamPhai({ ...base, annualYear: "2025" }),
    );
    const b = analyzeAnnualAxesNamPhaiV10(
      calculateNamPhai({ ...base, annualYear: "2026" }),
    );
    for (const domain of ["career", "romance", "wealth"] as const) {
      expect(a.axes[domain].natal.signedNet).toBe(b.axes[domain].natal.signedNet);
      expect(a.axes[domain].natal.supportMass).toBe(b.axes[domain].natal.supportMass);
      expect(a.axes[domain].natal.pressureMass).toBe(b.axes[domain].natal.pressureMass);
    }
  });

  it("AnnualTrigger may change with annualYear; Major Fortune ignores annual-only contamination path", () => {
    const base = { ...CASE_AA10_M1998_DAN_2026 };
    const chart2025 = calculateNamPhai({ ...base, annualYear: "2025" });
    const chart2026 = calculateNamPhai({ ...base, annualYear: "2026" });
    const a = analyzeAnnualAxesNamPhaiV10(chart2025);
    const b = analyzeAnnualAxesNamPhaiV10(chart2026);

    // Decade nets should match when same active cycle (same natal chart decade)
    for (const domain of ["career", "romance"] as const) {
      expect(a.axes[domain].decade.signedNet).toBe(b.axes[domain].decade.signedNet);
    }

    const mf = analyzeMajorFortune(chart2026, { school: "nam-phai" });
    // Presence of annual fields on ChartData is expected; evidence must stay major-fortune.
    expect(
      mf.emittedEvidence.every((e) => e.temporalScope === "major-fortune"),
    ).toBe(true);
    expect(
      mf.emittedEvidence.some(
        (e) => e.temporalScope === "annual" || e.temporalScope === "monthly",
      ),
    ).toBe(false);

    // Annual may differ (not forced — but layers remain distinct)
    expect(a.axes.career.annual.layer).toBe("annual-trigger");
    expect(b.axes.career.annual.layer).toBe("annual-trigger");
  });
});

describe("V0.10 monthly-flow forbidden", () => {
  it("candidate source tree does not import monthly-flow analyzer", () => {
    const root = join(
      process.cwd(),
      "src/lib/ziwei/analysis/modules/annual-axes/v0.10-layered",
    );
    const files = [
      "analyze.ts",
      "adapt-natal-foundation.ts",
      "adapt-major-fortune.ts",
      "adapt-annual-trigger.ts",
      "resonance.ts",
      "compose.ts",
    ];
    for (const f of files) {
      const text = readFileSync(join(root, f), "utf8");
      expect(text.includes("monthly-flow")).toBe(false);
      expect(text.includes("analyzeMonthlyFlow")).toBe(false);
    }
  });
});

describe("V0.10 school isolation", () => {
  it("candidate is Nam Phái research only", () => {
    const chart = calculateNamPhai(CASE_AA10_M1998_DAN_2026);
    const result = analyzeAnnualAxesNamPhaiV10(chart);
    expect(result.school).toBe("nam-phai");
  });
});
