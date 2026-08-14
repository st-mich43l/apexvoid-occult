import type { ExpertReview } from "./benchmark-v2-types";
import { PALACES } from "./reviews-v2";
import { loadBenchmarkCasesV2, loadReviewerIds, loadExpertReviewsV2 } from "./reviews-v2";
import { assignCaseSplit } from "./split-v2";

const SCHOOLS = new Set(["nam-phai", "trung-chau"]);
const AXES = new Set(["support", "pressure", "stability", "activation", "netQuality"]);
const AXIS_ORD = new Set(["low", "medium", "high", "unable-to-judge"]);
const NET = new Set(["guarded", "neutral", "supportive", "strong", "unable-to-judge"]);
const PAIR = new Set(["LEFT", "RIGHT", "TIE", "UNABLE_TO_JUDGE"]);

export function validateExpertReviews(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
): string[] {
  const errors: string[] = [];
  const cases = loadBenchmarkCasesV2();
  const caseIds = new Set(cases.map((c) => c.caseId));
  const reviewers = new Set(loadReviewerIds());
  const reviewIds = new Set<string>();
  const identity = new Set<string>();

  for (const r of reviews) {
    if (!r.reviewId) errors.push("missing reviewId");
    if (reviewIds.has(r.reviewId)) errors.push(`duplicate reviewId ${r.reviewId}`);
    reviewIds.add(r.reviewId);
    if (!caseIds.has(r.caseId)) errors.push(`unknown caseId ${r.caseId}`);
    if (reviewers.size > 0 && !reviewers.has(r.reviewerId)) {
      errors.push(`unknown reviewerId ${r.reviewerId}`);
    }
    if (reviewers.size === 0 && r.reviewerId) {
      errors.push(`reviewer ${r.reviewerId} not in empty registry (do not invent reviewers)`);
    }
    if (!SCHOOLS.has(r.school)) errors.push(`invalid school ${r.school}`);
    if (r.blindedToEngine !== true) errors.push(`${r.reviewId} blindedToEngine must be true`);
    const ident = `${r.reviewerId}::${r.caseId}::${r.school}`;
    if (identity.has(ident)) errors.push(`duplicate reviewer/case/school ${ident}`);
    identity.add(ident);

    const caseRec = cases.find((c) => c.caseId === r.caseId);
    if (caseRec && !caseRec.eligibleSchools.includes(r.school)) {
      errors.push(`${r.reviewId} school not eligible on case`);
    }
    if (caseRec && assignCaseSplit(caseRec.caseId) !== caseRec.splitAssignment) {
      errors.push(`holdout assignment integrity failed for ${caseRec.caseId}`);
    }

    for (const p of r.palaceRatings) {
      if (!PALACES.includes(p.palaceName)) errors.push(`invalid palace ${p.palaceName}`);
      if (!AXIS_ORD.has(p.support) || !AXIS_ORD.has(p.pressure) || !AXIS_ORD.has(p.stability) || !AXIS_ORD.has(p.activation)) {
        errors.push(`invalid axis ordinal on ${r.reviewId} ${p.palaceName}`);
      }
      if (!NET.has(p.netQuality)) errors.push(`invalid netQuality on ${r.reviewId} ${p.palaceName}`);
    }
    for (const pair of r.pairwiseComparisons) {
      if (pair.reviewerId !== r.reviewerId) {
        errors.push(`pairwise reviewerId mismatch on ${r.reviewId}`);
      }
      if (pair.school !== r.school || pair.caseId !== r.caseId) {
        errors.push(`pairwise identity mismatch on ${r.reviewId}`);
      }
      if (!AXES.has(pair.axis)) errors.push(`invalid pairwise axis ${pair.axis}`);
      if (!PALACES.includes(pair.leftPalace) || !PALACES.includes(pair.rightPalace)) {
        errors.push(`invalid pairwise palace on ${r.reviewId}`);
      }
      if (!PAIR.has(pair.result)) errors.push(`invalid pairwise result ${pair.result}`);
    }
  }
  return errors;
}
