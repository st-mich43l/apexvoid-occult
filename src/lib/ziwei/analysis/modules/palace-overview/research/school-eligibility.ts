import type { School } from "@/types/chart";
import type { BenchmarkCaseFingerprint } from "./case-fingerprint";

export interface SchoolEligibility {
  school: School;
  reviewEligibility: "eligible" | "research-only" | "blocked";
  reason?: string;
}

export function schoolEligibilityForFingerprint(
  fp: BenchmarkCaseFingerprint,
): SchoolEligibility[] {
  const isVcd = fp.vcdPalaces.length > 0;
  const nam: SchoolEligibility = isVcd
    ? {
        school: "nam-phai",
        reviewEligibility: "research-only",
        reason: "UNRESOLVED_NAM_PHAI_VCD — collectable for research, not authoritative calibration cohort",
      }
    : { school: "nam-phai", reviewEligibility: "eligible" };
  const trung: SchoolEligibility = {
    school: "trung-chau",
    reviewEligibility: "eligible",
    reason: isVcd ? "Trung Châu VCD review allowed; doctrine still bibliographic" : undefined,
  };
  return [nam, trung];
}

export function reviewableSchools(rows: SchoolEligibility[]): School[] {
  return rows.filter((r) => r.reviewEligibility !== "blocked").map((r) => r.school);
}

export function eligibleSchoolsForReview(rows: SchoolEligibility[]): School[] {
  return rows
    .filter((r) => r.reviewEligibility === "eligible")
    .map((r) => r.school);
}
