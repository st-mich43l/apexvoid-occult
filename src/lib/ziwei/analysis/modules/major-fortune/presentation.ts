import type { ChartData } from "@/types/chart";
import type { AdaptMajorFortuneOrdinalOptions, MajorFortuneOrdinalV03Analysis } from "./v0.3-ordinal-adapter/types";
import { compareMajorFortuneShadowV05 } from "./shadow";

export interface MajorFortunePresentationOptions extends AdaptMajorFortuneOrdinalOptions {}

/**
 * Entry point for all Major Fortune presentation (UI).
 * It runs the shadow comparison in the background if enabled,
 * and always returns the safe, user-visible production baseline.
 */
export function analyzeMajorFortuneForPresentation(
  chart: ChartData,
  options: MajorFortunePresentationOptions,
): MajorFortuneOrdinalV03Analysis {
  // compareMajorFortuneShadowV05 orchestrates the shadow run
  // and returns the baseline analysis.
  return compareMajorFortuneShadowV05(chart, options);
}
