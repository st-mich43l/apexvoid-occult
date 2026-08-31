/**
 * Research-only types for PR #267 Major Fortune V1 release-readiness requalification.
 * Not imported by production routers.
 */

export type ZiweiSchoolId = "nam-phai" | "trung-chau";

type HistoricalAssetState =
  | "STILL_CURRENT"
  | "SUPERSEDED"
  | "DELETED_PROVENANCE_ONLY"
  | "INVALIDATED"
  | "UNKNOWN";

export type FindingClassification =
  | "HISTORICAL_LINEAGE_GAP"
  | "CURRENT_PROVENANCE_GAP"
  | "NUMERIC_AUTHORITY_GAP"
  | "PHYSICAL_FACT_COVERAGE_GAP"
  | "TRANSFORMATION_COVERAGE_GAP"
  | "QUALITY_REPORTING_GAP"
  | "EXPECTED_MODEL_DIFFERENCE"
  | "MODEL_INSTABILITY"
  | "ARCHITECTURE_VIOLATION"
  | "UNEXPECTED_DELTA";

export type NumericAuthorityClass =
  | "SOURCED_NUMERIC_AUTHORITY"
  | "ENGINEERING_POLICY"
  | "FROZEN_INHERITED_FORMULA"
  | "RESEARCH_HYPOTHESIS"
  | "PLACEHOLDER"
  | "UNRESOLVED";

type QualityMetricClass =
  | "MEASURED"
  | "DERIVABLE"
  | "SYNTHETIC_CONSTANT"
  | "MOCK"
  | "UNSUPPORTED"
  | "MISLEADING"
  | "UNSUPPORTED_OR_NOT_DERIVABLE";

type EvidenceAuthorityClass =
  | "PROVENANCE_VALID_CURRENT"
  | "ENGINEERING_POLICY_EXPLICIT"
  | "HISTORICAL_PROVENANCE_ONLY"
  | "PLACEHOLDER_OR_UNVERIFIED"
  | "IMPLEMENTED_BUT_UNSCORED"
  | "SCHEMA_ONLY"
  | "SILENTLY_DROPPED"
  | "COVERAGE_GAP";

export type ReadinessDecision =
  | "MFV1_READY_AS_RESEARCH_CONTROL"
  | "MFV1_REQUIRES_PROVENANCE_REBUILD"
  | "MFV1_REQUIRES_COVERAGE_WORK"
  | "MFV1_REQUIRES_QUALITY_CONTRACT_REDESIGN"
  | "MFV1_RELEASE_CANDIDATE_READY_FOR_REVIEW";

type DimensionStatus = "PASS" | "FAIL" | "GAP" | "N/A" | "PARTIAL";

export interface HistoricalAssetRow {
  assetId: string;
  historicalPath: string;
  state: HistoricalAssetState;
  notes: string;
}

export interface EvidenceFamilySummary {
  category: string;
  physicalFactAvailable: boolean;
  physicalFactConsumed: boolean;
  sourceIds: string[];
  sourceIdsResolveCurrent: boolean;
  claimIds: string[];
  claimIdsResolveCurrent: boolean;
  scoringAuthorityLabel: string;
  scoringAuthorityActuallySupported: boolean;
  numericVectorAuthority: NumericAuthorityClass;
  schoolScope: string;
  temporalScope: string;
  silentDropPossible: boolean;
  classification: EvidenceAuthorityClass;
}

export interface NumericSurfaceSummary {
  surfaceId: string;
  value: number | string;
  authority: NumericAuthorityClass;
  notes: string;
}

export interface ReadinessDimension {
  dimension: string;
  status: DimensionStatus;
  evidence: string;
}

export interface CycleOverride {
  cycleIndex: number;
  startAge: number;
  endAge: number;
  activePalaceIndex: number;
}

export interface FactBucketCounts {
  recognized: number;
  explicitlyRejected: number;
  contextOnly: number;
  blocked: number;
  silentlyDropped: number;
  totalRelevant: number;
}

export interface UnsupportedStarHit {
  school: ZiweiSchoolId;
  caseId: string;
  cycleIndex: number;
  palaceIndex: number;
  frameRole: "focus" | "opposite" | "trine";
  starName: string;
  starCategory: "principal" | "auxiliary-or-other";
}

export interface NumericDeltaStats {
  count: number;
  meanSignedDelta: number;
  meanAbsoluteDelta: number;
  medianAbsoluteDelta: number;
  p95AbsoluteDelta: number;
  maxAbsoluteDelta: number;
}

export interface ScoreDistribution {
  count: number;
  min: number;
  p10: number;
  median: number;
  mean: number;
  p90: number;
  max: number;
  standardDeviation: number;
  scoreAt0Rate: number;
  scoreAt100Rate: number;
  nearCenterRate: number;
}

