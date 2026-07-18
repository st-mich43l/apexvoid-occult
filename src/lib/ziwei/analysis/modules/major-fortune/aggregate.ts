import type { MajorFortuneScoringProfile } from "../../knowledge/major-fortune-scoring";
import { scaleMajorFortuneAxes, type MajorFortuneEvidence, type MajorFortuneEvidenceCategory } from "./types";

function evidenceLayerWeightKey(
  category: MajorFortuneEvidenceCategory,
): keyof MajorFortuneScoringProfile["evidenceLayerWeights"] {
  if (category === "star") return "major-frame-star";
  if (category === "transformation") return "major-transformation";
  if (category === "structural-activation") return "structural-activation";
  return "interaction";
}

function baseWeight(evidence: MajorFortuneEvidence, profile: MajorFortuneScoringProfile): number {
  // `effectiveWeight` currently holds the frame's own frameWeight (1.0 for
  // overall; per-domain frameWeight, currently always 1.0) — folded in for
  // forward compatibility even though today's formula reduces to the
  // remaining three terms.
  const frameWeight = evidence.effectiveWeight;
  const frameRoleWeight = profile.frameRoleWeights[evidence.frameRole];
  const evidenceLayerWeight = profile.evidenceLayerWeights[evidenceLayerWeightKey(evidence.category)];
  const confidenceWeight = profile.confidenceWeights[evidence.knowledgeStatus];
  return frameWeight * frameRoleWeight * evidenceLayerWeight * confidenceWeight;
}

/** Identity per `major-fortune-scoring-profile.v0.json#dedup.identityFields`
 * (school + cycleIndex are constant for one analysis call and therefore
 * omitted from the in-run key). */
function dedupIdentity(evidence: MajorFortuneEvidence): string {
  return [
    evidence.scope,
    evidence.domainId ?? "overall",
    evidence.category,
    evidence.physicalFactId,
    evidence.ruleId,
    evidence.targetPalaceIndex,
  ].join("|");
}

/**
 * Resolve raw per-frame candidates into the final, dedup'd, weighted
 * evidence list for one scope (overall, or one domain):
 *  1. When the same physical fact is reachable through multiple frames,
 *     keep only the highest-base-weight candidate (stable tie-break).
 *  2. Diminishing returns apply per one-based rank within the same
 *     scope + domain + evidence layer + stackingGroup,
 *     `diminishingFactor = 1/sqrt(rank)`.
 *  3. `effectiveWeight = baseWeight * diminishingFactor`;
 *     `weightedAxes = rawAxes * effectiveWeight`.
 */
export function aggregateMajorFortuneEvidence(
  candidates: MajorFortuneEvidence[],
  profile: MajorFortuneScoringProfile,
): MajorFortuneEvidence[] {
  if (profile.diminishingReturns.formula !== "inverse_square_root_rank") {
    throw new Error(`unsupported diminishingReturns.formula: ${profile.diminishingReturns.formula}`);
  }

  // Step 1 — cross-frame dedup, keep highest base weight.
  const byIdentity = new Map<string, { evidence: MajorFortuneEvidence; weight: number }[]>();
  for (const evidence of candidates) {
    const key = dedupIdentity(evidence);
    const bucket = byIdentity.get(key) ?? [];
    bucket.push({ evidence, weight: baseWeight(evidence, profile) });
    byIdentity.set(key, bucket);
  }

  const survivors: { evidence: MajorFortuneEvidence; weight: number }[] = [];
  for (const bucket of byIdentity.values()) {
    bucket.sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.evidence.frameRole < b.evidence.frameRole ? -1 : 1;
    });
    const winner = bucket[0];
    if (winner) survivors.push(winner);
  }

  // Step 2 — stable ordering, then rank within scope+domain+layer+group.
  survivors.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return a.evidence.physicalFactId < b.evidence.physicalFactId ? -1 : 1;
  });

  const rankCounters = new Map<string, number>();
  const out: MajorFortuneEvidence[] = [];
  for (const { evidence, weight } of survivors) {
    const groupKey = `${evidence.scope}|${evidence.domainId ?? "overall"}|${evidenceLayerWeightKey(evidence.category)}|${evidence.stackingGroup}`;
    const rank = (rankCounters.get(groupKey) ?? 0) + 1;
    rankCounters.set(groupKey, rank);

    const diminishingFactor = 1 / Math.sqrt(rank);
    const effectiveWeight = weight * diminishingFactor;

    out.push({
      ...evidence,
      effectiveWeight,
      weightedAxes: scaleMajorFortuneAxes(evidence.rawAxes, effectiveWeight),
    });
  }

  return out;
}
