import type { ExpertBenchmarkCase, ExpertReview, ExpertReviewer } from "../calibration/benchmark-v2-types";
import type { ExpertReviewAssignment } from "./review-assignment";
import { PILOT_CASE_TARGET } from "./corpus-coverage";

export type CorpusDecision =
  | "BUILDING"
  | "PILOT_READY"
  | "PILOT_IN_PROGRESS"
  | "PILOT_REVIEW_COMPLETE"
  | "PILOT_ACCEPTED"
  | "RUBRIC_REVISION_REQUIRED"
  | "FULL_COLLECTION_IN_PROGRESS"
  | "CORPUS_READY";

export function corpusDecision(input: {
  cases: ExpertBenchmarkCase[];
  reviews: ExpertReview[];
  reviewers: ExpertReviewer[];
  assignments?: ExpertReviewAssignment[];
  pilotAccepted: boolean;
}): CorpusDecision {
  const reviewedCharts = new Set(input.reviews.map((r) => r.caseId)).size;
  const assignments = input.assignments ?? [];
  const pilotAssignments = assignments.filter((a) => a.purpose === "pilot" || a.purpose === "overlap");
  const allPilotDone =
    pilotAssignments.length > 0 &&
    pilotAssignments.every((a) => a.status === "completed" || a.status === "withdrawn") &&
    pilotAssignments.some((a) => a.status === "completed");
  if (input.cases.length < PILOT_CASE_TARGET) return "BUILDING";
  if (input.pilotAccepted && input.cases.length < 20) return "FULL_COLLECTION_IN_PROGRESS";
  if (input.pilotAccepted) return "PILOT_ACCEPTED";
  if (input.reviews.length === 0 && assignments.every((a) => a.status !== "completed")) {
    return "PILOT_READY";
  }
  if (allPilotDone && !input.pilotAccepted) return "PILOT_REVIEW_COMPLETE";
  if (reviewedCharts > 0 || assignments.some((a) => a.status === "completed")) {
    return "PILOT_IN_PROGRESS";
  }
  return "PILOT_READY";
}
