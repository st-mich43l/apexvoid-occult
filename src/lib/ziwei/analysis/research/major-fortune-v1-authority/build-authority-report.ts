import { analyzeMajorFortuneV1 } from "../../modules/major-fortune/engine-v1/analyze";
import type { MajorFortuneV1Evidence } from "../../modules/major-fortune/engine-v1/types";
import { enumerateObservations, loadFullCorpus, observationKey } from "../major-fortune-v1-readiness/corpus";
import { stableSortByKey } from "../major-fortune-v1-readiness/metrics";
import {
  expandNumericPolicies,
  loadAndValidateAuthorityPack,
} from "./load-authority-pack";
import { resolveClaimAuthority } from "./resolve-claim-authority";
import { resolveEvidenceAdmission } from "./resolve-evidence-admission";
import { resolveHistoricalId } from "./historical-id-resolution";
import type {
  AuthorityReport,
  AuthorityResolution,
  AuthorityState,
  ClaimStatus,
  ResearchAdmission,
} from "./types";

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function admissionCounts(resolutions: AuthorityResolution[]): AuthorityReport["admission"] {
  const count = (status: ResearchAdmission) => resolutions.filter((resolution) => resolution.researchAdmission === status).length;
  return {
    researchAdmitted: count("RESEARCH_ADMITTED"),
    contextOnly: count("CONTEXT_ONLY"),
    blocked: count("BLOCKED"),
    sourceObligationOpen: count("SOURCE_OBLIGATION_OPEN"),
    notImplemented: count("NOT_IMPLEMENTED"),
  };
}

function countAuthority(resolutions: AuthorityResolution[], authority: AuthorityState): number {
  return resolutions.filter((resolution) =>
    resolution.physicalFactAuthority === authority ||
    resolution.doctrineAuthority === authority ||
    resolution.numericAuthority === authority,
  ).length;
}

function resolveEvidence(
  observationKeyValue: string,
  evidence: MajorFortuneV1Evidence,
  pack: ReturnType<typeof loadAndValidateAuthorityPack>["pack"],
): AuthorityResolution {
  const claim = resolveClaimAuthority(pack, evidence.category);
  const admission = resolveEvidenceAdmission(pack, evidence.category);
  if (!claim || !admission) {
    throw new Error(`unclassified evidence family ${evidence.category}`);
  }

  const historicalIds = unique(
    [...evidence.sourceIds, ...evidence.claimIds].filter((id) => resolveHistoricalId(pack, id) !== null),
  );
  return {
    occurrenceId: `${observationKeyValue}|${evidence.evidenceId}`,
    evidenceId: evidence.evidenceId,
    evidenceFamily: evidence.category,
    category: evidence.category,
    school: evidence.school,
    runtimeLabel: evidence.scoringAuthority,
    physicalFactAuthority: claim.physicalFactAuthority,
    doctrineAuthority: claim.doctrineAuthority,
    numericAuthority: claim.numericAuthority,
    claimStatus: claim.claimStatus as ClaimStatus,
    researchAdmission: admission.currentResearchAdmission,
    releaseAdmission: admission.currentReleaseAdmission,
    historicalIds,
    sourceObligationIds: unique([...claim.sourceObligationIds, ...admission.sourceObligationIds]),
  };
}

