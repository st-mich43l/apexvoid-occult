import { existsSync } from "node:fs";
import { resolve } from "node:path";
import manifestJson from "../../knowledge/major-fortune-scoring/v1-authority-v0.1/manifest.json";
import witnessesJson from "../../knowledge/major-fortune-scoring/v1-authority-v0.1/source-witness-registry.json";
import claimsJson from "../../knowledge/major-fortune-scoring/v1-authority-v0.1/claim-authority-registry.json";
import numericJson from "../../knowledge/major-fortune-scoring/v1-authority-v0.1/numeric-policy-registry.json";
import admissionJson from "../../knowledge/major-fortune-scoring/v1-authority-v0.1/evidence-admission-policy.json";
import migrationJson from "../../knowledge/major-fortune-scoring/v1-authority-v0.1/historical-id-migration.json";
import obligationsJson from "../../knowledge/major-fortune-scoring/v1-authority-v0.1/source-obligations.json";
import { RC1_STAR_CATALOG } from "../../modules/major-fortune/engine-v1/scoring/star-catalog";
import type { AuthorityPack, NumericPolicyRecord, ValidationIssue } from "./types";

export function loadAuthorityPack(): AuthorityPack {
  return {
    manifest: manifestJson as AuthorityPack["manifest"],
    witnesses: (witnessesJson as { witnesses: AuthorityPack["witnesses"] }).witnesses,
    claims: (claimsJson as { claims: AuthorityPack["claims"] }).claims,
    numericPolicies: (numericJson as { records: AuthorityPack["numericPolicies"] }).records,
    admissionPolicies: (admissionJson as { policies: AuthorityPack["admissionPolicies"] }).policies,
    historicalMigrations: (migrationJson as { records: AuthorityPack["historicalMigrations"] }).records,
    obligations: (obligationsJson as { obligations: AuthorityPack["obligations"] }).obligations,
  };
}

function expandPolicy(record: NumericPolicyRecord): string[] {
  if (record.surfaceIds) return record.surfaceIds;
  if (record.surfacePattern === "star.{starName}.{axis}" && record.patternSource === "RC1_STAR_CATALOG") {
    return Object.keys(RC1_STAR_CATALOG).sort().flatMap((starName) =>
      (record.axes ?? []).map((axis) => `star.${starName}.${axis}`),
    );
  }
  if (record.surfacePattern === "tu-hoa.{mutagen}-{axis}") {
    return (record.patternValues ?? []).flatMap((mutagen) =>
      (record.axes ?? []).map((axis) => `${mutagen}-${axis}`),
    );
  }
  return [];
}

export function expandNumericPolicies(pack: AuthorityPack): Array<{ surfaceId: string; authority: NumericPolicyRecord["authority"]; recordId: string }> {
  return pack.numericPolicies.flatMap((record) =>
    expandPolicy(record).map((surfaceId) => ({ surfaceId, authority: record.authority, recordId: record.recordId })),
  );
}

function canonicalSourceIds(path: string): Set<string> {
  if (path.endsWith("major-fortune-source-registry.v0.json")) {
    return new Set((awaitedMajorSources as { sourceId: string }[]).map((source) => source.sourceId));
  }
  if (path.endsWith("engineering-provenance.v0.3.json")) {
    return new Set((awaitedV03Entries as { sourceId: string }[]).map((entry) => entry.sourceId));
  }
  if (path.endsWith("trung-chau-research-v0/source-registry.v0.json")) {
    return new Set((awaitedTcSources as { sourceId: string }[]).map((source) => source.sourceId));
  }
  return new Set();
}

function canonicalRegistryExists(path: string): boolean {
  return existsSync(resolve(process.cwd(), path));
}

import majorSourcesJson from "../../knowledge/major-fortune-scoring/major-fortune-source-registry.v0.json";
import v03Json from "../../knowledge/major-fortune-scoring/v0.3-ordinal-adapter/engineering-provenance.v0.3.json";
import tcJson from "../../knowledge/trung-chau-research-v0/source-registry.v0.json";

