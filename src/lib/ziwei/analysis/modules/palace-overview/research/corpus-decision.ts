import type { ExpertBenchmarkCase, ExpertReview, ExpertReviewer } from "../calibration/benchmark-v2-types";
import { PILOT_CASE_TARGET } from "./corpus-coverage";

export type CorpusDecision =
  | "BUILDING"
  | "PILOT_READY"
  | "PILOT_IN_PROGRESS"
  | "PILOT_ACCEPTED"
  | "FULL_COLLECTION_IN_PROGRESS"
  | "CORPUS_READY";

export function corpusDecision(input: {
  cases: ExpertBenchmarkCase[];
  reviews: ExpertReview[];
  reviewers: ExpertReviewer[];
  pilotAccepted: boolean;
}): CorpusDecision {
  const reviewedCharts = new Set(input.reviews.map((r) => r.caseId)).size;
  if (input.cases.length < PILOT_CASE_TARGET) return "BUILDING";
  if (input.reviews.length === 0) return "PILOT_READY";
  if (!input.pilotAccepted && reviewedCharts < PILOT_CASE_TARGET) {
    return "PILOT_IN_PROGRESS";
  }
  if (input.pilotAccepted && input.cases.length < 20) {
    return "FULL_COLLECTION_IN_PROGRESS";
  }
  if (input.pilotAccepted) return "CORPUS_READY";
  return "PILOT_IN_PROGRESS";
}
