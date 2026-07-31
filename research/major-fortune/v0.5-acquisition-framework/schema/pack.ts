export interface AcquisitionPackManifest {
  schemaVersion: string;
  packId: string;
  roundId: string;
  pillarId: "dia-loi" | "nhan-hoa" | "thien-thoi";

  targetFamilyIds: string[];

  requiredSchoolScopes: Array<"nam-phai" | "trung-chau">;

  maintainedInputs: {
    sourceRegistry: string;
    extractionLedger: string;
    claimRegistry: string;
    obligationClaimBinding: string;
  };

  generatedOutputs: {
    evidenceLedger: string;
    coverageMatrix: string;
    schoolMatrix: string;
    handoffQueue: string;
    summary: string;
    sourceGapReconciliation?: string;
  };
}

type SourceAuthorityClass =
  | "classical-text"
  | "school-manual"
  | "named-commentary"
  | "modern-reference"
  | "research-summary"
  | "engineering-policy";

type SourceAcquisitionMethod =
  | "physical-scan"
  | "digital-scan"
  | "library-copy"
  | "publisher-copy"
  | "personal-copy"
  | "metadata-only";

interface SourceIdentity {
  canonicalWorkId: string;
  editionIdentityId: string;
  copyIdentityId: string | null;
}

interface SourceCopyIdentity {
  copyId: string | null;
  acquisitionMethod: SourceAcquisitionMethod;
  artifactHash: string | null;
  editionFingerprint: string | null;
  archiveLocator: string | null;
  acquiredAt: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  verificationNotes: string | null;
}

export interface SourceLocator {
  locatorId: string;

  volume: string | null;
  chapter: string | null;
  section: string | null;
  pageStart: number | null;
  pageEnd: number | null;

  copyId: string | null;
  scanId: string | null;
  pageImageHash: string | null;

  extractionId: string | null;

  locatorVerification:
    | "verified-against-copy"
    | "reported-unverified"
    | "metadata-only";
}

export interface MajorFortuneResearchSource {
  sourceId: string;
  title: string;
  authorOrCompiler: string | null;
  edition: string | null;
  publisher: string | null;
  publicationYear: string | null;
  language: string;
  authorityClass: SourceAuthorityClass;

  schoolScope: "nam-phai" | "trung-chau" | "shared" | "unresolved";

  acquisitionStatus:
    | "acquired"
    | "partially-acquired"
    | "catalogued-only"
    | "unavailable";

  verificationStatus:
    | "verified-copy"
    | "metadata-only"
    | "needs-verification";

  sourceIdentity: SourceIdentity;
  copyIdentity: SourceCopyIdentity;
  locators: SourceLocator[];

  supportedFamilyIds: string[]; // No longer hard-coded enum

  notes: string;
}

export type EvidenceMaturity =
  | "catalogued-hypothesis"
  | "located-unverified"
  | "inspected-extraction"
  | "verified-analogy"
  | "verified-inferred"
  | "verified-extraction";

export type SourceEvidenceState =
  | "missing"
  | "catalogued"
  | "located-unverified"
  | "verified-analogy"
  | "verified-inferred"
  | "verified-explicit"
  | "conflicted";

export type AcquisitionWorkflowState =
  | "source-open"
  | "source-partial"
  | "source-closed"
  | "adjudication-open"
  | "handoff-ready";

type ReportedStatementForm =
  | "rule"
  | "definition"
  | "example"
  | "exception"
  | "commentary"
  | "inference"
  | "unresolved";

type EvidenceExplicitness =
  | "verified-explicit"
  | "verified-inferred"
  | "reported-unverified"
  | "analogy"
  | "none";

type AggregateExplicitness =
  | "none"
  | "reported-unverified"
  | "analogy"
  | "verified-inferred"
  | "verified-explicit"
  | "mixed"
  | "conflicted";

interface DimensionAssessment {
  requestedValue: string | null;
  sourceValue: string | null;
  proposedValue: string | null;

  applicationKind:
    | "direct"
    | "inferred"
    | "analogy"
    | "unresolved";

  evidenceExplicitness: EvidenceExplicitness;
  maturity: EvidenceMaturity;

  outcome:
    | "missing"
    | "catalogued"
    | "partial"
    | "verified"
    | "conflicted";

  reasons: string[];
}

export interface EvidencePath {
  claimId: string;
  extractionId: string;
  sourceId: string;
  locatorId: string;

  familyId: string;
  schoolScope: "nam-phai" | "trung-chau" | "shared";

  sourceVerificationStatus:
    | "verified-copy"
    | "needs-verification"
    | "metadata-only";

  locatorVerification:
    | "verified-against-copy"
    | "reported-unverified"
    | "metadata-only";

  evidenceExplicitness: EvidenceExplicitness;

  applicationKind:
    | "direct"
    | "inferred"
    | "analogy"
    | "unresolved";

  statementForm: ReportedStatementForm;
}

export interface EvidencePathAssessment {
  requestedValue: string | null;
  sourceValue: string | null;
  proposedValue: string | null;

  applicationKind:
    | "direct"
    | "inferred"
    | "analogy"
    | "unresolved";