export interface ModelComparisonBlock {
  comparableObservations: number;
  unavailableBaseline: number;
  unavailableCandidate: number;
  candidateErrors: number;
  deltas: NumericDeltaStats;
  bandAgreementRate: number | null;
  bandChangedCount: number;
  bandTransitionMatrix: Record<string, number>;
  v05Distribution: ScoreDistribution | null;
  v1Distribution: ScoreDistribution | null;
}

export interface TimelineChartSummary {
  school: ZiweiSchoolId;
  caseId: string;
  cycleCount: number;
  v05Range: number | null;
  v1Range: number | null;
  v05MedianAdjacentAbsDelta: number | null;
  v1MedianAdjacentAbsDelta: number | null;
  v05MaxAdjacentAbsDelta: number | null;
  v1MaxAdjacentAbsDelta: number | null;
  v05Flat: boolean;
  v1Flat: boolean;
}

interface QualityTruthfulnessSummary {
  reportedCoverageBehavior: string;
  measuredPhysicalCoverageComparable: boolean;
  reportedCoverageClassification: QualityMetricClass;
  reportedConfidenceClassification: QualityMetricClass;
  engineeringShareClassification: QualityMetricClass;
  verifiedDomainShareClassification: QualityMetricClass;
  experimentalShareClassification: QualityMetricClass;
  meanReportedCoveragePercent: number | null;
  meanMeasuredPhysicalCoveragePercent: number | null;
  meanReportedConfidencePercent: number | null;
  derivedConfidence: null;
  derivedConfidenceClassification: "UNSUPPORTED_OR_NOT_DERIVABLE";
}

export interface CoverageSchoolSummary {
  school: ZiweiSchoolId;
  observations: number;
  physicalFacts: number;
  recognized: number;
  silentlyDropped: number;
  principalCoverageRate: number | null;
  auxiliaryCoverageRate: number | null;
  transformationCoverageRate: number | null;
  silentDropRate: number | null;
}

export interface MajorFortuneV1ReadinessReport {
  schemaVersion: string;
  generationId: string;
  generatedFrom: {
    baseSha: string;
    candidate: string;
    baseline: string;
  };
  lineage: {
    historicalAssets: HistoricalAssetRow[];
    currentLifecycleAssessment: string;
    currentReleaseGate: "ABSENT";
    historicalGoShadowStatus: "INVALIDATED_AS_CURRENT_AUTHORITY";
  };
  authority: {
    evidenceFamilies: EvidenceFamilySummary[];
    numericSurfaces: NumericSurfaceSummary[];
    unresolvedSourceIds: string[];
    unresolvedClaimIds: string[];
    domainVerifiedLabelCount: number;
    domainVerifiedResolvedCount: number;
    domainVerifiedUnresolvedCount: number;
    domainVerifiedLabelTruthfulness: "PASS" | "FAIL";
  };
  coverage: {
    observations: number;
    physicalFacts: number;
    recognizedFacts: number;
    silentlyDroppedFacts: number;
    principalCoverageRate: number | null;
    auxiliaryCoverageRate: number | null;
    transformationCoverageRate: number | null;
    silentDropRate: number | null;
    bySchool: CoverageSchoolSummary[];
    uniqueUnsupportedStars: string[];
    unsupportedStarOccurrences: number;
    unsupportedOccurrenceRate: number | null;
    topUnsupportedStars: Array<{ starName: string; count: number }>;
    majorMutagensPhysicalCount: number;
    majorMutagensInV1FrameCount: number;
    majorTransformationEvidenceCount: number;
    majorTransformationScoredCount: number;
  };
  qualityTruthfulness: QualityTruthfulnessSummary;
  modelComparison: {
    global: ModelComparisonBlock;
    bySchool: Record<ZiweiSchoolId, ModelComparisonBlock>;
    byVcd: Record<"vcd" | "non-vcd", ModelComparisonBlock>;
    byTransformationExposure: Record<"mutagens-present" | "mutagens-absent", ModelComparisonBlock>;
  };
  timeline: {
    charts: number;
    flatTimelineRateV05: number;
    flatTimelineRateV1: number;
    medianWithinChartRangeV05: number | null;
    medianWithinChartRangeV1: number | null;
    sample: TimelineChartSummary[];
  };
  readiness: {
    dimensions: ReadinessDimension[];
    decision: ReadinessDecision;
    blockers: string[];
    recommendedNextPr: {
      outcome: "A" | "B" | "C" | "D";
      title: string;
      rationale: string;
    };
  };
  classifications: Record<FindingClassification, number>;
  corpus: {
    birthCaseCountNam: number;
    birthCaseCountTc: number;
    schoolCount: number;
    validCycleObservationCount: number;
    unavailableObservationCount: number;
    candidateErrorCount: number;
  };
  isolation: {
    productionImportsEngineV1: boolean;
    timelineImportsEngineV1: boolean;
    runtimeImportsResearchHarness: boolean;
  };
  limitations: string[];
}
