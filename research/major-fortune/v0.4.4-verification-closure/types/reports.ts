/**
 * Major Fortune V0.4.4 Report Types.
 *
 * All report types used across the audit pipeline.
 */

import { MajorFortuneObservationSetComparisonReport, MajorFortuneObservationComparisonResult } from "../comparison/types.js";

// ─── Corpus Identity ───────────────────────────────────────────────────────

export interface CorpusIdentityRecord {
  schemaVersion: "0.4.4";
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

export interface MajorFortuneMigrationReport {
  schemaVersion: "0.4.4";
  migratedBaselineCount: number;
  totalObservationCount: number;
  repairedObservationIdCount: number;
  semanticChangeCount: number;
  migrationMatrix: Record<string, { repairedIds: number; semanticChanges: number }>;
  passed: boolean;
}

// ─── Baseline Manifest ─────────────────────────────────────────────────────

export interface BaselineManifest {
  schemaVersion: "0.4.4";
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

export interface MajorFortuneBaselineMigrationManifest {
  migrationId: string;
  sourceSchemaVersion: string;
  targetSchemaVersion: "0.4.4";
  sourceBaselinePath: string;
  sourceBaselineSha256: string;
  targetBaselinePath: string;
  targetBaselineSha256: string;
  algorithmVersion: string;
  reason: string;
  affectedObservationCount: number;
  unchangedObservationCount: number;
  oldIdentityHash: string;
  newIdentityHash: string;
  acceptedBy: string | null;
  acceptanceReference: string | null;
}

// ─── Equivalence Report ────────────────────────────────────────────────────

export interface EquivalenceReport extends MajorFortuneObservationSetComparisonReport {
  schemaVersion: "0.4.4";
  baselineMode: string;
  currentMode: string;
  passed: boolean;
}

// ─── Coverage Report ───────────────────────────────────────────────────────

export interface EnabledCoverageReport {
  schemaVersion: "0.4.4";
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
  derivedTransformationDensity: number;
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
  schemaVersion: "0.4.4";
  stats: Record<string, ScoreDistributionStats>;
}

// ─── Band Migration Report ─────────────────────────────────────────────────

export interface BandMigrationReport {
  schemaVersion: "0.4.4";
  comparedObservationCount: number;
  unchangedScoreCount: number;
  changedScoreCount: number;
  positiveScoreMovementCount: number;
  negativeScoreMovementCount: number;
  unchangedBandCount: number;
  changedBandCount: number;
  oneBandTransitionCount: number;
  multiBandTransitionCount: number;
  positiveBandTransitionCount: number;
  negativeBandTransitionCount: number;
  unknownBandCount: number;
  migrationMatrix: Record<string, Record<string, number>>;
}

// ─── Timeline Equivalence Report ───────────────────────────────────────────

export interface TimelineModeEquivalenceReport {
  mode: "nam-phai-fallback" | "nam-phai-enabled" | "trung-chau-control";
  expectedObservationCount: number;
  singleCycleObservationCount: number;
  timelineObservationCount: number;
  comparedObservationCount: number;
  missingSingleCycleIds: string[];
  missingTimelineIds: string[];
  duplicateSingleCycleIds: string[];
  duplicateTimelineIds: string[];
  classifiedExclusions: Array<{
    observationId: string;
    reasonCode: string;
    policyReference: string;
  }>;
  unclassifiedExclusions: string[];
  mismatchingObservationCount: number;
  semanticDifferenceCount: number;
  differences: MajorFortuneObservationComparisonResult[];
  passed: boolean;
}

export interface MajorFortuneTimelineEquivalenceReport {
  schemaVersion: "0.4.4";
  modes: {
    namPhaiFallback: TimelineModeEquivalenceReport;
    namPhaiEnabled: TimelineModeEquivalenceReport;
    trungChauControl: TimelineModeEquivalenceReport;
  };
  aggregateMismatchCount: number;
  aggregateUnclassifiedExclusionCount: number;
  passed: boolean;
}

// ─── Temporal Independence Report ──────────────────────────────────────────

export interface MajorFortuneObservationDifference {
  path: string;
  baseValue: unknown;
  currentValue: unknown;
}

export interface MajorFortuneTemporalIndependenceReport {
  schemaVersion: "0.4.4";
  expectedMutationPairs: number;
  totalAttemptedPairs: number;
  supportedPairs: number;
  unsupportedPairs: number;
  unsupportedCases: Array<{
    mutationId: string;
    observationId: string;
    reasonCode: string;
  }>;
  inputMutationFailures: number;
  derivedMutationFailures: number;
  identityPreservationFailures: number;
  comparedPairs: number;
  passedPairs: number;
  contaminatedPairs: number;
  mutationCoverage: Record<
    string,
    {
      expected: number;
      attempted: number;
      supported: number;
      unsupported: number;
      inputMutationPassed: number;
      derivedMutationPassed: number;
      identityPassed: number;
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

export interface TelemetryCaseResult {
  caseId: string;
  expectedContractVersion: string;
  actualContractVersion: string;
  contractVersionMatches: boolean;
  expectedAcceptedTransformationCount: number;
  actualAcceptedTransformationCount: number;
  expectedDirectActivationCount: number;
  actualDirectActivationCount: number;
  expectedOutOfFrameCount: number;
  actualOutOfFrameCount: number;
  privacyViolations: string[];
  allowlistViolations: string[];
  deterministic: boolean;
  emissionCount: number;
  passed: boolean;
}

export interface TelemetrySemanticsReport {
  schemaVersion: "0.4.4";
  cases: TelemetryCaseResult[];
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
  schemaVersion: "0.4.4";
  runAArtifactCount: number;
  runBArtifactCount: number;
  comparedArtifactCount: number;
  matchingArtifactCount: number;
  mismatchingArtifactCount: number;
  missingInRunA: string[];
  missingInRunB: string[];
  excludedPaths: Array<{
    path: string;
    reason: string;
  }>;
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
  schemaVersion: "0.4.4";
  baseSha: string;
  corpusId: string;
  artifacts: Array<{
    path: string;
    sha256: string;
    role: string;
  }>;
}

// ─── Authority Manifest ────────────────────────────────────────────────────

export interface MajorFortuneAuthorityManifest {
  schemaVersion: "0.4.4";
  authorities: Array<{
    authorityId: string;
    files: string[];
    sha256: string;
    role:
      | "formula"
      | "contract"
      | "knowledge"
      | "adapter-policy"
      | "calculation-core"
      | "provenance"
      | "band-contract";
  }>;
  aggregateAuthorityHash: string;
}

// ─── Decision ──────────────────────────────────────────────────────────────

export type MajorFortuneV044DecisionValue =
  | "PROMOTE_MAJOR_FORTUNE_V044_VERIFICATION_CLOSURE"
  | "HOLD_MAJOR_FORTUNE_V044_VERIFICATION_CLOSURE"
  | "ROLL_BACK_MAJOR_FORTUNE_V04";

export interface MajorFortuneV044DecisionGate {
  gateId: string;
  status: "pass" | "fail";
  sourceReport: string;
  sourceReportSha256: string;
  detail: string;
}

export interface MajorFortuneV044Decision {
  schemaVersion: "0.4.4";
  decision: MajorFortuneV044DecisionValue;
  baseSha: string;
  auditedHeadSha: string;
  mergeCandidateSha: string | null;
  corpusId: string;
  corpusHash: string;
  authorityManifestHash: string;
  artifactManifestHash: string;
  decisionInputHash: string;
  integrationVersion: "0.4.4";
  modelVersion: string;
  formulaVersion: string;
  contractVersion: string;
  gates: MajorFortuneV044DecisionGate[];
  failedGateIds: string[];
}

// ─── Decision Check ────────────────────────────────────────────────────────

export interface DecisionCheckResult {
  schemaVersion: "0.4.4";
  decisionFileValid: boolean;
  allHashesValid: boolean;
  allGatesRecalculated: boolean;
  decisionMatches: boolean;
  expectedDecision: MajorFortuneV044DecisionValue;
  actualDecision: MajorFortuneV044DecisionValue | null;
  hashValidationFailures: string[];
  gateRecalculationFailures: string[];
  passed: boolean;
}

