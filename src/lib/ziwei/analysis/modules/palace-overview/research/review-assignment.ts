import type { School } from "@/types/chart";
import type { ExpertReviewer } from "../calibration/benchmark-v2-types";

export interface ExpertReviewAssignment {
  assignmentId: string;
  reviewerId: string;
  caseId: string;
  school: School;
  purpose: "pilot" | "primary" | "overlap";
  status: "assigned" | "completed" | "withdrawn";
  createdAt: string;
}

export function validateAssignments(
  assignments: ExpertReviewAssignment[],
  reviewers: ExpertReviewer[],
  caseIds: Set<string>,
  caseSchools: Map<string, School[]>,
): string[] {
  const errors: string[] = [];
  const reviewerById = new Map(reviewers.map((r) => [r.id, r]));
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
  }
  return errors;
}

export function planPilotOverlapAssignments(
  reviewers: ExpertReviewer[],
  cases: Array<{ caseId: string; eligibleSchools: School[] }>,
  createdAt: string,
): ExpertReviewAssignment[] {
  if (reviewers.length === 0) return [];
  const out: ExpertReviewAssignment[] = [];
  let n = 0;
  for (const c of cases) {
    for (const school of c.eligibleSchools) {
      const capable = reviewers.filter(
        (r) => r.status === "active" && r.schools.includes(school),
      );
      if (capable.length === 0) continue;
      out.push({
        assignmentId: `asg-${String(++n).padStart(4, "0")}`,
        reviewerId: capable[0]!.id,
        caseId: c.caseId,
        school,
        purpose: "pilot",
        status: "assigned",
        createdAt,
      });
      if (capable.length > 1) {
        out.push({
          assignmentId: `asg-${String(++n).padStart(4, "0")}`,
          reviewerId: capable[1]!.id,
          caseId: c.caseId,
          school,
          purpose: "overlap",
          status: "assigned",
          createdAt,
        });
      }
    }
  }
  return out;
}
