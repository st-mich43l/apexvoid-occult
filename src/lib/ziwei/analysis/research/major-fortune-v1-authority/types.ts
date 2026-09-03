export type AuthorityState =
  | "CALCULATION_CORE_FACT"
  | "VERIFIED_PRIMARY_DOCTRINE"
  | "VERIFIED_SCHOOL_DOCTRINE"
  | "SOURCED_NUMERIC_AUTHORITY"
  | "ENGINEERING_POLICY"
  | "FROZEN_INHERITED_FORMULA"
  | "RESEARCH_HYPOTHESIS"
  | "PLACEHOLDER"
  | "HISTORICAL_ONLY"
  | "UNRESOLVED"
  | "NOT_IMPLEMENTED";

export type ResearchAdmission =
  | "RESEARCH_ADMITTED"
  | "CONTEXT_ONLY"
  | "BLOCKED"
  | "SOURCE_OBLIGATION_OPEN"
  | "NOT_IMPLEMENTED";

export type ClaimStatus =
  | "VERIFIED"
  | "PARTIAL"
  | "ENGINEERING"
  | "SOURCE_OBLIGATION_OPEN"
  | "BLOCKED"
  | "NOT_IMPLEMENTED";

type SchoolScope =
  | "shared"
  | "nam-phai"
  | "trung-chau"
  | "per-school"
  | "unknown"
  | "engineering";

interface AuthorityManifest {
  schemaVersion: string;
  packId: string;
  candidateId: "major-fortune-engine-v1@1.0.0-rc.1";
  lifecycle: "RESEARCH_ONLY";
  runtimeAuthority: false;
  releaseAuthority: false;
  scoringAuthority: false;
  scoreImpactAllowed: false;
  candidateMutationAllowed: false;
  sourceRegistryRefs: string[];
  priorAuditRefs: string[];
  notes: string[];
}

export interface SourceWitness {
  witnessId: string;
  canonicalRegistryPath: string;
  canonicalSourceId: string;
  schoolScope: SchoolScope;
  authorityRole: string;
  locatorStatus: "EXACT_REPOSITORY_REFERENCE" | "EXACT_CLAIM_LOCATOR" | "PARTIAL_LOCATOR" | "BIBLIOGRAPHIC_ONLY" | "NONE";
  allowedUsage: string[];
  prohibitedUsage: string[];
  claimSupportAllowed: string;
  numericAuthorityAllowed: boolean;
  currentUsability: string;
  notes: string;
}

export interface ClaimAuthority {
  claimAuthorityId: string;
  evidenceFamily: string;
  schoolScope: SchoolScope;
  temporalScope: string;
  physicalFactAuthority: AuthorityState;
  doctrineAuthority: AuthorityState;
  numericAuthority: AuthorityState;
  currentWitnessIds: string[];
  historicalClaimIds: string[];
  claimStatus: ClaimStatus;
  sourceObligationIds: string[];
  researchAdmission: ResearchAdmission;
  releaseAdmission: "BLOCKED" | "NOT_IMPLEMENTED";
  notes: string;
}

export interface NumericPolicyRecord {
  recordId: string;
  surfaceIds?: string[];
  surfacePattern?: string;
  patternSource?: "RC1_STAR_CATALOG";
  patternValues?: string[];
  axes?: string[];
  authority: Exclude<AuthorityState, "CALCULATION_CORE_FACT" | "HISTORICAL_ONLY" | "NOT_IMPLEMENTED">;
  sourceWitnessIds?: string[];
  notes: string;
}

export interface AdmissionPolicy {
  familyId: string;
  physicalFactRequirement: string[];
  doctrineRequirement: string[];
  numericAuthorityRequirement: string[];
  currentResearchAdmission: ResearchAdmission;
  currentReleaseAdmission: "BLOCKED" | "NOT_IMPLEMENTED";
  blockingReasonCodes: string[];
  sourceObligationIds: string[];
}

