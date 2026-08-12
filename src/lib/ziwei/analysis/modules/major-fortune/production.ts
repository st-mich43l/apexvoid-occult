import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import { analyzeMajorFortuneCandidateV05 } from "./v0.5-candidate/candidate";

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
  // Directly forward to the promoted V0.5 engine implementation
  return analyzeMajorFortuneCandidateV05(chart, options);
}
