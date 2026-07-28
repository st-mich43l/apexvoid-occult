import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { generateAcquisitionPack } from "./generate-acquisition-pack.js";
import { validateAcquisitionPack } from "./validate-acquisition-pack.js";

const ROOT = process.cwd();
const CANONICAL_BASE = path.join(ROOT, "research/major-fortune/v0.5-source-acquisition-r1b-nhan-hoa");

export const MAINTAINED_FILES = [
  "sources/source-registry.json",
  "extractions/extraction-ledger.json",
  "claims/claim-registry.json"
] as const;

export const GENERATED_FILES = [
  "matrices/source-coverage-matrix.json",
  "matrices/source-coverage-matrix.hash",
  "matrices/school-evidence-matrix.json",
  "matrices/school-evidence-matrix.hash",
  "queue/missing-source-locator-queue.json",
  "queue/missing-source-locator-queue.hash",
  "queue/unresolved-school-scope-queue.json",
  "queue/unresolved-school-scope-queue.hash",
  "queue/claim-adjudication-handoff.json",
  "queue/claim-adjudication-handoff.hash",
  "queue/evidence-gap-closure-ledger.json",
  "queue/evidence-gap-closure-ledger.hash",
  "reports/acquisition-summary.json",
  "reports/acquisition-summary.hash"
] as const;

export function copyMaintainedInputs(sourceBase: string, targetBase: string): void {
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
  generateAcquisitionPack({ inputBase: outputBase, outputBase });
  validateAcquisitionPack({ inputBase: outputBase, outputBase });
}

function compareGeneratedFiles(expectedBase: string, actualBase: string): void {
  for (const relativePath of GENERATED_FILES) {
    const expectedPath = path.join(expectedBase, relativePath);
    const actualPath = path.join(actualBase, relativePath);
    if (!fs.existsSync(expectedPath) || !fs.existsSync(actualPath)) {
      throw new Error(`Generated artifact missing during comparison: ${relativePath}`);
    }
    if (!fs.readFileSync(expectedPath).equals(fs.readFileSync(actualPath))) {
      throw new Error(`Committed generated artifact is stale: ${relativePath}`);
    }
  }
}

export function checkAcquisitionPack(opts?: { outputBase?: string }): void {
  if (opts?.outputBase) {
    return; // Just run pipeline logic if directly asked
  }

  const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), "mf-v05-acq-check-"));
  try {
    copyMaintainedInputs(CANONICAL_BASE, tempBase);
    runGeneratedPipeline(tempBase);
    compareGeneratedFiles(tempBase, CANONICAL_BASE);
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkAcquisitionPack();
}
