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
  };

  generatedOutputs: {
    evidenceLedger: string;
    coverageMatrix: string;
    schoolMatrix: string;
    handoffQueue: string;
    summary: string;
  };
}

export type SourceAuthorityClass =
  | "classical-text"
  | "school-manual"
  | "named-commentary"
  | "modern-reference"
  | "research-summary"
  | "engineering-policy";

export type SourceAcquisitionMethod =
  | "physical-scan"
  | "digital-scan"
  | "library-copy"
  | "publisher-copy"
  | "personal-copy"
  | "metadata-only";

export interface SourceCopyIdentity {
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

  copyIdentity: SourceCopyIdentity;
  locators: SourceLocator[];

  supportedFamilyIds: string[]; // No longer hard-coded enum

  notes: string;
}

export type EvidenceMaturity =
  | "catalogued-hypothesis"
  | "located-unverified"
  | "inspected-extraction"
  | "verified-extraction";

export type SourceEvidenceState =
  | "missing"
  | "catalogued"
  | "located-unverified"
  | "verified-inferred"
  | "verified-explicit"
  | "conflicted";

export type AcquisitionWorkflowState =
  | "source-open"
  | "source-partial"
  | "source-closed"
  | "adjudication-open"
  | "handoff-ready";

export type ReportedStatementForm =
  | "rule"
  | "definition"
  | "example"
  | "exception"
  | "commentary"
  | "inference"
  | "unresolved";

export type EvidenceExplicitness =
  | "verified-explicit"
  | "verified-inferred"
  | "reported-unverified"
  | "analogy"
  | "none";

export interface DimensionAssessment {
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

export interface DimensionAggregate {
  outcome:
    | "missing"
    | "catalogued"
    | "partial"
    | "verified"
    | "conflicted";

  minimumMaturity: EvidenceMaturity;
  maximumMaturity: EvidenceMaturity;

  bestEvidenceState: SourceEvidenceState;
  blockingEvidenceState: SourceEvidenceState;

  requestedValues: string[];
  sourceValues: string[];
  proposedValues: string[];

  matchedClaimIds: string[];
  matchedExtractionIds: string[];
  matchedSourceIds: string[];
  matchedLocatorIds: string[];

  directPathCount: number;
  inferredPathCount: number;
  analogyPathCount: number;
  reportedUnverifiedPathCount: number;

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

export type AcquisitionClaimStatus =
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

  requestedTemporalScope: string | null;
  requestedPalaceFrame: string | null;
  requestedTargetFrame: string | null;

  sourceIds: string[];
  extractionIds: string[];
  claimIds: string[];

  dimensionAssessments: Record<string, DimensionAggregate>;

  unresolvedReasons: string[];
}

export interface CoverageEvaluation {
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

export interface AcquisitionPackRegistryEntry {
  packId: string;
  pillarId: string;
  manifestPath: string;
  evidenceLedgerPath: string;
  enabled: boolean;
}

export interface GapStageReconciliation {
  sourceAcquisition: "open" | "partial" | "closed" | "conflicted";
  claimAdjudication: "open" | "handoff-ready" | "closed" | "conflicted";
  calculationCore: "open" | "ready";
  matchedEvidenceRecordIds: string[];
  unresolvedReasons: string[];
}