export interface HistoricalMigration {
  historicalId: string;
  historicalType: "source" | "claim";
  historicalPath: string;
  historicalStatus: "DELETED_PROVENANCE_ONLY" | "INVALIDATED";
  currentAuthorityStatus: "NO_CURRENT_EQUIVALENT" | "PARTIAL_CURRENT_WITNESS" | "CURRENT_EQUIVALENT";
  replacementId: string | null;
  migrationAllowed: boolean;
  reason: string;
}

interface SourceObligation {
  obligationId: string;
  topic: string;
  priority: "P0" | "P1" | "P2";
  schoolScope: SchoolScope;
  evidenceFamily: string;
  requiredSourceTier: string;
  requiredLocatorType: string;
  currentWitnessIds: string[];
  currentStatus: "OPEN" | "PARTIAL" | "SATISFIED" | "BLOCKED";
  missingEvidence: string[];
  blockingCapabilities: string[];
  notes: string;
}

export interface AuthorityPack {
  manifest: AuthorityManifest;
  witnesses: SourceWitness[];
  claims: ClaimAuthority[];
  numericPolicies: NumericPolicyRecord[];
  admissionPolicies: AdmissionPolicy[];
  historicalMigrations: HistoricalMigration[];
  obligations: SourceObligation[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface AuthorityResolution {
  occurrenceId: string;
  evidenceId: string;
  evidenceFamily: string;
  category: string;
  school: string;
  runtimeLabel: string;
  physicalFactAuthority: AuthorityState;
  doctrineAuthority: AuthorityState;
  numericAuthority: AuthorityState;
  claimStatus: ClaimStatus;
  researchAdmission: ResearchAdmission;
  releaseAdmission: "BLOCKED" | "NOT_IMPLEMENTED";
  historicalIds: string[];
  sourceObligationIds: string[];
}

export interface AuthorityReport {
  schemaVersion: "pr268-major-fortune-v1-authority.v1";
  generationId: "major-fortune/v1-authority-v0.1";
  generatedFrom: {
    baseSha: string;
    candidate: "major-fortune-engine-v1@1.0.0-rc.1";
    baseline: "major-fortune-v0.5-production";
  };
  authority: {
    totalEvidence: number;
    physicalFactAuthorityResolved: number;
    verifiedPrimaryDoctrine: number;
    verifiedSchoolDoctrine: number;
    engineeringDoctrineOrPolicy: number;
    researchHypothesis: number;
    placeholder: number;
    historicalOnly: number;
    unresolved: number;
    unclassifiedAuthorityCount: number;
  };
  admission: {
    researchAdmitted: number;
    contextOnly: number;
    blocked: number;
    sourceObligationOpen: number;
    notImplemented: number;
  };
  evidenceFamilies: Array<{
    familyId: string;
    physicalFactAuthority: AuthorityState;
    doctrineAuthority: AuthorityState;
    numericAuthority: AuthorityState;
    claimStatus: ClaimStatus;
    researchAdmission: ResearchAdmission;
    releaseAdmission: "BLOCKED" | "NOT_IMPLEMENTED";
    sourceObligationIds: string[];
  }>;
  historicalIds: {
    occurrenceCount: number;
    idsObserved: number;
    idsResolved: number;
    idsWithNoCurrentEquivalent: number;
    records: Array<HistoricalMigration & { occurrenceCount: number; authorityResolution: string }>;
  };
  numeric: {
    numericPolicyCount: number;
    sourcedCount: number;
    engineeringCount: number;
    frozenInheritedCount: number;
    hypothesisCount: number;
    placeholderCount: number;
    unresolvedCount: number;
    surfaces: Array<{ surfaceId: string; authority: NumericPolicyRecord["authority"] }>;
  };
  sourceObligations: {
    open: number;
    partial: number;
    satisfied: number;
    blocked: number;
    records: SourceObligation[];
  };
  resolutions: AuthorityResolution[];
  decision: "MFV1_AUTHORITY_FOUNDATION_REBUILT" | "MFV1_AUTHORITY_FOUNDATION_PARTIAL" | "MFV1_REQUIRES_SOURCE_ACQUISITION";
}
