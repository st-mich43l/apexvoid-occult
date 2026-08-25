import registryJson from "./static-domain-registry.nam-phai.v0.12.json";
import profileJson from "./profile.nam-phai.v0.12.json";
import sourceRegistryJson from "./source-registry.v0.12.json";

export const V12_ENGINE_VERSION = "0.12.0" as const;
export const V12_CONTRACT_VERSION = "0.12.0" as const;
export const V12_KNOWLEDGE_VERSION = "0.12.0" as const;
export const V12_FORMULA_VERSION =
  "v0.12-static-direction-activation-role-compose+verified-primary-fallback" as const;
export const V12_CANDIDATE_ID =
  "CANDIDATE-AAV12-CALIBRATED-DOMAIN-SIGNALS" as const;
export const CONTROL_LAYERED_BALANCED = "CONTROL-LAYERED-BALANCED" as const;

export type V12ProfileId =
  | "CONTROL-LAYERED-BALANCED"
  | "YEAR-FOCUSED"
  | "MODERATE-YEAR";

export type V12ReferenceMass = 3 | 4 | 6 | 8;

export interface V12LayerWeights {
  natalFoundation: number;
  majorFortune: number;
  annualTrigger: number;
  resonance: number;
}

export interface AnnualAxesKnowledgeV12 {
  knowledgeVersion: typeof V12_KNOWLEDGE_VERSION;
  candidateId: typeof V12_CANDIDATE_ID;
  staticRegistry: typeof registryJson;
  profile: typeof profileJson;
  sourceRegistry: typeof sourceRegistryJson;
  epsilon: number;
  selectedReferenceMass: V12ReferenceMass;
  profiles: Record<V12ProfileId, V12LayerWeights>;
}

let cached: AnnualAxesKnowledgeV12 | null = null;

export function loadAnnualAxesKnowledgeV12(): AnnualAxesKnowledgeV12 {
  if (cached) return cached;
  const profile = profileJson as typeof profileJson & {
    staticSignal: { epsilon: number; selectedReferenceMass: number };
    profiles: Record<string, V12LayerWeights>;
  };
  cached = Object.freeze({
    knowledgeVersion: V12_KNOWLEDGE_VERSION,
    candidateId: V12_CANDIDATE_ID,
    staticRegistry: registryJson,
    profile: profileJson,
    sourceRegistry: sourceRegistryJson,
    epsilon: profile.staticSignal.epsilon,
    selectedReferenceMass: profile.staticSignal
      .selectedReferenceMass as V12ReferenceMass,
    profiles: profile.profiles as Record<V12ProfileId, V12LayerWeights>,
  }) as AnnualAxesKnowledgeV12;
  return cached;
}

export function getV12ProfileWeights(profileId: V12ProfileId): V12LayerWeights {
  const k = loadAnnualAxesKnowledgeV12();
  const w = k.profiles[profileId];
  if (!w) throw new Error(`unknown V0.12 profile ${profileId}`);
  return w;
}
