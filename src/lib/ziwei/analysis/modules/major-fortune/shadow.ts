/**
 * Explicit Major Fortune V1 shadow comparison.
 * Research / experimental path only — never called from canonical production.
 */
import type { ChartData } from "@/types/chart";
import type { ZiweiSchool } from "../../facts";
import { analyzeMajorFortuneCandidateV05 } from "./v0.5-candidate/candidate";
import { analyzeMajorFortuneV1 } from "./engine-v1/analyze";

export interface MajorFortuneShadowComparison {
  school: ZiweiSchool;
  cycle: {
    cycleIndex: number;
    startAge: number;
    endAge: number;
    activePalaceIndex: number;
  };
  baseline: {
    model: "v0.5";
    status: "available" | "partial" | "unavailable";
    score: number | null;
    band: string | null;
  };
  candidate: {
    model: "v1";
    status: "available" | "unavailable" | "error";
    score: number | null;
    band: string | null;
    errorMessage: string | null;
  };
  delta: {
    score: number | null;
    bandChanged: boolean;
  };
}

export interface CompareMajorFortuneV1ShadowOptions {
  school: ZiweiSchool;
  cycleOverride: MajorFortuneShadowComparison["cycle"];
  yearInCycle?: number;
}

/**
 * Deterministic, side-effect-free V0.5 vs V1 comparison.
 * Does not write, network, or log. Candidate failures become structured status.
 */
export function compareMajorFortuneV1Shadow(
  chart: ChartData,
  options: CompareMajorFortuneV1ShadowOptions,
): MajorFortuneShadowComparison {
  const baselineAnalysis = analyzeMajorFortuneCandidateV05(chart, {
    school: options.school,
    cycleOverride: options.cycleOverride,
    yearInCycle: options.yearInCycle,
  });
  const baselineResult = baselineAnalysis.result;
  const baselineStatus: MajorFortuneShadowComparison["baseline"]["status"] =
    !baselineResult || baselineAnalysis.adapterStatus === "unavailable"
      ? "unavailable"
      : baselineResult.status === "partial" ||
          baselineAnalysis.adapterStatus === "partial"
        ? "partial"
        : "available";

  let candidateStatus: MajorFortuneShadowComparison["candidate"]["status"] =
    "unavailable";
  let candidateScore: number | null = null;
  let candidateBand: string | null = null;
  let errorMessage: string | null = null;

  try {
    const v1 = analyzeMajorFortuneV1(chart, {
      school: options.school,
      cycleOverride: options.cycleOverride,
    });
    if (v1?.score) {
      candidateStatus = "available";
      candidateScore = v1.score.normalizedScore;
      candidateBand = v1.score.band;
    } else {
      candidateStatus = "unavailable";
    }
  } catch (err) {
    candidateStatus = "error";
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  const baselineScore = baselineResult?.score ?? null;
  const deltaScore =
    baselineScore == null || candidateScore == null
      ? null
      : candidateScore - baselineScore;

  return {
    school: options.school,
    cycle: options.cycleOverride,
    baseline: {
      model: "v0.5",
      status: baselineStatus,
      score: baselineScore,
      band: baselineResult?.band ?? null,
    },
    candidate: {
      model: "v1",
      status: candidateStatus,
      score: candidateScore,
      band: candidateBand,
      errorMessage,
    },
    delta: {
      score: deltaScore,
      bandChanged:
        (baselineResult?.band ?? null) !== candidateBand &&
        candidateStatus === "available",
    },
  };
}
