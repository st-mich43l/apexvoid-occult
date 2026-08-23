import type { V10LayerWeights, V10ProfileId } from "../../../knowledge/annual-axes/v0.10";
import { loadAnnualAxesKnowledgeV10 } from "../../../knowledge/annual-axes/v0.10";

export const V10_PROFILE_IDS: readonly V10ProfileId[] = [
  "layered-balanced",
  "annual-heavy",
  "structure-heavy",
] as const;

export function getProfileWeights(profileId: V10ProfileId): V10LayerWeights {
  const knowledge = loadAnnualAxesKnowledgeV10();
  return knowledge.profiles[profileId].weights;
}

export function assertProfileWeightsSumToOne(weights: V10LayerWeights): void {
  const sum =
    weights.natalFoundation +
    weights.majorFortune +
    weights.annualTrigger +
    weights.resonance;
  if (Math.abs(sum - 1) > 1e-9) {
    throw new Error(`profile weights must sum to 1, got ${sum}`);
  }
}

export function listProfiles(): Array<{ id: V10ProfileId; label: string; weights: V10LayerWeights }> {
  const knowledge = loadAnnualAxesKnowledgeV10();
  return V10_PROFILE_IDS.map((id) => ({
    id,
    label: knowledge.profiles[id].label,
    weights: knowledge.profiles[id].weights,
  }));
}
