import type { ClassifiedPathCandidate } from "../nam-phai-v043/classify-paths";

/**
 * V0.5 activation gate uses only deduplicated annual-trigger evidence.
 * Excludes global climate, Major Fortune background, unactivated natal
 * context, and context-only paths without a concrete annual trigger.
 */
export function isAnnualActivationCandidate(c: ClassifiedPathCandidate): boolean {
  if (c.path.channel === "global" || c.path.channel === "major-background") return false;

  if (c.evidence.layer === "annual") return true;

  if (c.evidence.layer === "natal-activated") {
    return (c.evidence.annualTriggerIds?.length ?? 0) > 0;
  }

  return false;
}

export function filterAnnualActivationRetained(
  activationRetained: ClassifiedPathCandidate[],
): ClassifiedPathCandidate[] {
  return activationRetained.filter(isAnnualActivationCandidate);
}