export function buildAuthorityReport(baseSha: string): AuthorityReport {
  const { pack, issues } = loadAndValidateAuthorityPack();
  if (issues.length > 0) {
    throw new Error(`Authority pack validation failed:\n${issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n")}`);
  }

  const resolutions: AuthorityResolution[] = [];
  for (const observation of enumerateObservations(loadFullCorpus())) {
    const key = observationKey(observation);
    const result = analyzeMajorFortuneV1(observation.chart, {
      school: observation.school,
      cycleOverride: observation.cycle,
    });
    if (!result) throw new Error(`V1 candidate unavailable for ${key}`);
    for (const evidence of result.evidence.admitted) {
      resolutions.push(resolveEvidence(key, evidence, pack));
    }
  }

  const sortedResolutions = stableSortByKey(resolutions, (resolution) => resolution.occurrenceId);
  const resolutionIds = new Set<string>();
  let unclassifiedAuthorityCount = 0;
  for (const resolution of sortedResolutions) {
    if (resolutionIds.has(resolution.occurrenceId)) unclassifiedAuthorityCount += 1;
    resolutionIds.add(resolution.occurrenceId);
    if (!resolution.physicalFactAuthority || !resolution.doctrineAuthority || !resolution.numericAuthority || !resolution.researchAdmission || !resolution.releaseAdmission) {
      unclassifiedAuthorityCount += 1;
    }
  }

  const numericSurfaces = stableSortByKey(expandNumericPolicies(pack), (surface) => surface.surfaceId);
  const numericCount = (authority: string) => numericSurfaces.filter((surface) => surface.authority === authority).length;
  const historicalOccurrences = new Map<string, number>();
  for (const resolution of sortedResolutions) {
    for (const id of resolution.historicalIds) historicalOccurrences.set(id, (historicalOccurrences.get(id) ?? 0) + 1);
  }
  const observedHistoricalIds = [...historicalOccurrences.keys()].sort();
  const historicalRecords = pack.historicalMigrations.map((record) => ({
    ...record,
    occurrenceCount: historicalOccurrences.get(record.historicalId) ?? 0,
    authorityResolution: historicalOccurrences.has(record.historicalId) ? "HISTORICAL_ONLY" : "NOT_OBSERVED",
  }));
  const obligationCount = (status: string) => pack.obligations.filter((obligation) => obligation.currentStatus === status).length;

  const report: AuthorityReport = {
    schemaVersion: "pr268-major-fortune-v1-authority.v1",
    generationId: "major-fortune/v1-authority-v0.1",
    generatedFrom: {
      baseSha,
      candidate: pack.manifest.candidateId,
      baseline: "major-fortune-v0.5-production",
    },
    authority: {
      totalEvidence: sortedResolutions.length,
      physicalFactAuthorityResolved: countAuthority(sortedResolutions, "CALCULATION_CORE_FACT"),
      verifiedPrimaryDoctrine: countAuthority(sortedResolutions, "VERIFIED_PRIMARY_DOCTRINE"),
      verifiedSchoolDoctrine: countAuthority(sortedResolutions, "VERIFIED_SCHOOL_DOCTRINE"),
      engineeringDoctrineOrPolicy: countAuthority(sortedResolutions, "ENGINEERING_POLICY"),
      researchHypothesis: countAuthority(sortedResolutions, "RESEARCH_HYPOTHESIS"),
      placeholder: countAuthority(sortedResolutions, "PLACEHOLDER"),
      historicalOnly: sortedResolutions.filter((resolution) => resolution.historicalIds.length > 0).length,
      unresolved: sortedResolutions.filter((resolution) => [resolution.physicalFactAuthority, resolution.doctrineAuthority, resolution.numericAuthority].includes("UNRESOLVED")).length,
      unclassifiedAuthorityCount,
    },
    admission: admissionCounts(sortedResolutions),
    evidenceFamilies: stableSortByKey(pack.claims.map((claim) => ({
      familyId: claim.evidenceFamily,
      physicalFactAuthority: claim.physicalFactAuthority,
      doctrineAuthority: claim.doctrineAuthority,
      numericAuthority: claim.numericAuthority,
      claimStatus: claim.claimStatus,
      researchAdmission: claim.researchAdmission,
      releaseAdmission: claim.releaseAdmission,
      sourceObligationIds: claim.sourceObligationIds,
    })), (family) => family.familyId),
    historicalIds: {
      occurrenceCount: sortedResolutions.reduce((total, resolution) => total + resolution.historicalIds.length, 0),
      idsObserved: observedHistoricalIds.length,
      idsResolved: observedHistoricalIds.filter((id) => pack.historicalMigrations.some((record) => record.historicalId === id)).length,
      idsWithNoCurrentEquivalent: observedHistoricalIds.filter((id) => pack.historicalMigrations.find((record) => record.historicalId === id)?.currentAuthorityStatus === "NO_CURRENT_EQUIVALENT").length,
      records: historicalRecords,
    },
    numeric: {
      numericPolicyCount: numericSurfaces.length,
      sourcedCount: numericCount("SOURCED_NUMERIC_AUTHORITY"),
      engineeringCount: numericCount("ENGINEERING_POLICY"),
      frozenInheritedCount: numericCount("FROZEN_INHERITED_FORMULA"),
      hypothesisCount: numericCount("RESEARCH_HYPOTHESIS"),
      placeholderCount: numericCount("PLACEHOLDER"),
      unresolvedCount: numericCount("UNRESOLVED"),
      surfaces: numericSurfaces.map((surface) => ({ surfaceId: surface.surfaceId, authority: surface.authority })),
    },
    sourceObligations: {
      open: obligationCount("OPEN"),
      partial: obligationCount("PARTIAL"),
      satisfied: obligationCount("SATISFIED"),
      blocked: obligationCount("BLOCKED"),
      records: stableSortByKey(pack.obligations, (obligation) => obligation.obligationId),
    },
    resolutions: sortedResolutions,
    decision: unclassifiedAuthorityCount === 0 && observedHistoricalIds.every((id) => pack.historicalMigrations.some((record) => record.historicalId === id))
      ? "MFV1_AUTHORITY_FOUNDATION_REBUILT"
      : "MFV1_AUTHORITY_FOUNDATION_PARTIAL",
  };
  return report;
}
