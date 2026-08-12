// R3 Địa Lợi source ingestion — canonical type definitions
// All types are independently defined for R3 (not imported from R2b).

export type DiaLoiFamilyId = 'principal-star-dignity' | 'vcd-opposite-palace-borrowing';
export type SchoolScope = 'nam-phai' | 'trung-chau';

type CanonicalDiaLoiDimension =
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

type AcquisitionMethod =
  | 'owned-physical-copy-scan'
  | 'licensed-digital-copy'
  | 'library-access'
  | 'public-domain-archive'
  | 'other-authorized-access';

// ─────────────────────────────────────────
// Discovery
// ─────────────────────────────────────────

interface BibliographicMetadata {
  title: string | null;
  authorOrCompiler: string | null;
  translatorOrEditor: string | null;
  publisher: string | null;
  publicationYear: string | null;
  language: string | null;
}

export interface DiscoverySourceLead {
  discoverySourceId: string;
  canonicalWorkCandidateId: string | null;
  editionCandidateId: string | null;
  schoolScope: SchoolScope;
  suppliedMetadata: BibliographicMetadata;
  discoveryStatus: 'lead';
}

// ─────────────────────────────────────────
// Source Lineage (NEW in R3)
// ─────────────────────────────────────────

type LineageStatus = 'verified' | 'partially-verified' | 'unknown';

export interface SourceLineageRecord {
  canonicalWorkId: string;
  authorshipLineageId: string | null;
  sourceTraditionId: string | null;
  translationOfCanonicalWorkId: string | null;
  derivedFromCanonicalWorkIds: string[];
  commentaryOnCanonicalWorkIds: string[];
  editionFamilyId: string | null;
  independenceNotes: string[];
  lineageStatus: LineageStatus;
}

// ─────────────────────────────────────────
// Artifact Intake
// ─────────────────────────────────────────

export interface ArtifactIntakeRecord {
  intakeId: string;
  discoverySourceId: string;
  /** Normalized relative path — no absolute filesystem paths */
  normalizedArtifactPath: string;
  acquisitionMethod: AcquisitionMethod;
  rightsNotes: string[];
  /** Optionally supplied SHA-256 for comparison; never trusted without verification */
  providedSha256?: string;
}

// ─────────────────────────────────────────
// Copy Identity
// ─────────────────────────────────────────

export interface CopyIdentityInspectionRecord {
  discoverySourceId: string;
  canonicalWorkId: string;
  editionIdentityId: string | null;
  schoolScope: SchoolScope;
  identityDecision: 'unresolved' | 'verified' | 'rejected';
  verifiedBy: string | null;
  verificationNotes: string[];
  lineageStatus: LineageStatus;
}

export interface VerifiedSourceCopy {
  copyIdentityId: string;
  canonicalWorkId: string;
  editionIdentityId: string | null;
  schoolScope: SchoolScope;
  sha256: string;
  byteLength: number;
  inspectionStatus: 'acquired-uninspected' | 'inspected-unverified' | 'verified' | 'rejected';
  identityDecision: 'unresolved' | 'verified' | 'rejected';
  verifiedBy: string | null;
  verificationNotes: string[];
  lineageStatus: LineageStatus;
}

// ─────────────────────────────────────────
// Locator
// ─────────────────────────────────────────

export interface LocatorInspectionRecord {
  locatorId: string;
  copyIdentityId: string;
  printedPageFrom: number | null;
  printedPageTo: number | null;
  digitalPageFrom: number | null;
  digitalPageTo: number | null;
  chapterOrSection: string | null;
  inspectedPageHashes: string[];
  inspectionStatus: 'verified' | 'rejected' | 'unresolved';
  inspectionNotes: string[];
}

export interface VerifiedLocator {
  locatorId: string;
  copyIdentityId: string;
  printedPageFrom: number | null;
  printedPageTo: number | null;
  digitalPageFrom: number | null;
  digitalPageTo: number | null;
  chapterOrSection: string | null;
  inspectedPageHashes: string[];
  verificationStatus: 'verified' | 'rejected' | 'unresolved';
  inspectionNotes: string[];
}

// ─────────────────────────────────────────
// Extraction
// ─────────────────────────────────────────

