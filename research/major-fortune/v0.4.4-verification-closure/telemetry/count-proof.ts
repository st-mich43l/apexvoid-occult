import type { MajorFortuneV02CycleObservation } from "../../../../src/lib/ziwei/analysis/modules/major-fortune/audit/v0.2/corpus.js";
import { resolveMajorFortuneMutagensForStem } from "../../../../src/lib/ziwei/calculation/resolve-major-fortune-mutagens.js";
import type { ChartData } from "../../../../src/types/chart.js";

/**
 * Independently calculates expected telemetry counts by running core logic outside of the standard pipeline.
 */
export function calculateExpectedTelemetryCounts(
  obs: MajorFortuneV02CycleObservation,
  chart: ChartData
): {
  expectedAcceptedTransformationCount: number;
  expectedDirectActivationCount: number;
  expectedOutOfFrameCount: number;
} {
  const activePalaceIndex = obs.activePalaceIndex;
  
  const fortuneStem = chart.palaces.find(p => p.index === activePalaceIndex)?.stem;
  
  // Calculate out of frame count independently
  const allTuHoa = fortuneStem ? resolveMajorFortuneMutagensForStem(obs.school, fortuneStem, chart.palaces) : [];

  let accepted = 0;
  let direct = 0;
  let outOfFrame = 0;

  for (const t of allTuHoa) {
    const targetIdx = t.palace?.index;
    if (targetIdx === undefined) continue;
    if (targetIdx === activePalaceIndex) {
      accepted++;
      direct++;
    } else {
      outOfFrame++;
    }
  }

  return {
    expectedAcceptedTransformationCount: accepted,
    expectedDirectActivationCount: direct,
    expectedOutOfFrameCount: outOfFrame,
  };
}
