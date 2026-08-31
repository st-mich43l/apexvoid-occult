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
}

/**
 * Canonical Major Fortune production entrypoint.
 * Released authority is V0.5 only. V1 is an experimental candidate and must be
 * invoked explicitly via the shadow comparator — never from this path.
 */
export function analyzeMajorFortune(
  chart: ChartData,
  options: AnalyzeMajorFortuneOptions,
): MajorFortuneAnalysis {
  return analyzeMajorFortuneCandidateV05(chart, options);
}
