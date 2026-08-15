import type { CandidateVoidBandPolicy } from "../types";

interface V2Geometry {
  focus: number;
  opposite: number;
  trine: number;
}

export interface V2RescueConfig {
  enabled: boolean;
  hypothesisId: string;
  sourceStatus: string;
  pressureDominanceTrigger: number;
  transformWeight: number;
  beneficMinorWeight: number;
  formationWeight: number;
  strengthCap: number;
  needScale: number;
  hamNeedFloor: number;
  maxSupportBoost: number;
  maxPressureRelief: number;
  maxStabilityBoost: number;
}

export interface V2StrongProfile {
  id: string;
  status: string;
  geometry: V2Geometry;
  brightness: { supportCap: number; pressureCap: number; method: string };
  rescue: V2RescueConfig;
  void: {
    sourceStatus: string;
    singleVoid: CandidateVoidBandPolicy;
    doubleVoid: CandidateVoidBandPolicy;
  };
  formation: {
    interactionScale: number;
    maxSupportContribution: number;
    maxPressureContribution: number;
    maxStabilityMagnitude: number;
    maxActivationMagnitude: number;
    voidOnPressureFormationExtraRelief: number;
    voidOnPositiveFormationSupportAttenuation: number;
  };
  vcd: {
    trungChauEnabled: boolean;
    namPhaiEnabled: boolean;
    namPhaiExploratory: boolean;
    transformFactor: number;
    minorFamilyFactor: number;
    maxBeneficContributors: number;
    maxPressureContributors: number;
    maxAxisMagnitude: number;
  };
  budget: {
    rescueSupport: number;
    rescuePressureRelief: number;
    voidExtraPressureRelief: number;
    formationAxisMagnitude: number;
    vcdAxisMagnitude: number;
  };
}

export interface InteractionCandidateV2Pack {
  id: string;
  status: string;
  labels: string[];
  notes: string;
  processingOrder: string[];
  processingOrderRationale: string;
  beneficMinorFamilyIds: string[];
  pressureMinorFamilyIds: string[];
  profiles: {
    moderate: { id: string; reproduces: string; geometry: V2Geometry };
    strong: V2StrongProfile;
  };
  materiality: {
    tooWeakMeanAbsDelta: number;
    unstableMeanAbsDelta: number;
    unstableLargeMoveShare: number;
    unstableLargeMovePoints: number;
  };
}

export type AblationId =
  | "full"
  | "no-geometry"
  | "no-rescue"
  | "no-void-relief"
  | "no-formation-amplification"
  | "no-vcd-context";

export interface RescueHit {
  fired: boolean;
  reason: string;
  strength: number;
  need: number;
  supportBoost: number;
  pressureRelief: number;
  stabilityBoost: number;
}

export interface StrongDiagnostics {
  ablation: AblationId;
  rescue: RescueHit;
  voidTypes: string[];
  formationScaled: boolean;
  vcdAdded: number;
  formationRuleCount: number;
  triggeredHypotheses: string[];
  budget: {
    rescueSupport: number;
    rescuePressureRelief: number;
    voidExtraPressureRelief: number;
    formationAxisMagnitude: number;
    vcdAxisMagnitude: number;
  };
}
