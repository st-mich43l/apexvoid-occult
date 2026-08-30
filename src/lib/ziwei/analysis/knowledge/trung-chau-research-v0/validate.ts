/**
 * Deterministic structural validation for Trung Châu Research Pack V0.
 */
import type {
  ClaimStatus,
  ContradictionsCatalog,
  DoctrineMatrixCatalog,
  ExpertReviewCatalog,
  PackMeta,
  ResearchClaim,
  ResearchSource,
  ResearchValidationIssue,
  ResearchValidationResult,
  RuntimeObservationsCatalog,
  SourceRegistryCatalog,
  SourceType,
  TerminologyCatalog,
  TrungChauResearchPackV0,
} from "./schema";

const SOURCE_TYPES: ReadonlySet<SourceType> = new Set([
  "primary_text",
  "school_authority",
  "academic_or_bibliographic",
  "recognized_commentary",
  "secondary_commentary",
  "community_or_forum",
  "internal_engineering",
]);

const DOCTRINE_CLAIM_STATUSES: ReadonlySet<ClaimStatus> = new Set([
  "source_supported",
  "source_conflicted",
  "expert_pending",
]);

const ENGINEERING_ONLY: SourceType = "internal_engineering";

function uniqueIds(
  ids: string[],
  path: string,
  issues: ResearchValidationIssue[],
): Set<string> {
  const seen = new Set<string>();
  for (const id of ids) {
    if (!id) {
      issues.push({ path, message: "empty id" });
      continue;
    }
    if (seen.has(id)) {
      issues.push({ path, message: `duplicate id ${id}` });
    }
    seen.add(id);
  }
  return seen;
}

function refsExist(
  refs: string[],
  known: Set<string>,
  path: string,
  issues: ResearchValidationIssue[],
): void {
  for (const ref of refs) {
    if (!known.has(ref)) {
      issues.push({ path, message: `unresolved ref ${ref}` });
    }
  }
}

function validateMeta(meta: PackMeta, issues: ResearchValidationIssue[]): void {
  if (meta.school !== "trung-chau") {
    issues.push({ path: "meta.school", message: `expected trung-chau, got ${meta.school}` });
  }
  if (meta.researchStage !== "V0") {
    issues.push({
      path: "meta.researchStage",
      message: `expected V0, got ${meta.researchStage}`,
    });
  }
  if (meta.runtimeAuthority !== false) {
    issues.push({
      path: "meta.runtimeAuthority",
      message: "runtimeAuthority must be false",
    });
  }
  if (meta.runtimeImpact !== "none") {
    issues.push({
      path: "meta.runtimeImpact",
      message: "runtimeImpact must be none",
    });
  }
  if (meta.narrativeAuthority !== false) {
    issues.push({
      path: "meta.narrativeAuthority",
      message: "narrativeAuthority must be false",
    });
  }
  if (meta.status !== "incomplete" && meta.status !== "research_only") {
    issues.push({
      path: "meta.status",
      message: `invalid pack status ${meta.status}`,
    });
  }
}

function isExternalDoctrineSource(source: ResearchSource): boolean {
  return source.sourceType !== ENGINEERING_ONLY;
}

function validateClaimProvenance(
  claim: ResearchClaim,
  sourcesById: Map<string, ResearchSource>,
  issues: ResearchValidationIssue[],
): void {
  const path = `claims.${claim.claimId}`;
  if (claim.school !== "trung-chau") {
    issues.push({ path: `${path}.school`, message: "school must be trung-chau" });
  }
  for (const ref of claim.sourceRefs) {
    if (!sourcesById.has(ref)) {
      issues.push({ path: `${path}.sourceRefs`, message: `unresolved source ${ref}` });
    }
  }
  if (!DOCTRINE_CLAIM_STATUSES.has(claim.status)) return;

  const resolved = claim.sourceRefs
    .map((id) => sourcesById.get(id))
    .filter((s): s is ResearchSource => !!s);
  const hasExternal = resolved.some(isExternalDoctrineSource);
  if (!hasExternal) {
    issues.push({
      path: `${path}.status`,
      message:
        `claim status ${claim.status} requires at least one non-internal_engineering source`,
    });
  }
}

