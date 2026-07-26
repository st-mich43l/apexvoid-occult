export type TemporalScope = "major-fortune" | "annual" | "monthly";

export type EvidenceStatus =
  | "verified"
  | "partial"
  | "engineering-only"
  | "missing"
  | "contradicted"
  | "not-applicable";

export type CandidateEligibilityStatus =
  | "eligible-for-shape-design"
  | "research-blocked"
  | "blocked-by-calculation-core"
  | "contradicted"
  | "excluded"
  | "metadata-only";

export type RuntimeLocatorStatus = "verified" | "missing";

export type DoctrineLocatorStatus =
  | "verified-doctrine"
  | "verified-runtime-only"
  | "missing"
  | "contradicted";

export interface EvidenceDimension {
  status: EvidenceStatus;
  sourceIds: string[];
  claimIds: string[];
  gapIds: string[];
  derivation: string;
  notes: string;
  blockerKind?: "research" | "calculation-core";
  runtimeLocatorStatus?: RuntimeLocatorStatus;
  doctrineLocatorStatus?: DoctrineLocatorStatus;
}

export type MajorFortuneResearchFrame =
  | "active-palace"
  | "tam-phuong-tu-chinh"
  | "direct-active-major-fortune-palace-only"
  | "active-major-fortune-palace-only"
  | "proposed-opposite-palace"
  | "out-of-frame-target"
  | "natal-and-major-fortune"
  | "not-applicable";

export interface SignalInventoryRecord {
  signalFamilyId: string;
  pillarId: string;
  runtimeStatus:
    | "production-enabled"
    | "production-blocked-on-evidence"
    | "production-blocked-on-calculation-core"
    | "not-applicable";
  doctrineStatus:
    | "verified"
    | "unverified"
    | "contradicted"
    | "school-specific-unresolved"
    | "not-applicable";
  frame: Exclude<MajorFortuneResearchFrame, "not-applicable">;
  sourceIds: string[];
  claimIds: string[];
  schoolScope: Array<"nam-phai" | "trung-chau">;
  engineeringMappings: Array<{
    scenario: string;
    direction: "support" | "pressure" | "neutral";
    strength: "normal" | "strong" | "none";
  }>;
  numericAuthority: "engineering-defined" | "not-applicable";
}

export interface BacklogInventoryRecord {
  signalFamilyId: string;
  implemented: boolean;
  emittedAsDiagnosticOnly: boolean;
  blockedOnEvidence: boolean;
  blockedOnCalculationCore: boolean;
  measurableFromCorpus: boolean | "not-measurable";
  doctrineStatus:
    | "verified"
    | "unverified"
    | "contradicted"
    | "school-specific-unresolved"
    | "not-applicable";
  schoolScope: Array<"nam-phai" | "trung-chau"> | "unresolved";
  pillarOwnership: string | "unresolved";
  proposedFrame: MajorFortuneResearchFrame;
  targetFrame: MajorFortuneResearchFrame;
}

export interface ProvenanceReconciliationRecord {
  identifier: string;
  identifierKind: "source" | "claim";
  origin: "runtime" | "historical-research" | "v05-research-delta";
  definingPath: string | null;
  definingSymbol: string | null;
  runtimeExists: boolean;
  authorityClass:
    | "calculation-core-fact"
    | "engineering-policy"
    | "research-hypothesis"
    | "school-manual-supported"
    | "published-reference-supported"
    | "unresolved"
    | "invalid-reference";
  schoolScope: Array<"nam-phai" | "trung-chau">;
  relatedIdentifiers: string[];
  notes: string;
}

export interface EvidenceGapMatrixRecord {
  signalFamilyId: string;
  existence: EvidenceDimension;
  schoolScope: EvidenceDimension;
  majorFortuneTemporalScope: EvidenceDimension;
  palaceFrame: EvidenceDimension;
  targetFrame: EvidenceDimension;
  polarity: EvidenceDimension;
  strength: EvidenceDimension;
  pillarOwnership: EvidenceDimension;
  stacking: EvidenceDimension;
  deduplication: EvidenceDimension;
  exceptionPolicy: EvidenceDimension;
  calculationCoreReadiness: EvidenceDimension;
  sourceLocatorQuality: EvidenceDimension;
  crossSourceAgreement: EvidenceDimension;
  corpusMeasurability: EvidenceDimension;
  openContradictionIds: string[];
  candidateEligibility: CandidateEligibilityStatus;
}

export interface SchoolPolicyMatrixRecord {
  signalFamilyId: string;
  runtimeAdmittedByNamPhai: boolean;
  runtimeAdmittedByTrungChau: boolean;
  featureGatedByNamPhai: boolean;
  featureGatedByTrungChau: boolean;
  researchAdmittedByNamPhai: boolean;
  researchAdmittedByTrungChau: boolean;
  doctrineVerifiedByNamPhai: boolean;
  doctrineVerifiedByTrungChau: boolean;
  sharedImplementation: boolean;
  sharedCalculationFacts: boolean;
  sharedDoctrine: boolean;
  crossSchoolFallbackForbidden: boolean;
  unresolvedSchoolContradictions: boolean;
}

export interface CandidateReadinessMatrixRecord {
  signalFamilyId: string;
  readiness: CandidateEligibilityStatus;
  blockingDimensions: string[];
}

export interface SourceRegistryDelta {
  schemaVersion: "0.5.0";
  sources: Array<{
    sourceId: string;
    catalogTitle: string;
    schoolScope: Array<"nam-phai" | "trung-chau">;
  }>;
}

