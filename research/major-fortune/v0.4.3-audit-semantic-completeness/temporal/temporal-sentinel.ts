import { ChartData } from "../../../../src/types/chart.js";
import type { MajorFortuneV02CycleObservation } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus.js";

/**
 * Validates that the mutation actually evaluated the exact same Major Fortune cycle.
 * If this fails, the mutation went out of bounds or broke chart identity,
 * so the semantic comparison failure is expected but the harness itself is invalid.
 */
export function validateTemporalSentinel(baseObs: MajorFortuneV02CycleObservation, alteredChart: ChartData): boolean {
  const active = alteredChart.majorFortunePalace;
  if (!active || !active.majorFortune) {
    return false;
  }
  
  if (active.majorFortune.order !== baseObs.cycleIndex) {
    return false;
  }

  if (active.index !== baseObs.activePalaceIndex) {
    return false;
  }

  return true;
}