function validateSourceRegistry(
  registry: SourceRegistryCatalog,
  issues: ResearchValidationIssue[],
): {
  sourceIds: Set<string>;
  claimIds: Set<string>;
  sourcesById: Map<string, ResearchSource>;
} {
  if (registry.school !== "trung-chau") {
    issues.push({
      path: "sourceRegistry.school",
      message: "school must be trung-chau",
    });
  }
  if (registry.status !== "incomplete" && registry.status !== "research_only") {
    issues.push({
      path: "sourceRegistry.status",
      message: `invalid status ${registry.status}`,
    });
  }
  validateMeta(registry.meta, issues);

  const sourceIds = uniqueIds(
    registry.sources.map((s) => s.sourceId),
    "sourceRegistry.sources",
    issues,
  );
  const claimIds = uniqueIds(
    registry.claims.map((c) => c.claimId),
    "sourceRegistry.claims",
    issues,
  );
  uniqueIds(
    registry.researchQueue.map((q) => q.researchId),
    "sourceRegistry.researchQueue",
    issues,
  );

  const sourcesById = new Map(registry.sources.map((s) => [s.sourceId, s]));
  for (const source of registry.sources) {
    if (!SOURCE_TYPES.has(source.sourceType)) {
      issues.push({
        path: `sources.${source.sourceId}.sourceType`,
        message: `invalid sourceType ${source.sourceType}`,
      });
    }
    if (source.sourceType === ENGINEERING_ONLY) {
      const bad = source.prohibitedUsage.every(
        (u) =>
          !u.includes("classical") &&
          !u.includes("verified_trung_chau") &&
          !u.includes("claim_as_classical") &&
          !u.includes("claim_as_verified"),
      );
      // Soft check: must list classical prohibition explicitly.
      const hasClassicalBan = source.prohibitedUsage.some(
        (u) =>
          u.includes("classical") ||
          u.includes("verified_trung_chau") ||
          u.includes("claim_as_classical") ||
          u.includes("claim_as_verified"),
      );
      if (!hasClassicalBan) {
        issues.push({
          path: `sources.${source.sourceId}.prohibitedUsage`,
          message:
            "internal_engineering must prohibit classical/verified doctrine claims",
        });
      }
      void bad;
    }
  }

  for (const claim of registry.claims) {
    validateClaimProvenance(claim, sourcesById, issues);
  }

  return { sourceIds, claimIds, sourcesById };
}

function validateObservations(
  catalog: RuntimeObservationsCatalog,
  issues: ResearchValidationIssue[],
): Set<string> {
  if (catalog.school !== "trung-chau") {
    issues.push({
      path: "runtimeObservations.school",
      message: "school must be trung-chau",
    });
  }
  return uniqueIds(
    catalog.observations.map((o) => o.observationId),
    "runtimeObservations.observations",
    issues,
  );
}

function validateMatrix(
  catalog: DoctrineMatrixCatalog,
  sourceIds: Set<string>,
  claimIds: Set<string>,
  observationIds: Set<string>,
  contradictionIds: Set<string>,
  reviewIds: Set<string>,
  issues: ResearchValidationIssue[],
): Set<string> {
  if (catalog.school !== "trung-chau") {
    issues.push({
      path: "doctrineMatrix.school",
      message: "school must be trung-chau",
    });
  }
  const policyIds = uniqueIds(
    catalog.rows.map((r) => r.policyId),
    "doctrineMatrix.rows",
    issues,
  );
  for (const row of catalog.rows) {
    const path = `doctrineMatrix.${row.policyId}`;
    if (row.school !== "trung-chau") {
      issues.push({ path: `${path}.school`, message: "school must be trung-chau" });
    }
    if (row.futureRuntimeAction !== "none" &&
      row.futureRuntimeAction !== "separate_pr_after_expert_review") {
      issues.push({
        path: `${path}.futureRuntimeAction`,
        message: `unsupported futureRuntimeAction ${row.futureRuntimeAction}`,
      });
    }
    if (
      row.futureRuntimeAction !== "none" &&
      row.futureRuntimeAction !== "separate_pr_after_expert_review"
    ) {
      // unreachable guard kept for clarity
    }
    if (row.runtimeObservationRef) {
      refsExist([row.runtimeObservationRef], observationIds, `${path}.runtimeObservationRef`, issues);
    }
    refsExist(row.claimRefs, claimIds, `${path}.claimRefs`, issues);
    refsExist(row.sourceRefs, sourceIds, `${path}.sourceRefs`, issues);
    refsExist(row.contradictionRefs, contradictionIds, `${path}.contradictionRefs`, issues);
    refsExist(row.expertReviewRefs, reviewIds, `${path}.expertReviewRefs`, issues);
  }
  return policyIds;
}

