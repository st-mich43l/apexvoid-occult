import { describe, expect, it } from "vitest";
import type {
  PalaceOverviewCalibrationConfidence,
  PalaceOverviewReleaseStage,
} from "../types";
import { ordinalAgreement, catastrophicInversionRate, engineOrdinalFromNormalizedAxis } from "../calibration/metrics";
import {
  assertSplitIsByCompleteChart,
  assessBenchmarkReadiness,
  loadBenchmarkSplit,
  reviewedChartCount,
  reviewedPalaceLabelCount,
  uniqueReviewers,
} from "../calibration/readiness";

describe("calibration benchmark readiness", () => {
  it("does not treat the unreviewed seed as expert ground truth", () => {
    expect(reviewedPalaceLabelCount()).toBe(0);
    expect(uniqueReviewers()).toEqual([]);
    expect(engineOrdinalFromNormalizedAxis(20)).toBe("low");
    expect(
      catastrophicInversionRate([
        { expertNet: null, engineBand: "balanced" },
      ]).rate,
    ).toBeNull();
    const stage: PalaceOverviewReleaseStage = "experimental";
    const conf: PalaceOverviewCalibrationConfidence = "unvalidated";
    expect(stage).toBe("experimental");
    expect(conf).toBe("unvalidated");
    expect(reviewedChartCount()).toBe(0);
    const readiness = assessBenchmarkReadiness();
    expect(readiness.ready).toBe(false);
    expect(readiness.missing.length).toBeGreaterThan(1);
  });

  it("split is by complete chart with no calibration/holdout overlap", () => {
    const split = loadBenchmarkSplit();
    expect(split.policy).toBe("whole-case-sha256-v2");
    expect(assertSplitIsByCompleteChart()).toBe(true);
    expect(split.holdoutCaseIds).toEqual([]);
  });

  it("ordinal agreement is null when labels are missing (not averaged)", () => {
    const stats = ordinalAgreement([
      { expert: null, engine: "medium" },
      { expert: null, engine: "high" },
    ]);
    expect(stats.rate).toBeNull();
    expect(stats.compared).toBe(0);
  });
});