export interface SourceExtractionInput {
  extractionId: string;
  locatorId: string;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  claimId: string;

  subjectKey: string;
  predicateKey: string;
  objectKey: string | null;

  palaceFrameKey: string | null;
  targetFrameKey: string | null;

  strengthKey: string | null;
  exceptionPolicyKey: string | null;

  explicitStatementDimensions: CanonicalDiaLoiDimension[];
  polarity: 'supports' | 'contradicts' | 'qualifies' | 'unclear';
  majorFortuneTemporalScope: 'explicit' | 'implicit' | 'absent';

  reviewerNotes: string[];
  extractionStatus: 'verified' | 'rejected' | 'unresolved';
}

export interface ValidatedExtraction extends SourceExtractionInput {
  isValid: boolean;
  validationErrors: string[];
}

// ─────────────────────────────────────────
// Canonical Obligations
// ─────────────────────────────────────────

export interface CanonicalDiaLoiSourceObligation {
  obligationId: string;
  gapId: string;
  foundationClaimId: string | null;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  dimension: CanonicalDiaLoiDimension;
  required: boolean;
}

// ─────────────────────────────────────────
// Claim Binding
// ─────────────────────────────────────────

export interface FoundationClaimBinding {
  bindingId: string;
  foundationClaimId: string;
  packClaimId: string;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  /** Structural mapping is valid even if evidence is insufficient */
  structuralStatus: 'valid' | 'invalid';
  /** Evidence sufficiency is separate from structural validity */
  evidenceStatus: 'verified' | 'insufficient' | 'contradicted' | 'not-applicable';
  matchedExtractionIds: string[];
  reasonCodes: string[];
}

interface CanonicalObligationClaimMap {
  obligationId: string;
  foundationClaimId: string | null;
  mappingStatus: 'verified' | 'not-applicable' | 'unresolved';
  reasonCodes: string[];
}

// ─────────────────────────────────────────
// Obligation Evaluation
// ─────────────────────────────────────────

export interface ObligationEvaluationResult {
  obligationId: string;
  gapId: string;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  dimension: CanonicalDiaLoiDimension;
  status: 'verified' | 'blocked' | 'contradicted' | 'not-applicable';
  supportingExtractionIds: string[];
  contradictingExtractionIds: string[];
  verifiedLocatorIds: string[];
  verifiedCopyIds: string[];
  independentCanonicalWorkIds: string[];
  reasonCodes: string[];
}

// ─────────────────────────────────────────
// Evidence-Scoped Models (R3.1)
// ─────────────────────────────────────────

export interface EvidenceScopeKey {
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  claimId: string | null;
  dimension: string;
}

interface NormalizedResearchProposition {
  propositionId: string;

  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  claimId: string;

  subjectKey: string;
  predicateKey: string;
  objectKey: string | null;

  temporalScope:
    | 'major-fortune-explicit'
    | 'major-fortune-implicit'
    | 'non-major-fortune';

  palaceFrameKey: string | null;
  targetFrameKey: string | null;

  strengthKey: string | null;
  exceptionPolicyKey: string | null;

  semanticPolarity:
    | 'supports'
    | 'qualifies'
    | 'contradicts';

  dimensionCoverage: CanonicalDiaLoiDimension[];

  reviewStatus:
    | 'verified'
    | 'unresolved'
    | 'rejected';
}

export interface EvidenceBearingWork {
  canonicalWorkId: string;
  copyIdentityIds: string[];
  locatorIds: string[];
  extractionIds: string[];

  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  claimId: string | null;

  propositionKey: string;

  supportPolarity: 'supports' | 'qualifies' | 'contradicts';

  lineageRecordId: string;
  authorshipLineageId: string | null;
  sourceTraditionId: string | null;
}

// ─────────────────────────────────────────
// Independence
// ─────────────────────────────────────────

export interface SourceIndependenceEntry {
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  claimId: string | null;
  dimension: string;

  candidateCanonicalWorkIds: string[];
  evidenceBearingCanonicalWorkIds: string[];
  independentCanonicalWorkIds: string[];

  propositionId: string | null;

  status:
    | 'independent-agreement'
    | 'independent-conflict'
    | 'dependent'
    | 'unknown'
    | 'insufficient';

