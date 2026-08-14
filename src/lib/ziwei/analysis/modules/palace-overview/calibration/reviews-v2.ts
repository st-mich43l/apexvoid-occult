import casesRaw from "../../../knowledge/palace-overview/v1/benchmark/expert-benchmark-cases.v2.json";
import reviewsRaw from "../../../knowledge/palace-overview/v1/benchmark/expert-reviews.v2.json";
import adjudicationsRaw from "../../../knowledge/palace-overview/v1/benchmark/expert-adjudications.v2.json";
import registryRaw from "../../../knowledge/palace-overview/v1/benchmark/reviewer-registry.v2.json";
import splitRaw from "../../../knowledge/palace-overview/v1/benchmark/calibration-holdout-split.v2.json";
import type {
  AxisName,
  ExpertAdjudication,
  ExpertBenchmarkCase,
  ExpertReview,
  ExpertReviewer,
} from "./benchmark-v2-types";
import { parseReliabilityUnitId, reliabilityUnitId } from "./benchmark-v2-types";
import { krippendorffAlphaOrdinal, type KrippendorffResult } from "./krippendorff";
import { uniquePairwiseCount, usablePairwiseCount } from "./pairwise";

const PALACES = [
  "Mệnh",
  "Phụ Mẫu",
  "Phúc Đức",
  "Điền Trạch",
  "Quan Lộc",
  "Nô Bộc",
  "Thiên Di",
  "Tật Ách",
  "Tài Bạch",
  "Tử Tức",
  "Phu Thê",
  "Huynh Đệ",
];

const AXIS_LEVELS = ["low", "medium", "high"] as const;
const NET_LEVELS = ["guarded", "neutral", "supportive", "strong"] as const;
const AXES: AxisName[] = ["support", "pressure", "stability", "activation", "netQuality"];

export function loadBenchmarkCasesV2(): ExpertBenchmarkCase[] {
  return (casesRaw as { cases: ExpertBenchmarkCase[] }).cases;
}

export function loadExpertReviewsV2(): ExpertReview[] {
  return (reviewsRaw as { reviews: ExpertReview[] }).reviews;
}

export function loadAdjudicationsV2(): ExpertAdjudication[] {
  return (adjudicationsRaw as { adjudications: ExpertAdjudication[] }).adjudications;
}

export function loadReviewers(): ExpertReviewer[] {
  return (registryRaw as { reviewers: ExpertReviewer[] }).reviewers;
}

export function loadBenchmarkSplitV2() {
  return splitRaw as {
    calibrationCaseIds: string[];
    holdoutCaseIds: string[];
    policy: string;
  };
}

export function loadCalibrationReviews(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
  cases: ExpertBenchmarkCase[] = loadBenchmarkCasesV2(),
): ExpertReview[] {
  const cal = new Set(
    cases.filter((c) => c.splitAssignment === "calibration").map((c) => c.caseId),
  );
  return reviews.filter((r) => cal.has(r.caseId));
}

export function loadHoldoutReviews(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
  cases: ExpertBenchmarkCase[] = loadBenchmarkCasesV2(),
): ExpertReview[] {
  const hold = new Set(
    cases.filter((c) => c.splitAssignment === "holdout").map((c) => c.caseId),
  );
  return reviews.filter((r) => hold.has(r.caseId));
}

function usableAxis(value: string | undefined): string | null {
  if (!value || value === "unable-to-judge") return null;
  return value;
}

function ratingValue(rating: ExpertReview["palaceRatings"][number], axis: AxisName): string | null {
  if (axis === "netQuality") return usableAxis(rating.netQuality);
  return usableAxis(rating[axis]);
}

function buildAxisMatrix(
  reviews: ExpertReview[],
  axis: AxisName,
  schoolFilter?: string,
): { matrix: Array<Array<string | null>>; reviewerIds: string[] } {
  const filtered = schoolFilter ? reviews.filter((r) => r.school === schoolFilter) : reviews;
  const reviewerIds = [...new Set(filtered.map((r) => r.reviewerId))].sort();
  const unitKeys = new Set<string>();
  for (const r of filtered) {
    for (const p of r.palaceRatings) {
      unitKeys.add(reliabilityUnitId(r.caseId, r.school, p.palaceName, axis));
    }
  }
  const matrix: Array<Array<string | null>> = [];
  for (const unit of [...unitKeys].sort()) {
    const parsed = parseReliabilityUnitId(unit);
    const row: Array<string | null> = reviewerIds.map((rid) => {
      const review = filtered.find(
        (x) =>
          x.reviewerId === rid &&
          x.caseId === parsed.caseId &&
          x.school === parsed.school,
      );
      const rating = review?.palaceRatings.find((p) => p.palaceName === parsed.palaceName);
      if (!rating) return null;
      return ratingValue(rating, axis);
    });
    matrix.push(row);
  }
  return { matrix, reviewerIds };
}

