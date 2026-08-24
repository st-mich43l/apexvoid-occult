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
  it("routes Nam Phái to V0.10 layered-balanced and exposes those scores", () => {
    const chart = calculateNamPhai(CASE_1998_2026);
    const released = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const directV10 = analyzeAnnualAxesNamPhaiV10(chart, {
      profileId: "layered-balanced",
      projectionVariant: "legacy",
    });

    expect(released.versions.engineVersion).toBe(directV10.versions.engineVersion);
    expect(released.versions.knowledgeVersion).toBe(directV10.versions.knowledgeVersion);

    for (const domain of ANNUAL_AXIS_DOMAINS) {
      const axis = released.axes[domain];
      expect(axis.engine).toBe("v0.10");
      expect(axis.score).toBe(directV10.axes[domain].finalScore);
    }
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
