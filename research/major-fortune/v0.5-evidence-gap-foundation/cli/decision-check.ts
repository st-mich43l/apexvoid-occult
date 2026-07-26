import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { extractInventory } from "./extract-inventory.js";
import { generateCandidateReadinessMatrix } from "./generate-candidate-readiness-matrix.js";
import { generateEvidenceGapMatrix } from "./generate-evidence-gap-matrix.js";
import { generateQueues } from "./generate-queues.js";
import { generateSchoolPolicyMatrix } from "./generate-school-policy-matrix.js";
import {
  GENERATED_FILES,
  MAINTAINED_FILES,
  MANIFEST_FILES,
  generateDecision,
} from "./decision-foundation.js";
import { runCorpusReport } from "./report-corpus.js";
import { runReconciliation } from "./reconcile-v04-transformation-baseline.js";
import { reportFoundation } from "./report-foundation.js";
import { validateFoundation } from "./validate-foundation.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(
  ROOT,
  "research/major-fortune/v0.5-evidence-gap-foundation",
);

function hashFile(filePath: string): string {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function readJson(base: string, relativePath: string): any {
  return JSON.parse(
    fs.readFileSync(path.join(base, relativePath), "utf8"),
  );
}

export function copyMaintainedInputs(
  sourceBase: string,
  targetBase: string,
): void {
  for (const relativePath of MAINTAINED_FILES) {
    const sourcePath = path.join(sourceBase, relativePath);
    const targetPath = path.join(targetBase, relativePath);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Maintained input missing: ${relativePath}`);
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}

export function runGeneratedPipeline(outputBase: string): void {
  extractInventory({ outputBase });
  runReconciliation({ outputBase });
  runCorpusReport({ outputBase });
  generateEvidenceGapMatrix({ outputBase });
  generateSchoolPolicyMatrix({ outputBase });
  generateCandidateReadinessMatrix({ outputBase });
  generateQueues({ outputBase });
  reportFoundation({ outputBase });
  generateDecision({ outputBase });
  validateFoundation({ outputBase });
}

function sortedKeys(value: Record<string, unknown>): string[] {
  return Object.keys(value).sort();
}

export function verifyDecisionRecord(base: string): void {
  const decision = readJson(base, "decision.json");
  const manifestKeys = sortedKeys(decision.canonicalInputHashes);
  const expectedManifestKeys = [...MANIFEST_FILES].sort();
  if (
    JSON.stringify(manifestKeys) !==
    JSON.stringify(expectedManifestKeys)
  ) {
    throw new Error(
      "Decision canonical-input manifest does not match the code-owned manifest.",
    );
  }

  for (const relativePath of MANIFEST_FILES) {
    const filePath = path.join(base, relativePath);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Manifest file missing: ${relativePath}`);
    }
    const actualHash = hashFile(filePath);
    if (decision.canonicalInputHashes[relativePath] !== actualHash) {
      throw new Error(
        `Decision hash mismatch for ${relativePath}.`,
      );
    }
  }

  const sidecars = [
    [
      "reports/corpus-gap-report.json",
      "reports/corpus-gap-report.hash",
    ],
    [
      "reports/v04-current-transformation-delta.json",
      "reports/v04-current-transformation-delta.hash",
    ],
    [
      "matrices/evidence-gap-matrix.json",
      "matrices/evidence-gap-matrix.hash",
    ],
    [
      "matrices/school-policy-matrix.json",
      "matrices/school-policy-matrix.hash",
    ],
    [
      "matrices/candidate-readiness-matrix.json",
      "matrices/candidate-readiness-matrix.hash",
    ],
  ] as const;
  for (const [jsonPath, hashPath] of sidecars) {
    const expected = hashFile(path.join(base, jsonPath));
    const committed = fs
      .readFileSync(path.join(base, hashPath), "utf8")
      .trim();
    if (expected !== committed) {
      throw new Error(`Hash sidecar mismatch for ${jsonPath}.`);
    }
  }

  const runtimeInventory = readJson(
    base,
    "inventory/runtime-signal-inventory.json",
  );
  const reconciliation = readJson(
    base,
    "inventory/provenance-reconciliation.json",
  );
  const corpus = readJson(base, "reports/corpus-gap-report.json");
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

  const provenanceMismatch =
    runtimeInventory.some(
      (family: any) =>
        family.runtimeStatus === "production-enabled" &&
        (family.sourceIds.length === 0 ||
          family.claimIds.length === 0),
    ) ||
    reconciliation.some(
      (record: any) =>
        record.origin === "runtime" &&
        (!record.runtimeExists ||
          !record.definingPath ||
          !record.definingSymbol),
    );
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

  let expectedDecision:
    | "CURRENT_PRODUCTION_PROVENANCE_MISMATCH"
    | "MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN"
    | "READY_FOR_MAJOR_FORTUNE_V05_CANDIDATE_DESIGN";
  if (provenanceMismatch || corpusMismatch) {
    expectedDecision = "CURRENT_PRODUCTION_PROVENANCE_MISMATCH";
  } else if (
    eligibleFamilyIds.length > 0 &&
    blockedFamilyIds.length === 0 &&
    openContradictionIds.length === 0 &&
    sourceQueue.length === 0 &&
    claimQueue.length === 0 &&
    calculationCoreQueue.length === 0
  ) {
    expectedDecision =
      "READY_FOR_MAJOR_FORTUNE_V05_CANDIDATE_DESIGN";
  } else {
    expectedDecision = "MAJOR_FORTUNE_V05_RESEARCH_GAPS_REMAIN";
  }

  if (decision.decision !== expectedDecision) {
    throw new Error(
      `Decision outcome mismatch: expected ${expectedDecision}, found ${decision.decision}.`,
    );
  }

  const expectedQueueCounts = {
    "source-acquisition": sourceQueue.length,
    "claim-adjudication": claimQueue.length,
    "calculation-core-gap": calculationCoreQueue.length,
  };
  if (
    JSON.stringify(decision.openQueueCounts) !==
    JSON.stringify(expectedQueueCounts)
  ) {
    throw new Error("Decision queue counts are stale.");
  }
  if (
    JSON.stringify(decision.openContradictionIds) !==
    JSON.stringify(openContradictionIds)
  ) {
    throw new Error("Decision contradiction IDs are stale.");
  }
  if (
    JSON.stringify(decision.eligibleFamilyIds) !==
      JSON.stringify(eligibleFamilyIds) ||
    JSON.stringify(decision.blockedFamilyIds) !==
      JSON.stringify(blockedFamilyIds)
  ) {
    throw new Error("Decision readiness family lists are stale.");
  }
  if (
    decision.corpusReportHash !==
    hashFile(path.join(base, "reports/corpus-gap-report.json"))
  ) {
    throw new Error("Decision corpus hash is stale.");
  }
}

