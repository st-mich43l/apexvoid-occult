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

  supportedFamilyIds: Array<
    | "principal-star-dignity"
    | "vcd-opposite-palace-borrowing"
  >;

  notes: string;
}

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
    | "inference";

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

  confidence: "high" | "medium" | "low";
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
  };
}

export interface AcquisitionSummary {
  sourcesTargeted: number;
  sourcesAcquired: number;

  verifiedCopySources: number;
  metadataOnlySources: number;
  sourcesNeedingVerification: number;

  extractionsCollected: number;

  claimsUnadjudicated: number;
  claimsReadyForAdjudication: number;
  claimsBlockedByProvenance: number;
  claimsBlockedByScope: number;

  familiesTargeted: number;
  familiesFullyCovered: number;
  familiesPartiallyCovered: number;

  dimensionsCoveredExplicitly: number;
  dimensionsCoveredByInference: number;
  dimensionsPartiallyCovered: number;
  dimensionsStillOpen: number;

  gapClosuresEmitted: number;
  gapsStillOpen: number;
}

export type AcquisitionEvidenceStatus =
  | "source-acquired"
  | "ready-for-adjudication"
  | "partially-covered"
  | "still-open";

export interface GapClosurePolicy {
  requiredSchools: Array<"nam-phai" | "trung-chau" | "shared">;
  requireVerifiedCopy: boolean;
  allowInference: boolean;
}

export interface EvidenceGapEvidenceRecord {
  recordId: string;
  gapId: string;

  familyId: string;

  schoolScope:
    | "nam-phai"
    | "trung-chau";

  dimension:
    | "existence"
    | "schoolScope"
    | "majorFortuneTemporalScope"
    | "palaceFrame"
    | "targetFrame"
    | "polarity"
    | "strength"
    | "pillarOwnership"
    | "stacking"
    | "deduplication"
    | "exceptionPolicy"
    | "sourceLocatorQuality"
    | "crossSourceAgreement"
    | "corpusMeasurability"
    | "calculationCoreReadiness";

  explicitness: "explicit" | "inferred" | "analogy" | "none";

  requestedTemporalScope: string | null;
  requestedPalaceFrame: string | null;
  requestedTargetFrame: string | null;

  status: AcquisitionEvidenceStatus;

  sourceIds: string[];
  extractionIds: string[];
  claimIds: string[];

  unresolvedReasons: string[];
}
