export type TemporalScope = "major-fortune" | "annual" | "monthly";

export interface SignalInventoryRecord {
  signalFamilyId: string;
  pillarId: string;
  runtimeStatus: "production-enabled" | "production-blocked-on-evidence" | "production-blocked-on-calculation-core" | "not-applicable";
  doctrineStatus: "verified" | "unverified" | "contradicted" | "school-specific-unresolved" | "not-applicable";
  frame: "active-palace" | "tam-phuong-tu-chinh" | "direct-active-major-fortune-palace-only" | "active-major-fortune-palace-only";
  sourceIds: string[];
  claimIds: string[];
  schoolScope: Array<"nam-phai" | "trung-chau"> | [];
  engineeringMappings: Array<{
    scenario: string;
    direction: "support" | "pressure" | "neutral";
    strength: "normal" | "strong" | "none";
  }>;
  numericAuthority: "engineering-defined" | "not-applicable";
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
  schoolScope: Array<"nam-phai" | "trung-chau"> | [];
  relatedIdentifiers: string[];
  notes: string;
}

export interface GapDimension {
  status: "verified" | "partial" | "engineering-only" | "missing" | "contradicted" | "not-applicable";
  sourceIds: string[];
  claimIds: string[];
  gapIds: string[];
  derivation: string;
  notes: string;
}

export interface EvidenceGapMatrixRecord {
  signalFamilyId: string;
  calculationCoreReadiness: GapDimension;
  runtimeMeasurability: GapDimension;
  schoolDoctrine: GapDimension;
  crossSourceAgreement: GapDimension;
  frameConsistency: GapDimension;
  polarityAgreement: GapDimension;
}

export interface SchoolPolicyMatrixRecord {
  signalFamilyId: string;
  admittedByNamPhai: boolean;
  admittedByTrungChau: boolean;
  sharedImplementation: boolean;
  sharedDoctrine: boolean;
  crossSchoolFallbackForbidden: boolean;
  unresolvedSchoolContradiction: boolean;
  featureGated: boolean;
}

export interface CandidateReadinessMatrixRecord {
  signalFamilyId: string;
  readiness: "ready" | "research-blocked" | "blocked-by-calculation-core";
  blockingDimensions: string[];
}

export interface SourceRegistryDelta {
  schemaVersion: "0.5.0";
  sources: Array<{
    sourceId: string;
    catalogTitle: string;
    schoolScope: Array<"nam-phai" | "trung-chau"> | [];
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
  affectedSchools: Array<"nam-phai" | "trung-chau"> | [];
  positions: any[];
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
  entries: any[];
}

export interface CorpusGapReport {
  schemaVersion: "0.5.0";
  thienThoi: {
    totalObservationsBySchool: Record<string, number>;
    elementRelationDistribution: Record<string, number>;
    supportPressureNeutralDistribution: Record<string, number>;
    evidenceEmissionCount: number;
    missingMenhElement: number;
    missingPalaceBranchMapping: number;
    scorePillarLevelDistribution: Record<string, number>;
    casesAffectedBySameElementPolicy: number;
  };
  diaLoi: {
    voChinhDieuObservations: number;
    onePrincipalCases: number;
    twoPrincipalCases: number;
    moreThanTwoDefensiveAnomalyCount: number;
    brightnessByStarAndDignity: Record<string, number>;
    missingBrightness: number;
    unsupportedBrightness: number;
    mixedDignity: number;
    noSignalCases: number;
    measurableOppositePalacePrincipalCases: number;
  };
  nhanHoa: {
    activationCountForEachConfiguredSet: Record<string, number>;
    partialPairCountForEachSet: Record<string, number>;
    locTonActivation: number;
    noEvidenceObservations: number;
    supportOnly: number;
    pressureOnly: number;
    mixed: number;
    neutralRate: number;
    duplicatePhysicalFactOrClusterRisks: number;
    schoolDistribution: Record<string, number>;
  };
  tuHoa: {
    resolvedTuples: number;
    completeTuples: number;
    directActivePalaceTuples: number;
    outOfFrameTuples: number;
    incompleteTuples: number;
    transformationTypeDistribution: Record<string, number>;
    targetPalaceDistribution: Record<string, number>;
    multiTransformationObservations: number;
    zeroDirectEvidenceObservations: number;
    namPhaiTrungChauComparison: Record<string, number>;
    measurableNatalTransitCollisions: number | { status: "not-measurable"; reason: string; requiredCapability: string };
  };
}

export interface Decision {
  schemaVersion: "0.5.0";
  decision: "CURRENT_PRODUCTION_PROVENANCE_MISMATCH" | "MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN" | "READY_FOR_MAJOR_FORTUNE_V05_CANDIDATE_DESIGN";
  canonicalInputHashes: Record<string, string>;
  failedOrBlockingConditions: string[];
  eligibleFamilyIds: string[];
  blockedFamilyIds: string[];
  openContradictionIds: string[];
  openQueueCounts: Record<string, number>;
  corpusReportHash: string;
  matrixHashes: Record<string, string>;
}
