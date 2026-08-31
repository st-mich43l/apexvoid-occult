import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BirthInput } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import * as candidateModule from "../v0.5-candidate/candidate";
import * as v1Module from "../engine-v1/analyze";
import { compareMajorFortuneV1Shadow } from "../shadow";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

function activeCycle(chart: ReturnType<typeof calculateNamPhai>) {
  const palace = chart.majorFortunePalace;
  if (!palace?.majorFortune) throw new Error("missing major fortune");
  return {
    cycleIndex: palace.majorFortune.order!,
    startAge: palace.majorFortune.start!,
    endAge: palace.majorFortune.end!,
    activePalaceIndex: palace.index,
  };
}

describe("compareMajorFortuneV1Shadow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("executes V0.5 once and V1 once per comparison and is deterministic", () => {
    const chart = calculateNamPhai(REGRESSION);
    const cycle = activeCycle(chart);
    const v05Spy = vi.spyOn(candidateModule, "analyzeMajorFortuneCandidateV05");
    const v1Spy = vi.spyOn(v1Module, "analyzeMajorFortuneV1");

    const first = compareMajorFortuneV1Shadow(chart, {
      school: "nam-phai",
      cycleOverride: cycle,
    });
    expect(v05Spy).toHaveBeenCalledTimes(1);
    expect(v1Spy).toHaveBeenCalledTimes(1);

    const second = compareMajorFortuneV1Shadow(chart, {
      school: "nam-phai",
      cycleOverride: cycle,
    });
    expect(v05Spy).toHaveBeenCalledTimes(2);
    expect(v1Spy).toHaveBeenCalledTimes(2);
    expect(first).toEqual(second);
    expect(first.baseline.model).toBe("v0.5");
    expect(first.candidate.model).toBe("v1");
  });

  it("returns structured error when V1 throws", () => {
    const chart = calculateNamPhai(REGRESSION);
    const cycle = activeCycle(chart);
    vi.spyOn(v1Module, "analyzeMajorFortuneV1").mockImplementation(() => {
      throw new Error("forced-v1-failure");
    });

    const comparison = compareMajorFortuneV1Shadow(chart, {
      school: "nam-phai",
      cycleOverride: cycle,
    });

    expect(comparison.candidate.status).toBe("error");
    expect(comparison.candidate.errorMessage).toBe("forced-v1-failure");
    expect(comparison.candidate.score).toBeNull();
    expect(comparison.baseline.model).toBe("v0.5");
  });

  it("returns candidate unavailable when V1 returns null", () => {
    const chart = calculateTrungChau(REGRESSION);
    const cycle = activeCycle(chart);
    vi.spyOn(v1Module, "analyzeMajorFortuneV1").mockReturnValue(null);

    const comparison = compareMajorFortuneV1Shadow(chart, {
      school: "trung-chau",
      cycleOverride: cycle,
    });

    expect(comparison.candidate.status).toBe("unavailable");
    expect(comparison.candidate.score).toBeNull();
    expect(comparison.delta.score).toBeNull();
  });

  it("does not console.error on candidate failure", () => {
    const chart = calculateNamPhai(REGRESSION);
    const cycle = activeCycle(chart);
    vi.spyOn(v1Module, "analyzeMajorFortuneV1").mockImplementation(() => {
      throw new Error("silent-failure");
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    compareMajorFortuneV1Shadow(chart, {
      school: "nam-phai",
      cycleOverride: cycle,
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
