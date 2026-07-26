import type {
  CandidateEligibilityStatus,
  EvidenceGapMatrixRecord,
} from "../schema/foundation.js";

const MANDATORY_DIMENSIONS = [
  "existence",
  "schoolScope",
  "majorFortuneTemporalScope",
  "palaceFrame",
  "targetFrame",
  "polarity",
  "strength",
  "pillarOwnership",
  "stacking",
  "deduplication",
  "exceptionPolicy",
  "calculationCoreReadiness",
  "sourceLocatorQuality",
  "crossSourceAgreement",
  "corpusMeasurability",
] as const;

export function calculateCandidateReadiness(
  record: EvidenceGapMatrixRecord,
): {
  readiness: CandidateEligibilityStatus;
  blockingDimensions: string[];
} {
  const blockingDimensions: string[] = [];

  for (const key of MANDATORY_DIMENSIONS) {
    const dimension = record[key];
    if (
      dimension.status !== "verified" &&
      dimension.status !== "not-applicable"
    ) {
      blockingDimensions.push(key);
    }
  }

  if (record.openContradictionIds.length > 0) {
    blockingDimensions.push("openContradictions");
  }

  const hasContradiction =
    record.openContradictionIds.length > 0 ||
    MANDATORY_DIMENSIONS.some(
      (key) => record[key].status === "contradicted",
    );
  if (hasContradiction) {
    return {
      readiness: "contradicted",
      blockingDimensions,
    };
  }

  const calculationCoreBlocked = MANDATORY_DIMENSIONS.some(
    (key) =>
      record[key].status === "missing" &&
      record[key].blockerKind === "calculation-core",
  );
  if (calculationCoreBlocked) {
    return {
      readiness: "blocked-by-calculation-core",
      blockingDimensions,
    };
  }

  if (blockingDimensions.length > 0) {
    return {
      readiness: "research-blocked",
      blockingDimensions,
    };
  }

  return {
    readiness: "eligible-for-shape-design",
    blockingDimensions: [],
  };
}
