#!/usr/bin/env tsx
/**
 * R3 Determinism CLI
 * Runs the full generation pipeline twice in isolated temp directories,
 * then compares the tracked outputs byte-for-byte.
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { sha256File } from '../src/canonical-json';
import { writePack } from '../src/write-pack';

const BASE_DIR = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-ingestion-r3-dia-loi');
const ROOT = path.resolve(BASE_DIR, '../../../..');

const TRACKED_OUTPUTS = [
  'registries/verified-source-copy-registry.json',
  'registries/verified-locator-registry.json',
  'obligations/obligation-evaluation-registry.json',
  'adjudication/claim-adjudication-registry.json',
  'authorization/dia-loi-admission-authorization.json',
  'bindings/foundation-claim-binding-manifest.json',
  'bindings/canonical-obligation-claim-map.json',
  'reports/decision.json',
  'reports/acquisition-summary.json',
  'reports/source-independence-report.json',
  'reports/source-obligation-report.json',
  'reports/source-gap-reconciliation.json',
  'reports/claim-adjudication-report.json',
  'reports/dia-loi-admission-authorization.json',
];

async function runPipelineInIsolation(tmpDir: string): Promise<Record<string, string>> {
  // Create an isolated base directory mirroring the R3 pack structure
  const isolatedBase = path.join(tmpDir, 'r3-pack');
  fs.mkdirSync(isolatedBase, { recursive: true });

  // Copy tracked read-only inputs (discovery, lineage)
  for (const sub of ['discovery', 'lineage']) {
    const src = path.join(BASE_DIR, sub);
    const dst = path.join(isolatedBase, sub);
    if (fs.existsSync(src)) {
      fs.mkdirSync(dst, { recursive: true });
      for (const f of fs.readdirSync(src)) {
        fs.copyFileSync(path.join(src, f), path.join(dst, f));
      }
    }
  }

  // Run generation using the isolated base and isolated tmp
  const isolatedTmp = path.join(tmpDir, 'r3-tmp');
  fs.mkdirSync(isolatedTmp, { recursive: true });

  // Import and run generate inline to avoid spawning processes
  const { runR3Generation } = await import('./generate');
  runR3Generation(isolatedBase, { tmpDir: isolatedTmp });

  // Compute hashes of all tracked outputs
  const hashes: Record<string, string> = {};
  for (const relPath of TRACKED_OUTPUTS) {
    const fullPath = path.join(isolatedBase, relPath);
    if (fs.existsSync(fullPath)) {
      hashes[relPath] = sha256File(fullPath);
    } else {
      hashes[relPath] = 'MISSING';
    }
  }

  return hashes;
}

const tmpA = fs.mkdtempSync(path.join(os.tmpdir(), 'r3-det-a-'));
const tmpB = fs.mkdtempSync(path.join(os.tmpdir(), 'r3-det-b-'));

try {
  const hashesA = await runPipelineInIsolation(tmpA);
  const hashesB = await runPipelineInIsolation(tmpB);

  const mismatches: string[] = [];
  for (const relPath of TRACKED_OUTPUTS) {
    if (hashesA[relPath] !== hashesB[relPath]) {
      mismatches.push(relPath);
    }
  }

  const result = {
    pass: mismatches.length === 0,
    checkedFiles: TRACKED_OUTPUTS.length,
    matchedFiles: TRACKED_OUTPUTS.length - mismatches.length,
    mismatchedFiles: mismatches,
  };

  writePack(path.join(BASE_DIR, 'reports/determinism-report.json'), result);

  if (!result.pass) {
    console.error('Determinism check FAILED:');
    console.error(`  Mismatched files: ${mismatches.join(', ')}`);
    process.exit(1);
  }

  console.log(`Determinism check: PASS (${result.checkedFiles} files matched)`);
} finally {
  // Cleanup
  fs.rmSync(tmpA, { recursive: true, force: true });
  fs.rmSync(tmpB, { recursive: true, force: true });
}
