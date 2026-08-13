import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import { analyzeMajorFortuneCandidateV05 } from "./v0.5-candidate/candidate";
import { analyzeMajorFortuneV1 } from "./engine-v1/analyze";

// Canonical public types
export type MajorFortuneAnalysis = ReturnType<typeof analyzeMajorFortuneCandidateV05>;
export type MajorFortuneResult = NonNullable<MajorFortuneAnalysis["result"]>;

export interface AnalyzeMajorFortuneOptions {
  school: ZiweiSchool;
  cycleOverride?: {
    cycleIndex: number;
    startAge: number;
    endAge: number;
    activePalaceIndex: number;
  };
  yearInCycle?: number;
  telemetryMode?: "production-score" | "none";
}

export function analyzeMajorFortune(
  chart: ChartData,
  options: AnalyzeMajorFortuneOptions
): MajorFortuneAnalysis {
  // Production baseline
  const baseline = analyzeMajorFortuneCandidateV05(chart, options);

  // V1 Shadow Mode
  try {
    const v1Result = analyzeMajorFortuneV1(chart, {
      school: options.school,
      cycleOverride: options.cycleOverride
    });

    if (options.telemetryMode === "production-score" && v1Result) {
      // In a real environment, we would emit `shadow-delta` telemetry here
      // capturing the difference between baseline.result.score and v1Result.score.normalizedScore
    }
  } catch (err) {
    // Shadow must not crash production
    console.error("V1 Shadow Analysis Error:", err);
  }

  return baseline;
}