  blockerReasonCodes: string[];

  evidence: Array<{
    canonicalWorkId: string;
    copyIdentityIds: string[];
    locatorIds: string[];
    extractionIds: string[];
    lineageRecordId: string;
  }>;
}

// ─────────────────────────────────────────
// Claim Adjudication
// ─────────────────────────────────────────

export interface ClaimAdjudicationResult {
  adjudicationId: string;
  claimId: string;
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  outcome: 'supported' | 'qualified' | 'contradicted' | 'insufficient-evidence' | 'not-applicable';
  obligationIds: string[];
  supportingExtractionIds: string[];
  contradictingExtractionIds: string[];
  verifiedSourceCopyIds: string[];
  verifiedLocatorIds: string[];
  independenceResult: SourceIndependenceEntry | null;
  majorFortuneTemporalScopeResult: 'explicit' | 'implicit' | 'absent' | 'not-evaluated';
  schoolScope_confirmed: SchoolScope;
  reasonCodes: string[];
}

// ─────────────────────────────────────────
// Lane Authorization
// ─────────────────────────────────────────

export interface LaneAuthorization {
  familyId: DiaLoiFamilyId;
  schoolScope: SchoolScope;
  authorizedStatus: 'source-verified-candidate' | 'blocked';
  approvedObligationIds: string[];
  approvedClaimAdjudicationIds: string[];
  approvedExtractionIds: string[];
  approvedVerifiedCopyIds: string[];
  approvedIndependentCanonicalWorkIds: string[];
  primaryBlockingReasonCodes: string[];
  diagnosticReasonCodes: string[];
}

// ─────────────────────────────────────────
// Decision
// ─────────────────────────────────────────

export type R3DecisionCode =
  | 'PROMOTE_DIA_LOI_LANES_TO_SOURCE_VERIFIED_CANDIDATE'
  | 'KEEP_DIA_LOI_BLOCKED_MISSING_ARTIFACTS'
  | 'KEEP_DIA_LOI_BLOCKED_MISSING_PROVENANCE'
  | 'KEEP_DIA_LOI_BLOCKED_MISSING_TEMPORAL_SCOPE'
  | 'KEEP_DIA_LOI_BLOCKED_INSUFFICIENT_INDEPENDENT_SOURCES'
  | 'KEEP_DIA_LOI_BLOCKED_CONFLICTED_DOCTRINE'
  | 'KEEP_DIA_LOI_BLOCKED_INCOMPLETE_ADJUDICATION'
  | 'KEEP_DIA_LOI_BLOCKED_INVALID_PACK';

export interface R3Decision {
  decision: R3DecisionCode;
  reasonCodes: string[];
  promotedLanes: Array<{ familyId: string; schoolScope: string }>;
  blockedLanes: Array<{ familyId: string; schoolScope: string; reasonCodes: string[] }>;
  lanes: Array<{
    familyId: string;
    schoolScope: string;
    status: 'source-verified-candidate' | 'blocked';
    reasonCodes: string[];
  }>;
}

// ─────────────────────────────────────────
// Pack state (passed through generation)
// ─────────────────────────────────────────

interface R3PackState {
  discoveryLeads: DiscoverySourceLead[];
  intakes: ArtifactIntakeRecord[];
  copyInspections: CopyIdentityInspectionRecord[];
  lineageRegistry: SourceLineageRecord[];
  locatorInspections: LocatorInspectionRecord[];
  extractionInputs: SourceExtractionInput[];
  bindingInputs: FoundationClaimBinding[];
  claimInputs: Array<{ claimId: string; familyId: DiaLoiFamilyId; schoolScope: SchoolScope }>;
  obligations: CanonicalDiaLoiSourceObligation[];

  // Computed
  verifiedCopies: VerifiedSourceCopy[];
  verifiedLocators: VerifiedLocator[];
  validatedExtractions: ValidatedExtraction[];
  evaluatedBindings: FoundationClaimBinding[];
  independenceEntries: SourceIndependenceEntry[];
  obligationEvaluations: ObligationEvaluationResult[];
  claimAdjudications: ClaimAdjudicationResult[];
  laneAuthorizations: LaneAuthorization[];
  decision: R3Decision;
}
