export type DiaLoiFamilyId = 'principal-star-dignity' | 'vcd-opposite-palace-borrowing';

export type SchoolScope = 'nam-phai' | 'trung-chau';

type DiaLoiPalaceFrame = 'active-major-fortune-palace' | 'natal-palace' | 'opposite-palace' | 'whole-axis' | 'unspecified';

type DiaLoiTargetFrame = 'active-major-fortune-palace' | 'opposite-palace' | 'whole-axis' | 'unspecified';

export type CanonicalDiaLoiDimension = 
  | 'existence' 
  | 'majorFortuneTemporalScope' 
  | 'palaceFrame' 
  | 'targetFrame' 
  | 'polarity' 
  | 'strength' 
  | 'exceptionPolicy' 
  | 'sourceLocatorQuality' 
  | 'crossSourceAgreement' 
  | 'schoolScope';

export interface CanonicalDiaLoiSourceObligation {
  obligationId: string;
  gapId: string;
  foundationClaimId: string | null;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  dimension: CanonicalDiaLoiDimension;
  required: boolean;
}

export interface SourceArtifactIntakeRecord {
  intakeId: string;
  discoverySourceId: string;
  localArtifactPath: string;
  acquisitionMethod: 
    | 'owned-physical-copy-scan' 
    | 'licensed-digital-copy' 
    | 'library-access' 
    | 'public-domain-archive' 
    | 'other-authorized-access';
  rightsNotes: string[];
  providedSha256?: string;
}

interface BibliographicMetadata {
  title: string | null;
  authorOrCompiler: string | null;
  translatorOrEditor: string | null;
  publisher: string | null;
  publicationYear: string | null;
  language: string | null;
}

export interface SourceDiscoveryLead {
  discoverySourceId: string;
  canonicalWorkCandidateId: string | null;
  editionCandidateId: string | null;
  schoolScope: SchoolScope;
  suppliedMetadata: BibliographicMetadata;
}

export interface CopyIdentityInspectionRecord {
  discoverySourceId: string;
  canonicalWorkId: string;
  editionIdentityId: string | null;
  identityDecision: 'unresolved' | 'verified' | 'rejected';
  verifiedBy: string | null;
  verificationNotes: string[];
}

export interface VerifiedSourceCopy {
  sourceId: string;
  canonicalWorkId: string;
  editionIdentityId: string | null;
  copyIdentityId: string;
  artifactSha256: string;
  inspectionStatus: 'acquired-uninspected' | 'inspected-unverified' | 'verified' | 'rejected';
  identityDecision: 'unresolved' | 'verified' | 'rejected';
  verifiedBy: string | null;
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
  inspectionDecision: 'located' | 'inspected' | 'verified' | 'rejected' | 'ambiguous';
  verifiedBy: string | null;
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
  bindingId: string;
  foundationClaimId: string;
  packClaimId: string;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  structuralStatus: 'valid' | 'invalid' | 'ambiguous';
  evidenceStatus: 'unverified' | 'partial' | 'verified' | 'rejected';
  matchedExtractionIds: string[];
  reasonCodes: string[];
}

export interface CanonicalObligationClaimMap {
  obligationId: string;
  foundationClaimId: string | null;
  mappingStatus: 'verified' | 'not-applicable' | 'unresolved';
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

interface SourceLineageRecord {
  canonicalWorkId: string;
  parentCanonicalWorkIds: string[];
  derivativeOfCanonicalWorkIds: string[];
  translationOfCanonicalWorkIds: string[];
  authorshipLineageId: string | null;
}

export interface CrossSourceAgreementResult {
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  dimension: string;
  claimId: string;
  candidateCanonicalWorkIds: string[];
  independentCanonicalWorkIds: string[];
  status: 'insufficient' | 'agreement' | 'conflict' | 'not-required';
  reasonCodes: string[];
}

interface ContradictionRecord {
  contradictionId: string;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  claimId: string;
  dimension: string;
  supportingExtractionIds: string[];
  contradictingExtractionIds: string[];
  severity: 'blocking' | 'non-blocking';
  resolutionStatus: 'unresolved' | 'resolved';
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

interface ArtifactManifestEntry {
  relativePath: string;
  sha256: string;
  byteLength: number;
}

