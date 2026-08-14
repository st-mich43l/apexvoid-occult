import { describe, expect, it } from "vitest";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAllPalaces } from "@/lib/ziwei/analysis/modules/palace-overview";
import {
  expandMajorStarPalaceMatrix,
  unknownStarPalaceCellCount,
} from "../doctrine/loader";
import { supportPressureConflict } from "../doctrine/conflict";
import { COVERAGE_COMPOSITE_POLICY } from "../doctrine/types";
import {
  locDoesNotReduceQualityVersusBaseline,
  solePressureEvidenceRemainsPositive,
  supportiveStarHamDoesNotBeatMieu,
} from "../doctrine/constraints";
import { krippendorffAlphaOrdinal } from "../calibration/krippendorff";
import { KRIPPENDORFF_POLICY, assessBenchmarkReadiness } from "../calibration/readiness";
import { ENGINE_ORDINAL_THRESHOLD_VERSION } from "../calibration/metrics";
import type { BirthInput } from "@/types/chart";

const REGRESSION: BirthInput = {
  solarDate: "1991-09-21",
  birthHour: "Dậu",
  gender: "female",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

describe("doctrine stage 2", () => {
  it("expands 14×12 with UNKNOWN fill rather than analogy", () => {
    const matrix = expandMajorStarPalaceMatrix();
    expect(matrix).toHaveLength(14 * 12);
    expect(unknownStarPalaceCellCount()).toBeGreaterThan(150);
    expect(matrix.filter((c) => c.status === "claimed").length).toBe(3);
  });

  it("does not display missing brightness as Bình", () => {
    const chart = calculateNamPhai(REGRESSION);
    const { results } = analyzeAllPalaces(chart, { school: "nam-phai" });
    for (const r of results) {
      for (const m of r.majorStars) {
        if (m.brightnessStatus === "unavailable") {
          expect(m.brightness).toBeNull();
        }
        expect(m.brightness === "Bình" && m.brightnessStatus === "unavailable").toBe(
          false,
        );
      }
      expect(r.palaceDomainCandidates?.every((c) => c.numericDelta === null)).toBe(
        true,
      );
      expect(r.conflict?.note).toContain("does not change net-quality");
      expect(r.coverage).toBeDefined();
    }
  });

  it("conflict is not the same as sparse evidence", () => {
    const conflicted = supportPressureConflict(80, 80);
    const sparse = supportPressureConflict(10, 10);
    expect(conflicted.present).toBe(true);
    expect(sparse.present).toBe(false);
  });

  it("doctrine constraints hold on the current heuristic catalog", () => {
    expect(supportiveStarHamDoesNotBeatMieu("Thiên Phủ")).toBe(true);
    expect(locDoesNotReduceQualityVersusBaseline()).toBe(true);
    expect(solePressureEvidenceRemainsPositive()).toBe(true);
  });

  it("Krippendorff alpha is null without overlapping raters and 1 on perfect ordinal agreement", () => {
    expect(krippendorffAlphaOrdinal([], ["low", "medium", "high"]).alpha).toBeNull();
    const perfect = [
      ["low", "low"],
      ["medium", "medium"],
      ["high", "high"],
    ];
    expect(krippendorffAlphaOrdinal(perfect, ["low", "medium", "high"]).alpha).toBe(1);
  });

  it("GO_FOR_CALIBRATION is not granted on chart-count alone", () => {
    const r = assessBenchmarkReadiness();
    expect(r.ready).toBe(false);
    expect(r.missing.length).toBeGreaterThan(1);
    expect(ENGINE_ORDINAL_THRESHOLD_VERSION).toBe("engineering-v1");
    expect(COVERAGE_COMPOSITE_POLICY).toContain("never modify score");
    expect(KRIPPENDORFF_POLICY).toContain("0.67");
  });
});
