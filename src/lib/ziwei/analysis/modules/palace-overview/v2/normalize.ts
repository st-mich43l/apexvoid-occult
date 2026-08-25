import type { PalaceOverviewBand } from "../types";
import type { PalaceOverviewFormulaV2 } from "./types";

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function mapSCungToRadarScore(
  sCung: number,
  formula: PalaceOverviewFormulaV2,
): number {
  const qn = formula.qualityNormalization;
  const mapped = 100 / (1 + Math.exp(-sCung / qn.scale));
  if (sCung === 0 && mapped !== qn.midpoint) {
    throw new Error("V2 logistic identity at S_cung 0 does not match midpoint");
  }
  return round1(mapped);
}

export function bandForV2Score(
  score: number,
  formula: PalaceOverviewFormulaV2,
): PalaceOverviewBand {
  const t = formula.bandThresholds;
  if (score <= t.lowMaxInclusive) return "low";
  if (score < t.guardedMaxExclusive) return "guarded";
  if (score < t.balancedMaxExclusive) return "balanced";
  if (score < t.supportiveMaxExclusive) return "supportive";
  return "strong";
}