function compareGeneratedFiles(
  expectedBase: string,
  actualBase: string,
): void {
  for (const relativePath of GENERATED_FILES) {
    const expectedPath = path.join(expectedBase, relativePath);
    const actualPath = path.join(actualBase, relativePath);
    if (!fs.existsSync(expectedPath) || !fs.existsSync(actualPath)) {
      throw new Error(
        `Generated artifact missing during comparison: ${relativePath}`,
      );
    }
    if (
      !fs.readFileSync(expectedPath).equals(fs.readFileSync(actualPath))
    ) {
      throw new Error(
        `Committed generated artifact is stale: ${relativePath}`,
      );
    }
  }
}

export function checkDecision(opts?: {
  outputBase?: string;
}): void {
  if (opts?.outputBase) {
    verifyDecisionRecord(opts.outputBase);
    return;
  }

  const tempBase = fs.mkdtempSync(
    path.join(os.tmpdir(), "mf-v05-decision-check-"),
  );
  try {
    copyMaintainedInputs(CANONICAL_BASE, tempBase);
    runGeneratedPipeline(tempBase);
    verifyDecisionRecord(tempBase);
    verifyDecisionRecord(CANONICAL_BASE);
    compareGeneratedFiles(tempBase, CANONICAL_BASE);
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkDecision();
}