  evidenceExplicitness: EvidenceExplicitness;
  maturity: EvidenceMaturity;

  outcome:
    | "missing"
    | "catalogued"
    | "partial"
    | "verified"
    | "conflicted";

  reasons: string[];
}

export interface EvidenceObligation {
  obligationId: string;
  gapId: string;
  claimId: string;
  familyId: string;
  schoolScope: string;
  dimension: string;

  required: boolean;

  state:
    | "missing"
    | "catalogued"
    | "partial"
    | "verified"
    | "conflicted";

  pathIds: string[];
  reasons: string[];
}

export interface DimensionAggregate {
  outcome:
    | "missing"
    | "catalogued"
    | "partial"
    | "verified"
    | "conflicted";

  aggregateExplicitness: AggregateExplicitness;

  minimumMaturity: EvidenceMaturity;
  maximumMaturity: EvidenceMaturity;

  bestEvidenceState: SourceEvidenceState;
  blockingEvidenceState: SourceEvidenceState;

  requestedValues: string[];
  sourceValues: string[];
  proposedValues: string[];

  matchedPathIds: string[];
  matchedClaimIds: string[];
  matchedExtractionIds: string[];
  matchedSourceIds: string[];
  matchedLocatorIds: string[];

  directPathCount: number;
  inferredPathCount: number;
  analogyPathCount: number;
  reportedUnverifiedPathCount: number;

  requiredObligations: EvidenceObligation[];
  optionalObligations: EvidenceObligation[];
  requiredObligationState:
    | "missing"
    | "catalogued"
    | "partial"
    | "verified"
    | "conflicted";

  reasons: string[];
}

export interface SourceExtractionRecord {
  extractionId: string;
  sourceId: string;
  locatorId: string;
  familyId: string;
  schoolScope: string;

  statementForm: ReportedStatementForm;
  evidenceExplicitness: EvidenceExplicitness;

  sourceTemporalScope:
    | "natal"
    | "major-fortune"
    | "annual"
    | "transit-general"
    | "unresolved";

  sourcePalaceFrame:
    | "natal-palace"
    | "active-major-fortune-palace"
    | "opposite-palace"
    | "multi-palace"
    | "unresolved";

  sourceTargetFrame:
    | "active-palace"
    | "opposite-palace"
    | "principal-star"
    | "full-configuration"
    | "interpretive-reference"
    | "unresolved";

  proposedApplicationScope: {
    temporalScope:
      | "natal"
      | "major-fortune"
      | "annual"
      | "transit-general"
      | "unresolved";

    palaceFrame: string;
    targetFrame: string;

    applicationKind:
      | "direct"
      | "inferred"
      | "analogy"
      | "unresolved";

    rationale: string | null;
  };

  normalizedSummary: string;
  shortExcerpt: string | null;
  translatorNote: string | null;

  confidence: "high" | "medium" | "low" | "unverified";
}

type AcquisitionClaimStatus =
  | "unadjudicated"
  | "ready-for-adjudication"
  | "blocked-missing-provenance"
  | "blocked-missing-locator"
  | "blocked-scope-ambiguity"
  | "blocked-school-ambiguity";

export interface AcquisitionClaim {
  claimId: string;
  familyId: string;
  proposition: string;

  schoolScope:
    | "nam-phai"
    | "trung-chau"
    | "shared"
    | "unresolved";

  requestedTemporalScope: string;
  requestedPalaceFrame: string;
  requestedTargetFrame: string;
  polarity: string | null;
  strength: string | null;

  sourceIds: string[];
  extractionIds: string[];

  acquisitionStatus: AcquisitionClaimStatus;

  unresolvedDimensions: string[];
  provenanceWarnings: string[];
}

export interface SourceCoverageMatrixRow {
  familyId: string;
  schoolScope: "nam-phai" | "trung-chau";

  dimensions: Record<string, DimensionAggregate>;
  evidenceSetMaturity: EvidenceSetMaturity;

  sourceIds: string[];
  extractionIds: string[];
  claimIds: string[];

  openGapIds: string[];
  partialGapIds: string[];
  closedGapIds: string[];
  conflictedGapIds: string[];
}

export interface SchoolEvidenceMatrixRow {
  familyId: string;
  schoolScope: "nam-phai" | "trung-chau";

  sourceIds: string[];
  verifiedSourceIds: string[];
  extractionIds: string[];
  claimIds: string[];

  directEvidenceCount: number;
  inferredEvidenceCount: number;
  analogyEvidenceCount: number;
  reportedUnverifiedCount: number;

  independentVerifiedSourceCount: number;

  supportedDimensions: string[];
  partialDimensions: string[];
  missingDimensions: string[];
  conflictedDimensions: string[];

  sourceGapState:
    | "open"
    | "partial"
    | "closed"
    | "conflicted";

  contradictionIds: string[];
  crossSchoolFallbackDetected: boolean;
  adjudicationReadyClaimIds: string[];

  notes: string[];
}

export interface AcquisitionSummary {
  packId: string;
  pillarId: string;

  familiesTargeted: number;
  schoolLanesTargeted: number;

