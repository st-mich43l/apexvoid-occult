import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { Decision } from "../schema/foundation.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-evidence-gap-foundation",
);

export const MAINTAINED_FILES = [
  "inventory/backlog-registry.json",
  "sources/source-registry-delta.json",
  "claims/claim-registry-delta.json",
  "sources/source-acquisition-ledger.json",
  "sources/page-scan-extraction-ledger.json",
  "contradictions/contradiction-log.json",
  "acquisition-pack-registry.json",
  "policies/source-obligation-policy.json",
] as const;

export const GENERATED_FILES = [
  "inventory/runtime-signal-inventory.json",
  "inventory/research-backlog-registry.json",
  "inventory/provenance-reconciliation.json",
  "matrices/evidence-gap-matrix.json",
  "matrices/evidence-gap-matrix.hash",
  "matrices/school-policy-matrix.json",
  "matrices/school-policy-matrix.hash",
  "matrices/candidate-readiness-matrix.json",
  "matrices/candidate-readiness-matrix.hash",
  "queue/source-acquisition-queue.json",
  "queue/claim-adjudication-queue.json",
  "queue/calculation-core-gap-queue.json",
  "reports/foundation-summary.json",
  "decision.json",
] as const;

export const MANIFEST_FILES = [
  ...MAINTAINED_FILES,
  ...GENERATED_FILES.filter(
    (file) =>
      file !== "decision.json" &&
      !file.endsWith(".hash"),
  ),
] as const;

function readJson(base: string, relativePath: string): any {
  return JSON.parse(
    fs.readFileSync(path.join(base, relativePath), "utf8"),
  );
}

function hashFile(base: string, relativePath: string): string {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(path.join(base, relativePath)))
    .digest("hex");
}

export function deriveDecision(base: string): Decision {
  const runtimeInventory = readJson(
    base,
    "inventory/runtime-signal-inventory.json",
  );
  const reconciliation = readJson(
    base,
    "inventory/provenance-reconciliation.json",
  );
  
  const readiness = readJson(
    base,
    "matrices/candidate-readiness-matrix.json",
  );
  const contradictions = readJson(
    base,
    "contradictions/contradiction-log.json",
  );
  const sourceQueue = readJson(
    base,
    "queue/source-acquisition-queue.json",
  );
  const claimQueue = readJson(
    base,
    "queue/claim-adjudication-queue.json",
  );
  const calculationCoreQueue = readJson(
    base,
    "queue/calculation-core-gap-queue.json",
  );

  const canonicalInputHashes: Record<string, string> = {};
  for (const relativePath of MANIFEST_FILES) {
    const fullPath = path.join(base, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Manifest file missing: ${relativePath}`);
    }
    canonicalInputHashes[relativePath] = hashFile(
      base,
      relativePath,
    );
  }

  const provenanceMismatches: string[] = [];
  for (const family of runtimeInventory) {
    if (
      family.runtimeStatus === "production-enabled" &&
      (family.sourceIds.length === 0 ||
        family.claimIds.length === 0)
    ) {
      provenanceMismatches.push(
        `${family.signalFamilyId} is production-enabled without complete runtime provenance.`,
      );
    }
  }
  for (const record of reconciliation) {
    if (
      record.origin === "runtime" &&
      (!record.runtimeExists ||
        !record.definingPath ||
        !record.definingSymbol)
    ) {
      provenanceMismatches.push(
        `${record.identifier} cannot be reconciled to a runtime declaration.`,
      );
    }
  }

  const corpusMismatch =
    corpus.reconciliation.status === "mismatched";
  const eligibleFamilyIds = readiness
    .filter(
      (record: any) =>
        record.readiness === "eligible-for-shape-design",
    )
    .map((record: any) => record.signalFamilyId);
  const blockedFamilyIds = readiness
    .filter(
      (record: any) =>
        record.readiness !== "eligible-for-shape-design" &&
        record.readiness !== "metadata-only",
    )
    .map((record: any) => record.signalFamilyId);
  const openContradictionIds = contradictions.contradictions
    .filter(
      (contradiction: any) => contradiction.status === "open",
    )
    .map((contradiction: any) => contradiction.contradictionId);

  const failedOrBlockingConditions: string[] = [];
  failedOrBlockingConditions.push(...provenanceMismatches);
  if (corpusMismatch) {
    failedOrBlockingConditions.push(
      ...corpus.reconciliation.mismatches.map(
        (mismatch: any) =>
          `Corpus reconciliation mismatch ${mismatch.metric}: expected ${JSON.stringify(
            mismatch.expected,
          )}, actual ${JSON.stringify(mismatch.actual)}.`,
      ),
    );
  }
  if (openContradictionIds.length > 0) {
    failedOrBlockingConditions.push(
      `Open contradictions: ${openContradictionIds.join(", ")}.`,
    );
  }
  if (blockedFamilyIds.length > 0) {
    failedOrBlockingConditions.push(
      `${blockedFamilyIds.length} signal families remain blocked.`,
    );
  }
  if (sourceQueue.length > 0) {
    failedOrBlockingConditions.push(
      `${sourceQueue.length} source-acquisition gaps remain open.`,
    );
  }
  if (claimQueue.length > 0) {
    failedOrBlockingConditions.push(
      `${claimQueue.length} claim-adjudication gaps remain open.`,
    );
  }
  if (calculationCoreQueue.length > 0) {
    failedOrBlockingConditions.push(
      `${calculationCoreQueue.length} Calculation Core gaps remain open.`,
    );
  }

  let decision: Decision["decision"];
  if (provenanceMismatches.length > 0 || corpusMismatch) {
    decision = "CURRENT_PRODUCTION_PROVENANCE_MISMATCH";
  } else if (
    eligibleFamilyIds.length > 0 &&
    blockedFamilyIds.length === 0 &&
    openContradictionIds.length === 0 &&
    sourceQueue.length === 0 &&
    claimQueue.length === 0 &&
    calculationCoreQueue.length === 0
  ) {
    decision = "READY_FOR_MAJOR_FORTUNE_V05_CANDIDATE_DESIGN";
  } else {
    decision = "MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN";
  }

  return {
    schemaVersion: "0.5.0",
    decision,
    canonicalInputHashes,
    failedOrBlockingConditions,
    eligibleFamilyIds,
    blockedFamilyIds,
    openContradictionIds,
    openQueueCounts: {
      "source-acquisition": sourceQueue.length,
      "claim-adjudication": claimQueue.length,
      "calculation-core-gap": calculationCoreQueue.length,
    },
    corpusReportHash: hashFile(
      base,
    ),
    matrixHashes: {
      "evidence-gap-matrix": hashFile(
        base,
        "matrices/evidence-gap-matrix.json",
      ),
      "school-policy-matrix": hashFile(
        base,
        "matrices/school-policy-matrix.json",
      ),
      "candidate-readiness-matrix": hashFile(
        base,
        "matrices/candidate-readiness-matrix.json",
      ),
    },
  };
}

export function generateDecision(opts?: {
  outputBase?: string;
}): Decision {
  const outputBase = opts?.outputBase ?? CANONICAL_BASE;
  const decision = deriveDecision(outputBase);
  fs.writeFileSync(
    path.join(outputBase, "decision.json"),
    `${JSON.stringify(decision, null, 2)}\n`,
  );
  return decision;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateDecision();
}
