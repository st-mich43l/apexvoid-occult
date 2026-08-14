export type GeometryProfileId = "baseline-relative" | "reviewer-hypothesis";

export interface CandidateVoidReliefPolicy {
  enabled: boolean;
  trigger: { minLocalPressureDominance: number };
  maxRelief: number;
  extraPressureAttenuation: number;
}

export interface CandidateVoidBandPolicy {
  supportAttenuation: number;
  pressureAttenuation: number;
  activationFactor: number;
  stabilityDelta: number;
  pressureRelief: CandidateVoidReliefPolicy;
}

export interface InteractionCandidateProfile {
  id: string;
  status: "experimental-uncalibrated";
  labels: string[];
  decision: "RESEARCH_CANDIDATE";
  brightnessDominance: {
    enabled: boolean;
    hypothesisId: string;
    rationale: string;
    sourceStatus: string;
    supportCap: number;
    pressureCap: number;
    method: "tanh";
  };
  voidInteraction: {
    hypothesisId: string;
    rationale: string;
    sourceStatus: string;
    singleVoid: CandidateVoidBandPolicy;
    doubleVoid: CandidateVoidBandPolicy;
  };
  geometry: {
    hypothesisId: string;
    rationale: string;
    sourceStatus: string;
    defaultProfile: GeometryProfileId;
    profiles: Record<GeometryProfileId, { focus: number; opposite: number; trine: number }>;
  };
  vcdContext: {
    hypothesisId: string;
    rationale: string;
    sourceStatus: string;
    trungChauEnabled: boolean;
    namPhaiEnabled: boolean;
    borrowTransformationsOnBorrowedMajors: boolean;
    borrowMinorFamilies: boolean;
    contextMagnitudeFactor: number;
  };
  structuralInteractions: {
    hypothesisId: string;
    rationale: string;
    sourceStatus: string;
    enableExperimentalDelta: boolean;
    hamVoidExtraPressure: number;
    hamVoidExtraStability: number;
  };
}

export interface BrightnessSaturationHit {
  brightnessSaturationApplied: boolean;
  originalContribution: { support: number; pressure: number };
  boundedContribution: { support: number; pressure: number };
  star: string;
  palace: string;
  axis: "support" | "pressure" | "both";
}

export interface VoidInteractionHit {
  voidInteractionMode: "none" | "single" | "double";
  supportBefore: number;
  supportAfter: number;
  pressureBefore: number;
  pressureAfter: number;
  reliefApplied: boolean;
  reliefReason: string;
}

export interface VcdContextHit {
  added: boolean;
  factIds: string[];
  school: string;
}

export interface FormationAudit {
  ruleId: string;
  label: string;
  participants: string[];
  brightness: Array<string | null>;
  transformations: string[];
  voidMarkers: string[];
}

export interface CandidateDiagnostics {
  brightnessHits: BrightnessSaturationHit[];
  voidHit: VoidInteractionHit;
  vcdContext: VcdContextHit;
  formationAudits: FormationAudit[];
  geometryProfile: GeometryProfileId;
  triggeredHypotheses: string[];
}