function validateTerminology(
  catalog: TerminologyCatalog,
  sourceIds: Set<string>,
  issues: ResearchValidationIssue[],
): void {
  uniqueIds(
    catalog.terms.map((t) => t.termId),
    "terminology.terms",
    issues,
  );
  for (const term of catalog.terms) {
    refsExist(term.sourceRefs, sourceIds, `terminology.${term.termId}.sourceRefs`, issues);
  }
}

function validateContradictions(
  catalog: ContradictionsCatalog,
  sourceIds: Set<string>,
  claimIds: Set<string>,
  reviewIds: Set<string>,
  issues: ResearchValidationIssue[],
): Set<string> {
  const ids = uniqueIds(
    catalog.contradictions.map((c) => c.contradictionId),
    "contradictions",
    issues,
  );
  for (const c of catalog.contradictions) {
    const path = `contradictions.${c.contradictionId}`;
    refsExist(c.claimRefs, claimIds, `${path}.claimRefs`, issues);
    refsExist(c.sourceRefs, sourceIds, `${path}.sourceRefs`, issues);
    if (c.expertReviewRefs) {
      refsExist(c.expertReviewRefs, reviewIds, `${path}.expertReviewRefs`, issues);
    }
    if (
      (c.status === "open" || c.status === "expert_pending" || c.status === "insufficient_evidence") &&
      c.resolution !== null
    ) {
      issues.push({
        path: `${path}.resolution`,
        message: "open/pending contradiction must have resolution null",
      });
    }
  }
  return ids;
}

function validateExpertReview(
  catalog: ExpertReviewCatalog,
  sourceIds: Set<string>,
  claimIds: Set<string>,
  issues: ResearchValidationIssue[],
): Set<string> {
  const ids = uniqueIds(
    catalog.reviews.map((r) => r.reviewId),
    "expertReview.reviews",
    issues,
  );
  for (const review of catalog.reviews) {
    const path = `expertReview.${review.reviewId}`;
    refsExist(review.claimRefs, claimIds, `${path}.claimRefs`, issues);
    refsExist(review.sourceRefs, sourceIds, `${path}.sourceRefs`, issues);
    if (review.reviewId === "ERQ-005") {
      if (review.status !== "open" && review.status !== "expert_pending") {
        issues.push({
          path: `${path}.status`,
          message: "ERQ-005 must remain open or expert_pending in V0",
        });
      }
      if (!review.reviewRequired) {
        issues.push({
          path: `${path}.reviewRequired`,
          message: "ERQ-005 must set reviewRequired true",
        });
      }
    }
  }
  return ids;
}

/** Validate a fully assembled Research Pack V0. */
export function validateTrungChauResearchPackV0(
  pack: TrungChauResearchPackV0,
): ResearchValidationResult {
  const issues: ResearchValidationIssue[] = [];
  validateMeta(pack.meta, issues);

  const { sourceIds, claimIds } = validateSourceRegistry(pack.sourceRegistry, issues);
  const observationIds = validateObservations(pack.runtimeObservations, issues);
  const reviewIds = validateExpertReview(
    pack.expertReview,
    sourceIds,
    claimIds,
    issues,
  );
  const contradictionIds = validateContradictions(
    pack.contradictions,
    sourceIds,
    claimIds,
    reviewIds,
    issues,
  );
  validateMatrix(
    pack.doctrineMatrix,
    sourceIds,
    claimIds,
    observationIds,
    contradictionIds,
    reviewIds,
    issues,
  );
  validateTerminology(pack.terminology, sourceIds, issues);

  // Ensure ERQ-005 exists in V0.
  if (!reviewIds.has("ERQ-005")) {
    issues.push({
      path: "expertReview",
      message: "ERQ-005 review record is required",
    });
  }

  return { ok: issues.length === 0, issues };
}

/** Test helper: provenance rule in isolation. */
export function assertDoctrineClaimNotEngineeringOnly(
  claim: ResearchClaim,
  sources: ResearchSource[],
): ResearchValidationIssue[] {
  const issues: ResearchValidationIssue[] = [];
  const map = new Map(sources.map((s) => [s.sourceId, s]));
  validateClaimProvenance(claim, map, issues);
  return issues;
}
