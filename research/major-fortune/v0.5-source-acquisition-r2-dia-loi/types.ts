export interface CanonicalSourceIdentity {
  canonicalWorkId: string;
  editionIdentityId: string;
  copyIdentityId: string;
}

export interface VerifiedSourceCopy {
  sourceId: string;
  canonicalWorkId: string;
  editionIdentityId: string;
  copyIdentityId: string;

  title: string;
  authorOrCompiler: string | null;
  translatorOrEditor: string | null;
  publisher: string | null;
  publicationYear: string | null;
  language: string;

  acquisitionMethod: string;
  archiveLocator: string;
  artifactSha256: string;

  inspectionStatus:
    | "not-acquired"
    | "acquired-uninspected"
    | "inspected"
    | "verified";

  verificationNotes: string[];
}

export interface VerifiedLocator {
  locatorId: string;
  sourceId: string;
  copyIdentityId: string;

  volume: string | null;
  chapter: string | null;
  section: string | null;
  pageStart: number | null;
  pageEnd: number | null;

  scanId: string | null;
  pageImageHashes: string[];

  verificationStatus:
    | "unverified"
    | "located"
    | "inspected"
    | "verified"
    | "rejected";

  verifiedBy: string | null;
  verificationNotes: string[];
}

export interface FoundationClaimBinding {
  foundationClaimId: string;
  packClaimId: string;

  familyId: string;
  schoolScope: "nam-phai" | "trung-chau";

  bindingStatus:
    | "verified"
    | "partial"
    | "rejected";

  reasonCodes: string[];
}

export interface DiaLoiStructuredExtraction {
  extractionId: string;
  claimId: string;

  familyId:
    | "principal-star-dignity"
    | "vcd-opposite-palace-borrowing";

  schoolScope:
    | "nam-phai"
    | "trung-chau";

  sourceId: string;
  canonicalWorkId: string;
  editionIdentityId: string;
  copyIdentityId: string;
  locatorId: string;

  proposition: string;

  temporalScope:
    | "natal"
    | "major-fortune"
    | "annual"
    | "monthly"
    | "unspecified";

  palaceFrame:
    | "active-major-fortune-palace"
    | "natal-palace"
    | "opposite-palace"
    | "whole-axis"
    | "unspecified";

  targetFrame:
    | "active-major-fortune-palace"
    | "opposite-palace"
    | "whole-axis"
    | "unspecified";

  polarity:
    | "support"
    | "pressure"
    | "conditional"
    | "neutral"
    | "unspecified";

  strength:
    | "weak"
    | "moderate"
    | "strong"
    | "unspecified";

  exceptionPolicy: string[];
  structuredValues: Record<string, string | number | boolean | null>;

  evidenceMaturity:
    | "catalogued-hypothesis"
    | "inspected"
    | "verified"
    | "conflicted";

  verificationNotes: string[];
}

export interface DiaLoiClaimAdjudication {
  adjudicationId: string;
  claimId: string;
  familyId: string;
  schoolScope: "nam-phai" | "trung-chau";

  decision:
    | "supported"
    | "conditionally-supported"
    | "mixed"
    | "contradicted"
    | "insufficient-evidence";

  supportingExtractionIds: string[];
  contradictingExtractionIds: string[];
  requiredObligationIds: string[];

  unresolvedReasons: string[];
}

export interface DiaLoiAdmissionAuthorization {
  familyId: string;
  schoolScope: "nam-phai" | "trung-chau";

  authorizedStatus:
    | "source-verified-candidate"
    | "blocked";

  approvedSourceObligationIds: string[];
  approvedClaimAdjudicationIds: string[];
  openContradictionIds: string[];

  blockingReasonCodes: string[];
}
