export type SourceAuthorityClass =
  | "classical-text"
  | "school-manual"
  | "named-commentary"
  | "modern-reference"
  | "research-summary"
  | "engineering-policy";

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

  locators: Array<{
    locatorId: string;
    volume: string | null;
    chapter: string | null;
    section: string | null;
    pageStart: number | null;
    pageEnd: number | null;
    scanId: string | null;
    extractionId: string | null;
  }>;

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
  familyId: "principal-star-dignity" | "vcd-opposite-palace-borrowing";

  schoolScope: "nam-phai" | "trung-chau" | "shared" | "unresolved";

  statementType:
    | "explicit-rule"
    | "example"
    | "exception"
    | "definition"
    | "commentary"
    | "inference";

  temporalScope:
    | "natal"
    | "major-fortune"
    | "annual"
    | "transit-general"
    | "unresolved";

  palaceFrame:
    | "active-major-fortune-palace"
    | "opposite-palace"
    | "natal-palace"
    | "multi-palace"
    | "unresolved";

  targetFrame:
    | "active-palace"
    | "opposite-palace"
    | "principal-star"
    | "full-configuration"
    | "interpretive-reference"
    | "unresolved";

  normalizedSummary: string;
  shortExcerpt: string | null;
  translatorNote: string | null;
  confidence: "high" | "medium" | "low";
}

export interface ResearchClaim {
  claimId: string;
  familyId: string;
  proposition: string;
  schoolScope: string;
  temporalScope: string;
  palaceFrame: string;
  targetFrame: string;
  polarity: string | null;
  strength: string | null;
  sourceIds: string[];
  extractionIds: string[];

  adjudicationStatus:
    | "unadjudicated"
    | "supported-single-source"
    | "supported-multiple-sources"
    | "conflicted"
    | "unsupported";
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
  extractionsCollected: number;
  claimsUnadjudicated: number;
  familiesCovered: number;
  familiesPartiallyCovered: number;
}
