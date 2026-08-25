import { describe, expect, it } from "vitest";
import type { NatalZiweiFact } from "@/lib/ziwei/analysis/facts";
import { loadPalaceOverviewFormulaV2 } from "../load-formula";
import { combineTp4c } from "../network";
import { mapSCungToRadarScore } from "../normalize";
import { applyTuanTrietFlip, computePalaceBaseScore } from "../score-base";

function fact(partial: Partial<NatalZiweiFact> & Pick<NatalZiweiFact, "id" | "kind">): NatalZiweiFact {
  return {
    layer: "natal",
    school: "nam-phai",
    palaceIndex: 0,
    palaceName: "Mệnh",
    palaceBranch: "Tý",
    source: "natal",
    ...partial,
  };
}

describe("palace-overview V2 formula load", () => {
  it("loads teacher coefficients without enabling formation K", () => {
    const f = loadPalaceOverviewFormulaV2();
    expect(f.brightnessScores.Hãm).toBe(-5);
    expect(f.brightnessScores.Miếu).toBe(10);
    expect(f.transformations.Quyền).toBe(5);
    expect(f.lucCat.scoreEach).toBe(3);
    expect(f.lucSat.scoreEach).toBe(-4);
    expect(f.formationMultiplierEnabled).toBe(false);
  });
});

describe("S_base and f(TT) hand-calc", () => {
  const formula = loadPalaceOverviewFormulaV2();

  it("Thái Dương Hãm + Hóa Quyền does not crash solely because of Hãm", () => {
    const parts = computePalaceBaseScore(
      [
        fact({
          id: "m",
          kind: "star",
          starClass: "major",
          canonicalStarName: "Thái Dương",
          brightness: "Hãm",
        }),
        fact({ id: "h", kind: "transformation", transformation: "Quyền" }),
      ],
      formula,
    );
    expect(parts.majorContribution).toBe(-5);
    expect(parts.transformContribution).toBe(5);
    expect(parts.sBase).toBe(0);
    expect(applyTuanTrietFlip(parts.sBase, false, formula)).toBe(0);
  });

  it("negative S_base with Triệt flips to a modest positive", () => {
    const parts = computePalaceBaseScore(
      [
        fact({
          id: "m1",
          kind: "star",
          starClass: "major",
          canonicalStarName: "Liêm Trinh",
          brightness: "Hãm",
        }),
        fact({
          id: "m2",
          kind: "star",
          starClass: "major",
          canonicalStarName: "Tham Lang",
          brightness: "Hãm",
        }),
        fact({ id: "tt", kind: "void-marker", voidType: "Triệt" }),
      ],
      formula,
    );
    expect(parts.sBase).toBe(-10);
    expect(parts.hasTuanTriet).toBe(true);
    expect(applyTuanTrietFlip(parts.sBase, true, formula)).toBe(4);
  });

  it("positive S_base with Tuần is scaled by 0.6", () => {
    expect(applyTuanTrietFlip(10, true, formula)).toBe(6);
  });

  it("S_base 0 with Tuần/Triệt stays 0", () => {
    expect(applyTuanTrietFlip(0, true, formula)).toBe(0);
  });

  it("VCD has C = 0 and still counts auxiliaries", () => {
    const parts = computePalaceBaseScore(
      [fact({ id: "ta", kind: "star", starClass: "auxiliary", canonicalStarName: "Tả Phụ" })],
      formula,
    );
    expect(parts.isVcd).toBe(true);
    expect(parts.majorContribution).toBe(0);
    expect(parts.lucCatContribution).toBe(3);
    expect(parts.sBase).toBe(3);
  });
});

describe("TP4C / VCD network hand-calc", () => {
  const formula = loadPalaceOverviewFormulaV2();

  it("VCD takes 60% from opposite and 25% from self auxiliaries", () => {
    const nodes = [
      { palaceIndex: 0, palaceBranch: "Tý", isVcd: true, sAfterTt: 3 },
      { palaceIndex: 6, palaceBranch: "Ngọ", isVcd: false, sAfterTt: 10 },
      { palaceIndex: 4, palaceBranch: "Thìn", isVcd: false, sAfterTt: 0 },
      { palaceIndex: 8, palaceBranch: "Thân", isVcd: false, sAfterTt: 0 },
    ];
    const combined = combineTp4c(nodes[0]!, nodes, formula);
    expect(combined.weights.self).toBe(0.25);
    expect(combined.weights.opposite).toBe(0.6);
    expect(combined.sCung).toBeCloseTo(3 * 0.25 + 10 * 0.6, 10);
  });

  it("maps S_cung 0 to radar 50", () => {
    expect(mapSCungToRadarScore(0, formula)).toBe(50);
  });
});
