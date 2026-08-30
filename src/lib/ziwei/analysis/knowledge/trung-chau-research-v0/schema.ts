/**
 * Trung Châu Research Pack V0 — research-only types.
 * Not ChartData. Not Calculation Core authority. Not narrative authority.
 */

export type ResearchPackStatus = "incomplete" | "research_only";

export type SourceType =
  | "primary_text"
  | "school_authority"
  | "academic_or_bibliographic"
  | "recognized_commentary"
  | "secondary_commentary"
  | "community_or_forum"
  | "internal_engineering";

export type ClaimStatus =
  | "unverified"
  | "source_supported"
  | "source_conflicted"
  | "expert_pending"
  | "rejected";

export type ResearchVerdict =
  | "insufficient_evidence"
  | "supported"
  | "conflicted"
  | "expert_pending";

export type ContradictionStatus =
  | "open"
  | "resolved"
  | "insufficient_evidence"
  | "expert_pending";

export type FutureRuntimeAction = "none" | "separate_pr_after_expert_review";

export type ResearchConfidence = "high" | "medium" | "low" | "unrated";

export type ResearchPriority = "P0" | "P1" | "P2";

export interface PackMeta {
  packId: string;
  schemaVersion: string;
  school: "trung-chau";
  researchStage: "V0";
  status: ResearchPackStatus;
  runtimeAuthority: false;
  runtimeImpact: "none";
  narrativeAuthority: false;
  notes?: string;
}

export interface ResearchSource {
  sourceId: string;
  title: string;
  sourceType: SourceType;
  allowedUsage: string[];
  prohibitedUsage: string[];
  confidence?: ResearchConfidence;
  author?: string;
  edition?: string;
  publication?: string;
  year?: string;
  language?: string;
  url?: string;
  locator?: string;
  accessDate?: string;
  notes?: string;
  /** In-repo bibliographic shell cross-reference (not new primary evidence). */
  relatedRepoSourceId?: string;
}

export interface ResearchClaim {
  claimId: string;
  school: "trung-chau";
  summary: string;
  sourceRefs: string[];
  locatorNotes?: string;
  status: ClaimStatus;
  confidence?: ResearchConfidence;
  expertReviewRequired?: boolean;
  notes?: string;
}

export interface ResearchQueueItem {
  researchId: string;
  topic: string;
  priority: ResearchPriority;
  question: string;
  relatedPolicyIds?: string[];
  relatedClaimIds?: string[];
  relatedExpertReviewIds?: string[];
}

export interface SourceRegistryCatalog {
  schemaVersion: string;
  registryId: string;
  status: ResearchPackStatus;
  school: "trung-chau";
  meta: PackMeta;
  sources: ResearchSource[];
  claims: ResearchClaim[];
  researchQueue: ResearchQueueItem[];
}

export interface RuntimeObservation {
  observationId: string;
  topic: string;
  school: "trung-chau";
  path: string;
  symbol: string;
  observedBehavior: string | string[];
  contrastSchool?: string;
  contrastBehavior?: string | string[];
  expertReviewRef?: string;
  notes?: string;
}

export interface RuntimeObservationsCatalog {
  schemaVersion: string;
  catalogId: string;
  school: "trung-chau";
  status: ResearchPackStatus;
  notes?: string;
  observations: RuntimeObservation[];
}

export interface DoctrineMatrixRow {
  policyId: string;
  topic: string;
  school: "trung-chau";
  runtimeObservationRef: string | null;
  claimRefs: string[];
  sourceRefs: string[];
  researchStatus: ClaimStatus;
  researchVerdict: ResearchVerdict;
  contradictionRefs: string[];
  expertReviewRefs: string[];
  notes?: string;
  futureRuntimeAction: FutureRuntimeAction;
}

export interface DoctrineMatrixCatalog {
  schemaVersion: string;
  catalogId: string;
  school: "trung-chau";
  status: ResearchPackStatus;
  notes?: string;
  rows: DoctrineMatrixRow[];
}

export interface TerminologyEntry {
  termId: string;
  canonicalResearchLabel: string;
  sourceForms: string[];
  internalRuntimeTerm?: string | null;
  sourceRefs: string[];
  notes?: string;
  status: ClaimStatus;
}

export interface TerminologyCatalog {
  schemaVersion: string;
  catalogId: string;
  school: "trung-chau";
  status: ResearchPackStatus;
  terms: TerminologyEntry[];
}

export interface ContradictionRecord {
  contradictionId: string;
  topic: string;
  claimRefs: string[];
  sourceRefs: string[];
  description: string;
  status: ContradictionStatus;
  expertReviewRequired: boolean;
  resolution: string | null;
  expertReviewRefs?: string[];
}

export interface ContradictionsCatalog {
  schemaVersion: string;
  catalogId: string;
  school: "trung-chau";
  status: ResearchPackStatus;
  contradictions: ContradictionRecord[];
}

export interface ExpertReviewRecord {
  reviewId: string;
  question: string;
  currentRuntimePositions: Record<string, string>;
  claimRefs: string[];
  sourceRefs: string[];
  evidenceForPositionA: string[];
  evidenceForPositionB: string[];
  unresolvedPoints: string[];
  status: "open" | "expert_pending" | "resolved";
  reviewRequired: boolean;
  notes?: string;
}

export interface ExpertReviewCatalog {
  schemaVersion: string;
  catalogId: string;
  school: "trung-chau";
  status: ResearchPackStatus;
  reviews: ExpertReviewRecord[];
}

export interface TrungChauResearchPackV0 {
  meta: PackMeta;
  sourceRegistry: SourceRegistryCatalog;
  runtimeObservations: RuntimeObservationsCatalog;
  doctrineMatrix: DoctrineMatrixCatalog;
  terminology: TerminologyCatalog;
  contradictions: ContradictionsCatalog;
  expertReview: ExpertReviewCatalog;
}

export interface ResearchValidationIssue {
  path: string;
  message: string;
}

export interface ResearchValidationResult {
  ok: boolean;
  issues: ResearchValidationIssue[];
}
