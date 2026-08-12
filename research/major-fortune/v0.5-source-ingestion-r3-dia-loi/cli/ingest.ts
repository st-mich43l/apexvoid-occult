#!/usr/bin/env tsx
/**
 * R3 Ingest CLI
 * Validates and normalizes artifact intake records from the private artifacts directory.
 * Writes normalized-intake.json to the temp directory.
 *
 * Private artifact directory: .research-artifacts/major-fortune/dia-loi/
 * Temp directory: .tmp/major-fortune-dia-loi-r3/
 */
import fs from 'fs';
import path from 'path';
import { validateIntakes } from '../src/validate-intake';
import type { ArtifactIntakeRecord } from '../src/types';

const ROOT = path.resolve(process.cwd());
const PRIVATE_DIR = path.resolve(ROOT, '.research-artifacts/major-fortune/dia-loi');
const TMP_DIR = path.resolve(ROOT, '.tmp/major-fortune-dia-loi-r3');

fs.mkdirSync(TMP_DIR, { recursive: true });

const intakeManifestPath = path.join(PRIVATE_DIR, 'artifact-intake-manifest.json');

let intakes: ArtifactIntakeRecord[] = [];
if (fs.existsSync(intakeManifestPath)) {
  intakes = JSON.parse(fs.readFileSync(intakeManifestPath, 'utf8')) as ArtifactIntakeRecord[];
  console.log(`Loaded ${intakes.length} intake record(s) from artifact-intake-manifest.json`);
} else {
  console.log('No artifact-intake-manifest.json found — proceeding with zero intakes (CI baseline).');
}

const results = validateIntakes(intakes, PRIVATE_DIR);
const validCount = results.filter(r => r.isValid).length;
const invalidCount = results.filter(r => !r.isValid).length;

if (invalidCount > 0) {
  console.error(`\nIntake validation FAILED: ${invalidCount} invalid intake(s):`);
  for (const r of results.filter(r => !r.isValid)) {
    console.error(`  ${r.intakeId}: ${r.errors.join(', ')}`);
  }
  process.exit(1);
}

console.log(`Intake validation passed: ${validCount} valid intake(s).`);

// Write normalized intake to tmp
const normalizedPath = path.join(TMP_DIR, 'normalized-intake.json');
fs.writeFileSync(normalizedPath, JSON.stringify(intakes, null, 2) + '\n', 'utf8');
console.log(`Normalized intake written to: ${normalizedPath}`);
