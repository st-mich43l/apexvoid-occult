/**
 * Major Fortune V0.4.2 Report Types.
 *
 * All report types used across the audit pipeline.
 */

// ─── Corpus Identity ───────────────────────────────────────────────────────

export interface CorpusIdentityRecord {
  schemaVersion: "0.4.2";
  corpusId: string;
  seed: number;
  sourceCorpusVersion: string;
  baseSha: string;
  chartCount: number;
  observationCount: number;
  schoolCounts: Record<string, number>;
  cycleCount: number;
  stemCounts: Record<string, number>;
  inputSchemaVersion: string;
  formulaHash: string;
  contractHash: string;
  knowledgeHash: string;
  adapterPolicyHash: string;
  calculationCoreHash: string;
}

// ─── Baseline Manifest ─────────────────────────────────────────────────────

export interface BaselineManifest {
  schemaVersion: "0.4.2";
  corpusId: string;
  sourceBaseSha: string;
  generatedByScript: string;
  observationCount: number;
  schoolCounts: Record<string, number>;
  baselineFiles: Array<{
    path: string;
    sha256: string;
    observationCount: number;
  }>;
  formulaHash: string;
  contractHash: string;
  knowledgeHash: string;
  adapterPolicyHash: string;
}

// ─── Equivalence Report ────────────────────────────────────────────────────

export type DifferenceClassification =
  | "allowed-metadata"
  | "unexpected-scoring"
  | "unexpected-evidence"
  | "unexpected-coverage"
  | "unexpected-cycle";

export interface ObservationDifference {
  observationId: string;
  path: string;
  baselineValue: unknown;
  currentValue: unknown;
  classification: DifferenceClassification;
}

export interface EquivalenceReport {
  schemaVersion: "0.4.2";
  baselineMode: string;
  currentMode: string;
  comparedObservationCount: number;
  matchingObservationCount: number;
  missingBaselineIds: string[];
  missingCurrentIds: string[];
  differences: ObservationDifference[];
  unexpectedDifferenceCount: number;
  passed: boolean;
}

// ─── Coverage Report ───────────────────────────────────────────────────────

export interface EnabledCoverageReport {
  schemaVersion: "0.4.2";
  mode: string;
  totalObservations: number;
  availableObservations: number;
  partialObservations: number;
  unavailableObservations: number;
  meanContextCoverage: number;
  meanScoringCoverage: number;
  minScoringCoverage: number;
  maxScoringCoverage: number;
  directActivationObservations: number;
  directActivationRate: number;
  directActivationCount: number;
  outOfFrameTupleCount: number;
  incompleteTupleCount: number;
  missingFortuneStemCount: number;
  incompleteReasons: Record<string, number>;
}

// ─── Distribution Report ───────────────────────────────────────────────────

export interface ScoreDistributionStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  p05: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  bandCounts: Record<string, number>;
  scoreStateCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  baseScoreCount: number;
  baseScoreRate: number;
  clampToZeroCount: number;
  clampToZeroRate: number;
  clampTo100Count: number;
  clampTo100Rate: number;
  pillarLevelDistributions: Record<string, Record<string, number>>;
}

export interface ScoreDistributionReport {
  schemaVersion: "0.4.2";
  stats: Record<string, ScoreDistributionStats>;
}

// ─── Band Migration Report ─────────────────────────────────────────────────

export interface BandMigrationReport {
  schemaVersion: "0.4.2";
  comparedObservationCount: number;
  unchangedObservationCount: number;
  positiveMovementCount: number;
  negativeMovementCount: number;
  oneBandMovementCount: number;
  multiBandMovementCount: number;
  migrationMatrix: Record<string, Record<string, number>>;
  scoreDeltaDistribution: ScoreDistributionStats;
  absoluteDeltaDistribution: ScoreDistributionStats;
  largestIncreases: Array<{ observationId: string; delta: number }>;
  largestDecreases: Array<{ observationId: string; delta: number }>;
}

// ─── Timeline Equivalence Report ───────────────────────────────────────────

export interface TimelineMismatch {
  observationId: string;
  field: string;
  singleCycleValue: unknown;
  timelineValue: unknown;
}

export interface TimelineEquivalenceReport {
  schemaVersion: "0.4.2";
  comparedObservationCount: number;
  matchingObservationCount: number;
  mismatches: TimelineMismatch[];
  timelineMismatchCount: number;
  passed: boolean;
}

// ─── Temporal Independence Report ──────────────────────────────────────────

export interface TemporalContamination {
  observationId: string;
  contaminationField: string;
  baseValue: unknown;
  alteredValue: unknown;
  affectedField: string;
  baseScore: number | null;
  alteredScore: number | null;
}

export interface TemporalIndependenceReport {
  schemaVersion: "0.4.2";
  testedPairCount: number;
  passedPairCount: number;
  contaminations: TemporalContamination[];
  temporalContaminationCount: number;
  passed: boolean;
}

// ─── Telemetry Semantics Report ────────────────────────────────────────────

export interface TelemetrySemanticsReport {
  schemaVersion: "0.4.2";
  testedEventCount: number;
  contractVersionCorrect: boolean;
  acceptedTransformationCountCorrect: boolean;
  directCountNeverExceedsAccepted: boolean;
  acceptedNeverExceedsTotal: boolean;
  noPrivateFields: boolean;
  eventIsDeterministic: boolean;
  passed: boolean;
  failures: string[];
}

// ─── Determinism Report ────────────────────────────────────────────────────

export interface DeterminismReport {
  schemaVersion: "0.4.2";
  run1Directory: string;
  run2Directory: string;
  comparedArtifacts: number;
  matchingArtifacts: number;
  differences: Array<{ path: string; run1Sha256: string; run2Sha256: string }>;
  deterministicDifferences: number;
  passed: boolean;
}

// ─── Artifact Manifest ─────────────────────────────────────────────────────

export interface ArtifactManifest {
  schemaVersion: "0.4.2";
  baseSha: string;
  corpusId: string;
  artifacts: Array<{
    path: string;
    sha256: string;
    role: "baseline" | "raw-audit" | "derived-report" | "decision-input" | "decision";
  }>;
}

// ─── Decision ──────────────────────────────────────────────────────────────

export type MajorFortuneV042DecisionValue =
  | "PROMOTE_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS"
  | "HOLD_MAJOR_FORTUNE_V042_AUDIT_TRUTHFULNESS"
  | "ROLL_BACK_MAJOR_FORTUNE_V04";

export interface MajorFortuneV042DecisionGate {
  gateId: string;
  status: "pass" | "fail";
  sourceReport: string;
  sourceReportSha256: string;
  detail: string;
}

export interface MajorFortuneV042Decision {
  schemaVersion: "0.4.2";
  decision: MajorFortuneV042DecisionValue;

  baseSha: string;
  headSha: string;
  corpusId: string;

  integrationVersion: "0.4.2";
  modelVersion: string;
  formulaVersion: string;
  contractVersion: string;

  gates: MajorFortuneV042DecisionGate[];
  failedGateIds: string[];
  decisionInputHash: string;
}

// ─── Decision Check ────────────────────────────────────────────────────────

export interface DecisionCheckResult {
  schemaVersion: "0.4.2";
  decisionFileValid: boolean;
  allHashesValid: boolean;
  allGatesRecalculated: boolean;
  decisionMatches: boolean;
  expectedDecision: MajorFortuneV042DecisionValue;
  actualDecision: MajorFortuneV042DecisionValue | null;
  hashValidationFailures: string[];
  gateRecalculationFailures: string[];
  passed: boolean;
}
