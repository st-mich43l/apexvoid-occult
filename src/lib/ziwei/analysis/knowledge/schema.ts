/** Shared knowledge record metadata for Zi Wei analysis modules. */

export type KnowledgeStatus =
  | "draft"
  | "experimental"
  | "approved"
  | "deprecated";

export type SchoolProfileId = "nam-phai-v1" | "trung-chau-v1";

export interface KnowledgeRecordMeta {
  id: string;
  version: string;
  status: KnowledgeStatus;
  schoolProfiles: SchoolProfileId[];
  sourceIds: string[];
  confidence: number;
  effectiveFrom: string;
  notes?: string;
}

export interface AxisSeed {
  support: number;
  pressure: number;
  stability: number;
  activation: number;
}

interface BrightnessModifier {
  supportFactor: number;
  pressureFactor: number;
  stabilityDelta: number;
  activationFactor: number;
}

export interface PalaceOverviewProfile extends KnowledgeRecordMeta {
  geometry: {
    focus: number;
    opposite: number;
    trine: number;
  };
  familyDiminishingReturns: number[];
  familyMaxContributors: number;
  qualityNormalization: {
    method: "logistic";
    scale: number;
    midpoint: number;
  };
  axisNormalization: {
    supportScale: number;
    pressureScale: number;
    activationScale: number;
    stabilityScale: number;
  };
  intensityNormalization: {
    scale: number;
  };
  bandThresholds: {
    lowMaxInclusive: number;
    guardedMaxExclusive: number;
    balancedMaxExclusive: number;
    supportiveMaxExclusive: number;
  };
  featureFlag: string;
  /** Must match voidEnvironment.voidMajorBorrowFactor (SSOT is void-environment.json). */
  voidMajorBorrowFactor: number;
}

interface MajorStarRecord {
  name: string;
  axes: AxisSeed;
  traits: string[];
}

interface MajorStarsCatalog extends KnowledgeRecordMeta {
  brightnessModifiers: Record<string, BrightnessModifier>;
  stars: MajorStarRecord[];
}

interface TransformationRecord {
  transformation: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  axes: AxisSeed;
}

interface TransformationsCatalog extends KnowledgeRecordMeta {
  transformations: TransformationRecord[];
}

export interface MinorFamilyRecord {
  id: string;
  label: string;
  axes: AxisSeed;
  diminishingGroup: string;
  notes?: string;
}

interface MinorStarFamiliesCatalog extends KnowledgeRecordMeta {
  families: MinorFamilyRecord[];
}

export type MinorStarScoringMode = "direct" | "context-only";

export type MinorBrightnessPolicy =
  | "none"
  | "hoa-linh"
  | "literary-if-present";

export interface MinorStarRecord {
  id: string;
  version: string;
  status: KnowledgeStatus;

  name: string;
  canonicalName: string;
  familyId: string;
  scoringMode: MinorStarScoringMode;

  schoolProfiles: SchoolProfileId[];
  sourceIds: string[];
  confidence: number;
  effectiveFrom: string;

  brightnessPolicy: MinorBrightnessPolicy;
  traitTags: string[];
  explanationKey: string;

  axesOverride?: AxisSeed;
  notes?: string;
}

interface MinorStarsCatalog extends KnowledgeRecordMeta {
  stars: MinorStarRecord[];
}

interface StarAliasRecord {
  alias: string;
  canonical: string;
}

interface StarAliasesCatalog extends KnowledgeRecordMeta {
  aliases: StarAliasRecord[];
}

export interface MinorStateModifierPolicy {
  supportFactor: number;
  pressureFactor: number;
  stabilityDelta: number;
  activationFactor: number;
}

interface MinorStateModifiersCatalog extends KnowledgeRecordMeta {
  policies: {
    none: { description: string };
    "hoa-linh": Record<string, MinorStateModifierPolicy>;
    "literary-if-present": Record<string, MinorStateModifierPolicy>;
  };
}

interface SchoolStarCoverageCatalog extends KnowledgeRecordMeta {
  staticMinorStars: {
    shared: string[];
    trungChauOnly: string[];
    namPhaiOnly: string[];
  };
  excludedFromStaticScoring: {
    transformMarkers: string[];
    voidMarkers: string[];
    annualExamples: string[];
    changShengSeparate: string[];
  };
  specialCases: Array<{ name: string; policy: string; reason: string }>;
}

interface VoidEnvironmentCatalog extends KnowledgeRecordMeta {
  voidMajorBorrowFactor: number;
  voidContext: AxisSeed;
  doubleVoidContext: AxisSeed;
  singleVoid: {
    localMajorMagnitudeFactor: number;
    localTransformationMagnitudeFactor: number;
    localMinorMagnitudeFactor: number;
    activationFactor: number;
    stabilityDelta: number;
  };
  doubleVoid: {
    localMajorMagnitudeFactor: number;
    localTransformationMagnitudeFactor: number;
    localMinorMagnitudeFactor: number;
    activationFactor: number;
    stabilityDelta: number;
  };
}

interface ChangShengRecord {
  stage: string;
  axes: AxisSeed;
}

