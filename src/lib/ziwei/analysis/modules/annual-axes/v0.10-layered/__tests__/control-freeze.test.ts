import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import type { BirthInput } from "@/types/chart";
import { analyzeAnnualAxesNamPhaiV08 } from "../../nam-phai-v08/analyze";
import { analyzeAnnualAxes } from "../../analyze";
import { ANNUAL_AXIS_DOMAINS } from "../../../../contracts/annual-axes";

const CONTROL_FIXTURES: BirthInput[] = [
  {
    solarDate: "1991-09-21",
    birthHour: "Dậu",
    gender: "female",
    timezone: "7",
    annualYear: "2026",
    flowBase: "luu-nien",
  },
  {
    solarDate: "1998-10-01",
    birthHour: "Dần",
    gender: "male",
    timezone: "7",
    annualYear: "2026",
    flowBase: "luu-nien",
  },
];

describe("CONTROL-AAV08-2 freeze", () => {
  it("analyzeAnnualAxes Nam Phái still routes to V0.8.2", () => {
    const chart = calculateNamPhai(CONTROL_FIXTURES[0]!);
    const routed = analyzeAnnualAxes(chart, { school: "nam-phai" });
    const direct = analyzeAnnualAxesNamPhaiV08(chart);
    expect(routed.versions.engineVersion).toBe("0.8.2");
    expect(direct.versions.engineVersion).toBe("0.8.2");
    expect(routed.versions.contractVersion).toBe("0.8.2");
    for (const domain of ANNUAL_AXIS_DOMAINS) {
      expect(routed.axes[domain].score).toBe(direct.axes[domain].score);
      expect(routed.axes[domain].engine).toBe("v0.8");
    }
  });

  it("frozen fixture scores remain deterministic", () => {
    for (const input of CONTROL_FIXTURES) {
      const chart = calculateNamPhai(input);
      const a = analyzeAnnualAxesNamPhaiV08(chart);
      const b = analyzeAnnualAxesNamPhaiV08(chart);
      expect(a.versions.engineVersion).toBe("0.8.2");
      expect(a.versions.knowledgeVersion).toBe("0.8.0");
      for (const domain of ANNUAL_AXIS_DOMAINS) {
        expect(a.axes[domain].score).toBe(b.axes[domain].score);
      }
    }
  });
});
