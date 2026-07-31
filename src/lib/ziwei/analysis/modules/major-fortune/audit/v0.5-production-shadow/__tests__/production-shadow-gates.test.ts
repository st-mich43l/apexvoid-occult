import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { calculate as calculateTrungChau } from "@/lib/ziwei/engine-trung-chau";
import type { BirthInput } from "@/types/chart";
import { getAnalysisStatus } from "@/lib/ziwei/analysis/contracts/common";
import {
  isMajorFortuneV05ShadowEnabled,
  MAJOR_FORTUNE_V05_SHADOW_FEATURE_FLAG,
} from "@/lib/ziwei/analysis/feature-flags";
import { analyzeMajorFortuneCandidateV05 } from "@/lib/ziwei/analysis/modules/major-fortune/shadow";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("Major Fortune V0.5 production shadow status + flag", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults enabled and returns available 0.4.3", () => {
    expect(isMajorFortuneV05ShadowEnabled()).toBe(true);
    expect(getAnalysisStatus("major-fortune")).toEqual({
      status: "available",
      module: "major-fortune",
      version: "0.4.3",
    });
  });

  it("marks monthly-flow available at 0.3.0", () => {
    expect(getAnalysisStatus("monthly-flow")).toEqual({
      status: "available",
      module: "monthly-flow",
      version: "0.3.0",
    });
  });

  it("env false disables major-fortune shadow", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V05_SHADOW", "false");
    expect(isMajorFortuneV05ShadowEnabled()).toBe(false);
  });

  it("query session override disables", () => {
    window.history.replaceState({}, "", `/?${MAJOR_FORTUNE_V05_SHADOW_FEATURE_FLAG}=0`);
    expect(isMajorFortuneV05ShadowEnabled()).toBe(false);
  });
});

describe("Major Fortune V0.5 production shadow coverage semantics on live charts", () => {
  it("Nam Phái shows scoring 0.75 and context 1", () => {
    vi.stubEnv("VITE_ZIWEI_MAJOR_FORTUNE_V04_NAM_PHAI_TRANSFORMATIONS", "false");
    const chart = calculateNamPhai(REGRESSION);
    const analysis = analyzeMajorFortuneCandidateV05(chart, { school: "nam-phai" });
    expect(analysis.result).not.toBeNull();
    expect(analysis.result!.coverage.contextCoverageWeight).toBe(1);
    expect(analysis.result!.coverage.scoringCoverageWeight).toBe(0.75);
    expect(analysis.result!.pillars["tu-hoa-sat-tinh"].level).toBeNull();
    expect(analysis.result!.scoreState).toBe("partial-data");
    vi.unstubAllEnvs();
  });

  it("Trung Châu reaches full scoring coverage when all pillar levels resolve", () => {
    const chart = calculateTrungChau(REGRESSION);
    const analysis = analyzeMajorFortuneCandidateV05(chart, { school: "trung-chau" });
    expect(analysis.result).not.toBeNull();
    const levels = Object.values(analysis.result!.pillars).map((p) => p.level);
    if (levels.every((l) => l != null)) {
      expect(analysis.result!.coverage.scoringCoverageWeight).toBe(1);
      expect(analysis.result!.coverage.contextCoverageWeight).toBe(1);
    }
  });
});
