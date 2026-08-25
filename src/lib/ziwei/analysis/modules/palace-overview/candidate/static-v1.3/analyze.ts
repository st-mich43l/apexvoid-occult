import type { BirthInput, ChartData } from "@/types/chart";
import { calculate as calculateNamPhai } from "@/lib/ziwei/engine-nam-phai";
import { analyzeAllPalaces } from "../../analyze-all-palaces";
import type { PalaceOverviewResult } from "../../types";
import { decomposePalaceEvidence } from "./decompose";
import { scoreStaticV13Candidates } from "./score-candidates";
import type {
  CandidatePalaceScore,
  PalaceStructuralDecomposition,
  StaticV13CandidateId,
} from "./types";

export const CASE_1998_DAN: BirthInput = {
  solarDate: "1998-10-01",
  birthHour: "Dần",
  gender: "male",
  timezone: "7",
  annualYear: "2026",
  flowBase: "luu-nien",
};

export interface StaticV13ChartAnalysis {
  controlId: "CONTROL-V12";
  candidatePackId: "palace-overview-static-v1.3-candidate";
  school: "nam-phai";
  annualYear: number;
  palaces: Array<{
    decomposition: PalaceStructuralDecomposition;
    candidates: Record<
      Exclude<StaticV13CandidateId, "control">,
      CandidatePalaceScore
    >;
    controlScore: number;
  }>;
}

function analyzeStaticV13Chart(
  chart: ChartData,
  school: "nam-phai" | "trung-chau" = "nam-phai",
): StaticV13ChartAnalysis {
  const { results } = analyzeAllPalaces(chart, { school });
  return {
    controlId: "CONTROL-V12",
    candidatePackId: "palace-overview-static-v1.3-candidate",
    school: "nam-phai",
    annualYear: chart.annualYear,
    palaces: results.map((r) => ({
      decomposition: decomposePalaceEvidence(r),
      candidates: scoreStaticV13Candidates(r.allEvidence),
      controlScore: r.score,
    })),
  };
}

export function analyzeStaticV13Birth(input: BirthInput = CASE_1998_DAN): StaticV13ChartAnalysis {
  return analyzeStaticV13Chart(calculateNamPhai(input), "nam-phai");
}

/** Remap a production result's score for DEV preview without mutating evidence. */
export function applyStaticV13CandidateScore(
  result: PalaceOverviewResult,
  candidateId: StaticV13CandidateId,
): PalaceOverviewResult {
  if (candidateId === "control") return result;
  const scored = scoreStaticV13Candidates(result.allEvidence)[candidateId];
  return {
    ...result,
    score: scored.score,
    band:
      scored.score <= 24
        ? "low"
        : scored.score < 50
          ? "guarded"
          : scored.score < 60
            ? "balanced"
            : scored.score < 75
              ? "supportive"
              : "strong",
  };
}
