import type { ExpertAdjudication, ExpertReview, ExpertReviewer } from "./benchmark-v2-types";
import {
  AXIS_ORDINAL_VALUES,
  CONFIDENCE_VALUES,
  NET_QUALITY_VALUES,
  PAIRWISE_RESULT_VALUES,
  palaceRatingIsUsable,
  pairwiseLogicalKey,
} from "./benchmark-v2-types";
import { PALACES } from "./reviews-v2";
import {
  loadAdjudicationsV2,
  loadBenchmarkCasesV2,
  loadExpertReviewsV2,
  loadReviewAssignments,
  loadReviewers,
} from "./reviews-v2";
import { assignCaseSplit } from "./split-v2";
import { isUsablePairwiseResult } from "./pairwise";
import { KNOWN_RUBRIC_VERSIONS } from "../research/natal-input";
import { validateAssignments } from "../research/review-assignment";
import type { ExpertReviewAssignment } from "../research/review-assignment";

const SCHOOLS = new Set(["nam-phai", "trung-chau"]);
const AXES = new Set(["support", "pressure", "stability", "activation", "netQuality"]);
const AXIS_ORD = new Set<string>(AXIS_ORDINAL_VALUES);
const NET = new Set<string>(NET_QUALITY_VALUES);
const PAIR = new Set<string>(PAIRWISE_RESULT_VALUES);
const CONF = new Set<string>(CONFIDENCE_VALUES);
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function hasUsableJudgment(r: ExpertReview): boolean {
  const palaceHit = r.palaceRatings.some((p) =>
    [p.support, p.pressure, p.stability, p.activation, p.netQuality].some(
      (v) => v !== "unable-to-judge",
    ),
  );
  const pairHit = r.pairwiseComparisons.some((p) => isUsablePairwiseResult(p.result));
  return palaceHit || pairHit;
}

export function validateExpertReviews(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
  reviewers: ExpertReviewer[] = loadReviewers(),
): string[] {
  const errors: string[] = [];
  const cases = loadBenchmarkCasesV2();
  const caseIds = new Set(cases.map((c) => c.caseId));
  const reviewerById = new Map(reviewers.map((r) => [r.id, r]));
  const reviewIds = new Set<string>();
  const assignmentIds = new Set<string>();
  const identity = new Set<string>();

  for (const c of cases) {
    if (assignCaseSplit(c.caseId) !== c.splitAssignment) {
      errors.push(`splitAssignment mismatch for ${c.caseId}`);
    }
  }

  for (const r of reviews) {
    if (!r.reviewId) errors.push("missing reviewId");
    if (reviewIds.has(r.reviewId)) errors.push(`duplicate reviewId ${r.reviewId}`);
    reviewIds.add(r.reviewId);
    if (!caseIds.has(r.caseId)) errors.push(`unknown caseId ${r.caseId}`);
    const reviewer = reviewerById.get(r.reviewerId);
    if (!reviewer) {
      errors.push(`unknown reviewerId ${r.reviewerId}`);
    } else {
      if (reviewer.status !== "active") {
        errors.push(`reviewer ${r.reviewerId} is not active`);
      }
      if (!reviewer.schools.includes(r.school)) {
        errors.push(`reviewer ${r.reviewerId} is not approved for ${r.school}`);
      }
    }
    if (!SCHOOLS.has(r.school)) errors.push(`invalid school ${r.school}`);
    if (r.blindedToEngine !== true) errors.push(`${r.reviewId} blindedToEngine must be true`);
    if (!r.rubricVersion) errors.push(`${r.reviewId} missing rubricVersion`);
    else if (!(KNOWN_RUBRIC_VERSIONS as readonly string[]).includes(r.rubricVersion)) {
      errors.push(`${r.reviewId} unknown rubricVersion ${r.rubricVersion}`);
    }
    if (!r.assignmentId) errors.push(`${r.reviewId} missing assignmentId`);
    else if (assignmentIds.has(r.assignmentId)) {
      errors.push(`duplicate review for assignment ${r.assignmentId}`);
    } else {
      assignmentIds.add(r.assignmentId);
    }
    if (!r.reviewedAt || !ISO.test(r.reviewedAt)) {
      errors.push(`${r.reviewId} reviewedAt must be ISO-8601`);
    }
    if (r.reviewerConfidence && !CONF.has(r.reviewerConfidence)) {
      errors.push(`${r.reviewId} invalid reviewerConfidence`);
    }
    const ident = `${r.reviewerId}::${r.caseId}::${r.school}`;
    if (identity.has(ident)) errors.push(`duplicate reviewer/case/school ${ident}`);
    identity.add(ident);

    const caseRec = cases.find((c) => c.caseId === r.caseId);
    if (caseRec && !caseRec.eligibleSchools.includes(r.school)) {
      errors.push(`${r.reviewId} school not eligible on case`);
    }

    const palaceSeen = new Set<string>();
    for (const p of r.palaceRatings) {
      if (!PALACES.includes(p.palaceName)) errors.push(`invalid palace ${p.palaceName}`);
      if (palaceSeen.has(p.palaceName)) {
        errors.push(`${r.reviewId} duplicate palace rating ${p.palaceName}`);
      }
      palaceSeen.add(p.palaceName);
      if (!AXIS_ORD.has(p.support) || !AXIS_ORD.has(p.pressure) || !AXIS_ORD.has(p.stability) || !AXIS_ORD.has(p.activation)) {
        errors.push(`invalid axis ordinal on ${r.reviewId} ${p.palaceName}`);
      }
      if (!NET.has(p.netQuality)) errors.push(`invalid netQuality on ${r.reviewId} ${p.palaceName}`);
      if (palaceRatingIsUsable(p) && !p.confidence) {
        errors.push(`${r.reviewId} ${p.palaceName} usable rating requires confidence`);
      }
      if (p.confidence && !CONF.has(p.confidence)) {
        errors.push(`invalid confidence on ${r.reviewId} ${p.palaceName}`);
      }
    }

    const pairSeen = new Set<string>();
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
      if (pair.leftPalace === pair.rightPalace) {
        errors.push(`${r.reviewId} self pairwise ${pair.leftPalace}`);
      }
      if (!PAIR.has(pair.result)) errors.push(`invalid pairwise result ${pair.result}`);
      const pk = pairwiseLogicalKey(
        pair.caseId,
        pair.school,
        pair.axis,
        pair.leftPalace,
        pair.rightPalace,
      );
      if (pairSeen.has(pk)) {
        errors.push(`${r.reviewId} duplicate logical pairwise ${pk}`);
      }
      pairSeen.add(pk);
    }

    if (!hasUsableJudgment(r)) {
      errors.push(`${r.reviewId} has no usable palace or pairwise judgment`);
    }
  }
  return errors;
}