  sourcesTotal: number;
  cataloguedSourceCount: number;
  inspectedSourceCount: number;
  verifiedSourceCount: number;
  sourcesMetadataOnly: number;
  sourcesNeedingVerification: number;

  claimsTotal: number;
  claimsReadyForAdjudication: number;
  blockedClaimCount: number;
  conflictingClaimCount: number;
  claimsBlockedByProvenance: number;
  claimsBlockedByScope: number;

  evidenceRecordsEmitted: number;
  verifiedEvidenceRecords: number;
  partialEvidenceRecords: number;
  cataloguedEvidenceRecords: number;
  openEvidenceRecords: number;

  uniqueTargetedSourceGaps: number;
  sourceGapsClosed: number;
  sourceGapsPartial: number;
  sourceGapsOpen: number;
  sourceGapsConflicted: number;

  adjudicationHandoffsCreated: number;
  claimGapsClosed: number;
  calculationCoreGapsClosed: number;
}

export interface GapSchoolLaneAssessment {
  gapId: string;
  familyId: string;
  schoolScope: "nam-phai" | "trung-chau";

  requiredObligationIds: string[];

  state:
    | "open"
    | "partial"
    | "closed"
    | "conflicted";

  matchedEvidenceRecordIds: string[];
  unresolvedReasons: string[];
}

interface GapStageReconciliation {
  sourceAcquisition:
    | "open"
    | "partial"
    | "closed"
    | "conflicted";

  claimAdjudication:
    | "open"
    | "handoff-ready"
    | "closed"
    | "conflicted";

  calculationCore:
    | "open"
    | "ready";

  matchedEvidenceRecordIds: string[];
  unresolvedReasons: string[];
}

export interface FinalGapAssessment {
  gapId: string;
  familyId: string;

  requiredSchoolScopes: Array<"nam-phai" | "trung-chau">;

  schoolLanes: GapSchoolLaneAssessment[];

  finalState:
    | "open"
    | "partial"
    | "closed"
    | "conflicted";

  stageStatus: GapStageReconciliation;

  unresolvedReasons: string[];
}

export interface SourceGapReconciliation {
  schemaVersion: string;
  packId: string;

  gaps: FinalGapAssessment[];

  totals: {
    unique: number;
    open: number;
    partial: number;
    closed: number;
    conflicted: number;
  };
}

export interface SourceObligationReport {
  schemaVersion: string;
  packId: string;
  obligations: EvidenceObligation[];
  totals: {
    required: number;
    optional: number;
    missing: number;
    catalogued: number;
    partial: number;
    verified: number;
    conflicted: number;
  };
}

export interface EvidenceScopeSnapshot {
  requestedTemporalScope: string | null;
  sourceTemporalScopes: string[];
  proposedTemporalScopes: string[];

  requestedPalaceFrame: string | null;
  sourcePalaceFrames: string[];
  proposedPalaceFrames: string[];

  requestedTargetFrame: string | null;
  sourceTargetFrames: string[];
  proposedTargetFrames: string[];
}

export type AcquisitionEvidenceStatus =
  | "metadata-only"
  | "partially-covered"
  | "still-open"
  | "source-verified"
  | "ready-for-adjudication";

export interface EvidenceGapEvidenceRecord {
  recordId: string;
  packId: string;
  gapId: string;
  familyId: string;
  schoolScope: "nam-phai" | "trung-chau";
  dimension: string;
  explicitness: EvidenceExplicitness;
  evidenceMaturity: EvidenceMaturity;
  provenanceQuality: string;
  status: AcquisitionEvidenceStatus;
  sourceEvidenceState: SourceEvidenceState;
  workflowState: AcquisitionWorkflowState;

  scopeSnapshot: EvidenceScopeSnapshot;

  sourceIds: string[];
  extractionIds: string[];
  claimIds: string[];

  dimensionAssessments: Record<string, DimensionAggregate>;

  unresolvedReasons: string[];
}

interface CoverageEvaluation {
  status:
    | "verified"
    | "partial"
    | "catalogued"
    | "missing"
    | "conflicted";

  explicitness: EvidenceExplicitness;

  matchedSourceIds: string[];
  matchedExtractionIds: string[];
  matchedClaimIds: string[];
  unresolvedReasons: string[];
}

export interface EvidenceSetMaturity {
  minimumMaturity: EvidenceMaturity;
  maximumMaturity: EvidenceMaturity;
  allSourcesVerified: boolean;
  allLocatorsVerified: boolean;
  independentSourceCount: number;
  minimumProvenanceQuality: string;
  maximumProvenanceQuality: string;
  unresolvedReasons: string[];
}

interface AcquisitionPackRegistryEntry {
  packId: string;
  pillarId: string;
  manifestPath: string;
  evidenceLedgerPath: string;
  enabled: boolean;
}

interface GapStageReconciliation {
  sourceAcquisition: "open" | "partial" | "closed" | "conflicted";
  claimAdjudication: "open" | "handoff-ready" | "closed" | "conflicted";
  calculationCore: "open" | "ready";
  matchedEvidenceRecordIds: string[];
  unresolvedReasons: string[];
}
