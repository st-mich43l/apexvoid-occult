import type { ChartData } from "@/types/chart";
import type { AdaptMajorFortuneOrdinalOptions, MajorFortuneOrdinalV03Analysis } from "./v0.3-ordinal-adapter/types";
import { compareMajorFortuneShadowV05, analyzeMajorFortuneProduction, type MajorFortuneShadowComparison } from "./shadow";
import { isMajorFortuneV05ShadowEnabled } from "../../feature-flags";

export interface MajorFortunePresentationOptions extends AdaptMajorFortuneOrdinalOptions {
  shadowMode?: "enabled" | "disabled" | "use-feature-flag";
}

export interface MajorFortunePresentationResult {
  analysis: MajorFortuneOrdinalV03Analysis;
  shadowComparison: MajorFortuneShadowComparison | null;
}

/**
 * Entry point for all Major Fortune presentation (UI).
 * It runs the shadow comparison in the background if enabled,
 * and always returns the safe, user-visible production baseline.
 */
export function analyzeMajorFortuneForPresentation(
  chart: ChartData,
  options: MajorFortunePresentationOptions,
): MajorFortunePresentationResult {
  const mode = options.shadowMode ?? "use-feature-flag";
  const shouldRunShadow = mode === "enabled" || (mode === "use-feature-flag" && isMajorFortuneV05ShadowEnabled());

  if (shouldRunShadow) {
    const comparison = compareMajorFortuneShadowV05(chart, options);
    return {
      analysis: comparison.baseline,
      shadowComparison: comparison,
    };
  }

  return {
    analysis: analyzeMajorFortuneProduction(chart, options),
    shadowComparison: null,
  };
}
