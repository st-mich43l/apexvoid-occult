/**
 * Major Fortune V0.4.3 Report Types.
 *
 * All report types used across the audit pipeline.
 */

import { MajorFortuneObservationSetComparisonReport } from "../comparison/types.js";

// ─── Corpus Identity ───────────────────────────────────────────────────────

export interface CorpusIdentityRecord {
  schemaVersion: "0.4.3";
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
  schemaVersion: "0.4.3";
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

// For V0.4.3, EquivalenceReport uses the canonical semantic comparator's output
export interface EquivalenceReport extends MajorFortuneObservationSetComparisonReport {
  schemaVersion: "0.4.3";
  baselineMode: string;
  currentMode: string;
  passed: boolean;
}

// ─── Coverage Report ───────────────────────────────────────────────────────

export interface EnabledCoverageReport {
  schemaVersion: "0.4.3";
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
  schemaVersion: "0.4.3";
  stats: Record<string, ScoreDistributionStats>;
}

// ─── Band Migration Report ─────────────────────────────────────────────────

export interface BandMigrationReport {
  schemaVersion: "0.4.3";
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

export interface TimelineEquivalenceReport extends MajorFortuneObservationSetComparisonReport {
  schemaVersion: "0.4.3";
  passed: boolean;
}

// ─── Temporal Independence Report ──────────────────────────────────────────

export interface MajorFortuneObservationDifference {
  path: string;
  baseValue: unknown;
  currentValue: unknown;
}

export interface TemporalIndependenceReport {
  schemaVersion: "0.4.3";
  totalPairs: number;
  validMutationPairs: number;
  mutationSentinelFailures: number;
  identityPreservationFailures: number;

  comparedPairs: number;
  passedPairs: number;
  contaminatedPairs: number;

  mutationCoverage: Record<
    string,
    {
      attempted: number;
      sentinelPassed: number;
      semanticPassed: number;
      semanticFailed: number;
    }
  >;

  contaminations: Array<{
    pairId: string;
    mutationId: string;
    observationId: string;
    differences: MajorFortuneObservationDifference[];
  }>;

  passed: boolean;
}

// ─── Telemetry Semantics Report ────────────────────────────────────────────

export interface TelemetrySemanticsReport {
  schemaVersion: "0.4.3";
  testedEventCount: number;
  allowlistViolationCount: number;
  privacyViolationCount: number;

  deterministicEventCount: number;
  nonDeterministicEventCount: number;

  countSemanticMismatchCount: number;
  duplicateEmissionCount: number;
  sinkRestorationFailureCount: number;

  failures: Array<{
    caseId: string;
    reasonCode: string;
    detail: string;
  }>;

  passed: boolean;
}

// ─── Determinism Report ────────────────────────────────────────────────────

export interface MajorFortuneDeterminismReport {
  schemaVersion: "0.4.3";
  runAId: string;
  runBId: string;

  comparedArtifacts: number;
  matchingArtifacts: number;
  mismatchingArtifacts: number;
  missingInRunA: string[];
  missingInRunB: string[];

  differences: Array<{
    path: string;
    runAHash: string;
    runBHash: string;
    semanticDifferences?: unknown[];
  }>;

  passed: boolean;
}

// ─── Artifact Manifest ─────────────────────────────────────────────────────

export interface ArtifactManifest {
  schemaVersion: "0.4.3";
  baseSha: string;
  corpusId: string;
  artifacts: Array<{
    path: string;
    sha256: string;
    role: "baseline" | "raw-audit" | "derived-report" | "decision-input" | "decision";
  }>;
}

// ─── Decision ──────────────────────────────────────────────────────────────

export type MajorFortuneV043DecisionValue =
  | "PROMOTE_MAJOR_FORTUNE_V043_SEMANTIC_AUDIT"
  | "HOLD_MAJOR_FORTUNE_V043_SEMANTIC_AUDIT"
  | "ROLL_BACK_MAJOR_FORTUNE_V04";

export interface MajorFortuneV043DecisionGate {
  gateId: string;
  status: "pass" | "fail";
  sourceReport: string;
  sourceReportSha256: string;
  detail: string;
}

export interface MajorFortuneV043Decision {
  schemaVersion: "0.4.3";
  decision: MajorFortuneV043DecisionValue;

  baseSha: string;
  headSha: string;
  corpusId: string;

  integrationVersion: "0.4.3";
  modelVersion: string;
  formulaVersion: string;
  contractVersion: string;

  gates: MajorFortuneV043DecisionGate[];
  failedGateIds: string[];
  decisionInputHash: string;
}

// ─── Decision Check ────────────────────────────────────────────────────────

export interface DecisionCheckResult {
  schemaVersion: "0.4.3";
  decisionFileValid: boolean;
  allHashesValid: boolean;
  allGatesRecalculated: boolean;
  decisionMatches: boolean;
  expectedDecision: MajorFortuneV043DecisionValue;
  actualDecision: MajorFortuneV043DecisionValue | null;
  hashValidationFailures: string[];
  gateRecalculationFailures: string[];
  passed: boolean;
}
