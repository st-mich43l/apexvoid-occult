/** Shared knowledge record types for the Major Fortune Scoring V0.1 experimental pack. */

export type MajorFortuneDomainId =
  | "menh"
  | "huynh-de"
  | "phu-the"
  | "tu-tuc"
  | "tài-bach"
  | "tat-ach"
  | "thien-di"
  | "no-boc"
  | "quan-loc"
  | "diền-trach"
  | "phúc-duc"
  | "phu-mẫu";

export interface MajorFortuneAxisWeights {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

export interface MajorFortuneDomainDefinition {
  domainId: MajorFortuneDomainId;
  labelVi: string;
  majorPalaceName: string;
  frameWeight: number;
}

export interface MajorFortuneDomainDefinitionsCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  overall: {
    anchor: string;
    frameGeometry: {
      focusOffset: number;
      oppositeOffset: number;
      trineOffsets: number[];
      modulo: number;
    };
  };
  domains: MajorFortuneDomainDefinition[];
  capabilityRules: {
    overallRequires: string[];
    twelveDomainsRequire: string[];
    incompleteDomainMapBehavior: string;
    preFortuneBehavior: string;
  };
}

export interface MajorFortuneScoringBand {
  minInclusive: number;
  maxExclusive?: number;
  maxInclusive?: number;
  id: string;
  labelVi: string;
}

export interface MajorFortuneScoringProfile {
  schemaVersion: string;
  profileId: string;
  status: string;
  requiresCalibration: boolean;
  axes: string[];
  output: {
    scoreMin: number;
    scoreMax: number;
    scorePrecision: number;
    bands: MajorFortuneScoringBand[];
  };
  frameRoleWeights: {
    focus: number;
    opposite: number;
    trine: number;
  };
  evidenceLayerWeights: {
    "major-frame-star": number;
    "major-transformation": number;
    "structural-activation": number;
    interaction: number;
  };
  confidenceWeights: {
    approved: number;
    experimental: number;
  };
  diminishingReturns: {
    formula: string;
    rankBase: number;
    expression: string;
  };
  normalization: {
    supportScale: number;
    pressureScale: number;
    stabilityScale: number;
    activationScale: number;
    stabilityCoefficient: number;
    activationGateFloor: number;
    activationGateRange: number;
    scoreAmplitude: number;
    scoreDivisor: number;
    neutralScore: number;
  };
  formulaSpec: Record<string, string>;
  dedup: {
    identityFields: string[];
    duplicateAcrossFramesBehavior: string;
    semanticAnnotationsAreNumeric: boolean;
  };
  immutability: {
    inputChartMutationAllowed: boolean;
    knowledgeMutationAllowed: boolean;
    palaceOverviewMutationAllowed: boolean;
  };
}

export interface MajorFortuneStructuralActivationRecord {
  markerId: string;
  scope: "overall" | "domain" | "overall_and_domain";
  axes: MajorFortuneAxisWeights;
  ruleId: string;
  requirements?: string[];
}

export interface MajorFortuneStructuralActivationsCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  polarityRule: string;
  records: MajorFortuneStructuralActivationRecord[];
  voidPolicy: {
    tuanTrietMode: string;
    numericDelta: number | null;
    policyRef: string;
    reason: string;
  };
  vcdPolicy: {
    mode: string;
    doNotDuplicateBorrowedStars: boolean;
    coefficientSource: string;
    numericOverride: number | null;
  };
}

export interface MajorFortuneTransformationImpactRecord {
  mutagen: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  axes: MajorFortuneAxisWeights;
  stackingGroup: string;
  ruleId: string;
}

export interface MajorFortuneTransformationImpactCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  applicationMode: string;
  records: MajorFortuneTransformationImpactRecord[];
  notes: string[];
}

export interface MajorFortuneInteractionRuleRecord {
  ruleId: string;
  label: string;
  enabled: boolean;
  exactTargetRequired: boolean;
  candidateAxesDelta: MajorFortuneAxisWeights | null;
  sourceRefs: string[];
  notes: string;
  policyRefs?: string[];
}

export interface MajorFortuneInteractionRulesCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  defaultEnabled: boolean;
  records: MajorFortuneInteractionRuleRecord[];
}

export interface MajorFortuneSchoolCapabilityProfile {
  calculationProfileRef: string;
  supportsOverallFrame: boolean;
  supportsTwelveDomainOverlay: boolean;
  supportsMajorFortuneTransformations: boolean;
  transformationReason?: string;
  transformationRequirements?: string[];
  forbiddenInputs: string[];
}

export interface MajorFortuneSchoolCapabilitiesCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  profiles: {
    "nam-phai": MajorFortuneSchoolCapabilityProfile;
    "trung-chau": MajorFortuneSchoolCapabilityProfile;
  };
  mismatchBehavior: string;
}

export interface MajorFortunePeriodPhaseRecord {
  phaseId: string;
  yearInCycleMin: number;
  yearInCycleMax: number;
}

export interface MajorFortunePeriodPhaseCatalog {
  schemaVersion: string;
  catalogId: string;
  status: string;
  scoreEffectEnabled: boolean;
  phases: MajorFortunePeriodPhaseRecord[];
  outputBehavior: string;
  reason: string;
  futureCalibrationCandidates: Array<{ phaseId: string; activationFactorCandidate: number }>;
}

export interface MajorFortuneSourceClaim {
  claimId: string;
  description: string;
}

export interface MajorFortuneSourceRecord {
  sourceId: string;
  title: string;
  sourceType: string;
  location?: string;
  author?: string;
  edition?: string;
  url?: string;
  locatorNotes?: string;
  researchClaim?: string;
  publicationDate?: string;
  allowedUsage: string[];
  prohibitedUsage: string[];
  claims?: MajorFortuneSourceClaim[];
}

export interface MajorFortuneSourceRegistry {
  schemaVersion: string;
  registryId: string;
  status: string;
  sources: MajorFortuneSourceRecord[];
  researchQueue: Array<{
    researchId: string;
    priority: string;
    topic: string;
    question: string;
  }>;
}

export interface MajorFortuneCalibrationCase {
  fixtureId: string;
  label: string;
  rawAxes: MajorFortuneAxisWeights;
  expected: {
    score: number;
    intensity: number;
    conflict: number;
    normalized: MajorFortuneAxisWeights;
  };
}

export interface MajorFortuneBehavioralFixture {
  fixtureId: string;
  description: string;
  expected: Record<string, unknown>;
}

export interface MajorFortuneCalibrationFixtures {
  schemaVersion: string;
  fixtureSetId: string;
  status: string;
  formulaProfileId: string;
  cases: MajorFortuneCalibrationCase[];
  behavioralFixtures: MajorFortuneBehavioralFixture[];
}

export interface MajorFortuneScoringKnowledgeV0 {
  domainDefinitions: MajorFortuneDomainDefinitionsCatalog;
  scoringProfile: MajorFortuneScoringProfile;
  structuralActivations: MajorFortuneStructuralActivationsCatalog;
  transformationImpact: MajorFortuneTransformationImpactCatalog;
  interactionRules: MajorFortuneInteractionRulesCatalog;
  schoolCapabilities: MajorFortuneSchoolCapabilitiesCatalog;
  periodPhase: MajorFortunePeriodPhaseCatalog;
  sourceRegistry: MajorFortuneSourceRegistry;
  calibrationFixtures: MajorFortuneCalibrationFixtures;
}
