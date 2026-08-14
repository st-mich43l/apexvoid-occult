import type { NatalZiweiFact } from "../../../facts";
import type { PalaceOverviewFormulaV2, PalaceV2BaseParts } from "./types";

export function computePalaceBaseScore(
  facts: NatalZiweiFact[],
  formula: PalaceOverviewFormulaV2,
): PalaceV2BaseParts {
  const majors = facts.filter((f) => f.kind === "star" && f.starClass === "major");
  const isVcd = majors.length === 0;

  let majorContribution = 0;
  if (!isVcd) {
    for (const m of majors) {
      if (!m.brightness) continue;
      majorContribution += formula.brightnessScores[m.brightness];
    }
  }

  let transformContribution = 0;
  for (const t of facts) {
    if (t.kind !== "transformation" || !t.transformation) continue;
    transformContribution += formula.transformations[t.transformation];
  }

  const lucCat = new Set(formula.lucCat.canonicalNames);
  const lucSat = new Set(formula.lucSat.canonicalNames);
  let lucCatContribution = 0;
  let lucSatContribution = 0;
  const seen = new Set<string>();
  for (const s of facts) {
    if (s.kind !== "star") continue;
    const name = s.canonicalStarName ?? s.starName;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    if (lucCat.has(name)) lucCatContribution += formula.lucCat.scoreEach;
    if (lucSat.has(name)) lucSatContribution += formula.lucSat.scoreEach;
  }

  const sBase =
    majorContribution + transformContribution + lucCatContribution + lucSatContribution;
  const hasTuanTriet = facts.some((f) => f.kind === "void-marker");

  return {
    majorContribution,
    transformContribution,
    lucCatContribution,
    lucSatContribution,
    sBase,
    isVcd,
    hasTuanTriet,
  };
}

export function applyTuanTrietFlip(
  sBase: number,
  hasTuanTriet: boolean,
  formula: PalaceOverviewFormulaV2,
): number {
  if (!hasTuanTriet) return sBase;
  if (sBase > 0) return sBase * formula.tuanTriet.positiveFactor;
  if (sBase < 0) return Math.abs(sBase) * formula.tuanTriet.negativeAbsFactor;
  return 0;
}
