import { describe, expect, it } from "vitest";
import { MF_V02_FAST_CORPUS } from "../corpus";
import { runMajorFortuneV02Audit } from "../run-audit";

describe("Major Fortune V0.2 audit-fast", () => {
  it("passes hard gates on fast corpus", () => {
    const metrics = runMajorFortuneV02Audit(MF_V02_FAST_CORPUS);
    expect(metrics.scoreBoundsFailures).toBe(0);
    expect(metrics.annualYearIndependenceFailures).toBe(0);
    expect(metrics.deterministicRerunFailures).toBe(0);
    expect(metrics.v01ControlReproducible).toBe(true);
    expect(metrics.score.nanOrInfinity).toBe(0);
    expect(metrics.hardGateFailures).toEqual([]);
  });
});
