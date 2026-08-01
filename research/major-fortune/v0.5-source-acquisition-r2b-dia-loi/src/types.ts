export type DiaLoiFamilyId = 'principal-star-dignity' | 'vcd-opposite-palace-borrowing';
export type SchoolScope = 'nam-phai' | 'trung-chau';
export type DiaLoiPalaceFrame = 'active-major-fortune-palace' | 'natal-palace' | 'opposite-palace' | 'whole-axis' | 'unspecified';
export type DiaLoiTargetFrame = 'active-major-fortune-palace' | 'opposite-palace' | 'whole-axis' | 'unspecified';

export interface SourceArtifactIntakeRecord {
  intakeId: string;
  discoverySourceId: string;
  localArtifactPath: string;
  expectedCanonicalWorkId: string | null;
  expectedEditionIdentityId: string | null;
  acquisitionMethod: 'owned-physical-copy-scan' | 'licensed-digital-copy' | 'library-access' | 'public-domain-archive' | 'other-authorized-access';
  rightsNotes: string[];
  suppliedMetadata: {
    title: string | null;
    authorOrCompiler: string | null;
    translatorOrEditor: string | null;
    publisher: string | null;
    publicationYear: string | null;
    language: string | null;
  };
}

export interface SourceCopyVerificationResult {
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
  inspectionStatus: 'not-acquired' | 'acquired-uninspected' | 'inspected-unverified' | 'verified' | 'rejected';
  verificationNotes: string[];
}

export interface LocatorInspectionRecord {
  locatorId: string;
  copyIdentityId: string;
  pageStart: number | null;
  pageEnd: number | null;
  chapter: string | null;
  section: string | null;
  inspectedPageArtifactPaths: string[];
  inspectionDecision: 'located' | 'not-found' | 'ambiguous';
  inspectionNotes: string[];
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
  verificationStatus: 'unverified' | 'located' | 'inspected' | 'verified' | 'rejected' | 'ambiguous';
  verifiedBy: string | null;
  verificationNotes: string[];
}

export interface FoundationClaimBinding {
  foundationClaimId: string;
  packClaimId: string;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  structuralStatus: 'valid' | 'invalid' | 'ambiguous';
  evidenceStatus: 'unverified' | 'partial' | 'verified' | 'rejected';
  reasonCodes: string[];
}

export interface DiaLoiExtractionInput {
  extractionId: string;
  locatorId: string;
  claimId: string;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  propositionParaphrase: string;
  explicitStatementDimensions: string[];
  inferredDimensions: string[];
  unsupportedDimensions: string[];
  temporalScope: 'major-fortune' | 'natal' | 'annual' | 'monthly' | 'unspecified';
  palaceFrame: DiaLoiPalaceFrame;
  targetFrame: DiaLoiTargetFrame;
  polarity: 'support' | 'pressure' | 'conditional' | 'neutral' | 'unspecified';
  strength: 'weak' | 'moderate' | 'strong' | 'unspecified';
  exceptionPolicy: string[];
  researcherNotes: string[];
}

export interface DiaLoiObligationEvaluation {
  obligationId: string;
  gapId: string;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  dimension: string;
  state: 'missing' | 'catalogued' | 'partial' | 'verified' | 'conflicted';
  matchedCopyIds: string[];
  matchedLocatorIds: string[];
  matchedExtractionIds: string[];
  matchedClaimBindingIds: string[];
  reasonCodes: string[];
}

export interface CrossSourceAgreementResult {
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  dimension: string;
  candidateCanonicalWorkIds: string[];
  independentCanonicalWorkIds: string[];
  status: 'insufficient' | 'agreement' | 'conflict' | 'not-required';
  reasonCodes: string[];
}

export interface DiaLoiClaimAdjudication {
  adjudicationId: string;
  claimId: string;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  decision: 'supported' | 'conditionally-supported' | 'mixed' | 'contradicted' | 'insufficient-evidence';
  supportingExtractionIds: string[];
  contradictingExtractionIds: string[];
  requiredObligationIds: string[];
  unresolvedReasons: string[];
}

export interface DiaLoiAdmissionAuthorization {
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  authorizedStatus: 'source-verified-candidate' | 'blocked';
  approvedSourceObligationIds: string[];
  approvedClaimAdjudicationIds: string[];
  openContradictionIds: string[];
  blockingReasonCodes: string[];
}
