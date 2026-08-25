import type {
  RomanceResearchDecision,
  RomanceSemanticClaimResolution,
  RomanceSemanticCoverage,
  RomanceSemanticReportStatus,
  RomanceSemanticReportV01,
} from "./types";
import {
  ROMANCE_SEMANTIC_MODEL_ID,
  ROMANCE_SEMANTIC_MODULE,
} from "./types";

export function classifySignals(admitted: RomanceSemanticClaimResolution[]): {
  supportSignals: string[];
  pressureSignals: string[];
  mixedSignals: string[];
} {
  const supportSignals: string[] = [];
  const pressureSignals: string[] = [];
  const mixedSignals: string[] = [];

  for (const c of admitted) {
    const label = `${c.claimId}:${c.starOrSystem}@${c.palace}`;
    const supportUp = c.tendency.support === "up";
    const supportDown = c.tendency.support === "down";
    const pressureUp = c.tendency.pressure === "up";
    const stabilityUp = c.tendency.stability === "up";
    const activationOnly =
      c.tendency.activation === "up" &&
      !supportUp &&
      !supportDown &&
      !pressureUp &&
      !stabilityUp;

    if (supportUp && pressureUp) {
      mixedSignals.push(label);
      continue;
    }
    if (supportUp || (stabilityUp && !pressureUp && !supportDown)) {
      supportSignals.push(label);
    }
    if (pressureUp || supportDown) {
      pressureSignals.push(label);
    }
    if (activationOnly) {
      mixedSignals.push(`${label}:activation-only`);
    }
  }

  return {
    supportSignals: [...new Set(supportSignals)].sort((a, b) => a.localeCompare(b)),
    pressureSignals: [...new Set(pressureSignals)].sort((a, b) => a.localeCompare(b)),
    mixedSignals: [...new Set(mixedSignals)].sort((a, b) => a.localeCompare(b)),
  };
}

/**
 * Epistemic A/B/C decision.
 *
 * Catalog density for romance anchors matters more than raw hit counts.
 * Never promote to A merely because a multi-chart corpus sum exceeds a threshold.
 */
export function decideResearchOutcome(input: {
  verifiedAdmitted: number;
  expertOnly: number;
  unresolved: number;
  conflicts: number;
  observedStars: number;
  starsWithDoctrine: number;
  starsWithAdmitted: number;
  /** Distinct VERIFIED claims in doctrine for Phu Thê (catalog). */
  catalogPhuTheVerifiedClaims: number;
  /** Distinct VERIFIED claims in doctrine for Tử Tức (catalog). */
  catalogTuTucVerifiedClaims: number;
}): RomanceResearchDecision {
  const {
    verifiedAdmitted,
    unresolved,
    conflicts,
    observedStars,
    starsWithDoctrine,
    starsWithAdmitted,
    catalogPhuTheVerifiedClaims,
    catalogTuTucVerifiedClaims,
  } = input;

  const catalogRomanceVerified =
    catalogPhuTheVerifiedClaims + catalogTuTucVerifiedClaims;

  if (catalogRomanceVerified === 0 && verifiedAdmitted === 0 && starsWithDoctrine === 0) {
    return "INSUFFICIENT_ROMANCE_SEMANTIC_AUTHORITY";
  }

  // Future numeric-design bar: rich primary-palace catalog + clean resolution
  // + meaningful observed coverage. 14 majors × Phu Thê would ideally need
  // broader star×palace coverage than the current 2-claim Phu Thê slice.
  const coverageRatio =
    observedStars > 0 ? starsWithAdmitted / observedStars : 0;
  const catalogDenseEnough =
    catalogPhuTheVerifiedClaims >= 6 && catalogTuTucVerifiedClaims >= 2;
  if (
    catalogDenseEnough &&
    catalogRomanceVerified >= 8 &&
    verifiedAdmitted >= 4 &&
    coverageRatio >= 0.35 &&
    unresolved === 0 &&
    conflicts === 0
  ) {
    return "ROMANCE_SEMANTIC_EVIDENCE_SUFFICIENT_FOR_NUMERIC_DESIGN";
  }

  if (
    catalogRomanceVerified > 0 ||
    verifiedAdmitted > 0 ||
    starsWithDoctrine > 0
  ) {
    return "ROMANCE_SEMANTIC_EVIDENCE_PARTIAL";
  }

  return "INSUFFICIENT_ROMANCE_SEMANTIC_AUTHORITY";
}

export function reportStatusFromCoverage(
  coverage: RomanceSemanticCoverage,
  admitted: number,
): RomanceSemanticReportStatus {
  if (admitted === 0 && coverage.starsWithAnyDoctrineClaim === 0) {
    return "unavailable";
  }
  if (
    coverage.unresolvedConditionalClaimCount > 0 ||
    coverage.starsWithAdmittedClaim < coverage.starsWithAnyDoctrineClaim ||
    coverage.zeroEvidencePalaceCount > 0
  ) {
    return "partial";
  }
  return admitted > 0 ? "available" : "unavailable";
}

export function modelBanner(): Pick<
  RomanceSemanticReportV01,
  "module" | "model" | "school" | "numericAuthority" | "scoreImpactAllowed" | "anchors"
> {
  return {
    module: ROMANCE_SEMANTIC_MODULE,
    model: ROMANCE_SEMANTIC_MODEL_ID,
    school: "nam-phai",
    numericAuthority: "none",
    scoreImpactAllowed: false,
    anchors: {
      legacy: ["Phu Thê", "Tử Tức"],
      researchComparison: ["Phúc Đức", "Mệnh"],
    },
  };
}
