import { readFileSync } from "node:fs";
import type { ExpertReview } from "../calibration/benchmark-v2-types";
import { validateExpertReviews } from "../calibration/validate-reviews";
import {
  loadBenchmarkCasesV2,
  loadExpertReviewsV2,
  loadReviewers,
} from "../calibration/reviews-v2";
import { CURRENT_RUBRIC_VERSION } from "./natal-input";

export function ingestReviewPayload(
  incoming: ExpertReview,
  existing: ExpertReview[] = loadExpertReviewsV2(),
): { ok: true; merged: ExpertReview[] } | { ok: false; errors: string[] } {
  if (!incoming.rubricVersion) {
    return { ok: false, errors: ["rubricVersion required"] };
  }
  if (incoming.rubricVersion !== CURRENT_RUBRIC_VERSION) {
    return {
      ok: false,
      errors: [`ingest expects rubricVersion ${CURRENT_RUBRIC_VERSION}`],
    };
  }
  if (existing.some((r) => r.reviewId === incoming.reviewId)) {
    return { ok: false, errors: [`duplicate reviewId ${incoming.reviewId}`] };
  }
  const merged = [...existing, incoming];
  const errors = validateExpertReviews(merged, loadReviewers());
  const caseIds = new Set(loadBenchmarkCasesV2().map((c) => c.caseId));
  if (!caseIds.has(incoming.caseId)) errors.push("unknown caseId");
  if (errors.length) return { ok: false, errors };
  return { ok: true, merged };
}

export function ingestReviewFile(path: string) {
  const incoming = JSON.parse(readFileSync(path, "utf8")) as ExpertReview;
  return ingestReviewPayload(incoming);
}
