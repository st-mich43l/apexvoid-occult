import { describe, expect, it } from "vitest";
import { getAnalysisStatus } from "@/lib/ziwei/analysis/contracts/common";
import { isMonthlyFlowV03Enabled } from "@/lib/ziwei/analysis/feature-flags";
import { hardGateShape } from "../hard-gate-shape";
// removed import

describe("Monthly Flow V0.3.0 production production gates", () => {
  it("feature flag defaults on and status is available 0.3.0", () => {
    expect(isMonthlyFlowV03Enabled()).toBe(true);
    expect(getAnalysisStatus("monthly-flow")).toEqual({
      status: "available",
      module: "monthly-flow",
      version: "0.3.0",
    });
  });

  it("documents hard-gate zero targets including V0.3.0 gates", () => {
    expect(hardGateShape).toEqual({
      determinismFailures: 0,
      scoreBoundFailures: 0,
      duplicatePhysicalFactFailures: 0,
      missingSourceIds: 0,
      providerSchoolMismatch: 0,
      fabricatedLeapMonthCount: 0,
      anchorFidelityFailures: 0,
      productionFocusFallbackCount: 0,
      healthUiExposureFailures: 0,
      currentMonthIdentityFailures: 0,
      domainMapFailures: 0,
    });
  });

});
