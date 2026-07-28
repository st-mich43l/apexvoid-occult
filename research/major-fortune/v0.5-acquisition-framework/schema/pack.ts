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

export interface SourceExtractionRecord {
  extractionId: string;
  sourceId: string;
  locatorId: string;
  familyId: string;
  schoolScope: string;

  statementType:
    | "explicit-rule"
    | "definition"
    | "example"
    | "exception"
    | "commentary"
    | "inference"
    | "reported-rule"
    | "catalogued-rule"
    | "unverified-rule";

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

  inspectedSourceCount: number;
  verifiedLocatorCount: number;
  explicitMajorFortuneClaimCount: number;
  natalOnlyClaimCount: number;
  unresolvedTemporalScopeCount: number;
  conflictingClaimCount: number;

  coverage: {
    existence: "covered" | "partial" | "missing";
    temporalScope: "covered" | "partial" | "missing";
    palaceFrame: "covered" | "partial" | "missing";
    targetFrame: "covered" | "partial" | "missing";
    polarity: "covered" | "partial" | "missing";
    strength: "covered" | "partial" | "missing";
    exceptionPolicy: "covered" | "partial" | "missing";
    sourceLocatorQuality: "covered" | "partial" | "missing";
    crossSourceAgreement: "covered" | "partial" | "missing";
    schoolScope: "covered" | "partial" | "missing";
  };
}

export interface AcquisitionSummary {
  packId: string;
  pillarId: string;

  familiesTargeted: number;
  schoolLanesTargeted: number;

  sourcesTotal: number;
  sourcesVerified: number;
  sourcesMetadataOnly: number;

  claimsTotal: number;
  claimsReadyForAdjudication: number;
  claimsBlockedByProvenance: number;
  claimsBlockedByScope: number;

  evidenceRecordsEmitted: number;
  verifiedEvidenceRecords: number;
  partialEvidenceRecords: number;
  cataloguedEvidenceRecords: number;
  openEvidenceRecords: number;

  sourceGapsClosed: number;
  sourceGapsPartial: number;
  sourceGapsOpen: number;

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
  explicitness: "explicit" | "inferred" | "analogy" | "unverified" | "none";
  evidenceMaturity: EvidenceMaturity;
  provenanceQuality: string;
  status: AcquisitionEvidenceStatus;
  
  requestedTemporalScope: string | null;
  requestedPalaceFrame: string | null;
  requestedTargetFrame: string | null;

  sourceIds: string[];
  extractionIds: string[];
  claimIds: string[];

  unresolvedReasons: string[];
}

export interface CoverageEvaluation {
  status:
    | "verified"
    | "partial"
    | "catalogued"
    | "missing"
    | "conflicted";

  explicitness:
    | "explicit"
    | "inferred"
    | "analogy"
    | "unverified"
    | "none";

  sourceIds: string[];
  extractionIds: string[];
  claimIds: string[];
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
  sourceAcquisition: "open" | "partial" | "closed";
  claimAdjudication: "open" | "handoff-ready" | "closed";
  calculationCore: "open";
  matchedEvidenceRecordIds: string[];
  unresolvedReasons: string[];
}
