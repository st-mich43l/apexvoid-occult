import type { ChartData } from "@/types/chart";
import { isMajorFortuneV05ShadowEnabled } from "../../feature-flags";
import { analyzeMajorFortuneOrdinalV03 } from "./v0.3-ordinal-adapter/analyze";
import type { AdaptMajorFortuneOrdinalOptions, MajorFortuneOrdinalV03Analysis } from "./v0.3-ordinal-adapter/types";
import { emitMajorFortuneShadowComparedTelemetry } from "./telemetry/emit";
import { MAJOR_FORTUNE_PRODUCTION_VERSION } from "./version";
import { analyzeMajorFortuneCandidateV05 } from "./v0.5-candidate/candidate";

export { analyzeMajorFortuneCandidateV05 };

export function analyzeMajorFortuneProduction(
  chart: ChartData,
  options: AdaptMajorFortuneOrdinalOptions,
): MajorFortuneOrdinalV03Analysis {
  return analyzeMajorFortuneOrdinalV03(chart, options);
}

export function compareMajorFortuneShadowV05(
  chart: ChartData,
  options: AdaptMajorFortuneOrdinalOptions,
): MajorFortuneOrdinalV03Analysis {
  const baseline = analyzeMajorFortuneProduction(chart, options);

  if (!isMajorFortuneV05ShadowEnabled()) {
    return baseline;
  }

  try {
    const candidate = analyzeMajorFortuneCandidateV05(chart, options);

    const scoreMatch = baseline.result?.score === candidate.result?.score;
    const bandMatch = baseline.display.bandLabelVi === candidate.display.bandLabelVi;
    const match = scoreMatch && bandMatch;

    emitMajorFortuneShadowComparedTelemetry({
      event: "major_fortune_shadow_compared",
      integrationVersion: MAJOR_FORTUNE_PRODUCTION_VERSION.productionIntegrationVersion,
      baselineModelVersion: MAJOR_FORTUNE_PRODUCTION_VERSION.baselineModelVersion,
      candidateModelVersion: MAJOR_FORTUNE_PRODUCTION_VERSION.candidateModelVersion,
      school: options.school,
      match,
      scoreMatch,
      bandMatch,
      baselineScore: baseline.result?.score ?? null,
      candidateScore: candidate.result?.score ?? null,
      baselineBand: baseline.display.bandLabelVi,
      candidateBand: candidate.display.bandLabelVi,
    });
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.error("[Major Fortune] Shadow analysis failed:", error);
    }
  }

  // The shadow orchestrator MUST return the frozen production baseline.
  return baseline;
}
