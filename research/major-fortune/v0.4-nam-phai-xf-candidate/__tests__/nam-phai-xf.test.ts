import { describe, it, expect, vi } from "vitest";
import { analyzeMajorFortuneOrdinalV03 } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/v0.3-ordinal-adapter/analyze";
import { calculate as calculateNamPhai } from "../../../../src/lib/ziwei/engine-nam-phai";
const REGRESSION = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female" as const,
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};
import * as featureFlags from "../../../../src/lib/ziwei/analysis/feature-flags";

describe("Major Fortune V0.4 Nam Phái Transformation Candidate", () => {
  it("enables Nam Phái transformations when flag is ON", () => {
    vi.spyOn(featureFlags, "isMajorFortuneV04NamPhaiTransformationsEnabled").mockReturnValue(true);

    const chart = calculateNamPhai(REGRESSION);
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });

    // The Tứ Hóa pillar should now be available or scored, not blocked.
    expect(analysis.result?.pillars["tu-hoa-sat-tinh"].state).not.toBe("partial-data");
    const tuHoaRejects = analysis.result?.pillars["tu-hoa-sat-tinh"].rejectedEvidence ?? [];
    
    // There shouldn't be a nam-phai-transformations-not-admitted-v03-policy reject.
    expect(
      tuHoaRejects.some(
        (r) => r.reason === "nam-phai-transformations-not-admitted-v03-policy"
      )
    ).toBe(false);
    
    vi.restoreAllMocks();
  });

  it("blocks Nam Phái transformations when flag is OFF", () => {
    vi.spyOn(featureFlags, "isMajorFortuneV04NamPhaiTransformationsEnabled").mockReturnValue(false);

    const chart = calculateNamPhai(REGRESSION);
    const analysis = analyzeMajorFortuneOrdinalV03(chart, { school: "nam-phai" });

    expect(analysis.result?.pillars["tu-hoa-sat-tinh"].state).toBe("partial-data");
    const reasonCodes = analysis.result?.pillars["tu-hoa-sat-tinh"].reasonCodes ?? [];
    expect(reasonCodes.includes("nam-phai-transformations-not-admitted-v03-policy")).toBe(true);

    vi.restoreAllMocks();
  });
});
