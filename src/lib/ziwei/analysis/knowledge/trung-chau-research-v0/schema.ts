/**
 * Trung Châu Research Pack V0 — research-only types.
 * Not ChartData. Not Calculation Core authority. Not narrative authority.
 */

type ResearchPackStatus = "incomplete" | "research_only";

type ResearchStage = "V0" | "V0.1" | "V0.2" | "V0.3";

export type RuntimeAlignment =
  | "aligned"
  | "mismatch"
  | "not_applicable"
  | "unknown";

export type ContradictionType =
  | "runtime_vs_source"
  | "source_vs_source"
  | "runtime_vs_contract_and_source";

type SourceAuthorityRole =
  | "bibliographic_identity"
  | "published_work_reproduction"
  | "school_course_reproduction"
  | "recognized_secondary"
  | "community_secondary"
  | "internal_engineering";

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

type ResearchQueueStatus =
  | "open"
  | "evidence_found"
  | "partially_resolved"
  | "expert_pending"
  | "closed_research_only";

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
  sourceAuthorityRole?: SourceAuthorityRole;
  allowedUsage: string[];
  prohibitedUsage: string[];
  confidence?: ResearchConfidence;
  author?: string;
  edition?: string;
  publication?: string;
  year?: string;
  isbn?: string;
  language?: string;
  url?: string;
  locator?: string;
  accessDate?: string;
  notes?: string;
  relatedRepoSourceId?: string;
  bibliographicIdentityRef?: string;
  reproductionOf?: string;
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
  status?: ResearchQueueStatus;
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

interface ExpertReviewCell {
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

type TuHoaMutagen = "Lộc" | "Quyền" | "Khoa" | "Kỵ";

interface TuHoaAuditCell {
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
  evidenceStage?: ResearchStage;
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

interface PlacementAuditEntry {
  key: string;
  sourcePosition: string | string[];
  runtimeObservation: string | string[];
  sourceRefs: string[];
  runtimeAlignment: RuntimeAlignment;
  researchStatus: ClaimStatus | "supported";
  notes?: string;
}

interface PlacementAuditSection {
  sectionId: string;
  topic: string;
  sourceRefs: string[];
  entries: PlacementAuditEntry[];
  notes?: string;
}

interface PlacementAuditCatalog {
  schemaVersion: string;
  catalogId: string;
  school: "trung-chau";
  status: ResearchPackStatus;
  runtimeAuthority: false;
  sections: PlacementAuditSection[];
  notes?: string;
}

interface TemporalAuditEntry {
  entryId: string;
  topic: string;
  sourcePosition?: string;
  runtimeObservation: string | string[];
  sourceRefs: string[];
  runtimeAlignment: RuntimeAlignment;
  researchStatus: ClaimStatus | "supported";
  policyRefs?: string[];
  notes?: string;
}

interface TemporalAuditCatalog {
  schemaVersion: string;
  catalogId: string;
  school: "trung-chau";
  status: ResearchPackStatus;
  runtimeAuthority: false;
  entries: TemporalAuditEntry[];
  notes?: string;
}

interface Erq005DecisionCell {
  stem: string;
  mutagen: string;
  currentRuntimeValue: string;
  sourceCandidateValue: string;
  runtimeAlignment: RuntimeAlignment;
  sourceRefs: string[];
  authorityNotes?: string;
  expertStatus: "expert_pending" | "resolved";
}

interface Erq005DecisionPacket {
  schemaVersion: string;
  decisionId: string;
  researchStage: ResearchStage;
  status: "expert_pending" | "resolved";
  runtimeAuthority: false;
  cells: Erq005DecisionCell[];
  sourceAuthoritySummary: string[];
  provenanceLimitations: string[];
  impactSurface: string[];
  decisionOptions: string[];
  requiredHumanApproval: true;
  futurePrBoundary: string;
  notes?: string;
}

interface CandidateImpactLayer {
  layer: string;
  mechanism: string;
  mauNhamImpact: string;
  notes?: string;
}

interface Erq005CandidateImpact {
  schemaVersion: string;
  catalogId: string;
  candidateId: string;
  researchStage: ResearchStage;
  status: "research_candidate";
  runtimeAuthority: false;
  requiresExpertApproval: true;
  changedCells?: Array<{ stem: string; mutagen: string; from: string; to: string }>;
  candidateDifferences?: Array<{
    stem: string;
    mutagen: string;
    currentTarget: string;
    candidateTarget: string;
  }>;
  impactSummary?: Record<string, number | string>;
  affectedLayers: CandidateImpactLayer[];
  goldenCasesInspected?: number;
  goldenCasesPotentiallyAffected?: number;
  layerNotes?: string[];
  analysisImpactNotes?: string[];
  monthlyImpactNotes?: string[];
  coverageGaps?: string[];
  v02ProvenanceNote?: string;
  analysisDependencyMap?: Array<{
    module: string;
    classification: string;
    notes?: string;
  }>;
  runtimeImpact?: "none";
  notes?: string;
}

interface TuHoaImpactAuditCatalog {
  schemaVersion: string;
  auditId: string;
  school: "trung-chau";
  candidateId: string;
  researchStage: ResearchStage;
  runtimeAuthority: false;
  runtimeImpact: "none";
  summary: Record<string, number>;
  invariants: Record<string, unknown>;
  coverageGaps?: Array<Record<string, unknown>>;
  phiFlowTargetResolution?: Record<string, unknown>;
  notes?: string;
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
  placementAudit?: PlacementAuditCatalog;
  temporalAudit?: TemporalAuditCatalog;
  erq005DecisionPacket?: Erq005DecisionPacket;
  erq005CandidateImpact?: Erq005CandidateImpact;
  tuHoaImpactAudit?: TuHoaImpactAuditCatalog;
}

export interface ResearchValidationIssue {
  path: string;
  message: string;
}

export interface ResearchValidationResult {
  ok: boolean;
  issues: ResearchValidationIssue[];
}
