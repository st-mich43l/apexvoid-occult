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
} from "./benchmark-v2-types";
import { reliabilityUnitId } from "./benchmark-v2-types";
import { krippendorffAlphaOrdinal, type KrippendorffResult } from "./krippendorff";

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

export function loadReviewerIds(): string[] {
  return (registryRaw as { reviewers: Array<{ id: string } | string> }).reviewers.map((r) =>
    typeof r === "string" ? r : r.id,
  );
}

export function loadBenchmarkSplitV2() {
  return splitRaw as {
    calibrationCaseIds: string[];
    holdoutCaseIds: string[];
    policy: string;
  };
}

function usableAxis(value: string | undefined): string | null {
  if (!value || value === "unable-to-judge") return null;
  return value;
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
    const parsed = unit.match(
      /^(.*):(nam-phai|trung-chau):(.*):(support|pressure|stability|activation|netQuality)$/,
    );
    if (!parsed) continue;
    const caseId = parsed[1]!;
    const school = parsed[2]!;
    const palace = parsed[3]!;
    const row: Array<string | null> = reviewerIds.map((rid) => {
      const review = filtered.find(
        (x) => x.reviewerId === rid && x.caseId === caseId && x.school === school,
      );
      const rating = review?.palaceRatings.find((p) => p.palaceName === palace);
      if (!rating) return null;
      if (axis === "netQuality") return usableAxis(rating.netQuality);
      return usableAxis(rating[axis]);
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
  const schools = [...new Set(reviews.map((r) => r.school))];
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

export function reviewedCaseSchoolKeys(reviews: ExpertReview[] = loadExpertReviewsV2()): string[] {
  return [...new Set(reviews.map((r) => `${r.caseId}::${r.school}`))];
}

export function multiReviewerCaseSchoolCount(
  reviews: ExpertReview[] = loadExpertReviewsV2(),
): number {
  const byKey = new Map<string, Set<string>>();
  for (const r of reviews) {
    const k = `${r.caseId}::${r.school}`;
    const set = byKey.get(k) ?? new Set();
    const overlapping = r.palaceRatings.some((p) =>
      [p.support, p.pressure, p.stability, p.activation, p.netQuality].some(
        (v) => v !== "unable-to-judge",
      ),
    );
    if (!overlapping) continue;
    set.add(r.reviewerId);
    byKey.set(k, set);
  }
  return [...byKey.values()].filter((s) => s.size >= 2).length;
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

export function uniqueReviewerIds(reviews: ExpertReview[] = loadExpertReviewsV2()): string[] {
  return [...new Set(reviews.map((r) => r.reviewerId))];
}

export function reviewedChartCountV2(reviews: ExpertReview[] = loadExpertReviewsV2()): number {
  return new Set(reviews.map((r) => r.caseId)).size;
}

export { PALACES };
