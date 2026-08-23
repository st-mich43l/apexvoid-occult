import profileJson from "./profile.json";
import domainProjectionJson from "./domain-projection.json";
import sourceRegistryJson from "./source-registry.json";
import type { AnnualAxisDomain } from "../../../contracts/annual-axes";

const V10_KNOWLEDGE_VERSION = "0.10.0" as const;
export const V10_CONTRACT_VERSION = "0.10.0-research" as const;
export const V10_ENGINE_VERSION = "0.10.0-layered" as const;
export const V10_FORMULA_VERSION = "v0.10-layered-fortune-compose" as const;
export const CONTROL_AAV08_2 = "CONTROL-AAV08-2" as const;

export type V10ProfileId = "layered-balanced" | "annual-heavy" | "structure-heavy";
export type V10ProjectionVariantId = "legacy" | "romance-expanded";
export type V10LayerApplicability = "natal" | "major-fortune" | "annual";

export interface V10LayerWeights {
  natalFoundation: number;
  majorFortune: number;
  annualTrigger: number;
  resonance: number;
}

interface V10ProfileDef {
  id: V10ProfileId;
  label: string;
  weights: V10LayerWeights;
}

export interface V10ResonanceConfig {
  foundationAnnualAlignment: number;
  decadeAnnualAlignment: number;
  tripleAlignmentBonus: number;
  oppositionRelief: number;
  temporarySetback: number;
  sameDirectionThreshold: number;
  maxMagnitude: number;
}

interface V10ProjectionAnchor {
  palace: string;
  weight: number;
  layerApplicability: V10LayerApplicability[];
  temporalOnly?: boolean;
}

export interface V10DomainProjection {
  anchors: V10ProjectionAnchor[];
}

export interface AnnualAxesKnowledgeV10 {
  knowledgeVersion: typeof V10_KNOWLEDGE_VERSION;
  controlId: typeof CONTROL_AAV08_2;
  candidateId: string;
  availabilityPolicy: {
    natalFoundation: "required";
    annualTrigger: "required";
    majorFortune: "optional-but-partial";
    resonance: "requires-source-layers";
  };
  coveragePolicy: {
    coverageAffectsScore: false;
    minResolvedWeightShareForAvailable: number;
    renormalizeResolvedStructuralAnchors: boolean;
  };
  natalConversion: {
    method: "directional-balance";
    epsilon: number;
    notes: string;
  };
  profiles: Record<V10ProfileId, V10ProfileDef>;
  resonance: V10ResonanceConfig;
  domainProjection: {
    legacy: Record<AnnualAxisDomain, V10DomainProjection>;
    "romance-expanded": Record<AnnualAxisDomain, V10DomainProjection>;
  };
  sourceRegistry: typeof sourceRegistryJson;
}

function cloneDomainMap(
  domains: Record<string, V10DomainProjection>,
): Record<AnnualAxisDomain, V10DomainProjection> {
  return JSON.parse(JSON.stringify(domains)) as Record<
    AnnualAxisDomain,
    V10DomainProjection
  >;
}

function buildKnowledge(): AnnualAxesKnowledgeV10 {
  const legacy = cloneDomainMap(
    (domainProjectionJson.variants.legacy.domains as Record<
      string,
      V10DomainProjection
    >),
  );
  const expanded = cloneDomainMap(legacy);
  const romanceOverride = domainProjectionJson.variants["romance-expanded"]
    .domains.romance as V10DomainProjection;
  expanded.romance = JSON.parse(JSON.stringify(romanceOverride));

  return {
    knowledgeVersion: V10_KNOWLEDGE_VERSION,
    controlId: CONTROL_AAV08_2,
    candidateId: profileJson.candidateId,
    availabilityPolicy: profileJson.availabilityPolicy as AnnualAxesKnowledgeV10["availabilityPolicy"],
    coveragePolicy: {
      coverageAffectsScore: false,
      minResolvedWeightShareForAvailable:
        profileJson.coveragePolicy.minResolvedWeightShareForAvailable,
      renormalizeResolvedStructuralAnchors:
        profileJson.coveragePolicy.renormalizeResolvedStructuralAnchors,
    },
    natalConversion: {
      method: "directional-balance",
      epsilon: profileJson.natalConversion.epsilon,
      notes: profileJson.natalConversion.notes,
    },
    profiles: profileJson.profiles as Record<V10ProfileId, V10ProfileDef>,
    resonance: profileJson.resonance as V10ResonanceConfig,
    domainProjection: {
      legacy,
      "romance-expanded": expanded,
    },
    sourceRegistry: sourceRegistryJson,
  };
}

let cached: AnnualAxesKnowledgeV10 | null = null;

export function loadAnnualAxesKnowledgeV10(): AnnualAxesKnowledgeV10 {
  if (!cached) cached = Object.freeze(buildKnowledge()) as AnnualAxesKnowledgeV10;
  return cached;
}

export function resolveProjectionVariant(
  knowledge: AnnualAxesKnowledgeV10,
  variant: V10ProjectionVariantId,
): Record<AnnualAxisDomain, V10DomainProjection> {
  return knowledge.domainProjection[variant];
}
