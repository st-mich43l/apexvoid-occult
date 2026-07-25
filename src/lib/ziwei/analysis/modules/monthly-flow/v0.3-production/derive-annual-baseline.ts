import type { AnnualAxesResult } from "../../annual-axes/types";
import type { AnnualBaselineProvenance } from "./types";

export function deriveAnnualBaseline(
  annualAxesResult: AnnualAxesResult | undefined | null
): AnnualBaselineProvenance | null {
  if (!annualAxesResult) {
    return null;
  }
  
  if (annualAxesResult.status === "unavailable") {
    return null;
  }

  const validScores: number[] = [];

  for (const domainKey of Object.keys(annualAxesResult.axes)) {
    const axisResult = annualAxesResult.axes[domainKey as keyof typeof annualAxesResult.axes];
    if (
      (axisResult.status === "available" || axisResult.status === "partial-data") &&
      axisResult.score !== null &&
      Number.isFinite(axisResult.score)
    ) {
      validScores.push(axisResult.score);
    }
  }

  if (validScores.length < 4) {
    return null;
  }

  // Sort ascending
  validScores.sort((a, b) => a - b);

  // Lower median
  const scoreCount = validScores.length;
  const baselineIndex = Math.floor((scoreCount - 1) / 2);
  const score = validScores[baselineIndex];

  return {
    score,
    sourceModule: "annual-axes",
    sourceContractVersion: annualAxesResult.versions.contractVersion,
    sourceEngineVersion: annualAxesResult.versions.engineVersion,
    sourceKnowledgeVersion: annualAxesResult.versions.knowledgeVersion,
    aggregationMethod: "lower-median-v1",
    sourceScoreCount: scoreCount,
    sourceScores: validScores,
  };
}
