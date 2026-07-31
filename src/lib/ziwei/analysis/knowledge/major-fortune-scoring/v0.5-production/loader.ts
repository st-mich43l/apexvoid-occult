import type { MajorFortuneProductionAdmissionRegistry, MajorFortuneProductionManifest } from "./types";
import manifestData from "./manifest.v0.5.json";
import registryData from "./admitted-family-registry.v0.5.json";
export interface ValidationIssue {
  path: string;
  message: string;
}

export type LoadResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

export function loadAdmittedFamilyRegistry(): LoadResult<MajorFortuneProductionAdmissionRegistry> {
  const registry = registryData as unknown as MajorFortuneProductionAdmissionRegistry;

  const issues: ValidationIssue[] = [];

  if (registry.schemaVersion !== "0.5.0") {
    issues.push({ path: "schemaVersion", message: `expected 0.5.0, got ${registry.schemaVersion}` });
  }

  const seenIds = new Set<string>();
  for (const family of registry.families) {
    if (seenIds.has(family.signalFamilyId)) {
      issues.push({ path: `families.${family.signalFamilyId}`, message: `duplicate family ID` });
    }
    seenIds.add(family.signalFamilyId);

    const validPillars = ["thien-thoi", "dia-loi", "nhan-hoa", "tu-hoa-sat-tinh"];
    if (!validPillars.includes(family.pillarId)) {
      issues.push({ path: `families.${family.signalFamilyId}.pillarId`, message: `unknown pillar ${family.pillarId}` });
    }

    const validSchools = ["nam-phai", "trung-chau", "shared"];
    if (!validSchools.includes(family.schoolScope)) {
      issues.push({ path: `families.${family.signalFamilyId}.schoolScope`, message: `unknown school ${family.schoolScope}` });
    }

    if (family.temporalScope !== "major-fortune") {
      issues.push({ path: `families.${family.signalFamilyId}.temporalScope`, message: `unknown temporal scope ${family.temporalScope}` });
    }

    const validStatuses = ["legacy-engineering-admitted", "source-verified-candidate", "shadow-only", "production-admitted", "blocked", "excluded"];
    if (!validStatuses.includes(family.productionStatus)) {
      issues.push({ path: `families.${family.signalFamilyId}.productionStatus`, message: `unknown status ${family.productionStatus}` });
    }

    if ((family.productionStatus === "blocked" || family.productionStatus === "excluded") && family.blockingReasonCodes.length === 0) {
      issues.push({ path: `families.${family.signalFamilyId}.blockingReasonCodes`, message: `requires reason code for blocked/excluded` });
    }

    if (family.scoringAuthority === "source-backed" && family.sourceObligationIds.length === 0) {
      issues.push({ path: `families.${family.signalFamilyId}.sourceObligationIds`, message: `requires source obligations for source-backed` });
    }

    if (family.productionStatus === "production-admitted" && !family.effectiveFromIntegrationVersion) {
      issues.push({ path: `families.${family.signalFamilyId}.effectiveFromIntegrationVersion`, message: `requires effective version for production-admitted` });
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, value: registry };
}

export function loadProductionManifest(): LoadResult<MajorFortuneProductionManifest> {
  const manifest = manifestData as unknown as MajorFortuneProductionManifest;
  const issues: ValidationIssue[] = [];

  if (manifest.schemaVersion !== "0.5.0") {
    issues.push({ path: "schemaVersion", message: `expected 0.5.0, got ${manifest.schemaVersion}` });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, value: manifest };
}
