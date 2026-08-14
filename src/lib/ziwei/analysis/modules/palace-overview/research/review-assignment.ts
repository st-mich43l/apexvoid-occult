import type { School } from "@/types/chart";
import type { ExpertBenchmarkCase, ExpertReviewer } from "../calibration/benchmark-v2-types";

export interface ExpertReviewAssignment {
  assignmentId: string;
  reviewerId: string;
  caseId: string;
  school: School;
  purpose: "pilot" | "primary" | "overlap";
  status: "assigned" | "completed" | "withdrawn";
  /** Nam Phái VCD must be research-only. */
  authority?: "calibration" | "research-only";
  createdAt: string;
}

export type ReviewerResolveError = "UNKNOWN_REVIEWER" | "INACTIVE_REVIEWER";

export function resolveActiveReviewer(
  reviewerId: string,
  reviewers: ExpertReviewer[],
): { ok: true; reviewer: ExpertReviewer } | { ok: false; code: ReviewerResolveError } {
  const reviewer = reviewers.find((r) => r.id === reviewerId);
  if (!reviewer) return { ok: false, code: "UNKNOWN_REVIEWER" };
  if (reviewer.status !== "active") return { ok: false, code: "INACTIVE_REVIEWER" };
  return { ok: true, reviewer };
}

export function selectAssignedForReviewer(
  reviewerId: string,
  assignments: ExpertReviewAssignment[],
): ExpertReviewAssignment[] {
  return assignments.filter((a) => a.reviewerId === reviewerId && a.status === "assigned");
}

export function canTransitionAssignment(
  from: ExpertReviewAssignment["status"],
  to: ExpertReviewAssignment["status"],
): boolean {
  if (from === "assigned" && (to === "completed" || to === "withdrawn")) return true;
  return false;
}

export function validateAssignments(
  assignments: ExpertReviewAssignment[],
  reviewers: ExpertReviewer[],
  caseIds: Set<string>,
  caseSchools: Map<string, School[]>,
  cases: ExpertBenchmarkCase[] = [],
): string[] {
  const errors: string[] = [];
  const reviewerById = new Map(reviewers.map((r) => [r.id, r]));
  const caseById = new Map(cases.map((c) => [c.caseId, c]));
  const ids = new Set<string>();
  for (const a of assignments) {
    if (ids.has(a.assignmentId)) errors.push(`duplicate assignmentId ${a.assignmentId}`);
    ids.add(a.assignmentId);
    const reviewer = reviewerById.get(a.reviewerId);
    if (!reviewer) errors.push(`assignment ${a.assignmentId} unknown reviewer`);
    else if (!reviewer.schools.includes(a.school)) {
      errors.push(`assignment ${a.assignmentId} reviewer not approved for ${a.school}`);
    }
    if (!caseIds.has(a.caseId)) errors.push(`assignment ${a.assignmentId} unknown case`);
    const eligible = caseSchools.get(a.caseId);
    if (eligible && !eligible.includes(a.school)) {
      errors.push(`assignment ${a.assignmentId} school not eligible on case`);
    }
    const rec = caseById.get(a.caseId);
    const isVcd = rec?.cohortTags.includes("vcd") ?? false;
    if (a.school === "nam-phai" && isVcd && a.authority !== "research-only") {
      errors.push(`assignment ${a.assignmentId} Nam Phái VCD must be research-only`);
    }
  }
  return errors;
}

export function findMatchingAssignment(
  review: { assignmentId?: string; reviewerId: string; caseId: string; school: School },
  assignments: ExpertReviewAssignment[],
): ExpertReviewAssignment | undefined {
  if (review.assignmentId) {
    return assignments.find((a) => a.assignmentId === review.assignmentId);
  }
  return assignments.find(
    (a) =>
      a.reviewerId === review.reviewerId &&
      a.caseId === review.caseId &&
      a.school === review.school,
  );
}

/**
 * Bounded deterministic preview. Does not write the registry.
 * Empty reviewer list → no assignments.
 */
export function planPilotAssignments(
  reviewers: ExpertReviewer[],
  cases: ExpertBenchmarkCase[],
  createdAt: string,
): ExpertReviewAssignment[] {
  const active = [...reviewers]
    .filter((r) => r.status === "active")
    .sort((a, b) => a.id.localeCompare(b.id));
  if (active.length === 0) return [];
  const sortedCases = [...cases].sort((a, b) => a.caseId.localeCompare(b.caseId));
  const slots: Array<{
    caseId: string;
    school: School;
    authority: "calibration" | "research-only";
  }> = [];
  for (const c of sortedCases) {
    const vcd = c.cohortTags.includes("vcd");
    for (const school of [...c.eligibleSchools].sort()) {
      slots.push({
        caseId: c.caseId,
        school,
        authority: school === "nam-phai" && vcd ? "research-only" : "calibration",
      });
    }
  }
  const calibration = slots.filter((s) => s.authority === "calibration");
  const nam = calibration.find((s) => s.school === "nam-phai");
  const trung = calibration.find((s) => s.school === "trung-chau");
  const extra = calibration.find(
    (s) =>
      s !== nam &&
      s !== trung &&
      (s.caseId !== nam?.caseId || s.school !== nam?.school) &&
      (s.caseId !== trung?.caseId || s.school !== trung?.school),
  );
  const primarySlots = [nam, trung, extra].filter(Boolean) as typeof slots;
  const overlapSlots = primarySlots.slice(0, 2);
  const out: ExpertReviewAssignment[] = [];
  let n = 0;
  const capable = (school: School) =>
    active.filter((r) => r.schools.includes(school));
  for (const slot of primarySlots) {
    const reviewersFor = capable(slot.school);
    if (!reviewersFor[0]) continue;
    out.push({
      assignmentId: `asg-${String(++n).padStart(4, "0")}`,
      reviewerId: reviewersFor[0].id,
      caseId: slot.caseId,
      school: slot.school,
      purpose: "pilot",
      status: "assigned",
      authority: slot.authority,
      createdAt,
    });
  }
  for (const slot of overlapSlots) {
    const reviewersFor = capable(slot.school);
    if (!reviewersFor[1]) continue;
    out.push({
      assignmentId: `asg-${String(++n).padStart(4, "0")}`,
      reviewerId: reviewersFor[1].id,
      caseId: slot.caseId,
      school: slot.school,
      purpose: "overlap",
      status: "assigned",
      authority: slot.authority,
      createdAt,
    });
  }
  return out;
}