export interface ClaimRegistryDelta {
  schemaVersion: "0.5.0";
  claims: Array<{
    claimId: string;
    sourceId: string;
    description: string;
    excerpt: string | null;
    engineeringInterpretation: string;
    doctrineHypothesis: string;
    sourceSupportedDoctrine: boolean;
  }>;
}

export interface Contradiction {
  contradictionId: string;
  priorContradictionIds: string[];
  status: "open" | "context-dependent" | "resolved" | "superseded";
  affectedFamilies: string[];
  affectedSchools: Array<"nam-phai" | "trung-chau">;
  positions: unknown[];
  adjudicationEvidenceIds: string[];
  resolution: string | null;
}

export interface ContradictionLog {
  schemaVersion: "0.5.0";
  contradictions: Contradiction[];
}

export interface Ledger {
  schemaVersion: "0.5.0";
  ledgerId: string;
  generatedOrMaintained: "generated" | "maintained";
  zeroEntryCount: number;
  previousRegistryReferences: string[];
  entries: unknown[];
}

export interface ReconciliationResult {
  status: "matched" | "mismatched" | "not-comparable";
  comparedMetrics: string[];
  mismatches: Array<{
    metric: string;
    expected: unknown;
    actual: unknown;
  }>;
  reason: string | null;
}

export interface CorpusGapReport {
  schemaVersion: "0.5.0";
  thienThoi: {
    totalObservationsBySchool: Record<string, number>;
    evidenceEmissionCount: number;
    elementRelationDistribution: Record<string, number>;
    supportPressureNeutralDistribution: Record<string, number>;
    missingMenhElement: number;
    missingPalaceBranchMapping: number;
    scorePillarLevelDistribution: Record<string, number>;
    scorePillarStateDistribution: Record<string, number>;
    sameElementPolicyCount: number;
    strongNormalStrengthDistribution: Record<string, number>;
    noElementEvidenceObservations: number;
    acceptedEvidenceCount: number;
    rejectedEvidenceCount: number;
    supportMass: number;
    pressureMass: number;
  };
  diaLoi: {
    voChinhDieuObservations: number;
    onePrincipalCases: number;
    twoPrincipalCases: number;
    moreThanTwoDefensiveAnomalyCount: number;
    brightnessByStarAndDignity: Record<string, Record<string, number>>;
    dignityCounts: Record<string, number>;
    missingBrightness: number;
    unsupportedBrightness: number;
    mixedDignity: number;
    evidenceEmissionCount: number;
    noSignalCases: number;
    measurableOppositePalacePrincipalCases: number;
    scorePillarLevelDistribution: Record<string, number>;
    scorePillarStateDistribution: Record<string, number>;
    schoolDistribution: Record<string, number>;
    acceptedEvidenceCount: number;
    rejectedEvidenceCount: number;
    supportMass: number;
    pressureMass: number;
  };
  nhanHoa: {
    activationCountForEachConfiguredSet: Record<string, number>;
    partialPairCountForEachSet: Record<string, number>;
    supportOnly: number;
    pressureOnly: number;
    mixed: number;
    noEvidenceObservations: number;
    scorePillarLevelDistribution: Record<string, number>;
    scorePillarStateDistribution: Record<string, number>;
    duplicatePhysicalFactRejections: number;
    duplicateEvidenceClusterRejections: number;
    schoolDistribution: Record<string, number>;
    acceptedEvidenceCount: number;
    rejectedEvidenceCount: number;
    supportMass: number;
    pressureMass: number;
  };
  tuHoa: {
    resolvedTuples: number;
    completeTuples: number;
    incompleteTuples: number;
    directActivePalaceTuples: number;
    outOfFrameTuples: number;
    acceptedTransformationEvidence: number;
    transformationTypeDistribution: Record<string, number>;
    targetPalaceDistribution: Record<string, number>;
    multiTransformationObservations: number;
    zeroDirectEvidenceObservations: number;
    blockedNamPhaiObservations: number;
    featureEnabledProductionState: boolean;
    scorePillarLevelDistribution: Record<string, number>;
    scorePillarStateDistribution: Record<string, number>;
    duplicateEvidenceRejection: number;
    duplicateOwnershipRejection: number;
    measurableNatalTransitCollisions:
      | number
      | {
          status: "not-measurable";
          reason: string;
          requiredCapability: string;
        };
    acceptedEvidenceCount: number;
    rejectedEvidenceCount: number;
    supportMass: number;
    pressureMass: number;
  };
  reconciliation: ReconciliationResult;
}

export interface FoundationSummary {
  schemaVersion: "0.5.0";
  runtimeFamilyCount: number;
  backlogFamilyCount: number;
  productionEnabledCount: number;
  researchBlockedCount: number;
  calculationCoreBlockedCount: number;
  eligibleFamilyCount: number;
  openContradictionCount: number;
  queueCounts: {
    sourceAcquisition: number;
    claimAdjudication: number;
    calculationCore: number;
  };
  corpusReconciliationStatus: ReconciliationResult["status"];
}

export interface Decision {
  schemaVersion: "0.5.0";
  decision:
    | "CURRENT_PRODUCTION_PROVENANCE_MISMATCH"
    | "MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN"
    | "READY_FOR_MAJOR_FORTUNE_V05_CANDIDATE_DESIGN";
  canonicalInputHashes: Record<string, string>;
  failedOrBlockingConditions: string[];
  eligibleFamilyIds: string[];
  blockedFamilyIds: string[];
  openContradictionIds: string[];
  openQueueCounts: Record<string, number>;
  corpusReportHash: string;
  matrixHashes: Record<string, string>;
}
