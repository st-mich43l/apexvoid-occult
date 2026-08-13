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

export interface MajorFortuneProductionKnowledge {
  manifest: MajorFortuneProductionManifest;
  admissionRegistry: MajorFortuneProductionAdmissionRegistry;
}

export function loadMajorFortuneProductionKnowledge(): LoadResult<MajorFortuneProductionKnowledge> {
  const manifest = manifestData as unknown as MajorFortuneProductionManifest;
  const registry = registryData as unknown as MajorFortuneProductionAdmissionRegistry;

  const issues: ValidationIssue[] = [];

  // 1. Validate manifest
  if (manifest.schemaVersion !== "0.5.0") {
    issues.push({ path: "manifest.schemaVersion", message: `expected 0.5.0, got ${manifest.schemaVersion}` });
  }
  if (!["production-shadow", "internal-canary", "external-canary", "production"].includes(manifest.status)) {
    issues.push({ path: "manifest.status", message: `invalid status ${manifest.status}` });
  }

  // 2. Validate registry
  if (registry.schemaVersion !== "0.5.0") {
    issues.push({ path: "registry.schemaVersion", message: `expected 0.5.0, got ${registry.schemaVersion}` });
  }

  // 3. Schema version agreement
  if (manifest.schemaVersion !== registry.schemaVersion) {
    issues.push({ path: "schemaVersion", message: "manifest and registry schema version mismatch" });
  }

  // 4. Validate the browser-safe manifest inventory. Build-time integrity belongs
  // in CI; runtime code must not smuggle Node's `require` into the Vite bundle.
  const supportedFiles = new Set([
    "manifest.v0.5.json",
    "admitted-family-registry.v0.5.json",
  ]);
  for (const file of manifest.files) {
    if (!supportedFiles.has(file)) {
      issues.push({ path: "manifest.files", message: `unknown file ${file}` });
    }
    if (file === "manifest.v0.5.json") continue;

    const expectedHash = manifest.canonicalHashes[file];
    if (!expectedHash) {
      issues.push({ path: `manifest.canonicalHashes.${file}`, message: `missing hash for ${file}` });
    } else if (!/^[a-f0-9]{64}$/.test(expectedHash)) {
      issues.push({ path: `manifest.canonicalHashes.${file}`, message: `invalid hash format ${expectedHash}` });
    }
  }

  for (const key of Object.keys(manifest.canonicalHashes)) {
    if (!manifest.files.includes(key)) {
      issues.push({ path: `manifest.canonicalHashes.${key}`, message: "unknown file in hashes" });
    }
  }

  // Registry structural validation
  const seenIds = new Set<string>();
  for (const family of registry.families) {
    if (seenIds.has(family.signalFamilyId)) {
      issues.push({ path: `registry.families.${family.signalFamilyId}`, message: `duplicate family ID` });
    }
    seenIds.add(family.signalFamilyId);

    const validPillars = ["thien-thoi", "dia-loi", "nhan-hoa", "tu-hoa-sat-tinh"];
    if (!validPillars.includes(family.pillarId)) {
      issues.push({ path: `registry.families.${family.signalFamilyId}.pillarId`, message: `unknown pillar ${family.pillarId}` });
    }

    const validSchools = ["nam-phai", "trung-chau", "shared"];
    if (!validSchools.includes(family.schoolScope)) {
      issues.push({ path: `registry.families.${family.signalFamilyId}.schoolScope`, message: `unknown school ${family.schoolScope}` });
    }

    if (family.temporalScope !== "major-fortune") {
      issues.push({ path: `registry.families.${family.signalFamilyId}.temporalScope`, message: `unknown temporal scope ${family.temporalScope}` });
    }

    const validStatuses = ["legacy-engineering-admitted", "source-verified-candidate", "shadow-only", "production-admitted", "blocked", "excluded"];
    if (!validStatuses.includes(family.productionStatus)) {
      issues.push({ path: `registry.families.${family.signalFamilyId}.productionStatus`, message: `unknown status ${family.productionStatus}` });
    }

    if ((family.productionStatus === "blocked" || family.productionStatus === "excluded") && family.blockingReasonCodes.length === 0) {
      issues.push({ path: `registry.families.${family.signalFamilyId}.blockingReasonCodes`, message: `requires reason code for blocked/excluded` });
    }

    if (family.scoringAuthority === "source-backed" && family.sourceObligationIds.length === 0) {
      issues.push({ path: `registry.families.${family.signalFamilyId}.sourceObligationIds`, message: `requires source obligations for source-backed` });
    }

    if (family.productionStatus === "production-admitted" && !family.effectiveFromIntegrationVersion) {
      issues.push({ path: `registry.families.${family.signalFamilyId}.effectiveFromIntegrationVersion`, message: `requires effective version for production-admitted` });
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, value: { manifest, admissionRegistry: registry } };
}
