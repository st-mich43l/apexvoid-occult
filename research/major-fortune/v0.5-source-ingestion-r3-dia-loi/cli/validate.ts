#!/usr/bin/env tsx
/**
 * R3 Validate CLI
 * Validates the R3 pack for structural integrity:
 *   - Obligation count (38)
 *   - Lane count (4)
 *   - No absolute paths in tracked files
 *   - Manifest hash and byte-length integrity
 *   - Pack-validation report
 */
import fs from 'fs';
import path from 'path';
import { sha256File } from '../src/canonical-json';
import { writePack } from '../src/write-pack';

const BASE_DIR = path.resolve(process.cwd(), 'research/major-fortune/v0.5-source-ingestion-r3-dia-loi');

interface CheckResult {
  checkId: string;
  passed: boolean;
  observed: unknown;
  expected: unknown;
  errors: string[];
}

function loadJson<T>(relPath: string): T | null {
  const fullPath = path.join(BASE_DIR, relPath);
  return fs.existsSync(fullPath) ? JSON.parse(fs.readFileSync(fullPath, 'utf8')) : null;
}

const checks: CheckResult[] = [];

// Check 1: Obligation count
const obligations = loadJson<any[]>('obligations/obligation-evaluation-registry.json');
checks.push({
  checkId: 'obligation-count',
  passed: Array.isArray(obligations) && obligations.length === 38,
  observed: Array.isArray(obligations) ? obligations.length : null,
  expected: 38,
  errors: (!Array.isArray(obligations) || obligations.length !== 38)
    ? [`Expected 38 obligations, found ${obligations?.length ?? 'null'}`]
    : [],
});

// Check 2: Lane count
const auth = loadJson<any[]>('authorization/dia-loi-admission-authorization.json');
checks.push({
  checkId: 'lane-count',
  passed: Array.isArray(auth) && auth.length === 4,
  observed: Array.isArray(auth) ? auth.length : null,
  expected: 4,
  errors: (!Array.isArray(auth) || auth.length !== 4)
    ? [`Expected 4 lanes, found ${auth?.length ?? 'null'}`]
    : [],
});

// Check 3: Gap reconciliation
const reconciliation = loadJson<any>('reports/source-gap-reconciliation.json');
checks.push({
  checkId: 'gap-reconciliation',
  passed: reconciliation?.reconciled === true,
  observed: reconciliation?.reconciled,
  expected: true,
  errors: reconciliation?.reconciled !== true
    ? [`Gap reconciliation failed: discrepancy=${reconciliation?.discrepancy}`]
    : [],
});

// Check 4: No absolute paths in tracked reports
const trackedReports = [
  'reports/acquisition-summary.json',
  'reports/source-independence-report.json',
  'reports/source-obligation-report.json',
  'reports/claim-adjudication-report.json',
  'reports/decision.json',
  'reports/decision-check.json',
];

const absolutePathErrors: string[] = [];
const absPathPattern = /(\/home\/|\/Users\/|[A-Z]:\\Users\\)/;

for (const relPath of trackedReports) {
  const fullPath = path.join(BASE_DIR, relPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (absPathPattern.test(content)) {
      absolutePathErrors.push(`Absolute path found in: ${relPath}`);
    }
  }
}

checks.push({
  checkId: 'no-absolute-paths',
  passed: absolutePathErrors.length === 0,
  observed: absolutePathErrors.length > 0,
  expected: false,
  errors: absolutePathErrors,
});

// Check 5: Manifest hash integrity
const manifest = loadJson<Array<{ relativePath: string; sha256: string; byteLength: number }>>(
  'reports/artifact-manifest.json'
);

const manifestHashErrors: string[] = [];
if (manifest) {
  for (const entry of manifest) {
    const fullPath = path.join(BASE_DIR, entry.relativePath);
    if (fs.existsSync(fullPath)) {
      const actualHash = sha256File(fullPath);
      const actualSize = fs.statSync(fullPath).size;
      if (actualHash !== entry.sha256) {
        manifestHashErrors.push(`Hash mismatch for: ${entry.relativePath}`);
      }
      if (actualSize !== entry.byteLength) {
        manifestHashErrors.push(`Byte length mismatch for: ${entry.relativePath}`);
      }
    }
  }
}

checks.push({
  checkId: 'manifest-hash-integrity',
  passed: manifestHashErrors.length === 0,
  observed: manifestHashErrors.length > 0,
  expected: false,
  errors: manifestHashErrors,
});

// Write pack validation
const allPassed = checks.every(c => c.passed);
const packValidation = {
  status: allPassed ? 'valid' : 'invalid',
  checks,
  errors: checks.flatMap(c => c.errors),
};

writePack(path.join(BASE_DIR, 'reports/pack-validation.json'), packValidation);

if (!allPassed) {
  console.error('Pack validation FAILED:');
  for (const c of checks.filter(c => !c.passed)) {
    console.error(`  ${c.checkId}: ${c.errors.join(', ')}`);
  }
  process.exit(1);
}

console.log(`Pack validation: ${packValidation.status}`);
