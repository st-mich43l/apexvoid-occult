import { readFileSync } from "node:fs";
import type { ExpertReview } from "../calibration/benchmark-v2-types";
import { validateExpertReviews } from "../calibration/validate-reviews";
import {
  loadBenchmarkCasesV2,
  loadExpertReviewsV2,
  loadReviewAssignments,
  loadReviewers,
} from "../calibration/reviews-v2";
import { CURRENT_RUBRIC_VERSION } from "./natal-input";
import {
  canTransitionAssignment,
  findMatchingAssignment,
  type ExpertReviewAssignment,
} from "./review-assignment";

export interface IngestOk {
  ok: true;
  merged: ExpertReview[];
  updatedAssignments: ExpertReviewAssignment[];
}

export interface IngestFail {
  ok: false;
  errors: string[];
}

export function ingestReviewPayload(
  incoming: ExpertReview,
  existing: ExpertReview[] = loadExpertReviewsV2(),
  assignments: ExpertReviewAssignment[] = loadReviewAssignments(),
  reviewers = loadReviewers(),
): IngestOk | IngestFail {
  const errors: string[] = [];
  if (!incoming.rubricVersion) errors.push("rubricVersion required");
  else if (incoming.rubricVersion !== CURRENT_RUBRIC_VERSION) {
    errors.push(`ingest expects rubricVersion ${CURRENT_RUBRIC_VERSION}`);
  }
  if (!incoming.assignmentId) errors.push("assignmentId required");
  if (existing.some((r) => r.reviewId === incoming.reviewId)) {
    errors.push(`duplicate reviewId ${incoming.reviewId}`);
  }
  if (existing.some((r) => r.assignmentId === incoming.assignmentId)) {
    errors.push(`assignment ${incoming.assignmentId} already has a review`);
  }
  const assignment = findMatchingAssignment(incoming, assignments);
  if (!assignment) {
    errors.push("no matching assignment");
  } else {
    if (assignment.reviewerId !== incoming.reviewerId) {
      errors.push("assignment reviewer differs");
    }
    if (assignment.caseId !== incoming.caseId) errors.push("assignment case differs");
    if (assignment.school !== incoming.school) errors.push("assignment school differs");
    if (assignment.status === "withdrawn") errors.push("assignment is withdrawn");
    if (assignment.status === "completed") {
      errors.push("assignment is already completed");
    }
    if (
      assignment.status === "assigned" &&
      !canTransitionAssignment("assigned", "completed")
    ) {
      errors.push("illegal assignment transition");
    }
  }
  if (errors.length) return { ok: false, errors };

  const merged = [...existing, incoming];
  const reviewErrors = validateExpertReviews(merged, reviewers);
  const caseIds = new Set(loadBenchmarkCasesV2().map((c) => c.caseId));
  if (!caseIds.has(incoming.caseId)) reviewErrors.push("unknown caseId");
  if (reviewErrors.length) return { ok: false, errors: reviewErrors };

  const updatedAssignments = assignments.map((a) =>
    a.assignmentId === incoming.assignmentId
      ? { ...a, status: "completed" as const }
      : a,
  );
  return { ok: true, merged, updatedAssignments };
}

export function ingestReviewFile(path: string) {
  const incoming = JSON.parse(readFileSync(path, "utf8")) as ExpertReview;
  return ingestReviewPayload(incoming);
}
