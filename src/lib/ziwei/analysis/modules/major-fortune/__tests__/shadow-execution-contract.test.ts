/**
 * Locks the Major Fortune shadow-execution contract:
 * canonical production + timeline must not execute V1.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BirthInput } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";

const { v1Spy } = vi.hoisted(() => ({
  v1Spy: vi.fn(() => null),
}));

vi.mock("../engine-v1/analyze", () => ({
  analyzeMajorFortuneV1: v1Spy,
}));

import { analyzeMajorFortune } from "../production";
import { analyzeMajorFortuneTimeline } from "../timeline";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("Major Fortune shadow execution boundary", () => {
  beforeEach(() => {
    v1Spy.mockClear();
  });

  it("canonical analyzeMajorFortune does not execute V1", () => {
    const chart = calculateNamPhai(REGRESSION);
    const palace = chart.majorFortunePalace;
    expect(palace?.majorFortune).toBeTruthy();

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const analysis = analyzeMajorFortune(chart, {
      school: "nam-phai",
      cycleOverride: {
        cycleIndex: palace!.majorFortune!.order!,
        startAge: palace!.majorFortune!.start!,
        endAge: palace!.majorFortune!.end!,
        activePalaceIndex: palace!.index,
      },
    });

    expect(analysis.model).toBe("v0.5-candidate");
    expect(v1Spy).toHaveBeenCalledTimes(0);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("timeline does not execute V1 across all cycles", () => {
    const chart = calculateNamPhai(REGRESSION);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const timeline = analyzeMajorFortuneTimeline(chart, { school: "nam-phai" });

    expect(timeline.points.length).toBeGreaterThan(1);
    expect(v1Spy).toHaveBeenCalledTimes(0);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
