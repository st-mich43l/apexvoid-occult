/**
 * Type surface for Annual Axes V0.4 (annual-delta) Nam Phái knowledge.
 */

import type { AnnualAxisDomainId } from "../schema";
import type {
  AnnualAxisDefinitionsCatalogV03NamPhai,
  AnnualHeadPolicyCatalogV03,
} from "../v0.3/schema";

export type AnnualAxisDomain = AnnualAxisDomainId;
export type AnnualAxisHeadRole = "focus" | "opposite" | "trine" | "outside";
export type AnnualChannelId =
  | "globalAnnualClimate"
  | "routedHeadImpact"
  | "directDomainImpact"
  | "majorFortuneBackground";

export type AnnualHeadPolicyCatalogV04 = AnnualHeadPolicyCatalogV03;
export type AnnualAxisDefinitionsCatalogV04NamPhai = AnnualAxisDefinitionsCatalogV03NamPhai;

export interface AnnualChannelProfileV04 {
  schemaVersion: string;
  profileId: string;
  status: string;
  requiresCalibration: boolean;
  channelWeights: {
    globalAnnualClimate: number;
    routedHeadImpact: number;
    directDomainImpact: number;
    majorFortuneBackground: number;
  };
  routing: {
    headFrameRoleWeights: Record<AnnualAxisHeadRole, number>;
    exponent: number;
    min: number;
    max: number;
    floor: number;
  };
  pathCombination: {
    policy: string;
    restDiscount: number;
    maxPathsCounted: number;
  };
  globalEligibility: {
    annualMovingStarMarkerIds: string[];
    notes?: string;
  };
}

export interface AnnualDeltaProfileV04 {
  schemaVersion: string;
  profileId: string;
  status: string;
  requiresCalibration: boolean;
  neutralScore: number;
  scoreMin: number;
  scoreMax: number;
  scorePrecision: number;
  supportScale: number;
  pressureScale: number;
  activationScale: number;
  activationGateFloor: number;
  activationGateRange: number;
  scoreAmplitude: number;
  scoreDivisor: number;
  natalResponse: {
    responseFloor: number;
    responseRange: number;
    resilienceDampingFloor: number;
    resilienceDampingRange: number;
  };
  bands: Array<{
    minInclusive: number;
    maxExclusive?: number;
    maxInclusive?: number;
    id: string;
    labelVi: string;
  }>;
  confidenceWeights: {
    approved: number;
    experimental: number;
  };
  diminishingReturns: {
    expression: string;
    rankWithin: string[];
  };
  formulaSpec: Record<string, string>;
}

export interface AnnualTriggerPolicyV04 {
  schemaVersion: string;
  catalogId: string;
  status: string;
  requiresCalibration: boolean;
  enabledTriggers: Array<{
    triggerId: string;
    description: string;
    enabled: boolean;
  }>;
  natalWithoutTrigger: {
    numericSupportPressure: number;
    mayAffectSensitivityOnly: boolean;
  };
}

export type AnnualAffinitySubject =
  | { kind: "star"; canonicalStarName: string }
  | { kind: "star-family"; familyId: string }
  | { kind: "transformation"; transformation: "Lộc" | "Quyền" | "Khoa" | "Kỵ" }
  | { kind: "moving-marker"; markerId: string };

export interface AnnualDomainAffinityRecordV04 {
  id: string;
  subject: AnnualAffinitySubject;
  affinities: Record<AnnualAxisDomain, number>;
  sourceIds: string[];
  knowledgeStatus: "approved" | "experimental";
}

export interface AnnualDomainAffinityCatalogV04 {
  schemaVersion: string;
  catalogId: string;
  status: string;
  requiresCalibration: boolean;
  categoryDefaults: {
    star: Record<AnnualAxisDomain, number>;
    mutagen: Record<AnnualAxisDomain, number>;
  };
  records: AnnualDomainAffinityRecordV04[];
}

export interface AnnualDistributionGatesV04 {
  schemaVersion: string;
  catalogId: string;
  status: string;
  requiresCalibration: boolean;
  hardGates: {
    allSixAbove60RateMax: number;
    exactDuplicateVectorRateMax: number;
    nearDuplicateVectorRateMax: number;
    meanIntraYearAxisStandardDeviationMin: number;
    medianIntraYearAxisRangeMin: number;
    medianPerDomainTwelveYearRangeMin: number;
    medianAdjacentYearAbsoluteDeltaMin: number;
    annualHeadMoveSensitivityRateMin: number;
    absoluteInterAxisCorrelationMax: number;
    unavailableRateMax: number;
  };
  notes?: string;
}

export interface AnnualSourceRegistryV04 {
  schemaVersion: string;
  registryId: string;
  status: string;
  sources: Array<{
    sourceId: string;
    title: string;
    sourceType: string;
    location?: string;
    allowedUsage: string[];
    prohibitedUsage: string[];
  }>;
  claims: Array<{
    claimId: string;
    sourceId: string;
    summary: string;
    confidence: string;
  }>;
}

export interface AnnualDynamicResolutionGuardV04 {
  schemaVersion: string;
  catalogId: string;
  [key: string]: unknown;
}

export interface AnnualAxesKnowledgeV04NamPhai {
  headPolicy: AnnualHeadPolicyCatalogV04;
  axisDefinitions: AnnualAxisDefinitionsCatalogV04NamPhai;
  channelProfile: AnnualChannelProfileV04;
  deltaProfile: AnnualDeltaProfileV04;
  triggerPolicy: AnnualTriggerPolicyV04;
  domainAffinity: AnnualDomainAffinityCatalogV04;
  distributionGates: AnnualDistributionGatesV04;
  sourceRegistry: AnnualSourceRegistryV04;
  dynamicResolutionGuard: AnnualDynamicResolutionGuardV04;
}
