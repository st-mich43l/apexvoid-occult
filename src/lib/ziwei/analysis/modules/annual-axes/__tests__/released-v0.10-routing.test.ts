import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { ANNUAL_AXIS_DOMAINS } from "../../../contracts/annual-axes";
import { analyzeAnnualAxes } from "../index";
import { analyzeAnnualAxesNamPhaiV10 } from "../v0.10-layered/analyze";

const CASE_1998_2026: BirthInput = {
  solarDate: "1998-10-01",
  birthHour: "Dần",
  gender: "male",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("released Annual Axes routing", () => {
  it("routes Nam Phái to V0.11 domain-engine with semantic 0.11.0 metadata", () => {
    const chart = calculateNamPhai(CASE_1998_2026);
    const released = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const directV10 = analyzeAnnualAxesNamPhaiV10(chart, {
      profileId: "layered-balanced",
      projectionVariant: "legacy",
      includeControl: false,
    });

    expect(released.versions.engineVersion).toBe("0.11.0");
    expect(released.versions.contractVersion).toBe("0.11.0");
    expect(released.versions.knowledgeVersion).toBe("0.11.0");
    expect(released.releaseStage).toBe("experimental");
    expect(released.calibrated).toBe(false);
    expect(released.annualFocus).not.toBeNull();
    expect(released.capabilities.supportsAnnualFocus).toBe(true);
    expect(released.capabilities.primaryAnnualFocus).toBe("annual-major-fortune");

    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = released.axes[domain];
      expect(axis.engine).toBe("v0.11");
      expect(axis.score).toBe(directV10.axes[domain].finalScore);
      if (axis.engine === "v0.11") {
        expect(axis.v10Trace.profileId).toBe("layered-balanced");
        expect(axis.v10Trace.projectionVariant).toBe("legacy");
      }
    }

    expect(directV10.controlScores.career).toBeNull();
  });

  it("does not expose V0.8 as the public Nam Phái runtime", () => {
    const chart = calculateNamPhai(CASE_1998_2026);
    const released = analyzeAnnualAxes(chart, { school: "nam-phai" });

    expect(released.versions.engineVersion).not.toBe("0.8.2");
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      expect(released.axes[domain].engine).not.toBe("v0.8");
    }
  });
});
