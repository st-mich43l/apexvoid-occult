import formulaJson from "../../../knowledge/palace-overview/v2/formula.json";
import type { PalaceOverviewFormulaV2 } from "./types";

export function loadPalaceOverviewFormulaV2(): PalaceOverviewFormulaV2 {
  const f = formulaJson as PalaceOverviewFormulaV2;
  if (f.qualityNormalization.method !== "logistic") {
    throw new Error("palace-overview V2 qualityNormalization.method must be logistic");
  }
  if (f.qualityNormalization.midpoint !== 50) {
    throw new Error("palace-overview V2 logistic midpoint must be 50");
  }
  const n = f.network;
  const sum =
    Math.round((n.self + n.opposite + n.trine + n.trine) * 1000) / 1000;
  if (sum !== 1) {
    throw new Error(`palace-overview V2 non-VCD weights must sum to 1, got ${sum}`);
  }
  const vcdSum =
    Math.round((n.vcdSelf + n.vcdOpposite + n.vcdTrine + n.vcdTrine) * 1000) /
    1000;
  if (vcdSum !== 1) {
    throw new Error(`palace-overview V2 VCD weights must sum to 1, got ${vcdSum}`);
  }
  if (f.formationMultiplierEnabled) {
    throw new Error("palace-overview V2 formation K is not authorized");
  }
  return f;
}
