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
  supportDelta: number;
  pressureDelta: number;
}

export interface PalaceOverviewProfile extends KnowledgeRecordMeta {
  geometry: {
    focus: number;
    opposite: number;
    trine: number;
  };
  familyDiminishingReturns: number[];
  /** 同宫: sao chủ = 1; sao kèm không cộng thêm một Miếu nữa. Cần thầy duyệt. */
  focusMajorDiminishing: number[];
  familyMaxContributors: number;
  qualityNormalization: {
    method: "logistic" | "cat-share" | "linear-net";
    /** For linear-net / mieu-unit: |net| that maps to 0 or 100. Must equal one Miếu tọa. */
    scale: number;
    midpoint: number;
    /** Unused by linear-net / cat-share. Kept for research logistic. */
    offset: number;
    ceiling: number;
    floor: number;
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
  /**
   * Nam Phái xung chiếu (KB cung_vi_va_tam_hop): đối cung is 矛盾 / nhân-quả,
   * not a second copy of tam hợp. Factors multiply the unweighted opposite net.
   */
  xungChieu: {
    phaCachFactor: number;
    cuuGiaiFactor: number;
    bothCatFactor: number;
    bothHungFactor: number;
  };
  brightnessQuality: Record<string, number>;
  tuHoaQuality: {
    Lộc: number;
    Quyền: number;
    Khoa: number;
    Kỵ: number;
    /**
     * Natal Hóa Kỵ on Thìn/Tuất/Sửu/Mùi (tứ mộ / 入庫忌).
     * VN 三合: Kỵ đắc địa tứ mộ. East: 生年忌入墓 reduces 凶.
     * Not the same as KB phản vi (Hãm + Tuần/Triệt). Cần thầy duyệt.
     */
    kyInTuMo: number;
  };
  /** 辰戌丑未 */
  tuMoBranches: string[];
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

type TuHoaKind = "Lộc" | "Quyền" | "Khoa" | "Kỵ";

interface TransformationMatrixCell {
  id: string;
  star: string;
  transformation: TuHoaKind;
  supportDelta: number;
  pressureDelta: number;
  stabilityDelta: number;
  activationDelta: number;
  brightnessOverride: string | null;
  usesFallback: boolean;
  label: string;
  semantics: string;
  sourceIds: string[];
  numericProvenance: string;
}

interface TransformationMatrixCatalog extends KnowledgeRecordMeta {
  fallback: Record<
    TuHoaKind,
    {
      supportDelta: number;
      pressureDelta: number;
      stabilityDelta: number;
      activationDelta: number;
    }
  >;
  cells: TransformationMatrixCell[];
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
    localStructuralMagnitudeFactor: number;
    activationFactor: number;
    stabilityDelta: number;
  };
  doubleVoid: {
    localMajorMagnitudeFactor: number;
    localTransformationMagnitudeFactor: number;
    localMinorMagnitudeFactor: number;
    localStructuralMagnitudeFactor: number;
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

type StarSystemKind =
  | "major"
  | "minor"
  | "transform"
  | "void"
  | "chang-sheng";

type StarSystemScoring =
  | "numeric"
  | "via-structural-rule"
  | "via-tu-hoa-seat"
  | "discovery-only";

type StarSystemMatch =
  | { mode: "all" }
  | { mode: "require-and-any"; require: string[]; anyOf: string[] }
  | { mode: "ham-plus-any"; anyOf: string[] };

interface StarSystemRosterEntry {
  kind: StarSystemKind;
  canonicalName: string;
  school: "shared" | "trung-chau-only";
  cycles: Array<"thai-tue" | "bac-si">;
  bo?: string;
  familyId?: string;
  scoringMode?: string;
}

interface StarSystemCombination {
  id: string;
  label: string;
  scoring: StarSystemScoring;
  participants: string[];
  match: StarSystemMatch;
  support: number;
  pressure: number;
  source: string;
  structuralRuleId?: string;
  invertWhenAnyTuMo?: string[];
  requiresTuMo?: string[];
  hungIfBrightness?: { star: string; levels: string[] };
}

interface NamPhaiStarSystemsCatalog extends KnowledgeRecordMeta {
  cycles: {
    thaiTue: string[];
    bacSi: string[];
    changSheng: string[];
  };
  thaiTueTamHop: Array<{
    id: string;
    stars: string[];
    support: number;
    pressure: number;
  }>;
  locTonCycle: {
    focus: number;
    trine: number;
    opposite: number;
    haoPressure: number;
    khongKiepPressure: number;
  };
  roster: StarSystemRosterEntry[];
  combinations: StarSystemCombination[];
}

interface SourceRecord extends KnowledgeRecordMeta {
  title: string;
  kind: "heuristic-seed" | "calculation-core" | "spec";
}

interface SourcesCatalog {
  sources: SourceRecord[];
}

type FormulaLayerId =
  | "major-brightness-tu-hoa"
  | "geometry-tp4c"
  | "structural-formations"
  | "minor-family"
  | "combinations"
  | "thai-tue-loc-ton-void"
  | "palace-role";

interface ApexvoidFormulaLayer {
  id: FormulaLayerId;
  enabled: boolean;
  source: string;
  giapCung?: boolean;
  skipTrungChauOnly?: boolean;
  skipCanonicalNames?: string[];
  /**
   * Convert this layer into Miếu-tọa units before summing.
   * Chính tinh (thể) = 1. Phụ / cách / tổ hợp (dụng) < 1. Cần thầy duyệt.
   */
  gain?: number;
}

interface ApexvoidFormulaDisplay {
  /**
   * Per-palace: 50 + 50 × tanh(net / tanhScale). Independent of other cung.
   * tanhScale = mieuRef × √2 (RMS of two Miếu units). Not a free /8, not z-score.
   */
  method: "absolute-tanh";
  mieuRef: number;
  tanhScale: number;
  /** |用| cannot exceed this many Miếu units. 体 leads natal radar. Cần thầy duyệt. */
  yongCapMieu: number;
}

interface ApexvoidFormulaCatalog extends KnowledgeRecordMeta {
  display: ApexvoidFormulaDisplay;
  layers: ApexvoidFormulaLayer[];
}

interface GapMatrixEntry {
  kind: "star" | "formation" | "combination" | "geometry" | "palace-role";
  id: string;
  starKind?: string;
  axes: string[];
  brightnessGate: string;
  polarity: "cát" | "hung" | "phản-vi" | "palace-role-only" | "unscored";
  partners: string[];
  source: { kind: "kb" | "external" | "missing"; path: string | null; note: string };
  scoringToday:
    | "none"
    | "brightness"
    | "combo-id"
    | "via-structural-rule"
    | "via-tu-hoa-seat"
    | "discovery-only";
  scoringComboIds: string[];
  proposedLayer: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "hold-for-teacher";
}

interface GapMatrixCatalog extends KnowledgeRecordMeta {
  scope: string;
  excluded: string[];
  layers: Record<string, string>;
  holdForTeacher: string[];
  entries: GapMatrixEntry[];
}

export interface PalaceOverviewKnowledgeV1 {
  profile: PalaceOverviewProfile;
  majorStars: MajorStarsCatalog;
  transformations: TransformationsCatalog;
  transformationMatrix: TransformationMatrixCatalog;
  minorFamilies: MinorStarFamiliesCatalog;
  minorStars: MinorStarsCatalog;
  minorStateModifiers: MinorStateModifiersCatalog;
  starAliases: StarAliasesCatalog;
  schoolCoverage: SchoolStarCoverageCatalog;
  voidEnvironment: VoidEnvironmentCatalog;
  changSheng: ChangShengCatalog;
  structuralRules: StructuralRulesCatalog;
  starSystems: NamPhaiStarSystemsCatalog;
  formula: ApexvoidFormulaCatalog;
  gapMatrix: GapMatrixCatalog;
  palaceBranchDignity: PalaceBranchDignityCatalog;
  sources: SourcesCatalog;
}

interface PalaceBranchDignityEntry {
  palace: string;
  branch: string;
  label: "Miếu" | "Vượng" | "Đắc" | "Bình" | "Hãm";
}

interface PalaceBranchDignityCatalog extends KnowledgeRecordMeta {
  entries: PalaceBranchDignityEntry[];
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