interface ChangShengCatalog extends KnowledgeRecordMeta {
  stages: ChangShengRecord[];
}

export interface StructuralRuleRecord {
  id: string;
  label: string;
  participants: string[];
  baseAxes: AxisSeed;
  conditions: Record<string, unknown>;
}

interface StructuralRulesCatalog extends KnowledgeRecordMeta {
  rules: StructuralRuleRecord[];
}

interface SourceRecord extends KnowledgeRecordMeta {
  title: string;
  kind: "heuristic-seed" | "calculation-core" | "spec";
}

interface SourcesCatalog {
  sources: SourceRecord[];
}

export interface PalaceOverviewKnowledgeV1 {
  profile: PalaceOverviewProfile;
  majorStars: MajorStarsCatalog;
  transformations: TransformationsCatalog;
  minorFamilies: MinorStarFamiliesCatalog;
  minorStars: MinorStarsCatalog;
  minorStateModifiers: MinorStateModifiersCatalog;
  starAliases: StarAliasesCatalog;
  schoolCoverage: SchoolStarCoverageCatalog;
  voidEnvironment: VoidEnvironmentCatalog;
  changSheng: ChangShengCatalog;
  structuralRules: StructuralRulesCatalog;
  sources: SourcesCatalog;
}

/* ────────────────────────────────────────────────────────────────────────
 * V1.2 Semantic Completion — annotation-only knowledge.
 * Fully separate from PalaceOverviewKnowledgeV1 (numeric): a broken
 * semantic catalog must never affect V1.1 scoring or its loadable status.
 * Every record here carries scoreMode:"annotation-only" and must never
 * define axes, multipliers, bonuses, or penalties.
 * ──────────────────────────────────────────────────────────────────────── */

export type PalaceAnnotationScope =
  | "same-palace"
  | "opposite-link"
  | "trine-link"
  | "tp4c";

interface MenhThanContextRule {
  id: string;
  label: string;
  condition: Record<string, boolean>;
  tags: string[];
  explanationKey: string;
  scoreMode: "annotation-only";
}

interface MenhThanContextCatalog extends KnowledgeRecordMeta {
  rules: MenhThanContextRule[];
}

export interface MinorStructuralPairRule {
  id: string;
  label: string;
  participants: string[];
  match: {
    mode: "all";
    allowedScopes: PalaceAnnotationScope[];
  };
  tags: string[];
  explanationKey: string;
  scoreMode: "annotation-only";
}

interface MinorStructuralPairsCatalog extends KnowledgeRecordMeta {
  scopePriority: PalaceAnnotationScope[];
  rules: MinorStructuralPairRule[];
}

interface TransformationTargetSemanticRule {
  id: string;
  transformation: "Lộc" | "Quyền" | "Khoa" | "Kỵ";
  targetTraitsAny: string[];
  tags: string[];
  explanationKey: string;
  scoreMode: "annotation-only";
}

interface TransformationTargetSemanticsCatalog
  extends KnowledgeRecordMeta {
  rules: TransformationTargetSemanticRule[];
}

interface TraitPalaceProjectionCatalog extends KnowledgeRecordMeta {
  composition: {
    fallbackTemplate: string;
    scoreMode: "annotation-only";
  };
  palaces: Record<string, { domainId: string; label: string }>;
  traits: Array<{ trait: string; label: string }>;
  overrides: Array<{
    id: string;
    trait: string;
    palace: string;
    label: string;
  }>;
}

interface VersionManifest {
  id: string;
  version: string;
  status: KnowledgeStatus;
  schoolProfiles: SchoolProfileId[];
  effectiveFrom: string;
  module: string;
  contractVersion: string;
  engineVersion: string;
  knowledgeVersion: string;
  scoringKnowledgeVersion?: string;
  semanticKnowledgeVersion?: string;
  calibrationVersion?: string | null;
  scoringInfrastructureVersion?: string;
  releaseStage?: "experimental" | "calibration" | "shadow" | "production";
  notes?: string;
}

type SemanticCitationStatus =
  | "needs-source-review"
  | "internal"
  | "approved";

interface SemanticSourceRecord extends KnowledgeRecordMeta {
  title: string;
  kind: "expert-synthesis" | "engineering-policy";
  citationStatus: SemanticCitationStatus;
}

interface SemanticSourcesCatalog {
  sources: SemanticSourceRecord[];
}

interface SourceMappingEntry {
  dataFile: string;
  semanticSourceIds: string[];
  numericSourceIds: string[];
}

interface SourceMappingCatalog {
  id: string;
  version: string;
  status: KnowledgeStatus;
  schoolProfiles: SchoolProfileId[];
  effectiveFrom: string;
  notes?: string;
  mappings: SourceMappingEntry[];
}

export interface PalaceOverviewSemanticKnowledgeV1 {
  versionManifest: VersionManifest;
  menhThanContext: MenhThanContextCatalog;
  minorStructuralPairs: MinorStructuralPairsCatalog;
  transformationTargetSemantics: TransformationTargetSemanticsCatalog;
  traitPalaceProjection: TraitPalaceProjectionCatalog;
  semanticSources: SemanticSourcesCatalog;
  sourceMapping: SourceMappingCatalog;
}
