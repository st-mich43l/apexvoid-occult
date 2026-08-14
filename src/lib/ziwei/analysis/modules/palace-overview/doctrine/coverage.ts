import type { CoverageComponents } from "./types";
import type { CompletenessInput } from "../normalize-result";
import { computeEvidenceCompleteness } from "../normalize-result";

function clamp01(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function computeCoverageComponents(input: CompletenessInput & {
  domainClaimCount: number;
  schoolPolicyResolved: boolean;
}): CoverageComponents {
  return {
    frame: input.frameNodeCount >= 4 ? 100 : 50,
    principalStarIdentity: clamp01(100 - 20 * input.unknownStarCount),
    stateBrightness: clamp01(100 - 10 * input.missingBrightnessCount),
    minorStarMapping: clamp01(100 - 2 * input.unknownStarCount),
    transformationMapping: clamp01(100 - 10 * input.unmappedTransformationCount),
    schoolPolicyResolution: input.schoolPolicyResolved ? 100 : 40,
    domainDoctrine: input.domainClaimCount > 0 ? 70 : 30,
  };
}

/** Keep the V1 penalty formula for evidenceCompleteness (numeric freeze). */
export function legacyCompleteness(input: CompletenessInput): number {
  return computeEvidenceCompleteness(input);
}
