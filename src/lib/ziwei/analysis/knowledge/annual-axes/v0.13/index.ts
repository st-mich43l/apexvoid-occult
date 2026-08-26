import bridgeJson from "./static-domain-doctrine-bridge.nam-phai.v0.13.json";
import profileJson from "./profile.nam-phai.v0.13.json";
import sourceRegistryJson from "./source-registry.v0.13.json";

export const V13_ENGINE_VERSION = "0.13.0" as const;
export const V13_CONTRACT_VERSION = "0.13.0" as const;
export const V13_KNOWLEDGE_VERSION = "0.13.0" as const;
export const V13_FORMULA_VERSION =
  "v0.13-v12-static-plus-doctrine-fallback" as const;
export const V13_CANDIDATE_ID =
  "CANDIDATE-AAV13-DOCTRINE-AUGMENTED-STATIC" as const;

export type V13MagnitudeOrdinal = "weak" | "moderate" | "strong" | "unspecified";

export interface V13DoctrineClaim {
  claimId: string;
  star: string;
  palace: string;
  school: string;
  conditions: {
    brightness?: string[];
    branches?: string[];
    coStars?: string[];
    supportStars?: string[];
    pressureStars?: string[];
    transformations?: string[];
  };
  tendency: {
    support?: string;
    pressure?: string;
    stability?: string;
    activation?: string;
  };
  magnitudeOrdinal: V13MagnitudeOrdinal;
  sourceIds: string[];
  locator: string;
  locatorType: string;
  adjudication: string;
  numericDelta: null;
  safety?: string;
}

export interface AnnualAxesKnowledgeV13 {
  knowledgeVersion: typeof V13_KNOWLEDGE_VERSION;
  candidateId: typeof V13_CANDIDATE_ID;
  bridge: {
    claims: V13DoctrineClaim[];
  };
  profile: typeof profileJson;
  sourceRegistry: typeof sourceRegistryJson;
  ordinalPoints: Record<V13MagnitudeOrdinal, number | null>;
  referenceMass: number;
  epsilon: number;
}

let cached: AnnualAxesKnowledgeV13 | null = null;

export function loadAnnualAxesKnowledgeV13(): AnnualAxesKnowledgeV13 {
  if (cached) return cached;

  const policy = profileJson.doctrineBridge;
  const claims = bridgeJson.claims as unknown as V13DoctrineClaim[];

  for (const claim of claims) {
    if (claim.adjudication !== "VERIFIED_PRIMARY") {
      throw new Error(`V0.13 non-primary claim admitted: ${claim.claimId}`);
    }
    if (claim.locatorType !== "EXACT_SECTION") {
      throw new Error(`V0.13 claim lacks exact locator: ${claim.claimId}`);
    }
    if (claim.numericDelta !== null) {
      throw new Error(`V0.13 claim smuggles numericDelta: ${claim.claimId}`);
    }
    if (!policy.schoolPolicy.includes(claim.school as "classical-shared" | "nam-phai")) {
      throw new Error(`V0.13 rejected school claim: ${claim.claimId}`);
    }
  }

  cached = Object.freeze({
    knowledgeVersion: V13_KNOWLEDGE_VERSION,
    candidateId: V13_CANDIDATE_ID,
    bridge: { claims },
    profile: profileJson,
    sourceRegistry: sourceRegistryJson,
    ordinalPoints: policy.ordinalPoints as Record<V13MagnitudeOrdinal, number | null>,
    referenceMass: profileJson.staticSignal.referenceMass,
    epsilon: profileJson.staticSignal.epsilon,
  }) as AnnualAxesKnowledgeV13;

  return cached;
}
