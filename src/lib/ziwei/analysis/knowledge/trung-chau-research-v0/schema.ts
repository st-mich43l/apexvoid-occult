/**
 * Trung Châu Research Pack V0 — research-only types.
 * Not ChartData. Not Calculation Core authority. Not narrative authority.
 */

type ResearchPackStatus = "incomplete" | "research_only";

export type ResearchStage = "V0" | "V0.1";

export type RuntimeAlignment =
  | "aligned"
  | "mismatch"
  | "not_applicable"
  | "unknown";

export type ContradictionType = "runtime_vs_source" | "source_vs_source";

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

type ResearchVerdict =
  | "insufficient_evidence"
  | "supported"
  | "conflicted"
  | "expert_pending";

type ContradictionStatus =
  | "open"
  | "resolved"
  | "insufficient_evidence"
  | "expert_pending";

type FutureRuntimeAction = "none" | "separate_pr_after_expert_review";

type ResearchConfidence = "high" | "medium" | "low" | "unrated";

type ResearchPriority = "P0" | "P1" | "P2";

export interface PackMeta {
  packId: string;
  schemaVersion: string;
  school: "trung-chau";
  researchStage: ResearchStage;
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
  /** Bibliographic identity record for an attributed work (not doctrine text). */
  bibliographicIdentityRef?: string;
  /** Another reproduction of the same underlying attributed work. */
  reproductionOf?: string;
  /** Host / republication context for web reproductions. */
  host?: string;
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

interface ResearchQueueItem {
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

interface RuntimeObservation {
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

interface DoctrineMatrixRow {
  policyId: string;
  topic: string;
  school: "trung-chau";
  runtimeObservationRef: string | null;
  claimRefs: string[];
  sourceRefs: string[];
  researchStatus: ClaimStatus;
  researchVerdict: ResearchVerdict;
  /** Runtime engineering vs inspected source — separate from researchVerdict. */
  runtimeAlignment?: RuntimeAlignment;
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

interface TerminologyEntry {
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

interface ContradictionRecord {
  contradictionId: string;
  topic: string;
  contradictionType?: ContradictionType;
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

export interface ExpertReviewCell {
  stem: string;
  mutagen: string;
  runtime: {
    "nam-phai": string;
    "trung-chau": string;
  };
  researchPositions: Array<{
    value: string;
    sourceRefs: string[];
  }>;
  runtimeAlignment: RuntimeAlignment;
  status: "expert_pending" | "resolved";
}

interface ExpertReviewRecord {
  reviewId: string;
  question: string;
  currentRuntimePositions: Record<string, string>;
  cells?: ExpertReviewCell[];
  claimRefs: string[];
  sourceRefs: string[];
  evidenceForPositionA: string[];
  evidenceForPositionB: string[];
  unresolvedPoints: string[];
  status: "open" | "expert_pending" | "resolved";
  reviewRequired: boolean;
  notes?: string;
}

export type TuHoaMutagen = "Lộc" | "Quyền" | "Khoa" | "Kỵ";

export interface TuHoaAuditCell {
  stem: string;
  mutagen: TuHoaMutagen;
  runtimeTrungChau: string;
  runtimeObservationRef: string;
  sourcePosition: string | null;
  sourceRefs: string[];
  result:
    | "aligned"
    | "runtime_source_mismatch"
    | "source_conflict"
    | "insufficient_evidence";
  expertStatus: "expert_pending" | "no_decision_needed";
  notes?: string;
}

export interface TuHoaAuditCatalog {
  schemaVersion: string;
  catalogId: string;
  school: "trung-chau";
  status: ResearchPackStatus;
  runtimeAuthority: false;
  sourceMnemonic?: string;
  sourceRefs: string[];
  cells: TuHoaAuditCell[];
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
  tuHoaAudit?: TuHoaAuditCatalog;
}

export interface ResearchValidationIssue {
  path: string;
  message: string;
}

export interface ResearchValidationResult {
  ok: boolean;
  issues: ResearchValidationIssue[];
}