export function reliabilityByAxis(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
): Record<AxisName, KrippendorffResult> {
  const out = {} as Record<AxisName, KrippendorffResult>;
  for (const axis of AXES) {
    const { matrix } = buildAxisMatrix(reviews, axis);
    const levels = axis === "netQuality" ? [...NET_LEVELS] : [...AXIS_LEVELS];
    out[axis] = krippendorffAlphaOrdinal(matrix, levels);
  }
  return out;
}

export function reliabilityBySchool(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
): Record<string, Record<AxisName, KrippendorffResult>> {
  const schools = ["nam-phai", "trung-chau"];
  const out: Record<string, Record<AxisName, KrippendorffResult>> = {};
  for (const school of schools) {
    out[school] = {} as Record<AxisName, KrippendorffResult>;
    for (const axis of AXES) {
      const { matrix } = buildAxisMatrix(reviews, axis, school);
      const levels = axis === "netQuality" ? [...NET_LEVELS] : [...AXIS_LEVELS];
      out[school][axis] = krippendorffAlphaOrdinal(matrix, levels);
    }
  }
  return out;
}

export interface OverlappingUnit {
  caseId: string;
  school: string;
  palaceName: string;
  axis: AxisName;
  reviewerIds: string[];
}

export function overlappingReliabilityUnits(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
): OverlappingUnit[] {
  const buckets = new Map<string, Set<string>>();
  for (const r of reviews) {
    for (const p of r.palaceRatings) {
      for (const axis of AXES) {
        if (ratingValue(p, axis) == null) continue;
        const id = reliabilityUnitId(r.caseId, r.school, p.palaceName, axis);
        const set = buckets.get(id) ?? new Set();
        set.add(r.reviewerId);
        buckets.set(id, set);
      }
    }
  }
  const out: OverlappingUnit[] = [];
  for (const [id, reviewers] of buckets) {
    if (reviewers.size < 2) continue;
    const parsed = parseReliabilityUnitId(id);
    out.push({
      caseId: parsed.caseId,
      school: parsed.school,
      palaceName: parsed.palaceName,
      axis: parsed.axis as AxisName,
      reviewerIds: [...reviewers].sort(),
    });
  }
  return out;
}

export function overlappingUnitCount(
  reviews: ExpertReview[],
  caseId: string,
  school: string,
): number {
  return overlappingReliabilityUnits(reviews).filter(
    (u) => u.caseId === caseId && u.school === school,
  ).length;
}

export function multiReviewerCaseSchoolCount(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
  minOverlappingUnits = 3,
): number {
  const byCs = new Map<string, number>();
  for (const u of overlappingReliabilityUnits(reviews)) {
    const k = `${u.caseId}::${u.school}`;
    byCs.set(k, (byCs.get(k) ?? 0) + 1);
  }
  return [...byCs.values()].filter((n) => n >= minOverlappingUnits).length;
}

export function overlappingUnitsByAxis(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
): Record<AxisName, number> {
  const counts = {} as Record<AxisName, number>;
  for (const axis of AXES) counts[axis] = 0;
  for (const u of overlappingReliabilityUnits(reviews)) {
    counts[u.axis] += 1;
  }
  return counts;
}

export function overlappingUnitsBySchool(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
): Record<string, number> {
  const counts: Record<string, number> = { "nam-phai": 0, "trung-chau": 0 };
  for (const u of overlappingReliabilityUnits(reviews)) {
    counts[u.school] = (counts[u.school] ?? 0) + 1;
  }
  return counts;
}

export function reviewedCaseSchoolKeys(reviews: ExpertReview[] = loadExpertReviewsV2()): string[] {
  return [...new Set(reviews.map((r) => `${r.caseId}::${r.school}`))];
}

export function reviewedCaseSchoolCountBySchool(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
): Record<string, number> {
  const keys = reviewedCaseSchoolKeys(reviews);
  const counts: Record<string, number> = { "nam-phai": 0, "trung-chau": 0 };
  for (const k of keys) {
    const school = k.split("::")[1]!;
    counts[school] = (counts[school] ?? 0) + 1;
  }
  return counts;
}

export function pairwiseCount(reviews: ExpertReview[] = loadExpertReviewsV2()): number {
  return reviews.reduce((n, r) => n + r.pairwiseComparisons.length, 0);
}

export function usablePairwiseFromReviews(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
): number {
  return usablePairwiseCount(reviews.flatMap((r) => r.pairwiseComparisons));
}

export function uniquePairwiseFromReviews(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
): number {
  return uniquePairwiseCount(reviews.flatMap((r) => r.pairwiseComparisons));
}

export function uniqueReviewerIds(reviews: ExpertReview[] = loadExpertReviewsV2()): string[] {
  return [...new Set(reviews.map((r) => r.reviewerId))];
}

export function reviewedChartCountV2(reviews: ExpertReview[] = loadExpertReviewsV2()): number {
  return new Set(reviews.map((r) => r.caseId)).size;
}

export { PALACES };
