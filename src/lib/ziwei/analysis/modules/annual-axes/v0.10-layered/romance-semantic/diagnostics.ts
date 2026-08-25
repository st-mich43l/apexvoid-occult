import type { RomanceSemanticCoverage, RomanceSemanticReportV01 } from "./types";

export function buildRomanceWarnings(
  report: Pick<
    RomanceSemanticReportV01,
    "coverage" | "conflicts" | "admittedClaims" | "unresolvedClaims" | "diagnostics"
  >,
): string[] {
  const warnings: string[] = [];
  const { coverage } = report;

  if (coverage.verifiedAdmittedClaimCount === 0) {
    warnings.push("NO_ROMANCE_SEMANTIC_EVIDENCE");
  }
  if (
    coverage.observedEligibleStars > 0 &&
    coverage.starsWithAdmittedClaim / coverage.observedEligibleStars < 0.25
  ) {
    warnings.push("LOW_VERIFIED_COVERAGE");
  }
  if (
    coverage.expertSynthesisOnlyClaimCount > 0 &&
    coverage.expertSynthesisOnlyClaimCount >= coverage.verifiedAdmittedClaimCount
  ) {
    warnings.push("EXPERT_SYNTHESIS_DOMINANT");
  }
  if (coverage.unresolvedConditionalClaimCount > 0) {
    warnings.push("CONDITIONAL_CLAIMS_UNRESOLVED");
  }
  if (coverage.conflictCount > 0 || report.conflicts.length > 0) {
    warnings.push("CONTRADICTORY_DOCTRINE");
  }
  if (coverage.zeroEvidencePalaceCount > 0) {
    warnings.push("ZERO_EVIDENCE_PALACE");
  }

  return [...new Set(warnings)].sort((a, b) => a.localeCompare(b));
}

export function summarizeCoverageNote(coverage: RomanceSemanticCoverage): string {
  return (
    `observedStars=${coverage.observedEligibleStars} ` +
    `withDoctrine=${coverage.starsWithAnyDoctrineClaim} ` +
    `admitted=${coverage.starsWithAdmittedClaim} ` +
    `unresolved=${coverage.unresolvedConditionalClaimCount} ` +
    `conflicts=${coverage.conflictCount}`
  );
}