export function validateAdjudications(
  adjudications: ExpertAdjudication[] = loadAdjudicationsV2(),
  reviews: ExpertReview[] = loadExpertReviewsV2(),
  reviewers: ExpertReviewer[] = loadReviewers(),
): string[] {
  const errors: string[] = [];
  const cases = new Set(loadBenchmarkCasesV2().map((c) => c.caseId));
  const reviewerIds = new Set(reviewers.map((r) => r.id));
  const reviewed = new Set(reviews.map((r) => `${r.reviewerId}::${r.caseId}::${r.school}`));
  for (const a of adjudications) {
    if (!cases.has(a.caseId)) errors.push(`adjudication unknown case ${a.caseId}`);
    if (!SCHOOLS.has(a.school)) errors.push(`adjudication invalid school ${a.school}`);
    if (!PALACES.includes(a.palaceName)) errors.push(`adjudication invalid palace ${a.palaceName}`);
    if (!AXES.has(a.axis)) errors.push(`adjudication invalid axis ${a.axis}`);
    if (!a.rationale?.trim()) errors.push(`adjudication empty rationale`);
    if (a.adjudicator && !reviewerIds.has(a.adjudicator) && reviewers.length > 0) {
      errors.push(`adjudication unknown adjudicator ${a.adjudicator}`);
    }
    for (const rid of a.reviewerIds) {
      if (!reviewed.has(`${rid}::${a.caseId}::${a.school}`)) {
        errors.push(`adjudication reviewer ${rid} did not review ${a.caseId}/${a.school}`);
      }
    }
  }
  return errors;
}

export function validateBenchmarkCorpus(): string[] {
  const cases = loadBenchmarkCasesV2();
  const assignmentErrors = validateAssignments(
    loadReviewAssignments() as ExpertReviewAssignment[],
    loadReviewers(),
    new Set(cases.map((c) => c.caseId)),
    new Map(cases.map((c) => [c.caseId, c.eligibleSchools])),
    cases,
  );
  return [
    ...validateExpertReviews(),
    ...validateAdjudications(),
    ...assignmentErrors,
  ];
}