const awaitedMajorSources = (majorSourcesJson as { sources: { sourceId: string }[] }).sources;
const awaitedV03Entries = (v03Json as { entries: { sourceId: string }[] }).entries;
const awaitedTcSources = (tcJson as { sources: { sourceId: string }[] }).sources;

export function validateAuthorityPack(pack: AuthorityPack): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (pack.manifest.runtimeAuthority || pack.manifest.releaseAuthority || pack.manifest.scoringAuthority) {
    issues.push({ path: "manifest", message: "authority pack must not own runtime, release, or scoring authority" });
  }
  if (pack.manifest.candidateMutationAllowed || pack.manifest.scoreImpactAllowed) {
    issues.push({ path: "manifest", message: "authority pack must not mutate candidates or scores" });
  }
  for (const registryPath of pack.manifest.sourceRegistryRefs) {
    if (!canonicalRegistryExists(registryPath)) issues.push({ path: "manifest.sourceRegistryRefs", message: `canonical registry ${registryPath} does not exist` });
  }

  const witnessById = new Map(pack.witnesses.map((witness) => [witness.witnessId, witness]));
  for (const witness of pack.witnesses) {
    if (!canonicalRegistryExists(witness.canonicalRegistryPath)) {
      issues.push({ path: `witnesses.${witness.witnessId}`, message: `canonical registry ${witness.canonicalRegistryPath} does not exist` });
      continue;
    }
    if (!canonicalSourceIds(witness.canonicalRegistryPath).has(witness.canonicalSourceId)) {
      issues.push({ path: `witnesses.${witness.witnessId}`, message: `canonical source ${witness.canonicalSourceId} does not exist` });
    }
  }
  const claimByFamily = new Map<string, typeof pack.claims[number]>();
  for (const claim of pack.claims) {
    if (claimByFamily.has(claim.evidenceFamily)) issues.push({ path: `claims.${claim.evidenceFamily}`, message: "duplicate evidence-family claim authority" });
    claimByFamily.set(claim.evidenceFamily, claim);
    for (const witnessId of claim.currentWitnessIds) {
      const witness = witnessById.get(witnessId);
      if (!witness) {
        issues.push({ path: `claims.${claim.claimAuthorityId}`, message: `unknown witness ${witnessId}` });
        continue;
      }
      const sourceIds = canonicalSourceIds(witness.canonicalRegistryPath);
      if (!sourceIds.has(witness.canonicalSourceId)) {
        issues.push({ path: `witnesses.${witnessId}`, message: `canonical source ${witness.canonicalSourceId} does not exist` });
      }
      if (claim.doctrineAuthority === "VERIFIED_PRIMARY_DOCTRINE" || claim.doctrineAuthority === "VERIFIED_SCHOOL_DOCTRINE") {
        if (witness.locatorStatus !== "EXACT_CLAIM_LOCATOR") issues.push({ path: `claims.${claim.claimAuthorityId}`, message: "verified doctrine requires an exact claim locator" });
        if (witness.prohibitedUsage.some((usage) => usage.includes("verified") || usage.includes("classical"))) issues.push({ path: `claims.${claim.claimAuthorityId}`, message: "witness prohibits verified/classical doctrine usage" });
      }
      if (claim.numericAuthority === "SOURCED_NUMERIC_AUTHORITY" && !witness.numericAuthorityAllowed) {
        issues.push({ path: `claims.${claim.claimAuthorityId}`, message: `witness ${witnessId} cannot authorize numeric scoring` });
      }
      if ((claim.schoolScope === "shared" || claim.schoolScope === "nam-phai") && witness.schoolScope === "trung-chau") {
        issues.push({ path: `claims.${claim.claimAuthorityId}`, message: "Trung Châu-only witness cannot support shared/Nam claim" });
      }
    }
  }

  const policyByFamily = new Map<string, (typeof pack.admissionPolicies)[number]>();
  for (const policy of pack.admissionPolicies) {
    if (policyByFamily.has(policy.familyId)) issues.push({ path: `admission.${policy.familyId}`, message: "duplicate evidence-family admission policy" });
    policyByFamily.set(policy.familyId, policy);
    if (!claimByFamily.has(policy.familyId)) issues.push({ path: `admission.${policy.familyId}`, message: "admission policy has no claim authority" });
    if (policy.currentReleaseAdmission !== "BLOCKED" && policy.currentReleaseAdmission !== "NOT_IMPLEMENTED") issues.push({ path: `admission.${policy.familyId}`, message: "release admission must remain blocked or not implemented" });
  }
  for (const claim of pack.claims) {
    const policy = policyByFamily.get(claim.evidenceFamily);
    if (!policy) issues.push({ path: `claims.${claim.claimAuthorityId}`, message: "claim authority has no admission policy" });
    if (policy && (claim.researchAdmission !== policy.currentResearchAdmission || claim.releaseAdmission !== policy.currentReleaseAdmission)) {
      issues.push({ path: `claims.${claim.claimAuthorityId}`, message: "claim and admission policy disagree" });
    }
  }

  const obligationIds = new Set(pack.obligations.map((obligation) => obligation.obligationId));
  for (const claim of pack.claims) for (const id of claim.sourceObligationIds) if (!obligationIds.has(id)) issues.push({ path: `claims.${claim.claimAuthorityId}`, message: `unknown obligation ${id}` });
  for (const policy of pack.admissionPolicies) for (const id of policy.sourceObligationIds) if (!obligationIds.has(id)) issues.push({ path: `admission.${policy.familyId}`, message: `unknown obligation ${id}` });
  for (const obligation of pack.obligations) for (const witnessId of obligation.currentWitnessIds) if (!witnessById.has(witnessId)) issues.push({ path: `obligations.${obligation.obligationId}`, message: `unknown witness ${witnessId}` });

  const historicalIds = new Set(pack.historicalMigrations.map((record) => record.historicalId));
  for (const claim of pack.claims) for (const id of claim.historicalClaimIds) if (!historicalIds.has(id)) issues.push({ path: `claims.${claim.claimAuthorityId}`, message: `historical ID ${id} has no migration record` });
  for (const record of pack.historicalMigrations) {
    if (record.currentAuthorityStatus === "CURRENT_EQUIVALENT" && !record.replacementId) issues.push({ path: `migration.${record.historicalId}`, message: "current equivalent requires replacementId" });
    if (record.historicalStatus === "DELETED_PROVENANCE_ONLY" && record.currentAuthorityStatus === "CURRENT_EQUIVALENT") issues.push({ path: `migration.${record.historicalId}`, message: "deleted historical ID cannot be current equivalent without independent requalification" });
  }

  const surfaces = expandNumericPolicies(pack);
  const seenSurfaces = new Set<string>();
  for (const surface of surfaces) {
    if (seenSurfaces.has(surface.surfaceId)) issues.push({ path: `numeric.${surface.surfaceId}`, message: "numeric surface has contradictory or duplicate authority" });
    seenSurfaces.add(surface.surfaceId);
  }
  if (surfaces.length !== 150) issues.push({ path: "numeric", message: `expected 150 RC1 numeric surfaces, found ${surfaces.length}` });
  for (const record of pack.numericPolicies) {
    if (record.authority === "SOURCED_NUMERIC_AUTHORITY" && (!record.sourceWitnessIds || record.sourceWitnessIds.length === 0)) issues.push({ path: `numeric.${record.recordId}`, message: "sourced numeric authority requires source witnesses" });
    for (const witnessId of record.sourceWitnessIds ?? []) {
      const witness = witnessById.get(witnessId);
      if (!witness) issues.push({ path: `numeric.${record.recordId}`, message: `unknown numeric witness ${witnessId}` });
      else if (!witness.numericAuthorityAllowed) issues.push({ path: `numeric.${record.recordId}`, message: `numeric witness ${witnessId} cannot authorize numeric scoring` });
    }
  }
  return issues;
}

export function loadAndValidateAuthorityPack(): { pack: AuthorityPack; issues: ValidationIssue[] } {
  const pack = loadAuthorityPack();
  return { pack, issues: validateAuthorityPack(pack) };
}
