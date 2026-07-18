import type { MajorFortuneScoringProfile } from "../../knowledge/major-fortune-scoring";
import type { DeepReadonly } from "../../knowledge/major-fortune-scoring";
import {
  scaleMajorFortuneAxes,
  type MajorFortuneDiagnostics,
  type MajorFortuneEvidence,
  type MajorFortuneEvidenceCategory,
} from "./types";

function evidenceLayerWeightKey(
  category: MajorFortuneEvidenceCategory,
): keyof MajorFortuneScoringProfile["evidenceLayerWeights"] {
  if (category === "star") return "major-frame-star";
  if (category === "transformation") return "major-transformation";
  if (category === "structural-activation") return "structural-activation";
  return "interaction";
}

function baseWeight(
  evidence: MajorFortuneEvidence,
  profile: DeepReadonly<MajorFortuneScoringProfile> | MajorFortuneScoringProfile,
): number {
  const frameWeight = evidence.effectiveWeight;
  const frameRoleWeight = profile.frameRoleWeights[evidence.frameRole];
  const evidenceLayerWeight = profile.evidenceLayerWeights[evidenceLayerWeightKey(evidence.category)];
  const confidenceWeight = profile.confidenceWeights[evidence.knowledgeStatus];
  return frameWeight * frameRoleWeight * evidenceLayerWeight * confidenceWeight;
}

/** Identity per `major-fortune-scoring-profile.v0.json#dedup.identityFields`. */
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
 * evidence list for one scope (overall, or one domain).
 */
export function aggregateMajorFortuneEvidence(
  candidates: MajorFortuneEvidence[],
  profile: DeepReadonly<MajorFortuneScoringProfile> | MajorFortuneScoringProfile,
  diagnostics?: MajorFortuneDiagnostics,
): MajorFortuneEvidence[] {
  if (profile.diminishingReturns.formula !== "inverse_square_root_rank") {
    throw new Error(`unsupported diminishingReturns.formula: ${profile.diminishingReturns.formula}`);
  }

  const byIdentity = new Map<string, { evidence: MajorFortuneEvidence; weight: number }[]>();
  for (const evidence of candidates) {
    const key = dedupIdentity(evidence);
    const bucket = byIdentity.get(key) ?? [];
    bucket.push({ evidence, weight: baseWeight(evidence, profile) });
    byIdentity.set(key, bucket);
  }

  const survivors: { evidence: MajorFortuneEvidence; weight: number }[] = [];
  for (const [identity, bucket] of byIdentity.entries()) {
    if (bucket.length > 1 && diagnostics) {
      diagnostics.duplicatePhysicalFacts.push(identity);
    }
    bucket.sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.evidence.frameRole < b.evidence.frameRole ? -1 : 1;
    });
    const winner = bucket[0];
    if (winner) survivors.push(winner);
  }

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
